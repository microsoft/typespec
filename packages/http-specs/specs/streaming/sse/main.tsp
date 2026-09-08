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

@route("protocol")
namespace Protocol {
  model Info {
    message: string;
  }

  @events
  union ProtocolEvents {
    @Events.contentType("application/json")
    message: Info,
  }

  @route("data")
  namespace Data {
    @events
    union DataEvents {
      withEnvelope: {
        @Events.contentType("text/plain")
        @data
        contents: string,
      },
      withoutEnvelope: {
        metadata: Record<string>,
        contents: string,
      },
    }

    @scenario
    @scenarioDoc("""
      SSE event with an explicit `@data` payload. The `withEnvelope` event sends
      only the `contents` property in the SSE `data` field.
      Expected response body (content type `text/event-stream`):
      ```
      event: withEnvelope
      data: hello
      ```
      """)
    @route("with-envelope")
    op withEnvelope(): SSEStream<DataEvents>;

    @scenario
    @scenarioDoc("""
      SSE event without an explicit `@data` payload. The `withoutEnvelope` event
      sends the complete model in the SSE `data` field.
      Expected response body (content type `text/event-stream`):
      ```
      event: withoutEnvelope
      data: {"metadata": {"source": "test"}, "contents": "world"}
      ```
      """)
    @route("without-envelope")
    op withoutEnvelope(): SSEStream<DataEvents>;
  }

  @scenario
  @scenarioDoc("""
    An SSE event with an `id` field. The event ID is envelope metadata and is
    not part of the typed event data.
    
    Expected response body (content type `text/event-stream`):
    ```
    id: event-1
    event: message
    data: {"message": "hello"}
    
    ```
    """)
  @route("id")
  op id(): SSEStream<ProtocolEvents>;

  @scenario
  @scenarioDoc("""
    An SSE event with an `id` field containing U+0000 NULL. The field is
    ignored according to the SSE parsing rules.
    
    Expected response body (content type `text/event-stream`):
    ```
    id: invalid<U+0000 NULL>id
    event: message
    data: {"message": "hello"}
    
    ```
    """)
  @route("invalid-id")
  op invalidId(): SSEStream<ProtocolEvents>;

  @scenario
  @scenarioDoc("""
    An SSE event with a valid `retry` field containing only ASCII digits. The
    field sets the client's reconnection delay and is not part of the typed
    event data.
    
    Expected response body (content type `text/event-stream`):
    ```
    retry: 1000
    event: message
    data: {"message": "hello"}
    
    ```
    """)
  @route("retry")
  op retry(): SSEStream<ProtocolEvents>;

  @scenario
  @scenarioDoc("""
    An SSE event with an invalid `retry` field. Since the value contains
    non-ASCII-digit characters, the field is ignored.
    
    Expected response body (content type `text/event-stream`):
    ```
    retry: not-a-number
    event: message
    data: {"message": "hello"}
    
    ```
    """)
  @route("invalid-retry")
  op invalidRetry(): SSEStream<ProtocolEvents>;

  @scenario
  @scenarioDoc("""
    An SSE stream that resumes after a reconnect. The first response closes after
    sending `event-1`. On reconnect, the client sends the most recently received
    event ID in the `Last-Event-ID` request header.
    
    Expected initial response body (content type `text/event-stream`):
    ```
    id: event-1
    event: message
    data: {"message": "hello"}
    ```
    
    Expected request header on reconnect:
    ```
    Last-Event-ID: event-1
    ```
    
    Expected reconnect response body (content type `text/event-stream`):
    ```
    id: event-2
    event: message
    data: {"message": "world"}
    
    ```
    """)
  @route("reconnect")
  op reconnect(): SSEStream<ProtocolEvents>;
}
