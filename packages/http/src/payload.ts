import {
  DiagnosticResult,
  LiteralType,
  Model,
  ModelProperty,
  Program,
  Scalar,
  StringTemplate,
  Tuple,
  Type,
  Union,
  createDiagnosticCollector,
  filterModelProperties,
  getDiscriminator,
  getEncode,
  getMediaTypeHint,
  isArrayModelType,
  navigateType,
} from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";
import { DuplicateTracker } from "@typespec/compiler/utils";
import { getContentTypes } from "./content-types.js";
import { isCookieParam, isHeader, isPathParam, isQueryParam, isStatusCode } from "./decorators.js";
import {
  GetHttpPropertyOptions,
  HeaderProperty,
  HttpProperty,
  resolvePayloadProperties,
} from "./http-property.js";
import { createDiagnostic, reportDiagnostic } from "./lib.js";
import { Visibility } from "./metadata.js";
import { HttpFileModel, getHttpFileModel, getHttpPart } from "./private.decorators.js";
import {
  HttpOperationFileBody,
  HttpOperationMultipartBody,
  HttpOperationPart,
  HttpPayloadBody,
} from "./types.js";

export interface HttpPayload {
  readonly body?: HttpPayloadBody;
  readonly metadata: HttpProperty[];
}

export interface ExtractBodyAndMetadataOptions extends GetHttpPropertyOptions {}

/**
 * The disposition of a payload in an HTTP operation.
 */
export enum HttpPayloadDisposition {
  /**
   * The payload appears in a request.
   */
  Request,
  /**
   * The payload appears in a response.
   */
  Response,
  /**
   * The payload appears in a multipart part.
   */
  Multipart,
}

export function resolveHttpPayload(
  program: Program,
  type: Type,
  visibility: Visibility,
  disposition: HttpPayloadDisposition,
  options: ExtractBodyAndMetadataOptions = {},
): DiagnosticResult<HttpPayload> {
  const diagnostics = createDiagnosticCollector();

  const metadata = diagnostics.pipe(
    resolvePayloadProperties(program, type, visibility, disposition, options),
  );

  const body = diagnostics.pipe(resolveBody(program, type, metadata, visibility, disposition));

  if (body) {
    if (
      body.contentTypes.some((x) => x.startsWith("multipart/")) &&
      body.bodyKind !== "multipart"
    ) {
      diagnostics.add(
        createDiagnostic({
          code: "no-implicit-multipart",
          target: body.property ?? type,
        }),
      );
      return diagnostics.wrap({ body: undefined, metadata });
    }
  }

  return diagnostics.wrap({ body, metadata });
}

