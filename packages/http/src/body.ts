import {
  Diagnostic,
  DuplicateTracker,
  ModelProperty,
  Program,
  Type,
  createDiagnosticCollector,
  filterModelProperties,
  getDiscriminator,
  isArrayModelType,
  navigateType,
} from "@typespec/compiler";
import {
  isBody,
  isBodyRoot,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { Visibility, isVisible } from "./metadata.js";

export interface ResolvedBody {
  readonly type: Type;
  /** `true` if the body was specified with `@body` */
  readonly isExplicit: boolean;
  /** If the body original model contained property annotated with metadata properties. */
  readonly containsMetadataAnnotations: boolean;
  /** If body is defined with `@body` or `@bodyRoot` this is the property */
  readonly property?: ModelProperty;
}

export function resolveBody(
  program: Program,
  requestOrResponseType: Type,
  metadata: Set<ModelProperty>,
  rootPropertyMap: Map<ModelProperty, ModelProperty>,
  visibility: Visibility,
  usedIn: "request" | "response"
): [ResolvedBody | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // non-model or intrinsic/array model -> response body is response type
  if (requestOrResponseType.kind !== "Model" || isArrayModelType(program, requestOrResponseType)) {
    return diagnostics.wrap({
      type: requestOrResponseType,
      isExplicit: false,
      containsMetadataAnnotations: false,
    });
  }

  const duplicateTracker = new DuplicateTracker<string, Type>();

  // look for explicit body
  let resolvedBody: ResolvedBody | undefined;
  for (const property of metadata) {
    const isBodyVal = isBody(program, property);
    const isBodyRootVal = isBodyRoot(program, property);
    if (isBodyVal || isBodyRootVal) {
      duplicateTracker.track("body", property);
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

/** Validate a property marked with `@body` */
export function validateBodyProperty(
  program: Program,
  property: ModelProperty,
  usedIn: "request" | "response"
): [boolean, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  navigateType(
    property.type,
    {
      modelProperty: (prop) => {
        const kind = isHeader(program, prop)
          ? "header"
          : usedIn === "request" && isQueryParam(program, prop)
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
