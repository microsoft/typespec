import type { DecoratorContext, DecoratorValidatorCallback, Model, Type } from "@typespec/compiler";

export type ExternRefDecorator = (
  context: DecoratorContext,
  target: Model,
  path: Type,
  name: Type,
) => DecoratorValidatorCallback | void;

export type _mapDecorator = (
  context: DecoratorContext,
  target: Model,
) => DecoratorValidatorCallback | void;

export type TypeSpecProtobufPrivateDecorators = {
  externRef: ExternRefDecorator;
  _map: _mapDecorator;
};
