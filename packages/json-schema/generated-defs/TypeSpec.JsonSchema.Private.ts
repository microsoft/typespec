import { DecoratorContext, Model, Type } from "@typespec/compiler";

export type ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type
) => void;
