import type { DecoratorContext, Model, Type } from "@typespec/compiler";

interface HttpPartOptions {
  readonly name?: string;
}
export type PlainDataDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpFileDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpPartDecorator = (
  context: DecoratorContext,
  target: Model,
  type: Type,
  options: HttpPartOptions
) => void;
