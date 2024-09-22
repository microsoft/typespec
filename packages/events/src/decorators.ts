import type { Program, Union } from "@typespec/compiler";
import type {
  ContentTypeDecorator,
  DataDecorator,
  EventsDecorator,
} from "../generated-defs/TypeSpec.Events.js";
import { EventsStateKeys } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.Events";

export const $events: EventsDecorator = (context, target) => {
  context.program.stateSet(EventsStateKeys.events).add(target);
};

export function isEvents(program: Program, target: Union): boolean {
  return program.stateSet(EventsStateKeys.events).has(target);
}

export const $contentType: ContentTypeDecorator = (context, target, contentType) => {
  context.program.stateMap(EventsStateKeys.contentType).set(target, contentType);
};

export const $data: DataDecorator = (context, target) => {
  context.program.stateSet(EventsStateKeys.data).add(target);
};
