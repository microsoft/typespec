import type { DecoratorContext, Type } from "../src/core/index.js";

export type GetterDecorator = (context: DecoratorContext, target: Type) => void;

export type TypeSpecPrototypesDecorators = {
  getter: GetterDecorator;
};
