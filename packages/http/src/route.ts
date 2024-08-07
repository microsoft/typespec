import {
  createDiagnosticCollector,
  DecoratorContext,
  DiagnosticResult,
  Interface,
  Namespace,
  Operation,
  Program,
  Type,
  validateDecoratorTarget,
} from "@typespec/compiler";
import { createDiagnostic, HttpStateKeys, reportDiagnostic } from "./lib.js";
import { getOperationParameters } from "./parameters.js";
import {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  PathParameterOptions,
  RouteOptions,
  RoutePath,
  RouteProducer,
  RouteProducerResult,
  RouteResolutionOptions,
} from "./types.js";
import { parseUriTemplate, UriTemplate } from "./uri-template.js";

// The set of allowed segment separator characters
const AllowedSegmentSeparators = ["/", ":"];

function normalizeFragment(fragment: string, trimLast = false) {
  if (fragment.length > 0 && AllowedSegmentSeparators.indexOf(fragment[0]) < 0) {
    // Insert the default separator
    fragment = `/${fragment}`;
  }

  if (trimLast && fragment[fragment.length - 1] === "/") {
    return fragment.slice(0, -1);
  }
  return fragment;
}

export function joinPathSegments(rest: string[]) {
  let current = "";
  for (const [index, segment] of rest.entries()) {
    current += normalizeFragment(segment, index < rest.length - 1);
  }
  return current;
}

function buildPath(pathFragments: string[]) {
  // Join all fragments with leading and trailing slashes trimmed
  const path = pathFragments.length === 0 ? "/" : joinPathSegments(pathFragments);

  // The final path must start with a '/'
  return path[0] === "/" ? path : `/${path}`;
}

export function resolvePathAndParameters(
  program: Program,
  operation: Operation,
  overloadBase: HttpOperation | undefined,
  options: RouteResolutionOptions
): DiagnosticResult<{
  readonly uriTemplate: string;
  path: string;
  parameters: HttpOperationParameters;
}> {
  const diagnostics = createDiagnosticCollector();
  const { uriTemplate, parameters } = diagnostics.pipe(
    getUriTemplateAndParameters(program, operation, overloadBase, options)
  );

  const parsedUriTemplate = parseUriTemplate(uriTemplate);

  // Pull out path parameters to verify what's in the path string
  const paramByName = new Set(
    parameters.parameters
      .filter(({ type }) => type === "path" || type === "query")
      .map((x) => x.name)
  );

  // Ensure that all of the parameters defined in the route are accounted for in
  // the operation parameters
  for (const routeParam of parsedUriTemplate.parameters) {
    if (!paramByName.has(routeParam.name)) {
      diagnostics.add(
        createDiagnostic({
          code: "missing-uri-param",
          format: { param: routeParam.name },
          target: operation,
        })
      );
    }
  }

  const path = produceLegacyPathFromUriTemplate(parsedUriTemplate);
  return diagnostics.wrap({
    uriTemplate,
    path,
    parameters,
  });
}

function produceLegacyPathFromUriTemplate(uriTemplate: UriTemplate) {
  let result = "";

  for (const segment of uriTemplate.segments ?? []) {
    if (typeof segment === "string") {
      result += segment;
    } else if (segment.operator !== "?" && segment.operator !== "&") {
      result += `{${segment.name}}`;
    }
  }

  return result;
}

function collectSegmentsAndOptions(
  program: Program,
  source: Interface | Namespace | undefined
): [string[], RouteOptions] {
  if (source === undefined) return [[], {}];

  const [parentSegments, parentOptions] = collectSegmentsAndOptions(program, source.namespace);

  const route = getRoutePath(program, source)?.path;
  const options =
    source.kind === "Namespace" ? (getRouteOptionsForNamespace(program, source) ?? {}) : {};

  return [[...parentSegments, ...(route ? [route] : [])], { ...parentOptions, ...options }];
}

function getUriTemplateAndParameters(
  program: Program,
  operation: Operation,
  overloadBase: HttpOperation | undefined,
  options: RouteResolutionOptions
): DiagnosticResult<RouteProducerResult> {
  const [parentSegments, parentOptions] = collectSegmentsAndOptions(
    program,
    operation.interface ?? operation.namespace
  );

  const routeProducer = getRouteProducer(program, operation) ?? DefaultRouteProducer;
  const [result, diagnostics] = routeProducer(program, operation, parentSegments, overloadBase, {
    ...parentOptions,
    ...options,
  });

  return [
    { uriTemplate: buildPath([result.uriTemplate]), parameters: result.parameters },
    diagnostics,
  ];
}

/**
 * @deprecated DO NOT USE. For internal use only as a workaround.
 * @param program Program
 * @param target Target namespace
 * @param sourceInterface Interface that should be included in namespace.
 */
