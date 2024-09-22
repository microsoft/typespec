import type { Model, Program, Type } from "@typespec/compiler";
import type { StreamOfDecorator } from "../generated-defs/TypeSpec.Streams.js";
import { StreamStateKeys } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.Streams";

export const $streamOf: StreamOfDecorator = (context, target, type) => {
  context.program.stateMap(StreamStateKeys.streamOf).set(target, type);
};

export function getStreamOf(program: Program, target: Model): Type | undefined {
  return program.stateMap(StreamStateKeys.streamOf).get(target);
}

export function isStream(program: Program, target: Model): boolean {
  return getStreamOf(program, target) !== undefined;
}
