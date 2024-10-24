import type { DecoratorContext, Operation } from "../src/index.js";

export type GetterDecorator = (context: DecoratorContext, target: Operation) => void;

export type TypeSpecPrototypesDecorators = {
  getter: GetterDecorator;
};
