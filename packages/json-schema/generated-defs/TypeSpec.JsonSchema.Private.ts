import type { DecoratorContext, DecoratorValidatorCallback, Model, Type } from "@typespec/compiler";

export type ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type,
) => DecoratorValidatorCallback | void;

export type TypeSpecJsonSchemaPrivateDecorators = {
  validatesRawJson: ValidatesRawJsonDecorator;
};
