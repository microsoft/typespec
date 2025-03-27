import {
  compilerAssert,
  createDiagnosticCollector,
  DiagnosticResult,
  Model,
  Type,
  walkPropertiesInherited,
  type Diagnostic,
  type ModelProperty,
  type Program,
} from "@typespec/compiler";
import { PathOptions, QueryOptions } from "../generated-defs/TypeSpec.Http.js";
import {
  getCookieParamOptions,
  getHeaderFieldOptions,
  getPathOptions,
  getQueryOptions,
  isBody,
  isBodyRoot,
  isMultipartBodyProperty,
  isStatusCode,
  resolvePathOptionsWithDefaults,
  resolveQueryOptionsWithDefaults,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { isVisible, Visibility } from "./metadata.js";
import { HttpPayloadDisposition } from "./payload.js";
import {
  CookieParameterOptions,
  HeaderFieldOptions,
  PathParameterOptions,
  QueryParameterOptions,
} from "./types.js";

export type HttpProperty =
  | HeaderProperty
  | CookieProperty
  | ContentTypeProperty
  | QueryProperty
  | PathProperty
  | StatusCodeProperty
  | BodyProperty
  | BodyRootProperty
  | MultipartBodyProperty
  | BodyPropertyProperty;

export interface HttpPropertyBase {
  readonly property: ModelProperty;
  /** Path from the root of the operation parameters/returnType to the property. */
  readonly path: (string | number)[];
}

export interface HeaderProperty extends HttpPropertyBase {
  readonly kind: "header";
  readonly options: HeaderFieldOptions;
}

export interface CookieProperty extends HttpPropertyBase {
  readonly kind: "cookie";
  readonly options: CookieParameterOptions;
}

export interface ContentTypeProperty extends HttpPropertyBase {
  readonly kind: "contentType";
}

export interface QueryProperty extends HttpPropertyBase {
  readonly kind: "query";
  readonly options: Required<QueryOptions>;
}
export interface PathProperty extends HttpPropertyBase {
  readonly kind: "path";
  readonly options: Required<PathOptions>;
}
export interface StatusCodeProperty extends HttpPropertyBase {
  readonly kind: "statusCode";
}
export interface BodyProperty extends HttpPropertyBase {
  readonly kind: "body";
}
export interface BodyRootProperty extends HttpPropertyBase {
  readonly kind: "bodyRoot";
}
export interface MultipartBodyProperty extends HttpPropertyBase {
  readonly kind: "multipartBody";
}
/** Property to include inside the body */
export interface BodyPropertyProperty extends HttpPropertyBase {
  readonly kind: "bodyProperty";
}

export interface GetHttpPropertyOptions {
  implicitParameter?: (
    param: ModelProperty,
  ) => PathParameterOptions | QueryParameterOptions | undefined;
}
/**
 * Find the type of a property in a model
 */
function getHttpProperty(
  program: Program,
  property: ModelProperty,
  path: (string | number)[],
  options: GetHttpPropertyOptions = {},
): [HttpProperty, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];

  function createResult<T extends Omit<HttpProperty, "path" | "property">>(
    opts: T,
  ): [HttpProperty & T, readonly Diagnostic[]] {
    return [{ ...opts, property, path } as any, diagnostics];
  }

  const annotations = {
    header: getHeaderFieldOptions(program, property),
    cookie: getCookieParamOptions(program, property),
    query: getQueryOptions(program, property),
    path: getPathOptions(program, property),
    body: isBody(program, property),
    bodyRoot: isBodyRoot(program, property),
    multipartBody: isMultipartBodyProperty(program, property),
    statusCode: isStatusCode(program, property),
  };
  const defined = Object.entries(annotations).filter((x) => !!x[1]);
  const implicit = options.implicitParameter?.(property);

  if (implicit && defined.length > 0) {
    if (implicit.type === "path" && annotations.path) {
      if (
        annotations.path.explode !== undefined ||
        annotations.path.style !== undefined ||
        annotations.path.allowReserved !== undefined
      ) {
        diagnostics.push(
          createDiagnostic({
            code: "use-uri-template",
            format: {
              param: property.name,
            },
            target: property,
          }),
        );
      }
    } else if (implicit.type === "query" && annotations.query) {
      if (annotations.query.explode !== undefined) {
        diagnostics.push(
          createDiagnostic({
            code: "use-uri-template",
            format: {
              param: property.name,
            },
            target: property,
          }),
        );
      }
    } else {
      diagnostics.push(
        createDiagnostic({
          code: "incompatible-uri-param",
          format: {
            param: property.name,
            uriKind: implicit.type,
            annotationKind: defined[0][0],
          },
          target: property,
        }),
      );
    }
  }
  // if implicit just returns as it is. Validation above would have checked nothing was set explicitly apart from the type and that the type match
  if (implicit) {
    return createResult({
      kind: implicit.type,
      options: implicit as any,
      property,
    });
  }
  if (defined.length === 0) {
    return createResult({ kind: "bodyProperty" });
  } else if (defined.length > 1) {
    diagnostics.push(
      createDiagnostic({
        code: "operation-param-duplicate-type",
        format: { paramName: property.name, types: defined.map((x) => x[0]).join(", ") },
        target: property,
      }),
    );
  }

  if (annotations.header) {
    if (annotations.header.name.toLowerCase() === "content-type") {
      return createResult({ kind: "contentType" });
    } else {
      return createResult({ kind: "header", options: annotations.header });
    }
  } else if (annotations.cookie) {
    return createResult({ kind: "cookie", options: annotations.cookie });
  } else if (annotations.query) {
    return createResult({
      kind: "query",
      options: resolveQueryOptionsWithDefaults(annotations.query),
    });
  } else if (annotations.path) {
    return createResult({
      kind: "path",
      options: resolvePathOptionsWithDefaults(annotations.path),
    });
  } else if (annotations.statusCode) {
    return createResult({ kind: "statusCode" });
  } else if (annotations.body) {
    return createResult({ kind: "body" });
  } else if (annotations.bodyRoot) {
    return createResult({ kind: "bodyRoot" });
  } else if (annotations.multipartBody) {
    return createResult({ kind: "multipartBody" });
  }
  compilerAssert(false, `Unexpected http property type`);
}

