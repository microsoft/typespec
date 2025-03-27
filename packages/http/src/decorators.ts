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
  Tuple,
  Type,
  Union,
  createDiagnosticCollector,
  getDoc,
  ignoreDiagnostics,
  typespecTypeToJson,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";
import { useStateMap } from "@typespec/compiler/utils";
import {
  BodyDecorator,
  BodyIgnoreDecorator,
  BodyRootDecorator,
  CookieDecorator,
  CookieOptions,
  DeleteDecorator,
  GetDecorator,
  HeadDecorator,
  HeaderDecorator,
  MultipartBodyDecorator,
  PatchDecorator,
  PatchOptions,
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
  CookieParameterOptions,
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
  headerNameOrOptions,
) => {
  const options: HeaderFieldOptions = {
    type: "header",
    name: entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
  };
  if (headerNameOrOptions) {
    if (typeof headerNameOrOptions === "string") {
      options.name = headerNameOrOptions;
    } else {
      const name = headerNameOrOptions.name;
      if (name) {
        options.name = name;
      }
      if (headerNameOrOptions.explode) {
        options.explode = true;
      }
    }
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

/** {@inheritDoc CookieDecorator } */
export const $cookie: CookieDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  cookieNameOrOptions?: string | CookieOptions,
) => {
  const paramName =
    typeof cookieNameOrOptions === "string"
      ? cookieNameOrOptions
      : (cookieNameOrOptions?.name ??
        entity.name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase());
  const options: CookieParameterOptions = {
    type: "cookie",
    name: paramName,
  };
  context.program.stateMap(HttpStateKeys.cookie).set(entity, options);
};

/**
 * Get the cookie parameter options for the given entity.
 * @param program
 * @param entity
 * @returns The cookie parameter options or undefined if the entity is not a cookie parameter.
 */
export function getCookieParamOptions(
  program: Program,
  entity: Type,
): QueryParameterOptions | undefined {
  return program.stateMap(HttpStateKeys.cookie).get(entity);
}

/**
 * Check whether the given entity is a cookie parameter.
 * @param program
 * @param entity
 * @returns True if the entity is a cookie parameter, false otherwise.
 */
export function isCookieParam(program: Program, entity: Type): boolean {
  return program.stateMap(HttpStateKeys.cookie).has(entity);
}

const [getQueryOptions, setQueryOptions] = useStateMap<
  ModelProperty,
  QueryOptions & { name: string }
>(HttpStateKeys.query);
export const $query: QueryDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  queryNameOrOptions?: string | QueryOptions,
) => {
  const paramName =
    typeof queryNameOrOptions === "string"
      ? queryNameOrOptions
      : (queryNameOrOptions?.name ?? entity.name);
  const userOptions: QueryOptions =
    typeof queryNameOrOptions === "object" ? queryNameOrOptions : {};

  setQueryOptions(context.program, entity, {
    explode: userOptions.explode,
    name: paramName,
  });
};

/** @internal */
export { getQueryOptions };
/** @internal */
export function resolveQueryOptionsWithDefaults(
  options: QueryOptions & { name: string },
): Required<QueryOptions> {
  return {
    explode: options.explode ?? false,
    name: options.name,
  };
}

export function getQueryParamOptions(
  program: Program,
  entity: Type,
): QueryParameterOptions | undefined {
  const userOptions = getQueryOptions(program, entity as any);
  if (!userOptions) return undefined;
  return { type: "query", ...resolveQueryOptionsWithDefaults(userOptions) };
}

export function getQueryParamName(program: Program, entity: Type): string | undefined {
  return getQueryParamOptions(program, entity)?.name;
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.query).has(entity);
}

const [getPathOptions, setPathOptions] = useStateMap<ModelProperty, PathOptions & { name: string }>(
  HttpStateKeys.path,
);

export const $path: PathDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  paramNameOrOptions?: string | PathOptions,
) => {
  const paramName =
    typeof paramNameOrOptions === "string"
      ? paramNameOrOptions
      : (paramNameOrOptions?.name ?? entity.name);

  const userOptions: PathOptions = typeof paramNameOrOptions === "object" ? paramNameOrOptions : {};
  setPathOptions(context.program, entity, {
    explode: userOptions.explode,
    allowReserved: userOptions.allowReserved,
    style: userOptions.style,
    name: paramName,
  });
};

/** @internal */
export { getPathOptions };

