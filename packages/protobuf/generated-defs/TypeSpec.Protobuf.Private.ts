import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Model,
  Type,
} from "@typespec/compiler";

export type ExternRefDecorator = (
  context: DecoratorContext,
  target: Model,
  path: Type,
  name: Type,
) => DecoratorValidatorCallbacks | void;

export type _mapDecorator = (
  context: DecoratorContext,
  target: Model,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecProtobufPrivateDecorators = {
  externRef: ExternRefDecorator;
  _map: _mapDecorator;
};
