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
  isArrayModelType,
  navigateType,
} from "@typespec/compiler";
import { DuplicateTracker } from "@typespec/compiler/utils";
import { getContentTypes, isContentTypeHeader } from "./content-types.js";
import {
  isBody,
  isBodyRoot,
  isHeader,
  isMultipartBodyProperty,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { Visibility, gatherMetadata, isMetadata, isVisible } from "./metadata.js";
import { getHttpPart } from "./private.decorators.js";
import { HttpOperationBody, HttpOperationMultipartBody, HttpOperationPart } from "./types.js";

export interface BodyAndMetadata {
  body?: HttpOperationBody | HttpOperationMultipartBody;
  metadata: Set<ModelProperty>;
}
export interface ExtractBodyAndMetadataOptions {
  isImplicitPathParam?: (param: ModelProperty) => boolean;
}
export function extractBodyAndMetadata(
  program: Program,
  type: Type,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart",
  options: ExtractBodyAndMetadataOptions = {}
): [BodyAndMetadata, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const rootPropertyMap = new Map<ModelProperty, ModelProperty>();
  const metadata = gatherMetadata(
    program,
    diagnostics,
    type,
    visibility,
    (_, param) =>
      isMetadata(program, param) ||
      Boolean(options.isImplicitPathParam && options.isImplicitPathParam(param)),
    rootPropertyMap
  );

  const body = diagnostics.pipe(
    resolveBody(program, type, metadata, rootPropertyMap, visibility, usedIn)
  );

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
        })
      );
      return diagnostics.wrap({ body: undefined, metadata });
    }
  }

  return diagnostics.wrap({ body, metadata });
}

function resolveBody(
  program: Program,
  requestOrResponseType: Type,
  metadata: Set<ModelProperty>,
  rootPropertyMap: Map<ModelProperty, ModelProperty>,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart"
): [HttpOperationBody | HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const { contentTypes, contentTypeProperty } = diagnostics.pipe(
    resolveContentTypes(program, metadata)
  );
  // non-model or intrinsic/array model -> response body is response type
  if (requestOrResponseType.kind !== "Model" || isArrayModelType(program, requestOrResponseType)) {
    return diagnostics.wrap({
      bodyKind: "single",
      contentTypes,
      type: requestOrResponseType,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  // look for explicit body
  const resolvedBody: HttpOperationBody | HttpOperationMultipartBody | undefined = diagnostics.pipe(
    resolveExplicitBodyProperty(program, metadata, contentTypes, visibility, usedIn)
  );

  if (resolvedBody === undefined) {
    // Special case if the model as a parent model then we'll return an empty object as this is assumed to be a nominal type.
    // Special Case if the model has an indexer then it means it can return props so cannot be void.
    if (requestOrResponseType.baseModel || requestOrResponseType.indexer) {
      return diagnostics.wrap({
        bodyKind: "single",
        contentTypes,
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
        contentTypes,
        type: requestOrResponseType,
        isExplicit: false,
        containsMetadataAnnotations: false,
      });
    }
  }

  const bodyRoot = resolvedBody?.property ? rootPropertyMap.get(resolvedBody.property) : undefined;

  const unannotatedProperties = filterModelProperties(
    program,
    requestOrResponseType,
    (p) => !metadata.has(p) && p !== bodyRoot && isVisible(program, p, visibility)
  );

  if (unannotatedProperties.properties.size > 0) {
    if (resolvedBody === undefined) {
      return diagnostics.wrap({
        bodyKind: "single",
        contentTypes,
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
        })
      );
    }
  }
  if (resolvedBody === undefined && contentTypeProperty) {
    diagnostics.add(
      createDiagnostic({
        code: "content-type-ignored",
        target: contentTypeProperty,
      })
    );
  }
  return diagnostics.wrap(resolvedBody);
}

function resolveContentTypes(
  program: Program,
  metadata: Set<ModelProperty>
): [{ contentTypes: string[]; contentTypeProperty?: ModelProperty }, readonly Diagnostic[]] {
  for (const prop of metadata) {
    if (isContentTypeHeader(program, prop)) {
      const [contentTypes, diagnostics] = getContentTypes(prop);
      return [{ contentTypes, contentTypeProperty: prop }, diagnostics];
    }
  }
  return [{ contentTypes: ["application/json"] }, []];
}

function resolveExplicitBodyProperty(
  program: Program,
  metadata: Set<ModelProperty>,
  contentTypes: string[],
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart"
): [HttpOperationBody | HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let resolvedBody: HttpOperationBody | HttpOperationMultipartBody | undefined;
  const duplicateTracker = new DuplicateTracker<string, Type>();

  for (const property of metadata) {
    const isBodyVal = isBody(program, property);
    const isBodyRootVal = isBodyRoot(program, property);
    const isMultiPartBody = isMultipartBodyProperty(program, property);

    if (isBodyVal || isBodyRootVal || isMultiPartBody) {
      duplicateTracker.track("body", property);
    }
    if (isBodyVal || isBodyRootVal) {
      let containsMetadataAnnotations = false;
      if (isBodyVal) {
        const valid = diagnostics.pipe(validateBodyProperty(program, property, usedIn));
        containsMetadataAnnotations = !valid;
      }
      if (resolvedBody === undefined) {
        resolvedBody = {
          bodyKind: "single",
          contentTypes,
          type: property.type,
          isExplicit: isBodyVal,
          containsMetadataAnnotations,
          property,
        };
      }
    } else if (isMultiPartBody) {
      resolvedBody = diagnostics.pipe(
        resolveMultiPartBody(program, property, contentTypes, visibility)
      );
    }
  }
  for (const [_, items] of duplicateTracker.entries()) {
    for (const prop of items) {
      diagnostics.add(
        createDiagnostic({
          code: "duplicate-body",
          target: prop,
        })
      );
    }
  }

  return diagnostics.wrap(resolvedBody);
}

/** Validate a property marked with `@body` */
function validateBodyProperty(
  program: Program,
  property: ModelProperty,
  usedIn: "request" | "response" | "multipart"
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
            })
          );
        }
      },
    },
    {}
  );
  return diagnostics.wrap(diagnostics.diagnostics.length === 0);
}

