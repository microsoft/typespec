import type { DecoratorContext, Model } from "@typespec/compiler";

export type PlainDataDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpFileDecorator = (context: DecoratorContext, target: Model) => void;
