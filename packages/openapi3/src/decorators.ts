import {
  DecoratorContext,
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
import { ExtensionKey, validateAdditionalInfoModel, validateIsUri } from "@typespec/openapi";
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

    // Validate the additionalInfo model
    if (
      !validateAdditionalInfoModel(
        context.program,
        context.getArgumentTarget(0)!,
        tagMetadata,
        "TypeSpec.OpenAPI.TagMetadata",
      )
    ) {
      return;
    }

    // Validate the externalDocs.url property
    if (data.externalDocs?.url) {
      if (
        !validateIsUri(
          context.program,
          context.getArgumentTarget(0)!,
          data.externalDocs.url,
          "externalDocs.url",
        )
      ) {
        return;
      }
    }
    // Merge data into metadata
    metadata = { ...data, name };
  }

  // Update the tags metadata with the new tag
  tags[name] = metadata;
  setTagsMetadata(context.program, entity, tags);
};

export { getTagsMetadata };
