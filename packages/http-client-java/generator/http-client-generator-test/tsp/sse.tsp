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

@events
union TestStreamEvents {
  started: StartedEnvelope,

  @terminalEvent
  completed: CompletedEnvelope,
}

@clientNamespace("TspTest.Sse.Stream", "java")
interface Stream {
  @route("/stream")
  @get
  read(@header authorization?: string): SSEStream<TestStreamEvents>;
}
