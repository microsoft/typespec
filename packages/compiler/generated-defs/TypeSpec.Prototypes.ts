import type { DecoratorContext, DecoratorValidatorCallback, Type } from "../src/index.js";

export type GetterDecorator = (
  context: DecoratorContext,
  target: Type,
) => DecoratorValidatorCallback | void;

export type TypeSpecPrototypesDecorators = {
  getter: GetterDecorator;
};