function resolveBody(
  program: Program,
  requestOrResponseType: Type,
  metadata: HttpProperty[],
  visibility: Visibility,
  disposition: HttpPayloadDisposition,
): DiagnosticResult<HttpPayloadBody | undefined> {
  const diagnostics = createDiagnosticCollector();

  const contentTypeProperty = metadata.find((x) => x.kind === "contentType");

  const file = getHttpFileModel(
    program,
    requestOrResponseType,
    createHttpFileModelFilter(metadata),
  );
  if (file !== undefined) {
    if (!contentTypeProperty) {
      // If no content-type property was specified, then this is a _literal_ file.
      return diagnostics.join(getFileBody(file));
    } else {
      const contentTypes =
        contentTypeProperty && diagnostics.pipe(getContentTypes(contentTypeProperty.property));

      reportDiagnostic(program, {
        code: "http-file-structured",
        format: {
          contentTypes: contentTypes!.join(", "),
        },
        target: contentTypeProperty.property,
      });
    }
  }

  // non-model or intrinsic/array model -> response body is response type
  if (requestOrResponseType.kind !== "Model" || isArrayModelType(program, requestOrResponseType)) {
    return diagnostics.wrap({
      bodyKind: "single",
      ...diagnostics.pipe(
        resolveContentTypesForBody(program, contentTypeProperty, requestOrResponseType),
      ),
      type: requestOrResponseType,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  // look for explicit body
  const resolvedBody: HttpPayloadBody | undefined = diagnostics.pipe(
    resolveExplicitBodyProperty(program, metadata, contentTypeProperty, visibility, disposition),
  );

  if (resolvedBody === undefined) {
    // Special case if the model has a parent model then we'll return an empty object as this is assumed to be a nominal type.
    // Special Case if the model has an indexer then it means it can return props so cannot be void.
    if (requestOrResponseType.baseModel || requestOrResponseType.indexer) {
      return diagnostics.wrap({
        bodyKind: "single",
        ...diagnostics.pipe(
          resolveContentTypesForBody(program, contentTypeProperty, requestOrResponseType),
        ),
        type: requestOrResponseType,
        isExplicit: false,
        containsMetadataAnnotations: false,
      });
    }
    // Special case for legacy purposes if the return type is an empty model with only @discriminator("xyz")
    // Then we still want to return that object as it technically always has a body with that implicit property.
    if (
      requestOrResponseType.derivedModels.length > 0 &&
      getDiscriminator(program, requestOrResponseType)
    ) {
      return diagnostics.wrap({
        bodyKind: "single",
        ...diagnostics.pipe(
          resolveContentTypesForBody(program, contentTypeProperty, requestOrResponseType),
        ),
        type: requestOrResponseType,
        isExplicit: false,
        containsMetadataAnnotations: false,
      });
    }
  }

  const unannotatedProperties = filterModelProperties(program, requestOrResponseType, (p) =>
    metadata.some((x) => x.property === p && x.kind === "bodyProperty"),
  );

  if (unannotatedProperties.properties.size > 0) {
    if (resolvedBody === undefined) {
      return diagnostics.wrap({
        bodyKind: "single",
        ...diagnostics.pipe(
          resolveContentTypesForBody(program, contentTypeProperty, requestOrResponseType),
        ),
        type: unannotatedProperties,
        isExplicit: false,
        containsMetadataAnnotations: false,
      });
    } else {
      diagnostics.add(
        createDiagnostic({
          code: "duplicate-body",
          messageId: "bodyAndUnannotated",
          target: requestOrResponseType,
        }),
      );
    }
  }
  if (resolvedBody === undefined && contentTypeProperty) {
    diagnostics.add(
      createDiagnostic({
        code: "content-type-ignored",
        target: contentTypeProperty.property,
      }),
    );
  }
  return diagnostics.wrap(resolvedBody);
}

interface ResolvedContentType {
  readonly contentTypes: string[];
  readonly contentTypeProperty?: ModelProperty;
}

function resolveExplicitBodyProperty(
  program: Program,
  metadata: HttpProperty[],
  contentTypeProperty: HttpProperty | undefined,
  visibility: Visibility,
  disposition: HttpPayloadDisposition,
): DiagnosticResult<HttpPayloadBody | undefined> {
  const diagnostics = createDiagnosticCollector();
  let resolvedBody: HttpPayloadBody | undefined;
  const duplicateTracker = new DuplicateTracker<string, Type>();

  for (const item of metadata) {
    if (item.kind === "body" || item.kind === "bodyRoot" || item.kind === "multipartBody") {
      duplicateTracker.track("body", item.property);
    }

    switch (item.kind) {
      case "body":
      case "bodyRoot":
        let containsMetadataAnnotations = false;
        if (item.kind === "body") {
          const valid = diagnostics.pipe(validateBodyProperty(program, item.property, disposition));
          containsMetadataAnnotations = !valid;
        }

        const file = getHttpFileModel(
          program,
          item.property.type,
          createHttpFileModelFilter(metadata),
        );

        const isFile = file !== undefined && !contentTypeProperty;

        if (file && contentTypeProperty) {
          const contentTypes = diagnostics.pipe(getContentTypes(contentTypeProperty.property));
          reportDiagnostic(program, {
            code: "http-file-structured",
            format: {
              contentTypes: contentTypes!.join(", "),
            },
            target: contentTypeProperty.property,
          });
        }

        if (item.property.type.kind === "Union" && unionContainsFile(program, item.property.type)) {
          reportDiagnostic(program, {
            code: "http-file-structured",
            messageId: "union",
            target:
              item.property.node.kind === SyntaxKind.ModelProperty
                ? item.property.node.value
                : item.property.node,
          });
        }

        resolvedBody ??= isFile
          ? diagnostics.pipe(getFileBody(file, item.property))
          : {
              bodyKind: "single",
              ...diagnostics.pipe(
                resolveContentTypesForBody(program, contentTypeProperty, item.property.type),
              ),
              type: item.property.type,
              isExplicit: item.kind === "body",
              containsMetadataAnnotations,
              property: item.property,
            };
        break;
      case "multipartBody":
        resolvedBody = diagnostics.pipe(
          resolveMultiPartBody(program, item.property, contentTypeProperty, visibility),
        );
        break;
    }
  }
  for (const [_, items] of duplicateTracker.entries()) {
    for (const prop of items) {
      diagnostics.add(
        createDiagnostic({
          code: "duplicate-body",
          target: prop,
        }),
      );
    }
  }

  return diagnostics.wrap(resolvedBody);
}

function unionContainsFile(program: Program, u: Union): boolean {
  return unionContainsFileWorker(u);

  function unionContainsFileWorker(u: Union, visited = new Set()): boolean {
    if (visited.has(u)) return false;

    visited.add(u);

    for (const { type } of u.variants.values()) {
      if (
        !!getHttpFileModel(program, type) ||
        (type.kind === "Union" && unionContainsFileWorker(type, visited))
      ) {
        return true;
      }
    }

    return false;
  }
}

/** Validate a property marked with `@body` */
function validateBodyProperty(
  program: Program,
  property: ModelProperty,
  disposition: HttpPayloadDisposition,
): DiagnosticResult<boolean> {
  const diagnostics = createDiagnosticCollector();
  navigateType(
    property.type,
    {
      modelProperty: (prop) => {
        const kind = isHeader(program, prop)
          ? "header"
          : // also emit metadata-ignored for response cookie
            (disposition === HttpPayloadDisposition.Request ||
                disposition === HttpPayloadDisposition.Response) &&
              isCookieParam(program, prop)
            ? "cookie"
            : (disposition === HttpPayloadDisposition.Request ||
                  disposition === HttpPayloadDisposition.Multipart) &&
                isQueryParam(program, prop)
              ? "query"
              : disposition === HttpPayloadDisposition.Request && isPathParam(program, prop)
                ? "path"
                : disposition === HttpPayloadDisposition.Response && isStatusCode(program, prop)
                  ? "statusCode"
                  : undefined;

        if (kind) {
          diagnostics.add(
            createDiagnostic({
              code: "metadata-ignored",
              format: { kind },
              target: prop,
            }),
          );
        }
      },
    },
    {},
  );
  return diagnostics.wrap(diagnostics.diagnostics.length === 0);
}

function resolveMultiPartBody(
  program: Program,
  property: ModelProperty,
  contentTypeProperty: HttpProperty | undefined,
  visibility: Visibility,
): DiagnosticResult<HttpOperationMultipartBody | undefined> {
  const diagnostics = createDiagnosticCollector();

  const type = property.type;

  const contentTypes =
    contentTypeProperty && diagnostics.pipe(getContentTypes(contentTypeProperty.property));

  for (const contentType of contentTypes ?? []) {
    if (!multipartContentTypesValues.includes(contentType as any)) {
      diagnostics.add(
        createDiagnostic({
          code: "multipart-invalid-content-type",
          format: { contentType, supportedContentTypes: multipartContentTypesValues.join(", ") },
          target: type,
        }),
      );
    }
  }

  if (type.kind === "Model") {
    return diagnostics.join(
      resolveMultiPartBodyFromModel(program, property, type, contentTypeProperty, visibility),
    );
  } else if (type.kind === "Tuple") {
    return diagnostics.join(
      resolveMultiPartBodyFromTuple(program, property, type, contentTypeProperty, visibility),
    );
  } else {
    diagnostics.add(createDiagnostic({ code: "multipart-model", target: property }));
    return diagnostics.wrap(undefined);
  }
}

function resolveMultiPartBodyFromModel(
  program: Program,
  property: ModelProperty,
  type: Model,
  contentTypeProperty: HttpProperty | undefined,
  visibility: Visibility,
): DiagnosticResult<HttpOperationMultipartBody | undefined> {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];
  for (const item of type.properties.values()) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item.type, visibility, item));
    if (part) {
      parts.push({ ...part, name: part.name ?? item.name, optional: item.optional });
    }
  }

  const resolvedContentTypes: ResolvedContentType = contentTypeProperty
    ? {
        contentTypeProperty: contentTypeProperty.property,
        contentTypes: diagnostics.pipe(getContentTypes(contentTypeProperty.property)),
      }
    : {
        contentTypes: [multipartContentTypes.formData],
      };

  return diagnostics.wrap({
    bodyKind: "multipart",
    ...resolvedContentTypes,
    parts,
    property,
    type,
  });
}