export function includeInterfaceRoutesInNamespace(
  program: Program,
  target: Namespace,
  sourceInterface: string
) {
  let array = program.stateMap(HttpStateKeys.externalInterfaces).get(target);
  if (array === undefined) {
    array = [];
    program.stateMap(HttpStateKeys.externalInterfaces).set(target, array);
  }

  array.push(sourceInterface);
}

export function DefaultRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions
): DiagnosticResult<RouteProducerResult> {
  const diagnostics = createDiagnosticCollector();
  const routePath = getRoutePath(program, operation)?.path;
  const uriTemplate =
    !routePath && overloadBase
      ? overloadBase.uriTemplate
      : joinPathSegments([...parentSegments, ...(routePath ? [routePath] : [])]);

  const parsedUriTemplate = parseUriTemplate(uriTemplate);

  const parameters: HttpOperationParameters = diagnostics.pipe(
    getOperationParameters(program, operation, uriTemplate, overloadBase, options.paramOptions)
  );

  // Pull out path parameters to verify what's in the path string
  const unreferencedPathParamNames = new Map(
    parameters.parameters
      .filter(({ type }) => type === "path" || type === "query")
      .map((x) => [x.name, x])
  );

  // Compile the list of all route params that aren't represented in the route
  for (const uriParam of parsedUriTemplate.parameters) {
    unreferencedPathParamNames.delete(uriParam.name);
  }

  const resolvedUriTemplate = addOperationTemplateToUriTemplate(uriTemplate, [
    ...unreferencedPathParamNames.values(),
  ]);
  return diagnostics.wrap({
    uriTemplate: resolvedUriTemplate,
    parameters,
  });
}

const styleToOperator: Record<PathParameterOptions["style"], string> = {
  matrix: ";",
  label: ".",
  simple: "",
  path: "/",
  fragment: "#",
};

function addOperationTemplateToUriTemplate(uriTemplate: string, params: HttpOperationParameter[]) {
  const pathParams = params
    .filter((x) => x.type === "path")
    .map((param) => {
      const operator = param.allowReserved ? "+" : styleToOperator[param.style];
      return `{${operator}${param.name}${param.explode ? "*" : ""}}`;
    });
  const queryParams = params.filter((x) => x.type === "query");

  const pathPart = joinPathSegments([uriTemplate, ...pathParams]);
  return (
    pathPart + (queryParams.length > 0 ? `{?${queryParams.map((x) => x.name).join(",")}}` : "")
  );
}

export function setRouteProducer(
  program: Program,
  operation: Operation,
  routeProducer: RouteProducer
): void {
  program.stateMap(HttpStateKeys.routeProducer).set(operation, routeProducer);
}

export function getRouteProducer(program: Program, operation: Operation): RouteProducer {
  return program.stateMap(HttpStateKeys.routeProducer).get(operation);
}

export function setRoute(context: DecoratorContext, entity: Type, details: RoutePath) {
  if (
    !validateDecoratorTarget(context, entity, "@route", ["Namespace", "Interface", "Operation"])
  ) {
    return;
  }

  const state = context.program.stateMap(HttpStateKeys.routes);

  if (state.has(entity) && entity.kind === "Namespace") {
    const existingPath: string | undefined = state.get(entity);
    if (existingPath !== details.path) {
      reportDiagnostic(context.program, {
        code: "duplicate-route-decorator",
        messageId: "namespace",
        target: entity,
      });
    }
  } else {
    state.set(entity, details.path);
    if (entity.kind === "Operation" && details.shared) {
      setSharedRoute(context.program, entity as Operation);
    }
  }
}

export function setSharedRoute(program: Program, operation: Operation) {
  program.stateMap(HttpStateKeys.sharedRoutes).set(operation, true);
}

export function isSharedRoute(program: Program, operation: Operation): boolean {
  return program.stateMap(HttpStateKeys.sharedRoutes).get(operation) === true;
}

export function getRoutePath(
  program: Program,
  entity: Namespace | Interface | Operation
): RoutePath | undefined {
  const path = program.stateMap(HttpStateKeys.routes).get(entity);
  return path
    ? {
        path,
        shared: entity.kind === "Operation" && isSharedRoute(program, entity as Operation),
      }
    : undefined;
}

export function setRouteOptionsForNamespace(
  program: Program,
  namespace: Namespace,
  options: RouteOptions
) {
  program.stateMap(HttpStateKeys.routeOptions).set(namespace, options);
}

export function getRouteOptionsForNamespace(
  program: Program,
  namespace: Namespace
): RouteOptions | undefined {
  return program.stateMap(HttpStateKeys.routeOptions).get(namespace);
}