/**
 * Walks the given input(request parameters or response) and return all the properties and where they should be included(header, query, path, body, as a body property, etc.)
 *
 * @param rootMapOut If provided, the map will be populated to link nested metadata properties to their root properties.
 */
export function resolvePayloadProperties(
  program: Program,
  type: Type,
  visibility: Visibility,
  disposition: HttpPayloadDisposition,
  options: GetHttpPropertyOptions = {},
): DiagnosticResult<HttpProperty[]> {
  const diagnostics = createDiagnosticCollector();
  const httpProperties = new Map<ModelProperty, HttpProperty>();

  if (type.kind !== "Model" || type.properties.size === 0) {
    return diagnostics.wrap([]);
  }

  const visited = new Set();
  function checkModel(model: Model, path: string[]) {
    visited.add(model);
    let foundBody = false;
    let foundBodyProperty = false;
    for (const property of walkPropertiesInherited(model)) {
      const propPath = [...path, property.name];

      if (!isVisible(program, property, visibility)) {
        continue;
      }

      let httpProperty = diagnostics.pipe(getHttpProperty(program, property, propPath, options));
      if (shouldTreatAsBodyProperty(httpProperty, disposition)) {
        httpProperty = { kind: "bodyProperty", property, path: propPath };
      }

      // Ignore cookies in response to avoid future breaking changes to @cookie.
      // https://github.com/microsoft/typespec/pull/4761#discussion_r1805082132
      if (httpProperty.kind === "cookie" && disposition === HttpPayloadDisposition.Response) {
        diagnostics.add(
          createDiagnostic({
            code: "response-cookie-not-supported",
            target: property,
            format: { propName: property.name },
          }),
        );
        continue;
      }

      if (
        httpProperty.kind === "body" ||
        httpProperty.kind === "bodyRoot" ||
        httpProperty.kind === "multipartBody"
      ) {
        foundBody = true;
      }

      if (
        !(httpProperty.kind === "body" || httpProperty.kind === "multipartBody") &&
        isModelWithProperties(property.type) &&
        !visited.has(property.type)
      ) {
        if (checkModel(property.type, propPath)) {
          foundBody = true;
          continue;
        }
      }
      if (httpProperty.kind === "bodyProperty") {
        foundBodyProperty = true;
      }
      httpProperties.set(property, httpProperty);
    }
    return foundBody && !foundBodyProperty;
  }

  checkModel(type, []);

  return diagnostics.wrap([...httpProperties.values()]);
}

function isModelWithProperties(type: Type): type is Model {
  return type.kind === "Model" && !type.indexer && type.properties.size > 0;
}

function shouldTreatAsBodyProperty(
  property: HttpProperty,
  disposition: HttpPayloadDisposition,
): boolean {
  switch (disposition) {
    case HttpPayloadDisposition.Request:
      return property.kind === "statusCode";
    case HttpPayloadDisposition.Response:
      return property.kind === "query" || property.kind === "path";
    case HttpPayloadDisposition.Multipart:
      return (
        property.kind === "path" || property.kind === "query" || property.kind === "statusCode"
      );
    default:
      void (disposition satisfies never);
      return false;
  }
}