const multipartContentTypes = {
  formData: "multipart/form-data",
  mixed: "multipart/mixed",
} as const;
const multipartContentTypesValues = Object.values(multipartContentTypes);

function resolveMultiPartBodyFromTuple(
  program: Program,
  property: ModelProperty,
  type: Tuple,
  contentTypeProperty: HttpProperty | undefined,
  visibility: Visibility,
): DiagnosticResult<HttpOperationMultipartBody | undefined> {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];

  const contentTypes =
    contentTypeProperty && diagnostics.pipe(getContentTypes(contentTypeProperty?.property));

  for (const [index, item] of type.values.entries()) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item, visibility));
    if (part?.name === undefined && contentTypes?.includes(multipartContentTypes.formData)) {
      diagnostics.add(
        createDiagnostic({
          code: "formdata-no-part-name",
          target: type.node.values[index],
        }),
      );
    }
    if (part) {
      parts.push(part);
    }
  }

  const resolvedContentTypes: ResolvedContentType = contentTypeProperty
    ? {
        contentTypeProperty: contentTypeProperty.property,
        contentTypes: diagnostics.pipe(getContentTypes(contentTypeProperty.property)),
      }
    : {
        contentTypes: [multipartContentTypes.formData],
      };

  return diagnostics.wrap({
    bodyKind: "multipart",
    ...resolvedContentTypes,
    parts,
    property,
    type,
  });
}

