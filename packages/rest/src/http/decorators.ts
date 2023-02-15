import {
  typespecTypeToJson,
  createDiagnosticCollector,
  DecoratorContext,
  Diagnostic,
  DiagnosticTarget,
  getDoc,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  setTypeSpecNamespace,
  Tuple,
  Type,
  Union,
  validateDecoratorTarget,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import { createDiagnostic, createStateSymbol, reportDiagnostic } from "../lib.js";
import { extractParamsFromPath } from "../utils.js";
import {
  AuthenticationOption,
  HeaderFieldOptions,
  HttpAuth,
  HttpVerb,
  PathParameterOptions,
  QueryParameterOptions,
  RouteOptions,
  RoutePath,
  ServiceAuthentication,
} from "./types.js";

export const namespace = "TypeSpec.Http";

const headerFieldsKey = createStateSymbol("header");
export function $header(
  context: DecoratorContext,
  entity: ModelProperty,
  headerNameOrOptions?: string | Model
) {
  const options: HeaderFieldOptions = {
    type: "header",
    name: entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
  };
  if (headerNameOrOptions) {
    if (typeof headerNameOrOptions === "string") {
      options.name = headerNameOrOptions;
    } else {
      const name = headerNameOrOptions.properties.get("name")?.type;
      if (name?.kind === "String") {
        options.name = name.value;
      }
      const format = headerNameOrOptions.properties.get("format")?.type;
      if (format?.kind === "String") {
        if (format.value === "csv") {
          options.format = format.value;
        }
      }
    }
  }
  if (
    entity.type.kind === "Model" &&
    entity.type.name === "Array" &&
    options.format === undefined
  ) {
    options.format = "csv";
  }
  context.program.stateMap(headerFieldsKey).set(entity, options);
}

export function getHeaderFieldOptions(program: Program, entity: Type): HeaderFieldOptions {
  return program.stateMap(headerFieldsKey).get(entity);
}

export function getHeaderFieldName(program: Program, entity: Type): string {
  return getHeaderFieldOptions(program, entity)?.name;
}

export function isHeader(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).has(entity);
}

const queryFieldsKey = createStateSymbol("query");
export function $query(
  context: DecoratorContext,
  entity: ModelProperty,
  queryNameOrOptions?: string | Model
) {
  const options: QueryParameterOptions = {
    type: "query",
    name: entity.name,
  };
  if (queryNameOrOptions) {
    if (typeof queryNameOrOptions === "string") {
      options.name = queryNameOrOptions;
    } else {
      const name = queryNameOrOptions.properties.get("name")?.type;
      if (name?.kind === "String") {
        options.name = name.value;
      }
      const format = queryNameOrOptions.properties.get("format")?.type;
      if (format?.kind === "String") {
        if (format.value === "multi" || format.value === "csv") {
          options.format = format.value;
        }
      }
    }
  }
  if (
    entity.type.kind === "Model" &&
    entity.type.name === "Array" &&
    options.format === undefined
  ) {
    options.format = "multi";
  }
  context.program.stateMap(queryFieldsKey).set(entity, options);
}

export function getQueryParamOptions(program: Program, entity: Type): QueryParameterOptions {
  return program.stateMap(queryFieldsKey).get(entity);
}

export function getQueryParamName(program: Program, entity: Type): string {
  return getQueryParamOptions(program, entity)?.name;
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(queryFieldsKey).has(entity);
}

const pathFieldsKey = createStateSymbol("path");
export function $path(context: DecoratorContext, entity: ModelProperty, paramName?: string) {
  const options: PathParameterOptions = {
    type: "path",
    name: paramName ?? entity.name,
  };
  context.program.stateMap(pathFieldsKey).set(entity, options);
}

export function getPathParamOptions(program: Program, entity: Type): PathParameterOptions {
  return program.stateMap(pathFieldsKey).get(entity);
}

export function getPathParamName(program: Program, entity: Type): string {
  return getPathParamOptions(program, entity)?.name;
}

export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(pathFieldsKey).has(entity);
}

const bodyFieldsKey = createStateSymbol("body");
export function $body(context: DecoratorContext, entity: ModelProperty) {
  context.program.stateSet(bodyFieldsKey).add(entity);
}

export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(bodyFieldsKey).has(entity);
}

