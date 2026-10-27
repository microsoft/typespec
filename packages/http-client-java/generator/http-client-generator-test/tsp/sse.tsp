import "@typespec/http";
import "@typespec/rest";
import "@typespec/events";
import "@typespec/sse";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Events;
using TypeSpec.SSE;
using Azure.ClientGenerator.Core;

@service
@server("https://example.org")
namespace TspTest.Sse;

model StartedPayload {
  message: string;
}

model CompletedPayload {
  result: string[];
}

model ProtocolOnlyPayload {
  value: string;
}

model TestStreamEvent {
  value: string;
}

@encode(DurationKnownEncoding.seconds, int32)
scalar SecondsDuration extends duration;

@clientNamespace("TspTest.Sse.Stream", "java")
model ScalarEnvelope {
  @data
  payload: string;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model DictionaryEnvelope {
  @data
  payload: Record<string>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model CollectionsEnvelope {
  @data
  payload: Record<string[]>[];
}

@clientNamespace("TspTest.Sse.Stream", "java")
model ModelMapEnvelope {
  @data
  payload: Record<StartedPayload>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model DurationEnvelope {
  @data
  payload: SecondsDuration;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model DurationCollectionsEnvelope {
  @data
  payload: Record<Record<SecondsDuration[]>[]>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model StartedEnvelope {
  @data
  payload: StartedPayload;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model CompletedEnvelope {
  @data
  payload: CompletedPayload;
}

model ProtocolOnlyEnvelope {
  @data
  payload: ProtocolOnlyPayload;
}

@events
union TestStreamEvents {
  started: StartedEnvelope,
  text: ScalarEnvelope,
  event: ScalarEnvelope,
  map: DictionaryEnvelope,
  collections: CollectionsEnvelope,
  modelMap: ModelMapEnvelope,
  duration: DurationEnvelope,
  durations: DurationCollectionsEnvelope,

  @terminalEvent
  completed: CompletedEnvelope,
}

@events
union ProtocolOnlyStreamEvents {
  message: ProtocolOnlyEnvelope,
}

@clientNamespace("TspTest.Sse.Stream", "java")
interface Stream {
  @route("/stream")
  @get
  read(@header authorization?: string): SSEStream<TestStreamEvents>;

  @route("/stream-with-colliding-request")
  @post
  readWithCollidingRequest(@body request: TestStreamEvent): SSEStream<TestStreamEvents>;

  @route("/protocol-only")
  @get
  @convenientAPI(false, "java")
  @protocolAPI(true, "java")
  readProtocolOnly(): SSEStream<ProtocolOnlyStreamEvents>;
}
