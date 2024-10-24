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
import { ExtensionKey, checkNoAdditionalProperties, validateIsUri } from "@typespec/openapi";
import {
  OneOfDecorator,
  TagMetadataDecorator,
  UseRefDecorator,
} from "../generated-defs/TypeSpec.OpenAPI.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
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

const [getTagsMetadataState, setTagsMetadata] = unsafe_useStateMap<Type, OpenAPI3Tag[]>(
  Symbol.for("tagsMetadata"),
);
export const $tagMetadata: TagMetadataDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  name: string,
  tagMetadata?: TypeSpecValue,
) => {
  const tags = getTagsMetadataState(context.program, entity);
  if (tags) {
    const tagNamesSet = new Set(tags.map((t) => t.name));
    if (tagNamesSet.has(name)) {
      reportDiagnostic(context.program, {
        code: "duplicate-tag",
        format: { tagName: name },
        target: context.getArgumentTarget(0)!,
      });
    }
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
    validateAdditionalInfoModel(context, tagMetadata);
    if (data.externalDocs?.url) {
      const diagnostics = validateIsUri(
        context.getArgumentTarget(0)!,
        data.externalDocs?.url,
        "externalDocs.url",
      );
      context.program.reportDiagnostics(diagnostics);
    }

    metadata = { ...data, name };
  }

  if (tags) {
    tags.push(metadata);
  } else {
    setTagsMetadata(context.program, entity, [metadata]);
  }
};

export function getTagsMetadata(program: Program, entity: Type): OpenAPI3Tag[] {
  return getTagsMetadataState(program, entity) || [];
}

function validateAdditionalInfoModel(context: DecoratorContext, typespecType: TypeSpecValue) {
  const propertyModel = context.program.resolveTypeReference(
    "TypeSpec.OpenAPI.TagMetadata",
  )[0]! as Model;

  if (typeof typespecType === "object" && propertyModel) {
    const diagnostics = checkNoAdditionalProperties(
      typespecType,
      context.getArgumentTarget(0)!,
      propertyModel,
    );
    context.program.reportDiagnostics(diagnostics);
  }
}
