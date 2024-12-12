import { Model, ModelProperty, Program, Type } from "@typespec/compiler";
import { HttpOperationParameters, HttpOperationResponseContent } from "../types.js";
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
 * Gets stream metadata for a given `HttpOperationParameters` or `HttpOperationResponseContent`.
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
