import type { DecoratorContext, Model, Type } from "@typespec/compiler";

export type PlainDataDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpFileDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpPartDecorator = (
  context: DecoratorContext,
  target: Model,
  type: Type,
  options: unknown
) => void;
