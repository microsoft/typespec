import { type ModelProperty, type Union, type UnionVariant } from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";
import type {
  ContentTypeDecorator,
  DataDecorator,
  EventsDecorator,
} from "../generated-defs/TypeSpec.Events.js";
import { EventsStateKeys } from "./lib.js";

const [isEvents, setEvents] = useStateSet<Union>(EventsStateKeys.events);

export const $eventsDecorator: EventsDecorator = (context, target) => {
  setEvents(context.program, target);
};

export { isEvents };

const [getContentType, setContentType] = useStateMap<ModelProperty | UnionVariant, string>(
  EventsStateKeys.contentType,
);

export const $contentTypeDecorator: ContentTypeDecorator = (context, target, contentType) => {
  setContentType(context.program, target, contentType);
};

export { getContentType };

const [isEventData, setEventData] = useStateSet<ModelProperty>(EventsStateKeys.data);

export const $dataDecorator: DataDecorator = (context, target) => {
  setEventData(context.program, target);
};

export { isEventData };
