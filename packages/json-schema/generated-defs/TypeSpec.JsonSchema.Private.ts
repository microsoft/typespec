import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Model,
  Type,
} from "@typespec/compiler";

export type ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecJsonSchemaPrivateDecorators = {
  validatesRawJson: ValidatesRawJsonDecorator;
};