const statusCodeKey = createStateSymbol("statusCode");
export function $statusCode(context: DecoratorContext, entity: ModelProperty) {
  context.program.stateSet(statusCodeKey).add(entity);

  const codes: string[] = [];
  if (entity.type.kind === "String") {
    if (validStatusCode(context.program, entity.type.value, entity)) {
      codes.push(entity.type.value);
    }
  } else if (entity.type.kind === "Number") {
    if (validStatusCode(context.program, String(entity.type.value), entity)) {
      codes.push(String(entity.type.value));
    }
  } else if (entity.type.kind === "Union") {
    for (const option of entity.type.options) {
      if (option.kind === "String") {
        if (validStatusCode(context.program, option.value, option)) {
          codes.push(option.value);
        }
      } else if (option.kind === "Number") {
        if (validStatusCode(context.program, String(option.value), option)) {
          codes.push(String(option.value));
        }
      } else {
        reportDiagnostic(context.program, {
          code: "status-code-invalid",
          target: entity,
        });
      }
    }
  } else if (entity.type.kind === "TemplateParameter") {
    // Ignore template parameters
  } else {
    reportDiagnostic(context.program, {
      code: "status-code-invalid",
      target: entity,
    });
  }
  setStatusCode(context.program, entity, codes);
}

export function setStatusCode(program: Program, entity: Model | ModelProperty, codes: string[]) {
  program.stateMap(statusCodeKey).set(entity, codes);
}

// Check status code value: 3 digits with first digit in [1-5]
// Issue a diagnostic if not valid
function validStatusCode(program: Program, code: string, entity: Type): boolean {
  const statusCodePatten = /[1-5][0-9][0-9]/;
  if (code.match(statusCodePatten)) {
    return true;
  }
  reportDiagnostic(program, {
    code: "status-code-invalid",
    target: entity,
    messageId: "value",
  });
  return false;
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateMap(statusCodeKey).has(entity);
}

export function getStatusCodes(program: Program, entity: Type): string[] {
  return program.stateMap(statusCodeKey).get(entity) ?? [];
}

// Reference: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
export function getStatusCodeDescription(statusCode: string) {
  switch (statusCode) {
    case "200":
      return "The request has succeeded.";
    case "201":
      return "The request has succeeded and a new resource has been created as a result.";
    case "202":
      return "The request has been accepted for processing, but processing has not yet completed.";
    case "204":
      return "There is no content to send for this request, but the headers may be useful. ";
    case "301":
      return "The URL of the requested resource has been changed permanently. The new URL is given in the response.";
    case "304":
      return "The client has made a conditional request and the resource has not been modified.";
    case "400":
      return "The server could not understand the request due to invalid syntax.";
    case "401":
      return "Access is unauthorized.";
    case "403":
      return "Access is forbidden";
    case "404":
      return "The server cannot find the requested resource.";
    case "409":
      return "The request conflicts with the current state of the server.";
    case "412":
      return "Precondition failed.";
    case "503":
      return "Service unavailable.";
  }

  switch (statusCode.charAt(0)) {
    case "1":
      return "Informational";
    case "2":
      return "Successful";
    case "3":
      return "Redirection";
    case "4":
      return "Client Error";
    case "5":
      return "Server Error";
  }

  // Any valid HTTP status code is covered above.
  return undefined;
}

const operationVerbsKey = createStateSymbol("verbs");

function setOperationVerb(program: Program, entity: Type, verb: HttpVerb): void {
  if (entity.kind === "Operation") {
    if (!program.stateMap(operationVerbsKey).has(entity)) {
      program.stateMap(operationVerbsKey).set(entity, verb);
    } else {
      reportDiagnostic(program, {
        code: "http-verb-duplicate",
        format: { entityName: entity.name },
        target: entity,
      });
    }
  } else {
    reportDiagnostic(program, {
      code: "http-verb-wrong-type",
      format: { verb, entityKind: entity.kind },
      target: entity,
    });
  }
}

export function getOperationVerb(program: Program, entity: Type): HttpVerb | undefined {
  return program.stateMap(operationVerbsKey).get(entity);
}

export function $get(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "get");
}

export function $put(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "put");
}

export function $post(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "post");
}

export function $patch(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "patch");
}

export function $delete(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "delete");
}

export function $head(context: DecoratorContext, entity: Operation) {
  setOperationVerb(context.program, entity, "head");
}

export interface HttpServer {
  url: string;
  description: string;
  parameters: Map<string, ModelProperty>;
}

