import type { DecoratorContext, Model, Type } from "@typespec/compiler";

/**
 * Specify that a model represents a stream protocol type whose data is described
 * by `Type`.
 *
 * @param type The type that models the underlying data of the stream.
 * @example
 * ```typespec
 * model Message {
 *   id: string;
 *   text: string;
 * }
 *
 * @streamOf(Message)
 * model Response {
 *   @body body: string;
 * }
 * ```
 */
export type StreamOfDecorator = (context: DecoratorContext, target: Model, type: Type) => void;

export type TypeSpecStreamsDecorators = {
  streamOf: StreamOfDecorator;
};
