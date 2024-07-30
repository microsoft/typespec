import type {
  DecoratorContext,
  Interface,
  ModelProperty,
  Namespace,
  Operation,
} from "@typespec/compiler";

export type ShortDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  value: string
) => void;

export type PositionalDecorator = (context: DecoratorContext, target: ModelProperty) => void;

export type InvertableDecorator = (context: DecoratorContext, target: ModelProperty) => void;

export type CliDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation
) => void;
