import { Program } from "../core/program.js";
import { DecoratorContext, ModelIndexer, Scalar, Type } from "../core/types.js";

export const namespace = "TypeSpec";

const indexTypeKey = Symbol.for(`TypeSpec.index`);
export const $indexer = (context: DecoratorContext, target: Type, key: Scalar, value: Type) => {
  const indexer: ModelIndexer = { key, value };
  context.program.stateMap(indexTypeKey).set(target, indexer);
};

export function getIndexer(program: Program, target: Type): ModelIndexer | undefined {
  return program.stateMap(indexTypeKey).get(target);
}
