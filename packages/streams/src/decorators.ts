import type { Model, Program, Type } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import type { StreamOfDecorator } from "../generated-defs/TypeSpec.Streams.js";
import { StreamStateKeys } from "./lib.js";

/**
 * Gets the stream's logical data type recorded by `@streamOf`, or `undefined` if
 * the model has no stream metadata. This is the data carried by the stream, not
 * necessarily the type used to represent its encoded body.
 */
const [getStreamOf, setStreamOf] = useStateMap<Model, Type>(StreamStateKeys.streamOf);

export const $streamOfDecorator: StreamOfDecorator = (context, target, type) => {
  setStreamOf(context.program, target, type);
};

/**
 * Tests whether the model has stream-data metadata from `@streamOf`, including
 * models created from `Stream<T>`. Does not validate a transport or content type.
 */
export function isStream(program: Program, target: Model): boolean {
  return getStreamOf(program, target) !== undefined;
}

export { getStreamOf };
