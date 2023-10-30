import { createDiagnostic, reportDiagnostic } from "./lib.js";

import {
  DecoratorContext,
  Diagnostic,
  DiagnosticTarget,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  StringLiteral,
  Tuple,
  Type,
  Union,
  createDiagnosticCollector,
  getDoc,
  ignoreDiagnostics,
  isArrayModelType,
  reportDeprecated,
  setTypeSpecNamespace,
  typespecTypeToJson,
  validateDecoratorTarget,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import { setRoute, setSharedRoute } from "./route.js";
import { HttpStateKeys } from "./state.js";
import { getStatusCodesFromType } from "./status-codes.js";
import {
  AuthenticationOption,
  HeaderFieldOptions,
  HttpAuth,
  HttpStatusCodeRange,
  HttpStatusCodes,
  HttpVerb,
  PathParameterOptions,
  QueryParameterOptions,
  ServiceAuthentication,
} from "./types.js";
import { extractParamsFromPath } from "./utils.js";

export const namespace = "TypeSpec.Http";

export function $header(
  context: DecoratorContext,
  entity: ModelProperty,
  headerNameOrOptions?: StringLiteral | Model
) {
  const options: HeaderFieldOptions = {
    type: "header",
    name: entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
  };
  if (headerNameOrOptions) {
    if (headerNameOrOptions.kind === "String") {
      options.name = headerNameOrOptions.value;
    } else {
      const name = headerNameOrOptions.properties.get("name")?.type;
      if (name?.kind === "String") {
        options.name = name.value;
      }
      const format = headerNameOrOptions.properties.get("format")?.type;
      if (format?.kind === "String") {
        const val = format.value;
        if (
          val === "csv" ||
          val === "tsv" ||
          val === "pipes" ||
          val === "ssv" ||
          val === "simple" ||
          val === "form" ||
          val === "multi"
        ) {
          options.format = val;
        }
      }
    }
  }
  if (
    entity.type.kind === "Model" &&
    isArrayModelType(context.program, entity.type) &&
    options.format === undefined
  ) {
    reportDiagnostic(context.program, {
      code: "header-format-required",
      target: context.decoratorTarget,
    });
  }
  context.program.stateMap(HttpStateKeys.headerFieldsKey).set(entity, options);
}

export function getHeaderFieldOptions(program: Program, entity: Type): HeaderFieldOptions {
  return program.stateMap(HttpStateKeys.headerFieldsKey).get(entity);
}

export function getHeaderFieldName(program: Program, entity: Type): string {
  return getHeaderFieldOptions(program, entity)?.name;
}

export function isHeader(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.headerFieldsKey).has(entity);
}

export function $query(
  context: DecoratorContext,
  entity: ModelProperty,
  queryNameOrOptions?: StringLiteral | Model
) {
  const options: QueryParameterOptions = {
    type: "query",
    name: entity.name,
  };
  if (queryNameOrOptions) {
    if (queryNameOrOptions.kind === "String") {
      options.name = queryNameOrOptions.value;
    } else {
      const name = queryNameOrOptions.properties.get("name")?.type;
      if (name?.kind === "String") {
        options.name = name.value;
      }
      const format = queryNameOrOptions.properties.get("format")?.type;
      if (format?.kind === "String") {
        options.format = format.value as any; // That value should have already been validated by the TypeSpec dec
      }
    }
  }
  if (
    entity.type.kind === "Model" &&
    isArrayModelType(context.program, entity.type) &&
    options.format === undefined
  ) {
    reportDiagnostic(context.program, {
      code: "query-format-required",
      target: context.decoratorTarget,
    });
  }
  context.program.stateMap(HttpStateKeys.queryFieldsKey).set(entity, options);
}

export function getQueryParamOptions(program: Program, entity: Type): QueryParameterOptions {
  return program.stateMap(HttpStateKeys.queryFieldsKey).get(entity);
}

export function getQueryParamName(program: Program, entity: Type): string {
  return getQueryParamOptions(program, entity)?.name;
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.queryFieldsKey).has(entity);
}