/** @internal */
export function resolvePathOptionsWithDefaults(
  options: PathOptions & { name: string },
): Required<PathOptions> {
  return {
    explode: options.explode ?? false,
    allowReserved: options.allowReserved ?? false,
    style: options.style ?? "simple",
    name: options.name,
  };
}

export function getPathParamOptions(
  program: Program,
  entity: Type,
): PathParameterOptions | undefined {
  const userOptions = getPathOptions(program, entity as any);
  if (!userOptions) return undefined;
  return { type: "path", ...resolvePathOptionsWithDefaults(userOptions) };
}

export function getPathParamName(program: Program, entity: Type): string | undefined {
  return getPathOptions(program, entity as any)?.name;
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
  entity: ModelProperty,
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
  entity: ModelProperty,
) => {
  context.program.stateSet(HttpStateKeys.multipartBody).add(entity);
};

export function isMultipartBodyProperty(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.multipartBody).has(entity);
}

export const $statusCode: StatusCodeDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
) => {
  context.program.stateSet(HttpStateKeys.statusCode).add(entity);
};

/**
 * @internal DO NOT USE, for internal use only.
 */
export function setStatusCode(program: Program, entity: Model | ModelProperty, codes: string[]) {
  program.stateMap(HttpStateKeys.statusCode).set(entity, codes);
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateSet(HttpStateKeys.statusCode).has(entity);
}

export function getStatusCodesWithDiagnostics(
  program: Program,
  type: ModelProperty,
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
      x.node?.parent === type.node,
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
export const $delete: DeleteDecorator = createVerbDecorator("delete");
export const $head: HeadDecorator = createVerbDecorator("head");

const _patch = createVerbDecorator("patch");

const [_getPatchOptions, setPatchOptions] = useStateMap<Operation, PatchOptions | undefined>(
  HttpStateKeys.patchOptions,
);

export const $patch: PatchDecorator = (
  context: DecoratorContext,
  entity: Operation,
  options?: PatchOptions,
) => {
  _patch(context, entity);

  if (options) setPatchOptions(context.program, entity, options);
};

/**
 * Gets the `PatchOptions` for the given operation.
 *
 * @param program - The program in which the operation occurs.
 * @param operation - The operation.
 * @returns The `PatchOptions` for the operation, or `undefined` if none. If the operation is not a PATCH operation, this
 * function will always return `undefined`. If it is a PATCH operation, it may return undefined if no options were provided.
 */
export function getPatchOptions(program: Program, operation: Operation): PatchOptions | undefined {
  return _getPatchOptions(program, operation);
}

const VERB_DECORATORS = [$get, $head, $post, $put, $patch, $delete];

export interface HttpServer {
  url: string;
  description?: string;
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
  description?: string,
  parameters?: Type,
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
  servers.push({ url, description, parameters: parameterMap });
};

export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(HttpStateKeys.servers).get(type);
}

export function $useAuth(
  context: DecoratorContext,
  entity: Namespace | Interface | Operation,
  authConfig: Type,
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
  auth: Authentication,
) {
  program.stateMap(HttpStateKeys.authentication).set(entity, auth);
}

function extractAuthentication(
  program: Program,
  type: Type,
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
  diagnosticTarget: DiagnosticTarget,
): [Authentication, readonly Diagnostic[]] {
  const options: AuthenticationOption[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const variant of tuple.variants.values()) {
    const value = variant.type;
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget),
        );
        if (result !== undefined) {
          options.push({ schemes: [result] });
        }
        break;
      case "Tuple":
        const option = diagnostics.pipe(
          extractHttpAuthenticationOption(program, value, diagnosticTarget),
        );
        options.push(option);
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: value.kind },
            target: value,
          }),
        );
    }
  }
  return diagnostics.wrap({ options });
}

function extractHttpAuthenticationOption(
  program: Program,
  tuple: Tuple,
  diagnosticTarget: DiagnosticTarget,
): [AuthenticationOption, readonly Diagnostic[]] {
  const schemes: HttpAuth[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const value of tuple.values) {
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget),
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
          }),
        );
    }
  }
  return diagnostics.wrap({ schemes });
}

function extractHttpAuthentication(
  program: Program,
  modelType: Model,
  diagnosticTarget: DiagnosticTarget,
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
  entity: Namespace | Interface | Operation,
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
  parameters?: Type,
) => {
  validateDecoratorUniqueOnNode(context, entity, $route);

  setRoute(context, entity, {
    path,
    shared: false,
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
  entity: Operation,
) => {
  setSharedRoute(context.program, entity);
};
