import type {
  DecoratorContext,
  DecoratorValidatorCallback,
  UnionVariant,
} from "@typespec/compiler";

/**
 * Indicates that the presence of this event is a terminal event,
 * and the client should disconnect from the server.
 */
export type TerminalEventDecorator = (
  context: DecoratorContext,
  target: UnionVariant,
) => DecoratorValidatorCallback | void;

export type TypeSpecSSEDecorators = {
  terminalEvent: TerminalEventDecorator;
};
