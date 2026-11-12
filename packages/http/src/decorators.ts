import type {
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
} from "@typespec/compiler";
import {
  createDiagnosticCollector,
  getDoc,
  ignoreDiagnostics,
  typespecTypeToJson,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";
import { useStateMap } from "@typespec/compiler/utils";
import type {
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
  ServerDecorator,
  StatusCodeDecorator,
} from "../generated-defs/TypeSpec.Http.js";
import { HttpStateKeys, createDiagnostic, reportDiagnostic } from "./lib.js";
import { getStatusCodesFromType } from "./status-codes.js";
import type {
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

/** {@inheritDoc HeaderDecorator} */
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

/**
 * Reads the header's wire name and explicitly configured serialization options.
 * Returns `undefined` at runtime for a type without `@header`.
 */
export function getHeaderFieldOptions(program: Program, entity: Type): HeaderFieldOptions {
  return program.stateMap(HttpStateKeys.header).get(entity);
}

/**
 * Reads the explicit or kebab-case default header name.
 * Returns `undefined` at runtime when the type is not marked `@header`.
 */
export function getHeaderFieldName(program: Program, entity: Type): string {
  return getHeaderFieldOptions(program, entity)?.name;
}

/** Tests whether the type has been marked as an HTTP header with `@header`. */
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
/** {@inheritDoc QueryDecorator} */
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

/**
 * Reads `@query` options, resolving the wire name and defaulting `explode` to false.
 * Returns `undefined` when the type is not a query parameter.
 */
export function getQueryParamOptions(
  program: Program,
  entity: Type,
): QueryParameterOptions | undefined {
  const userOptions = getQueryOptions(program, entity as any);
  if (!userOptions) return undefined;
  return { type: "query", ...resolveQueryOptionsWithDefaults(userOptions) };
}

/** Reads the query wire name, or `undefined` when `@query` has not been applied. */
export function getQueryParamName(program: Program, entity: Type): string | undefined {
  return getQueryParamOptions(program, entity)?.name;
}

/** Tests for explicit `@query` metadata; does not infer parameters from a URI template. */
export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.query).has(entity);
}

const [getPathOptions, setPathOptions] = useStateMap<ModelProperty, PathOptions & { name: string }>(
  HttpStateKeys.path,
);

/** {@inheritDoc PathDecorator} */
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

/**
 * Reads `@path` options with defaults: simple style, no explode, and no reserved characters.
 * Returns `undefined` without `@path`; URI-template inference happens during operation resolution.
 */
export function getPathParamOptions(
  program: Program,
  entity: Type,
): PathParameterOptions | undefined {
  const userOptions = getPathOptions(program, entity as any);
  if (!userOptions) return undefined;
  return { type: "path", ...resolvePathOptionsWithDefaults(userOptions) };
}

/** Reads the path wire name, or `undefined` when `@path` has not been applied. */
export function getPathParamName(program: Program, entity: Type): string | undefined {
  return getPathOptions(program, entity as any)?.name;
}

/** Tests for explicit `@path` metadata; does not infer parameters from a URI template. */
export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(HttpStateKeys.path).has(entity);
}

/** {@inheritDoc BodyDecorator} */
export const $body: BodyDecorator = (context: DecoratorContext, entity: ModelProperty) => {
  context.program.stateSet(HttpStateKeys.body).add(entity);
};

/** {@inheritDoc BodyRootDecorator} */
export const $bodyRoot: BodyRootDecorator = (context: DecoratorContext, entity: ModelProperty) => {
  context.program.stateSet(HttpStateKeys.bodyRoot).add(entity);
};

/** {@inheritDoc BodyIgnoreDecorator} */
export const $bodyIgnore: BodyIgnoreDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
) => {
  context.program.stateSet(HttpStateKeys.bodyIgnore).add(entity);
};

/** Tests whether the property's type was selected as the complete body by `@body`. */
export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.body).has(entity);
}

/** Tests whether `@bodyRoot` selects this property for body and nested metadata resolution. */
export function isBodyRoot(program: Program, entity: ModelProperty): boolean {
  return program.stateSet(HttpStateKeys.bodyRoot).has(entity);
}

/** Tests whether `@bodyIgnore` excludes this property from the HTTP body. */
export function isBodyIgnore(program: Program, entity: ModelProperty): boolean {
  return program.stateSet(HttpStateKeys.bodyIgnore).has(entity);
}

/** {@inheritDoc MultipartBodyDecorator} */
export const $multipartBody: MultipartBodyDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
) => {
  context.program.stateSet(HttpStateKeys.multipartBody).add(entity);
};

/** Tests whether `@multipartBody` selects this property as a multipart payload. */
export function isMultipartBodyProperty(program: Program, entity: Type): boolean {
  return program.stateSet(HttpStateKeys.multipartBody).has(entity);
}

/** {@inheritDoc StatusCodeDecorator} */
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

/** Tests whether `@statusCode` marks the property as response status metadata. */
export function isStatusCode(program: Program, entity: Type) {
  return program.stateSet(HttpStateKeys.statusCode).has(entity);
}

/**
 * Extracts status codes or inclusive ranges from a property's type and constraints.
 * Returns validation diagnostics alongside any successfully extracted entries.
 */
