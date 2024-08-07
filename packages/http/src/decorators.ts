import {
  DecoratorContext,
  Diagnostic,
  DiagnosticTarget,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  StringLiteral,
  SyntaxKind,
  Tuple,
  Type,
  Union,
  createDiagnosticCollector,
  getDoc,
  ignoreDiagnostics,
  isArrayModelType,
  reportDeprecated,
  typespecTypeToJson,
  validateDecoratorTarget,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import {
  BodyDecorator,
  BodyIgnoreDecorator,
  BodyRootDecorator,
  DeleteDecorator,
  GetDecorator,
  HeadDecorator,
  HeaderDecorator,
  MultipartBodyDecorator,
  PatchDecorator,
  PathDecorator,
  PathOptions,
  PostDecorator,
  PutDecorator,
  QueryDecorator,
  QueryOptions,
  RouteDecorator,
  ServerDecorator,
  SharedRouteDecorator,
  StatusCodeDecorator,
} from "../generated-defs/TypeSpec.Http.js";
import { HttpStateKeys, createDiagnostic, reportDiagnostic } from "./lib.js";
import { setRoute, setSharedRoute } from "./route.js";
import { getStatusCodesFromType } from "./status-codes.js";
import {
  Authentication,
  AuthenticationOption,
  HeaderFieldOptions,
  HttpAuth,
  HttpStatusCodeRange,
  HttpStatusCodes,
  HttpVerb,
  PathParameterOptions,
  QueryParameterOptions,
} from "./types.js";
import { extractParamsFromPath } from "./utils.js";

export const namespace = "TypeSpec.Http";

export const $header: HeaderDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  headerNameOrOptions?: StringLiteral | Type
) => {
  const options: HeaderFieldOptions = {
    type: "header",
    name: entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
  };
  if (headerNameOrOptions) {
    if (headerNameOrOptions.kind === "String") {
      options.name = headerNameOrOptions.value;
    } else if (headerNameOrOptions.kind === "Model") {
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
    } else {
      return;
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
  context.program.stateMap(HttpStateKeys.header).set(entity, options);
};

export function getHeaderFieldOptions(program: Program, entity: Type): HeaderFieldOptions {
  return program.stateMap(HttpStateKeys.header).get(entity);
}

export function getHeaderFieldName(program: Program, entity: Type): string {
  return getHeaderFieldOptions(program, entity)?.name;
}

export function isHeader(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.header).has(entity);
}

export const $query: QueryDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  queryNameOrOptions?: string | QueryOptions
) => {
  const paramName =
    typeof queryNameOrOptions === "string"
      ? queryNameOrOptions
      : (queryNameOrOptions?.name ?? entity.name);
  const userOptions: QueryOptions =
    typeof queryNameOrOptions === "object" ? queryNameOrOptions : {};
  if (userOptions.format) {
    reportDeprecated(
      context.program,
      "The `format` option of `@query` decorator is deprecated. Use `explode: true` instead of `form` and `multi`. `csv` or `simple` is the default now.",
      entity
    );
  }
  const options: QueryParameterOptions = {
    type: "query",
    explode:
      userOptions.explode ?? (userOptions.format === "multi" || userOptions.format === "form"),
    format: userOptions.format ?? (userOptions.explode ? "multi" : "csv"),
    name: paramName,
  };
  context.program.stateMap(HttpStateKeys.query).set(entity, options);
};

export function getQueryParamOptions(program: Program, entity: Type): QueryParameterOptions {
  return program.stateMap(HttpStateKeys.query).get(entity);
}

export function getQueryParamName(program: Program, entity: Type): string {
  return getQueryParamOptions(program, entity)?.name;
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.query).has(entity);
}

export const $path: PathDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  paramNameOrOptions?: string | PathOptions
) => {
  const paramName =
    typeof paramNameOrOptions === "string"
      ? paramNameOrOptions
      : (paramNameOrOptions?.name ?? entity.name);

  const userOptions: PathOptions = typeof paramNameOrOptions === "object" ? paramNameOrOptions : {};
  const options: PathParameterOptions = {
    type: "path",
    explode: userOptions.explode ?? false,
    allowReserved: userOptions.allowReserved ?? false,
    style: userOptions.style ?? "simple",
    name: paramName,
  };
  context.program.stateMap(HttpStateKeys.path).set(entity, options);
};

