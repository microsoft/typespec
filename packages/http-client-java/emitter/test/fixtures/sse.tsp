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

// Scenario: supported named payloads, API gates, and recursive collections.
@server("https://example.org")
namespace SseTest {
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
}

// Scenario: named-only support and whole-stream binary fallback.
namespace SseVariants {
  model Payload {
    value: string;
  }

  model Envelope {
    @data value: Record<Payload[]>[];
  }

  model LiteralPropertyPayload {
    kind: "fixed";
    value: string;
    nullableValue: string | null;
  }

  model NullablePayloadEnvelope {
    @data value: string | null;
  }

  model NestedNullablePayloadEnvelope {
    @data value: Record<(string | null)[]>;
  }

  // Unsupported unnamed and mixed named/unnamed streams.
  @events
  union Unnamed {
    string,
  }
  @events
  union Mixed {
    Payload,
    update: Payload,
  }

  // Supported named payloads, including literal-valued and nullable model properties.
  @events
  union Named {
    message: string,
    count: int32,
    enabled: boolean,
    collections: Envelope,
    payloadModel: LiteralPropertyPayload,

    @terminalEvent
    done: Payload,
  }

  // Unsupported literal event payloads.
  @events
  union StringLiteral {
    "literal",
  }
  @events
  union NamedStringLiteral {
    named: "literal",
  }
  @events
  union TerminalLiteral {
    @terminalEvent
    done: "[DONE]",
  }
  @events
  union NumberLiteral {
    42,
  }
  @events
  union NamedNumberLiteral {
    named: 42,
  }
  @events
  union BooleanLiteral {
    true,
  }
  @events
  union NamedBooleanLiteral {
    named: true,
  }

  // Unsupported non-JSON and nullable event payloads.
  @events
  union UnsupportedPayloadEncoding {
    @TypeSpec.Events.contentType("application/xml") named: Payload,
  }
  @events
  union NullablePayload {
    direct: NullablePayloadEnvelope,
    nested: NestedNullablePayloadEnvelope,
    valid: Payload,
  }

  @route("/unnamed") @get op unnamed(): SSEStream<Unnamed>;
  @route("/named") @get op named(): SSEStream<Named>;
  @route("/mixed") @get op mixed(): SSEStream<Mixed>;
  @route("/string-literal") @get op stringLiteral(): SSEStream<StringLiteral>;
  @route("/named-string-literal") @get op namedStringLiteral(): SSEStream<NamedStringLiteral>;
  @route("/terminal-literal") @get op terminalLiteral(): SSEStream<TerminalLiteral>;
  @route("/number-literal") @get op numberLiteral(): SSEStream<NumberLiteral>;
  @route("/named-number-literal") @get op namedNumberLiteral(): SSEStream<NamedNumberLiteral>;
  @route("/boolean-literal") @get op booleanLiteral(): SSEStream<BooleanLiteral>;
  @route("/named-boolean-literal") @get op namedBooleanLiteral(): SSEStream<NamedBooleanLiteral>;
  @route("/unsupported-payload-encoding") @get op unsupportedPayloadEncoding(
  ): SSEStream<UnsupportedPayloadEncoding>;
  @route("/nullable-payload") @get op nullablePayload(): SSEStream<NullablePayload>;
}

// Scenario: distinct generic instantiations with different numeric payloads.
namespace SseGeneric {
  @events
  union GenericEvents<T> {
    value: T,
  }
  @route("/first") @get op first(): SSEStream<GenericEvents<int32>>;
  @route("/second") @get op second(): SSEStream<GenericEvents<int64>>;
}

// Scenario: repeated use of one generic instantiation.
namespace SseGenericReused {
  @events
  union GenericEvents<T> {
    value: T,
  }
  @route("/first") @get op first(): SSEStream<GenericEvents<int64>>;
  @route("/second") @get op second(): SSEStream<GenericEvents<int64>>;
}

// Scenario: distinct generic instantiations with different wire encodings.
namespace SseGenericEncoded {
  @encode(string)
  scalar EncodedInteger extends int64;
  @events
  union GenericEvents<T> {
    value: T,
  }
  @route("/first") @get op first(): SSEStream<GenericEvents<int64>>;
  @route("/second") @get op second(): SSEStream<GenericEvents<EncodedInteger>>;
}
