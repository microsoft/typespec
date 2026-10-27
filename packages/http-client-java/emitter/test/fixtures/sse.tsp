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

model ProtocolOnlyPayload {
  value: string;
}

model ScalarFirstEvent {
  @data
  value: string;
}

model ScalarSecondEvent {
  @data
  value: string;
}

model DictionaryPayload {
  message: string;
}

model DirectDictionaryEvent {
  @data
  value: Record<string>;
}

model ArrayOfDictionariesEvent {
  @data
  value: Record<string>[];
}

model NestedDictionaryEvent {
  @data
  value: Record<Record<string[]>>;
}

model ModelDictionaryEvent {
  @data
  value: Record<DictionaryPayload>;
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

model ProtocolOnlyEnvelopeIgnoredByJava {
  @data
  payload: ProtocolOnlyPayload;
}

@events
union RetrievalStreamEvents {
  `retrieval.started`: StartedEnvelopeIgnoredByJava,

  @terminalEvent
  `response.completed`: CompletedEnvelopeIgnoredByJava,
}

@events
union ProtocolOnlyStreamEvents {
  message: ProtocolOnlyEnvelopeIgnoredByJava,
}

@events
union ScalarEvents {
  first: ScalarFirstEvent,
  second: ScalarSecondEvent,
}

@events
union RecursiveDictionaryEvents {
  direct: DirectDictionaryEvent,
  array: ArrayOfDictionariesEvent,
  nested: NestedDictionaryEvent,
  modelMap: ModelDictionaryEvent,
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

  @route("/protocol-only-payload")
  @get
  @convenientAPI(false, "java")
  @protocolAPI(true, "java")
  protocolOnlyPayload(): SSEStream<ProtocolOnlyStreamEvents>;

  @route("/scalar-events")
  @get
  scalarEvents(): SSEStream<ScalarEvents>;

  @route("/recursive-dictionary-events")
  @get
  recursiveDictionaryEvents(): SSEStream<RecursiveDictionaryEvents>;
}
