import "@typespec/http";
import "@typespec/sse";
import "@typespec/events";
import "@typespec/spector";

using Http;
using Events;
using SSE;
using Spector;

@doc("Test of server-sent events (SSE) streaming.")
@scenarioService("/streaming/sse")
namespace Streaming.Sse;

@route("unnamed")
namespace Unnamed {
  model Info {
    desc: string;
  }

  @events
  union UnnamedEvents {
    @Events.contentType("application/json")
    Info,
  }

  @scenario
  @scenarioDoc("""
    SSE streaming with unnamed events. The server streams a sequence of unnamed
    `message` events, each carrying a JSON `Info` payload, then closes the
    connection. Since the union variant is unnamed, no `event:` field is emitted
    and each event defaults to the `message` type.
    
    Expected response body (content type `text/event-stream`):
    ```
    data: {"desc": "one"}
    
    data: {"desc": "two"}
    
    data: {"desc": "three"}
    
    ```
    """)
  @route("receive")
  op receive(): SSEStream<UnnamedEvents>;
}

@route("named")
namespace Named {
  model ResponseCreated {
    id: string;
  }

  model ResponseDelta {
    delta: string;
  }

  @events
  union ResponseEvents {
    @Events.contentType("application/json")
    responseCreated: ResponseCreated,

    @Events.contentType("application/json")
    responseDelta: ResponseDelta,

    @Events.contentType("text/plain")
    @terminalEvent
    "[DONE]",
  }

  @scenario
  @scenarioDoc("""
    SSE streaming with multiple named events and a terminal event, modeled after
    an OpenAI-style streaming response. Each named union variant sets the SSE
    `event:` field; the terminal `[DONE]` event signals the client to disconnect.
    
    Expected response body (content type `text/event-stream`):
    ```
    event: responseCreated
    data: {"id": "resp_1"}
    
    event: responseDelta
    data: {"delta": "Hello"}
    
    event: responseDelta
    data: {"delta": " world"}
    
    data: [DONE]
    
    ```
    """)
  @route("receive")
  op receive(): SSEStream<ResponseEvents>;
}

@route("retrieve")
namespace Retrieve {
  model RetrievalRequest {
    query: string;
  }

  model PartialResult {
    text: string;
  }

  model FinalResult {
    references: string[];
  }

  @events
  union RetrievalEvents {
    @Events.contentType("application/json")
    partialResult: PartialResult,

    @Events.contentType("application/json")
    finalResult: FinalResult,

    @Events.contentType("text/plain")
    @terminalEvent
    "[DONE]",
  }

  @scenario
  @scenarioDoc("""
    A POST request with a JSON body whose response is an SSE stream, modeled
    after a knowledge-retrieval service. The server streams `partialResult`
    events as results become available, a final `finalResult` event, and a
    terminal `[DONE]` event.
    
    Expected request body (content type `application/json`):
    ```
    {"query": "what is typespec?"}
    ```
    
    Expected response body (content type `text/event-stream`):
    ```
    event: partialResult
    data: {"text": "partial one"}
    
    event: partialResult
    data: {"text": "partial two"}
    
    event: finalResult
    data: {"references": ["doc1", "doc2"]}
    
    data: [DONE]
    
    ```
    """)
  @post
  @route("stream")
  op stream(@body request: RetrievalRequest): SSEStream<RetrievalEvents>;
}
