import type { DecoratorContext, DecoratorPostValidator, Type } from "../src/index.js";

export type GetterDecorator = (
  context: DecoratorContext,
  target: Type,
) => DecoratorPostValidator | void;

export type TypeSpecPrototypesDecorators = {
  getter: GetterDecorator;
};