const serversKey = createStateSymbol("servers");
/**
 * Configure the server url for the service.
 * @param context Decorator context
 * @param target Decorator target(Must be a namespace)
 * @param description Description for this server.
 * @param parameters @optional Parameters to interpolate in the server url.
 */
export function $server(
  context: DecoratorContext,
  target: Namespace,
  url: string,
  description: string,
  parameters?: Model
): void {
  const params = extractParamsFromPath(url);
  const parameterMap = new Map(parameters?.properties ?? []);
  for (const declaredParam of params) {
    const param = parameterMap.get(declaredParam);
    if (!param) {
      reportDiagnostic(context.program, {
        code: "missing-server-param",
        format: { param: declaredParam },
        target: context.getArgumentTarget(0)!,
      });
      parameterMap.delete(declaredParam);
    }
  }

  let servers: HttpServer[] = context.program.stateMap(serversKey).get(target);
  if (servers === undefined) {
    servers = [];
    context.program.stateMap(serversKey).set(target, servers);
  }
  servers.push({
    url,
    description,
    parameters: parameterMap,
  });
}

export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(serversKey).get(type);
}

export function $plainData(context: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(context, entity, "@plainData", "Model")) {
    return;
  }
  const { program } = context;

  const decoratorsToRemove = ["$header", "$body", "$query", "$path", "$statusCode"];
  const [headers, bodies, queries, paths, statusCodes] = [
    program.stateMap(headerFieldsKey),
    program.stateSet(bodyFieldsKey),
    program.stateMap(queryFieldsKey),
    program.stateMap(pathFieldsKey),
    program.stateMap(statusCodeKey),
  ];

  for (const property of entity.properties.values()) {
    // Remove the decorators so that they do not run in the future, for example,
    // if this model is later spread into another.
    property.decorators = property.decorators.filter(
      (d) => !decoratorsToRemove.includes(d.decorator.name)
    );

    // Remove the impact the decorators already had on this model.
    headers.delete(property);
    bodies.delete(property);
    queries.delete(property);
    paths.delete(property);
    statusCodes.delete(property);
  }
}

setTypeSpecNamespace("Private", $plainData);

const authenticationKey = createStateSymbol("authentication");
export function $useAuth(
  context: DecoratorContext,
  serviceNamespace: Namespace,
  authConfig: Model | Union | Tuple
) {
  const [auth, diagnostics] = extractServiceAuthentication(context.program, authConfig);
  if (diagnostics.length > 0) context.program.reportDiagnostics(diagnostics);
  if (auth !== undefined) {
    setAuthentication(context.program, serviceNamespace, auth);
  }
}

export function setAuthentication(
  program: Program,
  serviceNamespace: Namespace,
  auth: ServiceAuthentication
) {
  program.stateMap(authenticationKey).set(serviceNamespace, auth);
}

function extractServiceAuthentication(
  program: Program,
  type: Model | Union | Tuple
): [ServiceAuthentication | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  switch (type.kind) {
    case "Model":
      const auth = diagnostics.pipe(extractHttpAuthentication(program, type, type));
      if (auth === undefined) return diagnostics.wrap(undefined);
      return diagnostics.wrap({ options: [{ schemes: [auth] }] });
    case "Tuple":
      const option = diagnostics.pipe(extractHttpAuthenticationOption(program, type, type));
      return diagnostics.wrap({ options: [option] });
    case "Union":
      return extractHttpAuthenticationOptions(program, type, type);
  }
}

function extractHttpAuthenticationOptions(
  program: Program,
  tuple: Union,
  diagnosticTarget: DiagnosticTarget
): [ServiceAuthentication, readonly Diagnostic[]] {
  const options: AuthenticationOption[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const value of tuple.options) {
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget)
        );
        if (result !== undefined) {
          options.push({ schemes: [result] });
        }
        break;
      case "Tuple":
        const option = diagnostics.pipe(
          extractHttpAuthenticationOption(program, value, diagnosticTarget)
        );
        options.push(option);
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: value.kind },
            target: value,
          })
        );
    }
  }
  return diagnostics.wrap({ options });
}

function extractHttpAuthenticationOption(
  program: Program,
  tuple: Tuple,
  diagnosticTarget: DiagnosticTarget
): [AuthenticationOption, readonly Diagnostic[]] {
  const schemes: HttpAuth[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const value of tuple.values) {
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget)
        );
        if (result !== undefined) {
          schemes.push(result);
        }
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: value.kind },
            target: value,
          })
        );
    }
  }
  return diagnostics.wrap({ schemes });
}