export function getPathParamOptions(program: Program, entity: Type): PathParameterOptions {
  return program.stateMap(HttpStateKeys.path).get(entity);
}

export function getPathParamName(program: Program, entity: Type): string {
  return getPathParamOptions(program, entity)?.name;
}

export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.path).has(entity);
}

export const $body: BodyDecorator = (context: DecoratorContext, entity: ModelProperty) => {
  context.program.stateSet(HttpStateKeys.body).add(entity);
};

export const $bodyRoot: BodyRootDecorator = (context: DecoratorContext, entity: ModelProperty) => {
  context.program.stateSet(HttpStateKeys.bodyRoot).add(entity);
};

export const $bodyIgnore: BodyIgnoreDecorator = (
  context: DecoratorContext,
  entity: ModelProperty
) => {
  context.program.stateSet(HttpStateKeys.bodyIgnore).add(entity);
};

export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.body).has(entity);
}

export function isBodyRoot(program: Program, entity: ModelProperty): boolean {
  return program.stateSet(HttpStateKeys.bodyRoot).has(entity);
}

export function isBodyIgnore(program: Program, entity: ModelProperty): boolean {
  return program.stateSet(HttpStateKeys.bodyIgnore).has(entity);
}

export const $multipartBody: MultipartBodyDecorator = (
  context: DecoratorContext,
  entity: ModelProperty
) => {
  context.program.stateSet(HttpStateKeys.multipartBody).add(entity);
};

export function isMultipartBodyProperty(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.multipartBody).has(entity);
}

export const $statusCode: StatusCodeDecorator = (
  context: DecoratorContext,
  entity: ModelProperty
) => {
  context.program.stateSet(HttpStateKeys.statusCode).add(entity);

  // eslint-disable-next-line deprecation/deprecation
  setLegacyStatusCodeState(context, entity);
};

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
  context.program.stateMap(HttpStateKeys.statusCode).set(entity, codes);
}

/**
 * @deprecated DO NOT USE, for internal use only.
 */
export function setStatusCode(program: Program, entity: Model | ModelProperty, codes: string[]) {
  program.stateMap(HttpStateKeys.statusCode).set(entity, codes);
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.statusCode).has(entity);
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
      return "Access is forbidden.";
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

function setOperationVerb(context: DecoratorContext, entity: Operation, verb: HttpVerb): void {
  validateVerbUniqueOnNode(context, entity);
  context.program.stateMap(HttpStateKeys.verbs).set(entity, verb);
}

function validateVerbUniqueOnNode(context: DecoratorContext, type: Operation) {
  const verbDecorators = type.decorators.filter(
    (x) =>
      VERB_DECORATORS.includes(x.decorator) &&
      x.node?.kind === SyntaxKind.DecoratorExpression &&
      x.node?.parent === type.node
  );

  if (verbDecorators.length > 1) {
    reportDiagnostic(context.program, {
      code: "http-verb-duplicate",
      format: { entityName: type.name },
      target: context.decoratorTarget,
    });
    return false;
  }
  return true;
}

export function getOperationVerb(program: Program, entity: Type): HttpVerb | undefined {
  return program.stateMap(HttpStateKeys.verbs).get(entity);
}

function createVerbDecorator(verb: HttpVerb) {
  return (context: DecoratorContext, entity: Operation) => {
    setOperationVerb(context, entity, verb);
  };
}

export const $get: GetDecorator = createVerbDecorator("get");
export const $put: PutDecorator = createVerbDecorator("put");
export const $post: PostDecorator = createVerbDecorator("post");
export const $patch: PatchDecorator = createVerbDecorator("patch");
export const $delete: DeleteDecorator = createVerbDecorator("delete");
export const $head: HeadDecorator = createVerbDecorator("head");

const VERB_DECORATORS = [$get, $head, $post, $put, $patch, $delete];

export interface HttpServer {
  url: string;
  description: string;
  parameters: Map<string, ModelProperty>;
}

