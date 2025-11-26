import type { DecoratorContext, DecoratorPostValidator, Model, Type } from "@typespec/compiler";

export type ExternRefDecorator = (
  context: DecoratorContext,
  target: Model,
  path: Type,
  name: Type,
) => DecoratorPostValidator | void;

export type _mapDecorator = (
  context: DecoratorContext,
  target: Model,
) => DecoratorPostValidator | void;

export type TypeSpecProtobufPrivateDecorators = {
  externRef: ExternRefDecorator;
  _map: _mapDecorator;
};