function extractHttpAuthentication(
  program: Program,
  modelType: Model,
  diagnosticTarget: DiagnosticTarget
): [HttpAuth | undefined, readonly Diagnostic[]] {
  const [result, diagnostics] = typespecTypeToJson<HttpAuth>(modelType, diagnosticTarget);
  if (result === undefined) {
    return [result, diagnostics];
  }
  const description = getDoc(program, modelType);
  const auth = result.type === "oauth2" ? extractOAuth2Auth(result) : result;
  return [
    {
      ...auth,
      id: modelType.name || result.type,
      ...(description && { description }),
    },
    diagnostics,
  ];
}

function extractOAuth2Auth(data: any): HttpAuth {
  return {
    ...data,
    flows: data.flows.map((flow: any) => {
      return {
        ...flow,
        scopes: flow.scopes.map((x: string) => ({ value: x })),
      };
    }),
  };
}

export function getAuthentication(
  program: Program,
  namespace: Namespace
): ServiceAuthentication | undefined {
  return program.stateMap(authenticationKey).get(namespace);
}

function extractSharedValue(context: DecoratorContext, parameters?: Model): boolean {
  const sharedType = parameters?.properties.get("shared")?.type;
  if (sharedType === undefined) {
    return false;
  }
  switch (sharedType.kind) {
    case "Boolean":
      return sharedType.value;
    default:
      reportDiagnostic(context.program, {
        code: "shared-boolean",
        target: sharedType,
      });
      return false;
  }
}

/**
 * `@route` defines the relative route URI for the target operation
 *
 * The first argument should be a URI fragment that may contain one or more path parameter fields.
 * If the namespace or interface that contains the operation is also marked with a `@route` decorator,
 * it will be used as a prefix to the route URI of the operation.
 *
 * `@route` can only be applied to operations, namespaces, and interfaces.
 */
export function $route(context: DecoratorContext, entity: Type, path: string, parameters?: Model) {
  validateDecoratorUniqueOnNode(context, entity, $route);

  setRoute(context, entity, {
    path,
    isReset: false,
    shared: extractSharedValue(context, parameters),
  });
}

export function $routeReset(
  context: DecoratorContext,
  entity: Type,
  path: string,
  parameters?: Model
) {
  setRoute(context, entity, {
    path,
    isReset: true,
    shared: extractSharedValue(context, parameters),
  });
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

const routesKey = createStateSymbol("routes");
function setRoute(context: DecoratorContext, entity: Type, details: RoutePath) {
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

export function getRoutePath(
  program: Program,
  entity: Namespace | Interface | Operation
): RoutePath | undefined {
  return program.stateMap(routesKey).get(entity);
}

const includeInapplicableMetadataInPayloadKey = createStateSymbol(
  "includeInapplicableMetadataInPayload"
);

/**
 * Specifies if inapplicable metadata should be included in the payload for
 * the given entity. This is true by default unless changed by this
 * decorator.
 *
 * @param entity Target model, namespace, or model property. If applied to a
 *               model or namespace, applies recursively to child models,
 *               namespaces, and model properties unless overridden by
 *               applying this decorator to a child.
 *
 * @param value `true` to include inapplicable metadata in payload, false to
 *               exclude it.
 *
 * @see isApplicableMetadata
 */
export function $includeInapplicableMetadataInPayload(
  context: DecoratorContext,
  entity: Type,
  value: boolean
) {
  if (
    !validateDecoratorTarget(context, entity, "@includeInapplicableMetadataInPayload", [
      "Namespace",
      "Model",
      "ModelProperty",
    ])
  ) {
    return;
  }
  const state = context.program.stateMap(includeInapplicableMetadataInPayloadKey);
  state.set(entity, value);
}

/**
 * Determines if the given model property should be included in the payload if it is
 * inapplicable metadata.
 *
 * @see isApplicableMetadata
 * @see $includeInapplicableMetadataInPayload
 */
export function includeInapplicableMetadataInPayload(
  program: Program,
  property: ModelProperty
): boolean {
  let e: ModelProperty | Namespace | Model | undefined;
  for (e = property; e; e = e.kind === "ModelProperty" ? e.model : e.namespace) {
    const value = program.stateMap(includeInapplicableMetadataInPayloadKey).get(e);
    if (value !== undefined) {
      return value;
    }
  }
  return true;
}
