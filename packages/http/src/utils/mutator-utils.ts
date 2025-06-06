import { Model, Program, Type } from "@typespec/compiler";
import {
  unsafe_MutableType as MutableType,
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
} from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";

const MUTATOR_RESULT_CACHE = Symbol.for("TypeSpec.Http.MutatorResultCache");

interface MutatorResultCache {
  [MUTATOR_RESULT_CACHE]?: WeakMap<MutableType, ReturnType<typeof mutateSubgraph>>;
}

export function cachedMutateSubgraph(
  program: Program,
  mutator: Mutator,
  type: MutableType,
): ReturnType<typeof mutateSubgraph> {
  const cache = ((mutator as MutatorResultCache)[MUTATOR_RESULT_CACHE] ??= new WeakMap());

  let cached = cache.get(type);

  if (cached) return cached;

  cached = mutateSubgraph(program, [mutator], type);

  cache.set(type, cached);
  return cached;
}

export function applyClone(target: Model, clone: Model): void {
  target.name = clone.name;
  target.baseModel = clone.baseModel;
  target.properties = clone.properties;
}

export function rename(
  program: Program,
  type: Extract<Type, { name?: string }>,
  nameTemplate: string,
) {
  if ($(program).array.is(type) && type.name === "Array") return;
  if (type.name) {
    type.name = replaceTemplatedStringFromProperties(nameTemplate, type);
  }
}

function replaceTemplatedStringFromProperties(formatString: string, sourceObject: Type) {
  // Template parameters are not valid source objects, just skip them
  if (sourceObject.kind === "TemplateParameter") {
    return formatString;
  }

  return formatString.replace(/{(\w+)}/g, (_, propName) => {
    return (sourceObject as any)[propName];
  });
}
