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

export const $tagMetadata: TagMetadataDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  name: string,
  tagMetadata?: TypeSpecValue,
) => {
  const tags = getTagsMetadata(context.program, entity);
  if (tags && tags[name]) {
    reportDiagnostic(context.program, {
      code: "duplicate-tag",
      format: { tagName: name },
      target: context.getArgumentTarget(0)!,
    });
  }
  let metadata: OpenAPI3Tag = { name };
  if (tagMetadata) {
    const [data, diagnostics] = typespecTypeToJson<OpenAPI3Tag & Record<ExtensionKey, unknown>>(
      tagMetadata,
      context.getArgumentTarget(0)!,
    );
    context.program.reportDiagnostics(diagnostics);
    if (data === undefined) {
      return;
    }
    validateAdditionalInfoModel(context, tagMetadata, data);
    metadata = { ...data, name };
  }

  const newTags = { ...tags, [name]: metadata };
  setTagsMetadata(context.program, entity, newTags);
};

export { getTagsMetadata };

function validateAdditionalInfoModel(
  context: DecoratorContext,
  typespecType: TypeSpecValue,
  data: OpenAPI3Tag & Record<`x-${string}`, unknown>,
) {
  const propertyModel = context.program.resolveTypeReference(
    "TypeSpec.OpenAPI.TagMetadata",
  )[0]! as Model;
  const diagnostics: Diagnostic[] = [];
  if (typeof typespecType === "object" && propertyModel) {
    diagnostics.push(
      ...checkNoAdditionalProperties(typespecType, context.getArgumentTarget(0)!, propertyModel),
    );
  }
  if (data.externalDocs?.url) {
    diagnostics.push(
      ...validateIsUri(context.getArgumentTarget(0)!, data.externalDocs?.url, "externalDocs.url"),
    );
  }
  context.program.reportDiagnostics(diagnostics);
}