export function getStatusCodesWithDiagnostics(
  program: Program,
  type: ModelProperty,
): [HttpStatusCodes, readonly Diagnostic[]] {
  return getStatusCodesFromType(program, type, type);
}

/** Extracts status entries from a property, discarding validation diagnostics. */
export function getStatusCodes(program: Program, entity: ModelProperty): HttpStatusCodes {
  return ignoreDiagnostics(getStatusCodesWithDiagnostics(program, entity));
}

/**
 * Gets a built-in description for a status code or its HTTP status class.
 * Returns `undefined` for unrecognized values, including the `"*"` default response.
 */
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

/**
 * Reads the method assigned by an HTTP verb decorator, or `undefined` when none is set.
 * Does not perform the body-based method inference used by operation resolution.
 */
export function getOperationVerb(program: Program, entity: Type): HttpVerb | undefined {
  return program.stateMap(HttpStateKeys.verbs).get(entity);
}

function createVerbDecorator(verb: HttpVerb) {
  return (context: DecoratorContext, entity: Operation) => {
    setOperationVerb(context, entity, verb);
  };
}

/** {@inheritDoc GetDecorator} */
export const $get: GetDecorator = createVerbDecorator("get");
/** {@inheritDoc PutDecorator} */
export const $put: PutDecorator = createVerbDecorator("put");
/** {@inheritDoc PostDecorator} */
export const $post: PostDecorator = createVerbDecorator("post");
/** {@inheritDoc DeleteDecorator} */
export const $delete: DeleteDecorator = createVerbDecorator("delete");
/** {@inheritDoc HeadDecorator} */
export const $head: HeadDecorator = createVerbDecorator("head");

const _patch = createVerbDecorator("patch");

const [_getPatchOptions, setPatchOptions] = useStateMap<Operation, PatchOptions | undefined>(
  HttpStateKeys.patchOptions,
);

/**
 * Determines whether a decorator is being applied as the original source-level application,
 * as opposed to being inherited via `op is` or `interface extends`.
 *
 * @param context - The decorator context.
 * @param entity - The operation the decorator is being applied to.
 * @returns `true` if the decorator was directly written on this operation, `false` if inherited.
 */
function isOriginalDecoratorApplication(context: DecoratorContext, entity: Operation): boolean {
  const decoratorNode = context.decoratorTarget as any;

  // If inherited via `interface extends`, the cloned operation retains the original node,
  // but its interface is different from the node's parent.
  if (
    entity.interface !== undefined &&
    entity.node !== undefined &&
    entity.node.parent !== entity.interface.node
  ) {
    return false;
  }

  // If inherited via `op is`, the operation has a sourceOperation set.
  if (entity.sourceOperation !== undefined) {
    return false;
  }

  // If inherited via `op is` (fallback for when sourceOperation isn't yet set),
  // the decorator expression's parent won't match the entity's node.
  if (decoratorNode?.kind === SyntaxKind.DecoratorExpression && decoratorNode.parent) {
    if (decoratorNode.parent !== entity.node) {
      return false;
    }
  }

  return true;
}

/** {@inheritDoc PatchDecorator} */
export const $patch: PatchDecorator = (
  context: DecoratorContext,
  entity: Operation,
  options?: PatchOptions,
) => {
  _patch(context, entity);

  if (options) {
    if (options.implicitOptionality === true) {
      // Only emit the deprecation warning on the original use of the decorator,
      // not when inherited via `op is` or `interface extends`.
      if (isOriginalDecoratorApplication(context, entity)) {
        reportDiagnostic(context.program, {
          code: "deprecated-implicit-optionality",
          target: entity,
        });
      }
    }
    setPatchOptions(context.program, entity, options);
  }
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

/** A server endpoint declared by `@server`, including its template parameter definitions. */
export interface HttpServer {
  /** Server URL template, with `{name}` placeholders for server parameters. */
  url: string;
  /** Human-readable endpoint description, when supplied. */
  description?: string;
  /** Declared parameter properties keyed by their template names. */
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

/**
 * Reads servers declared directly on a namespace, in decorator application order.
 * Returns `undefined` when none are declared; does not search parent namespaces.
 */
export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(HttpStateKeys.servers).get(type);
}

/**
 * Applies `@useAuth`, interpreting unions as alternatives and tuples as combined schemes.
 * Reports invalid authentication definitions before recording any extracted requirements.
 */
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

/**
 * Stores extracted authentication directly on the target, replacing any previous value.
 * Inheritance from containing interfaces or namespaces is resolved when querying an operation.
 */
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
      : {
          ...result,
          // OpenID Connect requirement scopes come from the `scopes` tuple on the
          // model. Normalize to an array so downstream resolution can rely on it.
          ...(result.type === "openIdConnect" && {
            scopes: Array.isArray((result as any).scopes) ? (result as any).scopes : [],
          }),
          model: modelType,
        };
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

/**
 * Reads authentication stored directly on the target, or `undefined` when absent.
 * Use {@link getAuthenticationForOperation} to include containing-interface and namespace defaults.
 */
export function getAuthentication(
  program: Program,
  entity: Namespace | Interface | Operation,
): Authentication | undefined {
  return program.stateMap(HttpStateKeys.authentication).get(entity);
}
