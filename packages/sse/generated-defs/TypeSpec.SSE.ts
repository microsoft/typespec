import type { DecoratorContext, UnionVariant } from "@typespec/compiler";

export type TerminalEventDecorator = (context: DecoratorContext, target: UnionVariant) => void;

export type TypeSpecSSEDecorators = {
  terminalEvent: TerminalEventDecorator;
};
