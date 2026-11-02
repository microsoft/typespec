import type { Model, ModelProperty, Program, Type } from "@typespec/compiler";
import type { HttpOperationParameters, HttpOperationResponseContent } from "../types.js";
let getStreamOf: typeof import("@typespec/streams").getStreamOf;
try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  getStreamOf = (await import("@typespec/streams")).getStreamOf;
} catch {
  getStreamOf = () => {
    throw new Error("@typespec/streams was not found");
  };
}

/**
 * Separates a stream's wire body type from its logical element type and originating stream model.
 * Returned for explicit stream bodies, including properties spread from a stream model.
 */
export interface StreamMetadata {
  /**
   * The `Type` of the property decorated with `@body`.
   */
  bodyType: Type;
  /**
   * The `Type` of the stream model.
   * For example, an instance of `HttpStream`.
   */
  originalType: Type;
  /**
   * The `Type` of the streaming payload.
   *
   * For example, given `HttpStream<Foo, "application/jsonl">`,
   * the `streamType` would be `Foo`.
   */
  streamType: Type;
  /**
   * The list of content-types that this stream supports.
   */
  contentTypes: string[];
}

/**
 * Gets stream metadata for resolved request parameters or a response content alternative.
 * Returns `undefined` without a body property, media types, or an originating stream model.
 * Follows source-property links so metadata survives model spreads.
 *
 * Requires `@typespec/streams` to be installed when inspecting a potential stream body.
 */
export function getStreamMetadata(
  program: Program,
  httpParametersOrResponse: HttpOperationParameters | HttpOperationResponseContent,
): StreamMetadata | undefined {
  const body = httpParametersOrResponse.body;
  if (!body) return;

  const contentTypes = body.contentTypes;
  if (!contentTypes.length) return;

  // @body is always explicitly set by HttpStream, so body.property will be defined.
  const bodyProperty = body.property;
  if (!bodyProperty) return;

  const streamData = getStreamFromBodyProperty(program, bodyProperty);
  if (!streamData) return;

  return {
    bodyType: body.type,
    originalType: streamData.model,
    streamType: streamData.streamOf,
    contentTypes: contentTypes,
  };
}

function getStreamFromBodyProperty(
  program: Program,
  bodyProperty: ModelProperty,
): { model: Model; streamOf: Type } | undefined {
  // Check the model first, then if we can't find it, fallback to the sourceProperty model.
  const streamOf = bodyProperty.model ? getStreamOf(program, bodyProperty.model) : undefined;

  if (streamOf) {
    // if `streamOf` is defined, then we know that `bodyProperty.model` is defined.
    return { model: bodyProperty.model!, streamOf };
  }

  if (bodyProperty.sourceProperty) {
    return getStreamFromBodyProperty(program, bodyProperty.sourceProperty);
  }
  return;
}
