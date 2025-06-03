import { Program } from "@typespec/compiler";
import {
  unsafe_MutableType as MutableType,
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
} from "@typespec/compiler/experimental";

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
