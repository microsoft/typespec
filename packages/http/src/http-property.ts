import {
  DiagnosticResult,
  Model,
  Type,
  compilerAssert,
  createDiagnosticCollector,
  walkPropertiesInherited,
  type Diagnostic,
  type ModelProperty,
  type Program,
} from "@typespec/compiler";
import { Queue } from "@typespec/compiler/utils";
import {
  getHeaderFieldOptions,
  getPathParamOptions,
  getQueryParamOptions,
  isBody,
  isBodyRoot,
  isMultipartBodyProperty,
  isStatusCode,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { Visibility, isVisible } from "./metadata.js";
import { HeaderFieldOptions, PathParameterOptions, QueryParameterOptions } from "./types.js";

export type HttpProperty =
  | HeaderProperty
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
}

export interface HeaderProperty extends HttpPropertyBase {
  readonly kind: "header";
  readonly options: HeaderFieldOptions;
}

export interface ContentTypeProperty extends HttpPropertyBase {
  readonly kind: "contentType";
}

export interface QueryProperty extends HttpPropertyBase {
  readonly kind: "query";
  readonly options: QueryParameterOptions;
}
export interface PathProperty extends HttpPropertyBase {
  readonly kind: "path";
  readonly options: PathParameterOptions;
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
  isImplicitPathParam?: (param: ModelProperty) => boolean;
}
/**
 * Find the type of a property in a model
 */
export function getHttpProperty(
  program: Program,
  property: ModelProperty,
  options: GetHttpPropertyOptions = {}
): [HttpProperty, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  function createResult<T extends HttpProperty>(opts: T): [T, readonly Diagnostic[]] {
    return [{ ...opts, property } as any, diagnostics];
  }

  const annotations = {
    header: getHeaderFieldOptions(program, property),
    query: getQueryParamOptions(program, property),
    path: getPathParamOptions(program, property),
    body: isBody(program, property),
    bodyRoot: isBodyRoot(program, property),
    multipartBody: isMultipartBodyProperty(program, property),
    statusCode: isStatusCode(program, property),
  };
  const defined = Object.entries(annotations).filter((x) => !!x[1]);
  if (defined.length === 0) {
    if (options.isImplicitPathParam && options.isImplicitPathParam(property)) {
      return createResult({
        kind: "path",
        options: {
          name: property.name,
          type: "path",
        },
        property,
      });
    }
    return [{ kind: "bodyProperty", property }, []];
  } else if (defined.length > 1) {
    diagnostics.push(
      createDiagnostic({
        code: "operation-param-duplicate-type",
        format: { paramName: property.name, types: defined.map((x) => x[0]).join(", ") },
        target: property,
      })
    );
  }

  if (annotations.header) {
    if (annotations.header.name.toLowerCase() === "content-type") {
      return createResult({ kind: "contentType", property });
    } else {
      return createResult({ kind: "header", options: annotations.header, property });
    }
  } else if (annotations.query) {
    return createResult({ kind: "query", options: annotations.query, property });
  } else if (annotations.path) {
    return createResult({ kind: "path", options: annotations.path, property });
  } else if (annotations.statusCode) {
    return createResult({ kind: "statusCode", property });
  } else if (annotations.body) {
    return createResult({ kind: "body", property });
  } else if (annotations.bodyRoot) {
    return createResult({ kind: "bodyRoot", property });
  } else if (annotations.multipartBody) {
    return createResult({ kind: "multipartBody", property });
  }
  compilerAssert(false, `Unexpected http property type`, property);
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
  options: GetHttpPropertyOptions = {}
): DiagnosticResult<HttpProperty[]> {
  const diagnostics = createDiagnosticCollector();
  const httpProperties = new Map<ModelProperty, HttpProperty>();

  if (type.kind !== "Model" || type.properties.size === 0) {
    return diagnostics.wrap([]);
  }

  const visited = new Set();
  const queue = new Queue<[Model, ModelProperty | undefined]>([[type, undefined]]);

  while (!queue.isEmpty()) {
    const [model, rootOpt] = queue.dequeue();
    visited.add(model);

    for (const property of walkPropertiesInherited(model)) {
      const root = rootOpt ?? property;

      if (!isVisible(program, property, visibility)) {
        continue;
      }

      let httpProperty = diagnostics.pipe(getHttpProperty(program, property, options));
      if (shouldTreatAsBodyProperty(httpProperty, visibility)) {
        httpProperty = { kind: "bodyProperty", property };
      }
      httpProperties.set(property, httpProperty);
      if (
        property !== root &&
        (httpProperty.kind === "body" ||
          httpProperty.kind === "bodyRoot" ||
          httpProperty.kind === "multipartBody")
      ) {
        const parent = httpProperties.get(root);
        if (parent?.kind === "bodyProperty") {
          httpProperties.delete(root);
        }
      }
      if (httpProperty.kind === "body" || httpProperty.kind === "multipartBody") {
        continue; // We ignore any properties under `@body` or `@multipartBody`
      }

      if (
        property.type.kind === "Model" &&
        !type.indexer &&
        type.properties.size > 0 &&
        !visited.has(property.type)
      ) {
        queue.enqueue([property.type, root]);
      }
    }
  }

  return diagnostics.wrap([...httpProperties.values()]);
}

function shouldTreatAsBodyProperty(property: HttpProperty, visibility: Visibility): boolean {
  if (visibility & Visibility.Read) {
    return property.kind === "query" || property.kind === "path";
  }

  if (!(visibility & Visibility.Read)) {
    return property.kind === "statusCode";
  }
  return false;
}
