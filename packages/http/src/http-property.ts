import {
  compilerAssert,
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
import { HeaderFieldOptions, PathParameterOptions, QueryParameterOptions } from "./types.js";

export type HttpProperty =
  | HeaderProperty
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
    return createResult({ kind: "header", options: annotations.header, property });
  } else if (annotations.query) {
    return createResult({ kind: "query", options: annotations.query, property });
  } else if (annotations.path) {
    if (property.optional) {
      diagnostics.push(
        createDiagnostic({
          code: "optional-path-param",
          format: { paramName: property.name },
          target: property,
        })
      );
    }
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
