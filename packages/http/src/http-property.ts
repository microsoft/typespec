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
  /** Path from the root of the operation parameters/returnType to the property. */
  readonly path: (string | number)[];
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
  implicitParameter?: (
    param: ModelProperty
  ) => PathParameterOptions | QueryParameterOptions | undefined;
}
/**
 * Find the type of a property in a model
 */
function getHttpProperty(
  program: Program,
  property: ModelProperty,
  path: (string | number)[],
  options: GetHttpPropertyOptions = {}
): [HttpProperty, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  function createResult<T extends Omit<HttpProperty, "path" | "property">>(
    opts: T
  ): [HttpProperty & T, readonly Diagnostic[]] {
    return [{ ...opts, property, path } as any, diagnostics];
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
  const implicit = options.implicitParameter?.(property);

  if (implicit && defined.length > 0) {
    if (implicit.type === "path" && annotations.path) {
      if (
        annotations.path.explode ||
        annotations.path.style !== "simple" ||
        annotations.path.allowReserved
      ) {
        diagnostics.push(
          createDiagnostic({
            code: "use-uri-template",
            format: {
              param: property.name,
            },
            target: property,
          })
        );
      }
    } else if (implicit.type === "query" && annotations.query) {
      if (annotations.query.explode) {
        diagnostics.push(
          createDiagnostic({
            code: "use-uri-template",
            format: {
              param: property.name,
            },
            target: property,
          })
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
        })
      );
    }
  }
  if (defined.length === 0) {
    if (implicit) {
      return createResult({
        kind: implicit.type,
        options: implicit as any,
        property,
      });
    }
    return createResult({ kind: "bodyProperty" });
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
      return createResult({ kind: "contentType" });
    } else {
      return createResult({ kind: "header", options: annotations.header });
    }
  } else if (annotations.query) {
    return createResult({ kind: "query", options: annotations.query });
  } else if (annotations.path) {
    return createResult({ kind: "path", options: annotations.path });
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
  options: GetHttpPropertyOptions = {}
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
      if (shouldTreatAsBodyProperty(httpProperty, visibility)) {
        httpProperty = { kind: "bodyProperty", property, path: propPath };
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

function shouldTreatAsBodyProperty(property: HttpProperty, visibility: Visibility): boolean {
  if (visibility & Visibility.Read) {
    return property.kind === "query" || property.kind === "path";
  }

  if (!(visibility & Visibility.Read)) {
    return property.kind === "statusCode";
  }
  return false;
}