export function $path(context: DecoratorContext, entity: ModelProperty, paramName?: string) {
  const options: PathParameterOptions = {
    type: "path",
    name: paramName ?? entity.name,
  };
  context.program.stateMap(HttpStateKeys.pathFieldsKey).set(entity, options);
}

export function getPathParamOptions(program: Program, entity: Type): PathParameterOptions {
  return program.stateMap(HttpStateKeys.pathFieldsKey).get(entity);
}

export function getPathParamName(program: Program, entity: Type): string {
  return getPathParamOptions(program, entity)?.name;
}

export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.pathFieldsKey).has(entity);
}

export function $body(context: DecoratorContext, entity: ModelProperty) {
  context.program.stateSet(HttpStateKeys.bodyFieldsKey).add(entity);
}

export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.bodyFieldsKey).has(entity);
}

export function $statusCode(context: DecoratorContext, entity: ModelProperty) {
  context.program.stateSet(HttpStateKeys.statusCodeKey).add(entity);

  // eslint-disable-next-line deprecation/deprecation
  setLegacyStatusCodeState(context, entity);
}

/**
 * To not break we keep the legacy behavior of resolving the discrete status code in the decorator and saving them in the state.
 * @deprecated To remove. Added in October 2023 sprint.
 */
function setLegacyStatusCodeState(context: DecoratorContext, entity: ModelProperty) {
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
    for (const variant of entity.type.variants.values()) {
      const option = variant.type;
      if (option.kind === "String") {
        if (validStatusCode(context.program, option.value, option)) {
          codes.push(option.value);
        }
      } else if (option.kind === "Number") {
        if (validStatusCode(context.program, String(option.value), option)) {
          codes.push(String(option.value));
        }
      }
    }
  }

  // Check status code value: 3 digits with first digit in [1-5]
  // Issue a diagnostic if not valid
  function validStatusCode(program: Program, code: string, entity: Type): boolean {
    const statusCodePattern = /[1-5][0-9][0-9]/;
    if (code.match(statusCodePattern)) {
      return true;
    }
    reportDiagnostic(program, {
      code: "status-code-invalid",
      target: entity,
      messageId: "value",
    });
    return false;
  }
  context.program.stateMap(HttpStateKeys.statusCodeKey).set(entity, codes);
}

/**
 * @deprecated DO NOT USE, for internal use only.
 */
export function setStatusCode(program: Program, entity: Model | ModelProperty, codes: string[]) {
  program.stateMap(HttpStateKeys.statusCodeKey).set(entity, codes);
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.statusCodeKey).has(entity);
}

export function getStatusCodesWithDiagnostics(
  program: Program,
  type: ModelProperty
): [HttpStatusCodes, readonly Diagnostic[]] {
  return getStatusCodesFromType(program, type, type);
}

export function getStatusCodes(program: Program, entity: ModelProperty): HttpStatusCodes {
  return ignoreDiagnostics(getStatusCodesWithDiagnostics(program, entity));
}

// Reference: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
export function getStatusCodeDescription(statusCode: number | "*" | HttpStatusCodeRange | string) {
  if (typeof statusCode === "object") {
    return rangeDescription(statusCode.start, statusCode.end);
  }
  const statusCodeNumber = typeof statusCode === "string" ? parseInt(statusCode, 10) : statusCode;
  switch (statusCodeNumber) {
    case 200:
      return "The request has succeeded.";
    case 201:
      return "The request has succeeded and a new resource has been created as a result.";
    case 202:
      return "The request has been accepted for processing, but processing has not yet completed.";
    case 204:
      return "There is no content to send for this request, but the headers may be useful. ";
    case 301:
      return "The URL of the requested resource has been changed permanently. The new URL is given in the response.";
    case 304:
      return "The client has made a conditional request and the resource has not been modified.";
    case 400:
      return "The server could not understand the request due to invalid syntax.";
    case 401:
      return "Access is unauthorized.";
    case 403:
      return "Access is forbidden";
    case 404:
      return "The server cannot find the requested resource.";
    case 409:
      return "The request conflicts with the current state of the server.";
    case 412:
      return "Precondition failed.";
    case 503:
      return "Service unavailable.";
  }

  return rangeDescription(statusCodeNumber, statusCodeNumber);
}

