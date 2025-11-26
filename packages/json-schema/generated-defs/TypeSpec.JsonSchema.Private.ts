import type { DecoratorContext, DecoratorPostValidator, Model, Type } from "@typespec/compiler";

export type ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type,
) => DecoratorPostValidator | void;

export type TypeSpecJsonSchemaPrivateDecorators = {
  validatesRawJson: ValidatesRawJsonDecorator;
};
