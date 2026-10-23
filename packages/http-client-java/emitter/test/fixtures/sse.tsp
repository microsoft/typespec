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
namespace SseTest;

model RetrievalStarted {
  requestId: string;
}

model ResponseCompleted {
  statusCode: int32;
}

@clientNamespace("SseTest.Retrieve", "java")
model StartedEnvelopeIgnoredByJava {
  @data
  payload: RetrievalStarted;
}

@clientNamespace("SseTest.Retrieve", "java")
model CompletedEnvelopeIgnoredByJava {
  @data
  payload: ResponseCompleted;
}

@events
union RetrievalStreamEvents {
  `retrieval.started`: StartedEnvelopeIgnoredByJava,

  @terminalEvent
  `response.completed`: CompletedEnvelopeIgnoredByJava,
}

@clientNamespace("SseTest.Retrieve", "java")
interface Retrieve {
  @route("/retrieve")
  @post
  retrieve(
    @body request: {
      query: string;
    },
    @header authorization?: string,
  ): SSEStream<RetrievalStreamEvents>;

  @route("/retrieve-protocol")
  @post
  @convenientAPI(false, "java")
  @protocolAPI(true, "java")
  retrieveProtocol(
    @body request: {
      query: string;
    },
  ): SSEStream<RetrievalStreamEvents>;
}
