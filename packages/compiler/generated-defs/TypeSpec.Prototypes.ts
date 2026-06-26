import type { DecoratorContext, DecoratorValidatorCallbacks, Type } from "../src/index.js";

export type GetterDecorator = (
  context: DecoratorContext,
  target: Type,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecPrototypesDecorators = {
  getter: GetterDecorator;
};
