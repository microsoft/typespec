import {
  DecoratorContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
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
  entity: Namespace | Interface | Operation,
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

    curr.description = data.description;
    curr.externalDocs = data.externalDocs;
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

// Merge the tags for a operation with the tags that are on the namespace or
// interface it resides within.
export function getAllTagMetadatas(
  program: Program,
  target: Namespace | Interface | Operation,
): OpenAPI3Tag[] | undefined {
  const tags = new Set<OpenAPI3Tag>();

  let current: Namespace | Interface | Operation | undefined = target;
  while (current !== undefined) {
    for (const t of getTagMetadata(program, current)) {
      tags.add(t);
    }

    // Move up to the parent
    if (current.kind === "Operation") {
      current = current.interface ?? current.namespace;
    } else {
      // Type is a namespace or interface
      current = current.namespace;
    }
  }

  return tags.size > 0 ? Array.from(tags).reverse() : undefined;
}
