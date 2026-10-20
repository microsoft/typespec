import "@typespec/http";
import "@typespec/rest";
import "@typespec/events";
import "@typespec/sse";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Events;
using TypeSpec.SSE;

@service
@server("https://example.org")
namespace SseTest;

model RetrievalStarted {
  requestId: string;
}

model ResponseCompleted {
  statusCode: int32;
}

model StartedEnvelopeIgnoredByJava {
  @data
  payload: RetrievalStarted;
}

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

@route("/retrieve")
@post
op retrieve(
  @body request: {
    query: string;
  },
): SSEStream<RetrievalStreamEvents>;
