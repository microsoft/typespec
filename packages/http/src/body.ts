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
import { Visibility, gatherMetadata, isVisible } from "./metadata.js";
import { getHttpPart } from "./private.decorators.js";
import { HttpBody, HttpOperationMultipartBody, HttpOperationPart } from "./types.js";

interface BodyAndMetadata {
  body?: HttpBody;
  metadata: Set<ModelProperty>;
}
export function extractBodyAndMetadata(
  program: Program,
  responseType: Type,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart"
): [BodyAndMetadata, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const rootPropertyMap = new Map<ModelProperty, ModelProperty>();
  const metadata = gatherMetadata(
    program,
    diagnostics,
    responseType,
    visibility,
    undefined,
    rootPropertyMap
  );

  const body = diagnostics.pipe(
    resolveBody(program, responseType, metadata, rootPropertyMap, visibility, usedIn)
  );

  return diagnostics.wrap({ body, metadata });
}

function resolveBody(
  program: Program,
  requestOrResponseType: Type,
  metadata: Set<ModelProperty>,
  rootPropertyMap: Map<ModelProperty, ModelProperty>,
  visibility: Visibility,
  usedIn: "request" | "response" | "multipart"
): [HttpBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // non-model or intrinsic/array model -> response body is response type
  if (requestOrResponseType.kind !== "Model" || isArrayModelType(program, requestOrResponseType)) {
    return diagnostics.wrap({
      bodyKind: "single",
      type: requestOrResponseType,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  // look for explicit body
  const resolvedBody: HttpBody | undefined = diagnostics.pipe(
    resolveExplicitBodyProperty(program, metadata, usedIn)
  );

  if (resolvedBody === undefined) {
    // Special case if the model as a parent model then we'll return an empty object as this is assumed to be a nominal type.
    // Special Case if the model has an indexer then it means it can return props so cannot be void.
    if (requestOrResponseType.baseModel || requestOrResponseType.indexer) {
      return diagnostics.wrap({
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

  return diagnostics.wrap(resolvedBody);
}

function resolveExplicitBodyProperty(
  program: Program,
  metadata: Set<ModelProperty>,
  usedIn: "request" | "response" | "multipart"
): [HttpBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let resolvedBody: HttpBody | undefined;
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
          type: property.type,
          isExplicit: isBodyVal,
          containsMetadataAnnotations,
          property,
        };
      }
    } else if (isMultiPartBody) {
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
  visibility: Visibility
): [HttpOperationMultipartBody | undefined, readonly Diagnostic[]] {
  const type = property.type;
  if (type.kind === "Model") {
    return resolveMultiPartBodyFromModel(program, property, type, visibility);
  } else if (type.kind === "Tuple") {
    return resolveMultiPartBodyFromTuple(program, property, type, visibility);
  } else {
    return [undefined, [createDiagnostic({ code: "multipart-model", target: property })]];
  }
}

function resolveMultiPartBodyFromModel(
  program: Program,
  property: ModelProperty,
  type: Model,
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

  return diagnostics.wrap({ bodyKind: "multipart", contentTypes: [], parts, property, type });
}

function resolveMultiPartBodyFromTuple(
  program: Program,
  property: ModelProperty,
  type: Tuple,
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

  return diagnostics.wrap({ bodyKind: "multipart", contentTypes: [], parts, property, type });
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
      type,
      visibility,
      "multipart"
    );

    return [{ multi: false, name: part.options.name, body: null!, headers: {} }, diagnostics];
  }
  return [undefined, [createDiagnostic({ code: "multipart-part", target: type })]];
}
