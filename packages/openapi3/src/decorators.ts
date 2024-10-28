import {
  DecoratorContext,
  Diagnostic,
  Model,
  ModelProperty,
  Namespace,
  Program,
  Type,
  TypeSpecValue,
  Union,
  typespecTypeToJson,
} from "@typespec/compiler";
import { unsafe_useStateMap } from "@typespec/compiler/experimental";
import { ExtensionKey, checkNoAdditionalProperties, validateIsUri } from "@typespec/openapi";
import {
  OneOfDecorator,
  TagMetadataDecorator,
  UseRefDecorator,
} from "../generated-defs/TypeSpec.OpenAPI.js";
import { OpenAPI3Keys, createStateSymbol, reportDiagnostic } from "./lib.js";
import { OpenAPI3Tag } from "./types.js";

const refTargetsKey = createStateSymbol("refs");
export const $useRef: UseRefDecorator = (
  context: DecoratorContext,
  entity: Model | ModelProperty,
  refUrl: string,
) => {
  context.program.stateMap(refTargetsKey).set(entity, refUrl);
};

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = createStateSymbol("oneOf");
export const $oneOf: OneOfDecorator = (
  context: DecoratorContext,
  entity: Union | ModelProperty,
) => {
  if (entity.kind === "ModelProperty" && entity.type.kind !== "Union") {
    reportDiagnostic(context.program, {
      code: "oneof-union",
      target: context.decoratorTarget,
    });
  }
  context.program.stateMap(oneOfKey).set(entity, true);
};

export function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

const [getTagsMetadata, setTagsMetadata] = unsafe_useStateMap<
  Type,
  { [name: string]: OpenAPI3Tag }
>(OpenAPI3Keys.tagsMetadata);

/**
 * Decorator to add metadata to a tag associated with a namespace.
 * @param context - The decorator context.
 * @param entity - The namespace entity to associate the tag with.
 * @param name - The name of the tag.
 * @param tagMetadata - Optional metadata for the tag.
 */
export const $tagMetadata: TagMetadataDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  name: string,
  tagMetadata?: TypeSpecValue,
) => {
  // Retrieve existing tags metadata or initialize an empty object
  const tags = getTagsMetadata(context.program, entity) || {};

  // Check for duplicate tag names
  if (tags[name]) {
    reportDiagnostic(context.program, {
      code: "duplicate-tag",
      format: { tagName: name },
      target: context.getArgumentTarget(0)!,
    });
    return;
  }

  let metadata: OpenAPI3Tag = { name };

  // Process tag metadata if provided
  if (tagMetadata) {
    const [data, diagnostics] = typespecTypeToJson<OpenAPI3Tag & Record<ExtensionKey, unknown>>(
      tagMetadata,
      context.getArgumentTarget(0)!,
    );

    // Report any diagnostics found during conversion
    context.program.reportDiagnostics(diagnostics);

    // Abort if data conversion failed
    if (data === undefined) {
      return;
    }

    // Validate additional information model; abort if invalid
    if (!validateAdditionalInfoModel(context, tagMetadata, data)) {
      return;
    }

    // Merge data into metadata
    metadata = { ...data, name };
  }

  // Update the tags metadata with the new tag
  tags[name] = metadata;
  setTagsMetadata(context.program, entity, tags);
};

export { getTagsMetadata };

/**
 * Validates the additional information model for tags.
 * @param context - The decorator context.
 * @param typespecType - The type of the tag metadata.
 * @param data - The tag metadata as an object.
 * @returns `true` if the validation was successful, `false` otherwise.
 */
function validateAdditionalInfoModel(
  context: DecoratorContext,
  typespecType: TypeSpecValue,
  data: OpenAPI3Tag & Record<`x-${string}`, unknown>,
): boolean {
  const diagnostics: Diagnostic[] = [];

  // Resolve the TagMetadata model
  const propertyModel = context.program.resolveTypeReference(
    "TypeSpec.OpenAPI.TagMetadata",
  )[0]! as Model;

  // Check that the type matches the model
  if (typeof typespecType === "object" && propertyModel) {
    diagnostics.push(
      ...checkNoAdditionalProperties(typespecType, context.getArgumentTarget(0)!, propertyModel),
    );
  }

  // Validate the externalDocs.url property
  if (data.externalDocs?.url) {
    diagnostics.push(
      ...validateIsUri(context.getArgumentTarget(0)!, data.externalDocs.url, "externalDocs.url"),
    );
  }

  // Abort if any diagnostics were found
  if (diagnostics.length > 0) {
    // Report any diagnostics found during validation
    context.program.reportDiagnostics(diagnostics);
    return false;
  }
  return true;
}
