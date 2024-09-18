import type { DecoratorContext, Model, Type } from "@typespec/compiler";

export type ExternRefDecorator = (
  context: DecoratorContext,
  target: Model,
  path: Type,
  name: Type,
) => void;

export type _mapDecorator = (context: DecoratorContext, target: Model) => void;

export type TypeSpecProtobufPrivateDecorators = {
  externRef: ExternRefDecorator;
  _map: _mapDecorator;
};
