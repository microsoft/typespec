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
import { ExtensionKey } from "@typespec/openapi";
import {
  OneOfDecorator,
  TagMetadataDecorator,
  UseRefDecorator,
} from "../generated-defs/TypeSpec.OpenAPI.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { AdditionalTag, OpenAPI3Tag } from "./types.js";

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

const [getTagsMetadataState, setTagMetadatas] = unsafe_useStateMap<Type, OpenAPI3Tag[]>(
  Symbol.for("tagMetadatas"),
);
export const $tagMetadata: TagMetadataDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  name: string,
  additionalTag?: TypeSpecValue,
) => {
  const curr = {
    name: name,
  } as OpenAPI3Tag;
  if (additionalTag) {
    const [data, diagnostics] = typespecTypeToJson<AdditionalTag & Record<ExtensionKey, unknown>>(
      additionalTag,
      context.getArgumentTarget(0)!,
    );
    context.program.reportDiagnostics(diagnostics);
    if (data === undefined) {
      return;
    }
  }

  const tags = getTagsMetadataState(context.program, entity);
  if (tags) {
    tags.push(curr);
  } else {
    setTagMetadatas(context.program, entity, [curr]);
  }
};

export function getTagMetadata(program: Program, entity: Type): OpenAPI3Tag[] {
  return getTagsMetadataState(program, entity) || [];
}