/**
 * Configure the server url for the service.
 * @param context Decorator context
 * @param target Decorator target (must be a namespace)
 * @param description Description for this server.
 * @param parameters @optional Parameters to interpolate in the server url.
 */
export const $server: ServerDecorator = (
  context: DecoratorContext,
  target: Namespace,
  url: string,
  description: string,
  parameters?: Type
) => {
  const params = extractParamsFromPath(url);
  const parameterMap = new Map((parameters as Model)?.properties ?? []);
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

  let servers: HttpServer[] = context.program.stateMap(HttpStateKeys.servers).get(target);
  if (servers === undefined) {
    servers = [];
    context.program.stateMap(HttpStateKeys.servers).set(target, servers);
  }
  servers.push({
    url,
    description,
    parameters: parameterMap,
  });
};

export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(HttpStateKeys.servers).get(type);
}

export function $useAuth(
  context: DecoratorContext,
  entity: Namespace | Interface | Operation,
  authConfig: Type
) {
  validateDecoratorUniqueOnNode(context, entity, $useAuth);
  const [auth, diagnostics] = extractAuthentication(context.program, authConfig);
  if (diagnostics.length > 0) context.program.reportDiagnostics(diagnostics);
  if (auth !== undefined) {
    setAuthentication(context.program, entity, auth);
  }
}

export function setAuthentication(
  program: Program,
  entity: Namespace | Interface | Operation,
  auth: Authentication
) {
  program.stateMap(HttpStateKeys.authentication).set(entity, auth);
}

function extractAuthentication(
  program: Program,
  type: Type
): [Authentication | undefined, readonly Diagnostic[]] {
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
    default:
      return [
        undefined,
        [
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: type.kind },
            target: type,
          }),
        ],
      ];
  }
}

function extractHttpAuthenticationOptions(
  program: Program,
  tuple: Union,
  diagnosticTarget: DiagnosticTarget
): [Authentication, readonly Diagnostic[]] {
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
  const auth =
    result.type === "oauth2"
      ? extractOAuth2Auth(modelType, result)
      : { ...result, model: modelType };
  return [
    {
      ...auth,
      id: modelType.name || result.type,
      ...(description && { description }),
    },
    diagnostics,
  ];
}

function extractOAuth2Auth(modelType: Model, data: any): HttpAuth {
  // Validation of OAuth2Flow models in this function is minimal because the
  // type system already validates whether the model represents a flow
  // configuration.  This code merely avoids runtime errors.
  const flows =
    Array.isArray(data.flows) && data.flows.every((x: any) => typeof x === "object")
      ? data.flows
      : [];

  const defaultScopes = Array.isArray(data.defaultScopes) ? data.defaultScopes : [];
  return {
    id: data.id,
    type: data.type,
    model: modelType,
    flows: flows.map((flow: any) => {
      const scopes: Array<string> = flow.scopes ? flow.scopes : defaultScopes;
      return {
        ...flow,
        scopes: scopes.map((x: string) => ({ value: x })),
      };
    }),
  };
}

export function getAuthentication(
  program: Program,
  entity: Namespace | Interface | Operation
): Authentication | undefined {
  return program.stateMap(HttpStateKeys.authentication).get(entity);
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
export const $route: RouteDecorator = (
  context: DecoratorContext,
  entity: Type,
  path: string,
  parameters?: Type
) => {
  validateDecoratorUniqueOnNode(context, entity, $route);

  // Handle the deprecated `shared` option
  let shared = false;
  const sharedValue = (parameters as Model)?.properties.get("shared")?.type;
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
};

/**
 * `@sharedRoute` marks the operation as sharing a route path with other operations.
 *
 * When an operation is marked with `@sharedRoute`, it enables other operations to share the same
 * route path as long as those operations are also marked with `@sharedRoute`.
 *
 * `@sharedRoute` can only be applied directly to operations.
 */
export const $sharedRoute: SharedRouteDecorator = (
  context: DecoratorContext,
  entity: Operation
) => {
  setSharedRoute(context.program, entity);
};

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
  const state = context.program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayload);
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
    const value = program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayload).get(e);
    if (value !== undefined) {
      return value;
    }
  }
  return true;
}