function resolveMultiPartBody(
  program: Program,
  property: ModelProperty,
  contentTypes: string[],
  visibility: Visibility
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const type = property.type;
  if (type.kind === "Model") {
    return resolveMultiPartBodyFromModel(program, property, type, contentTypes, visibility);
  } else if (type.kind === "Tuple") {
    return resolveMultiPartBodyFromTuple(program, property, type, contentTypes, visibility);
  } else {
    return [undefined, [createDiagnostic({ code: "multipart-model", target: property })]];
  }
}

function resolveMultiPartBodyFromModel(
  program: Program,
  property: ModelProperty,
  type: Model,
  contentTypes: string[],
  visibility: Visibility
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];
  for (const item of type.properties.values()) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item.type, visibility));
    if (part) {
      parts.push(part);
    }
  }

  return diagnostics.wrap({ bodyKind: "multipart", contentTypes, parts, property, type });
}

function resolveMultiPartBodyFromTuple(
  program: Program,
  property: ModelProperty,
  type: Tuple,
  contentTypes: string[],
  visibility: Visibility
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parts: HttpOperationPart[] = [];
  for (const item of type.values) {
    const part = diagnostics.pipe(resolvePartOrParts(program, item, visibility));
    if (part) {
      parts.push(part);
    }
  }

  return diagnostics.wrap({ bodyKind: "multipart", contentTypes, parts, property, type });
}

function resolvePartOrParts(
  program: Program,
  type: Type,
  visibility: Visibility
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
  visibility: Visibility
): [HttpOperationPart | undefined, readonly Diagnostic[]] {
  const part = getHttpPart(program, type);
  if (part) {
    const [{ body, metadata }, diagnostics] = extractBodyAndMetadata(
      program,
      part.type,
      visibility,
      "multipart"
    );
    if (body === undefined) {
      return [undefined, diagnostics];
    } else if (body.bodyKind === "multipart") {
      return [undefined, [createDiagnostic({ code: "multipart-nested", target: type })]];
    }

    return [{ multi: false, name: part.options.name, body, headers: {} }, diagnostics];
  }
  return [undefined, [createDiagnostic({ code: "multipart-part", target: type })]];
}
