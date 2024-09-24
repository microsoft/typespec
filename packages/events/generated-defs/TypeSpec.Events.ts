import type { DecoratorContext, ModelProperty, Union, UnionVariant } from "@typespec/compiler";

/**
 * Specify that this union describes a set of events.
 *
 * @example
 * ```typespec
 * @events
 * union MixedEvents {
 *   pingEvent: string;
 *
 *   doneEvent: "done";
 * }
 * ```
 */
export type EventsDecorator = (context: DecoratorContext, target: Union) => void;

/**
 * Specifies the content type of the event envelope, event body, or event payload.
 * When applied to an event payload, that field must also have a corresponding `@data`
 * decorator.
 *
 * @example
 * ```typespec
 * @events union MixedEvents {
 *   @contentType("application/json")
 *   message: { id: string, text: string, }
 * }
 * ```
 * @example Specify the content type of the event payload.
 *
 * ```typespec
 * @events union MixedEvents {
 *   { done: true },
 *
 *   { done: false, @data @contentType("text/plain") value: string,}
 * }
 * ```
 */
export type ContentTypeDecorator = (
  context: DecoratorContext,
  target: UnionVariant | ModelProperty,
  contentType: string,
) => void;

/**
 * Identifies the payload of an event.
 * Only one field in an event can be marked as the payload.
 *
 * @example
 * ```typespec
 * @events union MixedEvents {
 *   { metadata: Record<string>, @data payload: string,}
 * }
 * ```
 */
export type DataDecorator = (context: DecoratorContext, target: ModelProperty) => void;

export type TypeSpecEventsDecorators = {
  events: EventsDecorator;
  contentType: ContentTypeDecorator;
  data: DataDecorator;
};