function rangeDescription(start: number, end: number) {
  if (start >= 100 && end <= 199) {
    return "Informational";
  } else if (start >= 200 && end <= 299) {
    return "Successful";
  } else if (start >= 300 && end <= 399) {
    return "Redirection";
  } else if (start >= 400 && end <= 499) {
    return "Client error";
  } else if (start >= 500 && end <= 599) {
    return "Server error";
  }
  return undefined;
}

function setOperationVerb(program: Program, entity: Type, verb: HttpVerb): void {
  if (entity.kind === "Operation") {
    if (!program.stateMap(HttpStateKeys.operationVerbsKey).has(entity)) {
      program.stateMap(HttpStateKeys.operationVerbsKey).set(entity, verb);
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
  return program.stateMap(HttpStateKeys.operationVerbsKey).get(entity);
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

  let servers: HttpServer[] = context.program.stateMap(HttpStateKeys.serversKey).get(target);
  if (servers === undefined) {
    servers = [];
    context.program.stateMap(HttpStateKeys.serversKey).set(target, servers);
  }
  servers.push({
    url,
    description,
    parameters: parameterMap,
  });
}

export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(HttpStateKeys.serversKey).get(type);
}

export function $plainData(context: DecoratorContext, entity: Model) {
  const { program } = context;

  const decoratorsToRemove = ["$header", "$body", "$query", "$path", "$statusCode"];
  const [headers, bodies, queries, paths, statusCodes] = [
    program.stateMap(HttpStateKeys.headerFieldsKey),
    program.stateSet(HttpStateKeys.bodyFieldsKey),
    program.stateMap(HttpStateKeys.queryFieldsKey),
    program.stateMap(HttpStateKeys.pathFieldsKey),
    program.stateMap(HttpStateKeys.statusCodeKey),
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
  program.stateMap(HttpStateKeys.authenticationKey).set(serviceNamespace, auth);
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
  for (const variant of tuple.variants.values()) {
    const value = variant.type;
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
  // Validation of OAuth2Flow models in this function is minimal because the
  // type system already validates whether the model represents a flow
  // configuration.  This code merely avoids runtime errors.
  const flows =
    Array.isArray(data.flows) && data.flows.every((x: any) => typeof x === "object")
      ? data.flows
      : [];
  return {
    ...data,
    flows: flows.map((flow: any) => {
      return {
        ...flow,
        scopes: (flow.scopes || []).map((x: string) => ({ value: x })),
      };
    }),
  };
}

export function getAuthentication(
  program: Program,
  namespace: Namespace
): ServiceAuthentication | undefined {
  return program.stateMap(HttpStateKeys.authenticationKey).get(namespace);
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

  // Handle the deprecated `shared` option
  let shared = false;
  const sharedValue = parameters?.properties.get("shared")?.type;
  if (sharedValue !== undefined) {
    reportDeprecated(
      context.program,
      "The `shared` option is deprecated, use the `@sharedRoute` decorator instead.",
      entity
    );

    // The type checker should have raised a diagnostic if the value isn't boolean
    if (sharedValue.kind === "Boolean") {
      shared = sharedValue.value;
    }
  }

  setRoute(context, entity, {
    path,
    shared,
  });
}

/**
 * `@sharedRoute` marks the operation as sharing a route path with other operations.
 *
 * When an operation is marked with `@sharedRoute`, it enables other operations to share the same
 * route path as long as those operations are also marked with `@sharedRoute`.
 *
 * `@sharedRoute` can only be applied directly to operations.
 */
export function $sharedRoute(context: DecoratorContext, entity: Operation) {
  setSharedRoute(context.program, entity);
}

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
  const state = context.program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayloadKey);
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
    const value = program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayloadKey).get(e);
    if (value !== undefined) {
      return value;
    }
  }
  return true;
}
