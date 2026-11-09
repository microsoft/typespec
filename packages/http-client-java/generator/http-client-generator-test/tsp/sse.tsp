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

@encode(DurationKnownEncoding.seconds, int32)
scalar SecondsDuration extends duration;

@clientNamespace("TspTest.Sse.Stream", "java")
model TestTextStreamEvent {
  @data
  payload: string;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestEventStreamEvent {
  @data
  payload: string;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestMapStreamEvent {
  @data
  payload: Record<string>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestCollectionsStreamEvent {
  @data
  payload: Record<string[]>[];
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestModelMapStreamEvent {
  @data
  payload: Record<StartedPayload>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestDurationStreamEvent {
  @data
  payload: SecondsDuration;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestDurationsStreamEvent {
  @data
  payload: Record<Record<SecondsDuration[]>[]>;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestStartedStreamEvent {
  @data
  payload: StartedPayload;
}

@clientNamespace("TspTest.Sse.Stream", "java")
model TestCompletedStreamEvent {
  @data
  payload: CompletedPayload;
}

model ProtocolOnlyMessageStreamEvent {
  @data
  payload: ProtocolOnlyPayload;
}

@events
union TestStreamEvents {
  started: TestStartedStreamEvent,
  text: TestTextStreamEvent,
  event: TestEventStreamEvent,
  map: TestMapStreamEvent,
  collections: TestCollectionsStreamEvent,
  modelMap: TestModelMapStreamEvent,
  duration: TestDurationStreamEvent,
  durations: TestDurationsStreamEvent,

  @terminalEvent
  completed: TestCompletedStreamEvent,
}

@events
union ProtocolOnlyStreamEvents {
  message: ProtocolOnlyMessageStreamEvent,
}

@events
union RetrievalStreamEvents {
  `retrieval.started`: StartedPayload,
  `123.done`: string,

  @terminalEvent
  `activity.completed`: {
    @data payload: CompletedPayload,
  },
}

@clientNamespace("TspTest.Sse.Stream", "java")
interface Stream {
  @route("/stream")
  @get
  read(@header authorization?: string): SSEStream<TestStreamEvents>;

  @route("/fallback")
  @get
  readFallback(): SSEStream<RetrievalStreamEvents>;

  @route("/protocol-only")
  @get
  @convenientAPI(false, "java")
  @protocolAPI(true, "java")
  readProtocolOnly(): SSEStream<ProtocolOnlyStreamEvents>;
}
