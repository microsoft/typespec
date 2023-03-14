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
import { createDiagnostic, createStateSymbol, reportDiagnostic } from "./lib.js";
import { getOperationParameters } from "./parameters.js";
import {
  HttpOperation,
  HttpOperationParameters,
  RouteOptions,
  RoutePath,
  RouteProducer,
  RouteProducerResult,
  RouteResolutionOptions,
} from "./types.js";
import { extractParamsFromPath } from "./utils.js";

// The set of allowed segment separator characters
const AllowedSegmentSeparators = ["/", ":"];

function normalizeFragment(fragment: string) {
  if (fragment.length > 0 && AllowedSegmentSeparators.indexOf(fragment[0]) < 0) {
    // Insert the default separator
    fragment = `/${fragment}`;
  }

  // Trim any trailing slash
  return fragment.replace(/\/$/g, "");
}

function buildPath(pathFragments: string[]) {
  // Join all fragments with leading and trailing slashes trimmed
  const path =
    pathFragments.length === 0
      ? "/"
      : pathFragments
          .map(normalizeFragment)
          .filter((x) => x !== "")
          .join("");

  // The final path must start with a '/'
  return path.length > 0 && path[0] === "/" ? path : `/${path}`;
}

export function resolvePathAndParameters(
  program: Program,
  operation: Operation,
  overloadBase: HttpOperation | undefined,
  options: RouteResolutionOptions
): DiagnosticResult<{
  path: string;
  pathSegments: string[];
  parameters: HttpOperationParameters;
}> {
  const diagnostics = createDiagnosticCollector();
  const { segments, parameters } = diagnostics.pipe(
    getRouteSegments(program, operation, overloadBase, options)
  );

  // Pull out path parameters to verify what's in the path string
  const paramByName = new Set(
    parameters.parameters.filter(({ type }) => type === "path").map(({ param }) => param.name)
  );

  // Ensure that all of the parameters defined in the route are accounted for in
  // the operation parameters
  const routeParams = segments.flatMap(extractParamsFromPath);
  for (const routeParam of routeParams) {
    if (!paramByName.has(routeParam)) {
      diagnostics.add(
        createDiagnostic({
          code: "missing-path-param",
          format: { param: routeParam },
          target: operation,
        })
      );
    }
  }

  return diagnostics.wrap({
    path: buildPath(segments),
    pathSegments: segments,
    parameters,
  });
}

function collectSegmentsAndOptions(
  program: Program,
  source: Interface | Namespace | undefined
): [string[], RouteOptions] {
  if (source === undefined) return [[], {}];

  const [parentSegments, parentOptions] = collectSegmentsAndOptions(program, source.namespace);

  const route = getRoutePath(program, source)?.path;
  const options =
    source.kind === "Namespace" ? getRouteOptionsForNamespace(program, source) ?? {} : {};

  return [[...parentSegments, ...(route ? [route] : [])], { ...parentOptions, ...options }];
}

function getRouteSegments(
  program: Program,
  operation: Operation,
  overloadBase: HttpOperation | undefined,
  options: RouteResolutionOptions
): DiagnosticResult<RouteProducerResult> {
  const diagnostics = createDiagnosticCollector();
  const [parentSegments, parentOptions] = collectSegmentsAndOptions(
    program,
    operation.interface ?? operation.namespace
  );

  const routeProducer = getRouteProducer(program, operation) ?? DefaultRouteProducer;
  const result = diagnostics.pipe(
    routeProducer(program, operation, parentSegments, overloadBase, {
      ...parentOptions,
      ...options,
    })
  );

  return diagnostics.wrap(result);
}

const externalInterfaces = createStateSymbol("externalInterfaces");
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
  let array = program.stateMap(externalInterfaces).get(target);
  if (array === undefined) {
    array = [];
    program.stateMap(externalInterfaces).set(target, array);
  }

  array.push(sourceInterface);
}

const routeProducerKey = createStateSymbol("routeProducer");

export function DefaultRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions
): DiagnosticResult<RouteProducerResult> {
  const diagnostics = createDiagnosticCollector();
  const routePath = getRoutePath(program, operation)?.path;
  const segments =
    !routePath && overloadBase
      ? overloadBase.pathSegments
      : [...parentSegments, ...(routePath ? [routePath] : [])];
  const routeParams = segments.flatMap(extractParamsFromPath);

  const parameters: HttpOperationParameters = diagnostics.pipe(
    getOperationParameters(program, operation, overloadBase, routeParams, options.paramOptions)
  );

  // Pull out path parameters to verify what's in the path string
  const unreferencedPathParamNames = new Set(
    parameters.parameters.filter(({ type }) => type === "path").map(({ param }) => param.name)
  );

  // Compile the list of all route params that aren't represented in the route
  for (const routeParam of routeParams) {
    unreferencedPathParamNames.delete(routeParam);
  }

  // Add any remaining declared path params
  for (const paramName of unreferencedPathParamNames) {
    segments.push(`{${paramName}}`);
  }

  return diagnostics.wrap({
    segments,
    parameters,
  });
}

export function setRouteProducer(
  program: Program,
  operation: Operation,
  routeProducer: RouteProducer
): void {
  program.stateMap(routeProducerKey).set(operation, routeProducer);
}

export function getRouteProducer(program: Program, operation: Operation): RouteProducer {
  return program.stateMap(routeProducerKey).get(operation);
}

const routesKey = createStateSymbol("routes");

export function setRoute(context: DecoratorContext, entity: Type, details: RoutePath) {
  if (
    !validateDecoratorTarget(context, entity, "@route", ["Namespace", "Interface", "Operation"])
  ) {
    return;
  }

  const state = context.program.stateMap(routesKey);

  if (state.has(entity) && entity.kind === "Namespace") {
    const existingValue: RoutePath = state.get(entity);
    if (existingValue.path !== details.path) {
      reportDiagnostic(context.program, {
        code: "duplicate-route-decorator",
        messageId: "namespace",
        target: entity,
      });
    }
  } else {
    state.set(entity, details);
  }
}

export function isSharedRoute(program: Program, operation: Operation): boolean {
  return program.stateMap(routesKey).get(operation)?.shared;
}

export function getRoutePath(
  program: Program,
  entity: Namespace | Interface | Operation
): RoutePath | undefined {
  return program.stateMap(routesKey).get(entity);
}

const routeOptionsKey = createStateSymbol("routeOptions");

export function setRouteOptionsForNamespace(
  program: Program,
  namespace: Namespace,
  options: RouteOptions
) {
  program.stateMap(routeOptionsKey).set(namespace, options);
}

export function getRouteOptionsForNamespace(
  program: Program,
  namespace: Namespace
): RouteOptions | undefined {
  return program.stateMap(routeOptionsKey).get(namespace);
}
