import {
  Diagnostic,
  Model,
  ModelProperty,
  Program,
  Tuple,
  Type,
  createDiagnosticCollector,
  filterModelProperties,
  getDiscriminator,
  getEncode,
  ignoreDiagnostics,
  isArrayModelType,
  navigateType,
} from "@typespec/compiler";
import { DuplicateTracker } from "@typespec/compiler/utils";
import { getContentTypes } from "./content-types.js";
import { isHeader, isPathParam, isQueryParam, isStatusCode } from "./decorators.js";
import {
  GetHttpPropertyOptions,
  HeaderProperty,
  HttpProperty,
  resolvePayloadProperties,
} from "./http-property.js";
import { createDiagnostic } from "./lib.js";
import { Visibility } from "./metadata.js";
import { HttpFileModel, getHttpFileModel, getHttpPart } from "./private.decorators.js";
import { HttpOperationBody, HttpOperationMultipartBody, HttpOperationPart } from "./types.js";

export interface HttpPayload {
  readonly body?: HttpOperationBody | HttpOperationMultipartBody;
  readonly metadata: HttpProperty[];
}
export interface ExtractBodyAndMetadataOptions extends GetHttpPropertyOptions {}
export function resolveHttpPayload(
  program: Program,
  type: Type,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart",
  options: ExtractBodyAndMetadataOptions = {},
): [HttpPayload, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const metadata = diagnostics.pipe(resolvePayloadProperties(program, type, visibility, options));

  const body = diagnostics.pipe(resolveBody(program, type, metadata, visibility, usedIn));

  if (body) {
    if (
      body.contentTypes.includes("multipart/form-data") &&
      body.bodyKind === "single" &&
      body.type.kind !== "Model"
    ) {
      diagnostics.add(
        createDiagnostic({
          code: "multipart-model",
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
  usedIn: "request" | "response" | "multipart",
): [HttpOperationBody | HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const resolvedContentTypes = diagnostics.pipe(resolveContentTypes(program, metadata, usedIn));

  const file = getHttpFileModel(program, requestOrResponseType);
  if (file !== undefined) {
    const file = getHttpFileModel(program, requestOrResponseType)!;
    return diagnostics.wrap({
      bodyKind: "single",
      contentTypes: diagnostics.pipe(getContentTypes(file.contentType)),
      contentTypeProperty: file.contentType,
      type: file.contents.type,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  // non-model or intrinsic/array model -> response body is response type
  if (requestOrResponseType.kind !== "Model" || isArrayModelType(program, requestOrResponseType)) {
    return diagnostics.wrap({
      bodyKind: "single",
      ...resolvedContentTypes,
      type: requestOrResponseType,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  // look for explicit body
  const resolvedBody: HttpOperationBody | HttpOperationMultipartBody | undefined = diagnostics.pipe(
    resolveExplicitBodyProperty(program, metadata, resolvedContentTypes, visibility, usedIn),
  );

  if (resolvedBody === undefined) {
    // Special case if the model as a parent model then we'll return an empty object as this is assumed to be a nominal type.
    // Special Case if the model has an indexer then it means it can return props so cannot be void.
    if (requestOrResponseType.baseModel || requestOrResponseType.indexer) {
      return diagnostics.wrap({
        bodyKind: "single",
        ...resolvedContentTypes,
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
        ...resolvedContentTypes,
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
        ...resolvedContentTypes,
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
  if (resolvedBody === undefined && resolvedContentTypes.contentTypeProperty) {
    diagnostics.add(
      createDiagnostic({
        code: "content-type-ignored",
        target: resolvedContentTypes.contentTypeProperty,
      }),
    );
  }
  return diagnostics.wrap(resolvedBody);
}

interface ResolvedContentType {
  readonly contentTypes: string[];
  readonly contentTypeProperty?: ModelProperty;
}
function resolveContentTypes(
  program: Program,
  metadata: HttpProperty[],
  usedIn: "request" | "response" | "multipart",
): [ResolvedContentType, readonly Diagnostic[]] {
  for (const prop of metadata) {
    if (prop.kind === "contentType") {
      const [contentTypes, diagnostics] = getContentTypes(prop.property);
      return [{ contentTypes, contentTypeProperty: prop.property }, diagnostics];
    }
  }
  switch (usedIn) {
    case "multipart":
      // Figure this out later
      return [{ contentTypes: [] }, []];
    default:
      return [{ contentTypes: ["application/json"] }, []];
  }
}

function resolveExplicitBodyProperty(
  program: Program,
  metadata: HttpProperty[],
  resolvedContentTypes: ResolvedContentType,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart",
): [HttpOperationBody | HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let resolvedBody: HttpOperationBody | HttpOperationMultipartBody | undefined;
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
          const valid = diagnostics.pipe(validateBodyProperty(program, item.property, usedIn));
          containsMetadataAnnotations = !valid;
        }
        if (resolvedBody === undefined) {
          resolvedBody = {
            bodyKind: "single",
            ...resolvedContentTypes,
            type: item.property.type,
            isExplicit: item.kind === "body",
            containsMetadataAnnotations,
            property: item.property,
            parameter: item.property,
          };
        }
        break;
      case "multipartBody":
        resolvedBody = diagnostics.pipe(
          resolveMultiPartBody(program, item.property, resolvedContentTypes, visibility),
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

/** Validate a property marked with `@body` */
function validateBodyProperty(
  program: Program,
  property: ModelProperty,
  usedIn: "request" | "response" | "multipart",
): [boolean, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  navigateType(
    property.type,
    {
      modelProperty: (prop) => {
        const kind = isHeader(program, prop)
          ? "header"
          : (usedIn === "request" || usedIn === "multipart") && isQueryParam(program, prop)
            ? "query"
            : usedIn === "request" && isPathParam(program, prop)
              ? "path"
              : usedIn === "response" && isStatusCode(program, prop)
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
  resolvedContentTypes: ResolvedContentType,
  visibility: Visibility,
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const type = property.type;
  if (type.kind === "Model") {
    return resolveMultiPartBodyFromModel(program, property, type, resolvedContentTypes, visibility);
  } else if (type.kind === "Tuple") {
    return resolveMultiPartBodyFromTuple(program, property, type, resolvedContentTypes, visibility);
  } else {
    return [undefined, [createDiagnostic({ code: "multipart-model", target: property })]];
  }
}

function resolveMultiPartBodyFromModel(
  program: Program,
  property: ModelProperty,
  type: Model,
  resolvedContentTypes: ResolvedContentType,
  visibility: Visibility,
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];
  for (const item of type.properties.values()) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item.type, visibility));
    if (part) {
      parts.push({ ...part, name: part.name ?? item.name, optional: item.optional });
    }
  }

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
  resolvedContentTypes: ResolvedContentType,
  visibility: Visibility,
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];

  for (const contentType of resolvedContentTypes.contentTypes) {
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
  for (const [index, item] of type.values.entries()) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item, visibility));
    if (
      part?.name === undefined &&
      resolvedContentTypes.contentTypes.includes(multipartContentTypes.formData)
    ) {
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
): [HttpOperationPart | undefined, readonly Diagnostic[]] {
  if (type.kind === "Model" && isArrayModelType(program, type)) {
    const [part, diagnostics] = resolvePart(program, type.indexer.value, visibility);
    if (part) {
      return [{ ...part, multi: true }, diagnostics];
    }
    return [part, diagnostics];
  } else {
    return resolvePart(program, type, visibility);
  }
}

function resolvePart(
  program: Program,
  type: Type,
  visibility: Visibility,
): [HttpOperationPart | undefined, readonly Diagnostic[]] {
  const part = getHttpPart(program, type);
  if (part) {
    const file = getHttpFileModel(program, part.type);
    if (file !== undefined) {
      return getFilePart(part.options.name, file);
    }
    let [{ body, metadata }, diagnostics] = resolveHttpPayload(
      program,
      part.type,
      visibility,
      "multipart",
    );
    if (body === undefined) {
      return [undefined, diagnostics];
    } else if (body.bodyKind === "multipart") {
      return [undefined, [createDiagnostic({ code: "multipart-nested", target: type })]];
    }

    if (body.contentTypes.length === 0) {
      body = { ...body, contentTypes: resolveDefaultContentTypeForPart(program, body.type) };
    }
    return [
      {
        multi: false,
        name: part.options.name,
        body,
        optional: false,
        headers: metadata.filter((x): x is HeaderProperty => x.kind === "header"),
      },
      diagnostics,
    ];
  }
  return [undefined, [createDiagnostic({ code: "multipart-part", target: type })]];
}

function getFilePart(
  name: string | undefined,
  file: HttpFileModel,
): [HttpOperationPart | undefined, readonly Diagnostic[]] {
  const [contentTypes, diagnostics] = getContentTypes(file.contentType);
  return [
    {
      multi: false,
      name,
      body: {
        bodyKind: "single",
        contentTypeProperty: file.contentType,
        contentTypes: contentTypes,
        type: file.contents.type,
        isExplicit: false,
        containsMetadataAnnotations: false,
      },
      filename: file.filename,
      optional: false,
      headers: [],
    },
    diagnostics,
  ];
}

function resolveDefaultContentTypeForPart(program: Program, type: Type): string[] {
  function resolve(type: Type): string[] {
    if (type.kind === "Scalar") {
      const encodedAs = getEncode(program, type);
      if (encodedAs) {
        type = encodedAs.type;
      }

      if (
        ignoreDiagnostics(
          program.checker.isTypeAssignableTo(
            type.projectionBase ?? type,
            program.checker.getStdType("bytes"),
            type,
          ),
        )
      ) {
        return ["application/octet-stream"];
      } else {
        return ["text/plain"];
      }
    } else if (type.kind === "Union") {
      return [...type.variants.values()].flatMap((x) => resolve(x.type));
    } else {
      return ["application/json"];
    }
  }

  return [...new Set(resolve(type))];
}
