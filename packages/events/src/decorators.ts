import { type ModelProperty, type Union, type UnionVariant } from "@typespec/compiler";
import { unsafe_useStateMap, unsafe_useStateSet } from "@typespec/compiler/experimental";
import type {
  ContentTypeDecorator,
  DataDecorator,
  EventsDecorator,
} from "../generated-defs/TypeSpec.Events.js";
import { EventsStateKeys } from "./lib.js";

const [isEvents, setEvents] = unsafe_useStateSet<Union>(EventsStateKeys.events);

export const $eventsDecorator: EventsDecorator = (context, target) => {
  setEvents(context.program, target);
};

export { isEvents };

const [getContentType, setContentType] = unsafe_useStateMap<ModelProperty | UnionVariant, string>(
  EventsStateKeys.contentType,
);

export const $contentTypeDecorator: ContentTypeDecorator = (context, target, contentType) => {
  setContentType(context.program, target, contentType);
};

export { getContentType };

const [isEventData, setEventData] = unsafe_useStateSet<ModelProperty>(EventsStateKeys.data);

export const $dataDecorator: DataDecorator = (context, target) => {
  setEventData(context.program, target);
};

export { isEventData };
