import { DocTarget, setDocData } from "../../core/intrinsic-type-state.js";
import type { Program } from "../../core/program.js";
import type { DecoratorContext, ModelIndexer, Scalar, Type } from "../../core/types.js";

const indexTypeKey = Symbol.for(`TypeSpec.index`);
export const indexerDecorator = (
  context: DecoratorContext,
  target: Type,
  key: Scalar,
  value: Type,
) => {
  const indexer: ModelIndexer = { key, value };
  context.program.stateMap(indexTypeKey).set(target, indexer);
};

export function getIndexer(program: Program, target: Type): ModelIndexer | undefined {
  return program.stateMap(indexTypeKey).get(target);
}

/**
 * @internal to be used to set the `@doc` from doc comment.
 */
export const docFromCommentDecorator = (
  context: DecoratorContext,
  target: Type,
  key: DocTarget,
  text: string,
) => {
  setDocData(context.program, target, key, { value: text, source: "comment" });
};

const prototypeGetterKey = Symbol.for(`TypeSpec.Prototypes.getter`);
/** @internal */
export function getterDecorator(context: DecoratorContext, target: Type) {
  context.program.stateMap(prototypeGetterKey).set(target, true);
}

/** @internal */
export function isPrototypeGetter(program: Program, target: Type): ModelIndexer | undefined {
  return program.stateMap(prototypeGetterKey).get(target) ?? false;
}