function resolvePartOrParts(
  program: Program,
  type: Type,
  visibility: Visibility,
  property?: ModelProperty,
): DiagnosticResult<HttpOperationPart | undefined> {
  if (type.kind === "Model" && isArrayModelType(program, type)) {
    const [part, diagnostics] = resolvePart(program, type.indexer.value, visibility, property);
    if (part) {
      return [{ ...part, multi: true }, diagnostics];
    }
    return [part, diagnostics];
  } else {
    return resolvePart(program, type, visibility, property);
  }
}

function resolvePart(
  program: Program,
  type: Type,
  visibility: Visibility,
  property?: ModelProperty,
): DiagnosticResult<HttpOperationPart | undefined> {
  const diagnostics = createDiagnosticCollector();
  const part = getHttpPart(program, type);
  if (part) {
    let { body, metadata } = diagnostics.pipe(
      resolveHttpPayload(program, part.type, visibility, HttpPayloadDisposition.Multipart),
    );

    const contentTypeProperty = metadata.find((x) => x.kind === "contentType");

    if (body === undefined) {
      return diagnostics.wrap(undefined);
    } else if (body.bodyKind === "multipart") {
      diagnostics.add(createDiagnostic({ code: "multipart-nested", target: type }));
      return diagnostics.wrap(undefined);
    }

    if (body.contentTypes.length === 0) {
      body = {
        ...body,
        contentTypes: diagnostics.pipe(
          resolveContentTypesForBody(program, contentTypeProperty, body.type),
        ).contentTypes,
      };
    }

    return diagnostics.wrap({
      multi: false,
      property,
      name: part.options.name,
      body,
      optional: false,
      headers: metadata.filter((x): x is HeaderProperty => x.kind === "header"),
      filename: body.bodyKind === "file" ? body.filename : undefined,
    });
  }

  diagnostics.add(createDiagnostic({ code: "multipart-part", target: type }));

  return diagnostics.wrap(undefined);
}

