import { type ModelProperty, type Union, type UnionVariant } from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";
import type {
  ContentTypeDecorator,
  DataDecorator,
  EventsDecorator,
} from "../generated-defs/TypeSpec.Events.js";
import { EventsStateKeys } from "./lib.js";

/** Tests whether the union is marked with `@TypeSpec.Events.events`. */
const [isEvents, setEvents] = useStateSet<Union>(EventsStateKeys.events);

export const $eventsDecorator: EventsDecorator = (context, target) => {
  setEvents(context.program, target);
};

export { isEvents };

/**
 * Gets the `@contentType` value recorded on an event variant or payload property,
 * or `undefined` if none is set. Does not infer a protocol's default content type.
 */
const [getContentType, setContentType] = useStateMap<ModelProperty | UnionVariant, string>(
  EventsStateKeys.contentType,
);

export const $contentTypeDecorator: ContentTypeDecorator = (context, target, contentType) => {
  setContentType(context.program, target, contentType);
};

export { getContentType };

/** Tests whether the property is marked with `@TypeSpec.Events.data` as an event payload. */
const [isEventData, setEventData] = useStateSet<ModelProperty>(EventsStateKeys.data);

export const $dataDecorator: DataDecorator = (context, target) => {
  setEventData(context.program, target);
};

export { isEventData };