/**
 * Creates a filter function to determine if a property is applicable metadata for the purposes
 * of effective File model calculation.
 */
function createHttpFileModelFilter(metadata: HttpProperty[]): (property: ModelProperty) => boolean {
  const metadataPropToMetadata = new Map<ModelProperty, HttpProperty>(
    metadata.map((x) => [x.property, x]),
  );

  return function isApplicableMetadata(property) {
    const httpProperty = metadataPropToMetadata.get(property);
    if (["filename"].includes(property.name)) return true;
    if (!httpProperty) return true;
    if (httpProperty.kind !== "bodyProperty") return false;

    return true;
  };
}

/**
 * Gets a file body from an HttpFileModel.
 *
 * @param file - the resolved file model
 * @param property - the property that references the file model, if any
 */
function getFileBody(
  file: HttpFileModel,
  property?: ModelProperty,
): DiagnosticResult<HttpOperationFileBody> {
  const [contentTypes, diagnostics] = getContentTypes(file.contentType);

  const isText = isOrExtendsString(file.contents.type);

  return [
    {
      bodyKind: "file",
      type: file.type,
      contents: file.contents,
      filename: file.filename,
      isText,
      contentTypeProperty: file.contentType,
      contentTypes,
      property,
    },
    diagnostics,
  ];

  function isOrExtendsString(type: Scalar): boolean {
    return isString(type) || (!!type.baseScalar && isOrExtendsString(type.baseScalar));

    function isString(type: Scalar): boolean {
      return (
        type.name === "string" &&
        !!type.namespace &&
        type.namespace.name === "TypeSpec" &&
        !!type.namespace.namespace &&
        type.namespace.namespace.name === "" &&
        !type.namespace.namespace.namespace
      );
    }
  }
}

function getDefaultContentTypeForKind(type: Type): string {
  return type.kind === "Scalar" ? "text/plain" : "application/json";
}

function isLiteralType(type: Type): type is LiteralType | StringTemplate {
  return (
    type.kind === "String" ||
    type.kind === "Number" ||
    type.kind === "Boolean" ||
    type.kind === "StringTemplate"
  );
}

function resolveContentTypesForBody(
  program: Program,
  contentTypeProperty: HttpProperty | undefined,
  type: Type,
  getDefaultContentType: (type: Type) => string = getDefaultContentTypeForKind,
): DiagnosticResult<ResolvedContentType> {
  const diagnostics = createDiagnosticCollector();

  return diagnostics.wrap(resolve());

  function resolve(): ResolvedContentType {
    if (contentTypeProperty) {
      return {
        contentTypes: diagnostics.pipe(getContentTypes(contentTypeProperty.property)),
        contentTypeProperty: contentTypeProperty.property,
      };
    }

    if (isLiteralType(type)) {
      switch (type.kind) {
        case "StringTemplate":
        case "String":
          type = program.checker.getStdType("string");
          break;
        case "Boolean":
          type = program.checker.getStdType("boolean");
          break;
        case "Number":
          type = program.checker.getStdType("numeric");
          break;
        default:
          void (type satisfies never);
      }
    }

    let encoded;

    while (
      (type.kind === "Scalar" || type.kind === "ModelProperty") &&
      (encoded = getEncode(program, type))
    ) {
      type = encoded.type;
    }

    if (type.kind === "Union") {
      const variants = [...type.variants.values()];
      const containsNull = variants.some(
        (v) => v.type.kind === "Intrinsic" && v.type.name === "null",
      );

      // If the union contains null, we just collapse to JSON in this default case.

      if (containsNull) {
        return { contentTypes: ["application/json"] };
      }

      const set = new Set<string>();

      for (const variant of variants) {
        const resolved = diagnostics.pipe(
          resolveContentTypesForBody(program, contentTypeProperty, variant.type),
        );

        for (const contentType of resolved.contentTypes) {
          set.add(contentType);
        }
      }
      return { contentTypes: [...set] };
    } else {
      const contentType = getMediaTypeHint(program, type) ?? getDefaultContentType(type);

      return { contentTypes: [contentType] };
    }
  }
}
