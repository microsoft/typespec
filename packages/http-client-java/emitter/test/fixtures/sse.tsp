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
    @route("/retrieve-protocol")
    @post
    @convenientAPI(false, "java")
    @protocolAPI(true, "java")
    retrieveProtocol(
      @body request: {
        query: string;
      },
    ): SSEStream<RetrievalStreamEvents>;

    @route("/retrieve")
    @post
    retrieve(
      @body request: {
        query: string;
      },
      @header authorization?: string,
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

namespace SseSuppressedUnsupported {
  @events
  union StringLiteral {
    "literal",
  }

  #suppress "@typespec/http-client-java/sse-unsupported" "The binary fallback is expected."
  @route("/read")
  @get
  op read(): SSEStream<StringLiteral>;
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

// Scenario: unsupported generic instantiations do not claim a shared TCGC CID.
namespace SseGenericSupportedFirst {
  model Heartbeat {
    value: string;
  }
  @events
  union GenericEvents<T> {
    value: T,
    heartbeat: Heartbeat,
  }
  @route("/supported") @get op supported(): SSEStream<GenericEvents<string>>;
  @route("/unsupported") @get op unsupported(): SSEStream<GenericEvents<"done">>;
}

namespace SseGenericUnsupportedFirst {
  model Heartbeat {
    value: string;
  }
  @events
  union GenericEvents<T> {
    value: T,
    heartbeat: Heartbeat,
  }
  @route("/unsupported") @get op unsupported(): SSEStream<GenericEvents<"done">>;
  @route("/supported") @get op supported(): SSEStream<GenericEvents<string>>;
}

// Scenario: emitter-owned SSE name patterns with generator-owned Java normalization.
namespace SseNaming {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union RetrievalStreamEvents {
    `retrieval.started`: PayloadEnvelope,
    `response.completed`: PayloadEnvelope,
  }

  @events
  union KnowledgeBaseRetrievalStreamEvents {
    `retrieval.started`: PayloadEnvelope,
    `baseRetrieval.completed`: PayloadEnvelope,
    `activity.completed`: PayloadEnvelope,
    `response.completed`: PayloadEnvelope,
  }

  @events
  union StreamEvents {
    `123.done`: PayloadEnvelope,
  }

  @events
  union `123Events` {
    done: PayloadEnvelope,
  }

  @route("/retrieval") @get op retrieval(): SSEStream<RetrievalStreamEvents>;
  @route("/knowledge-base") @get op knowledgeBase(): SSEStream<KnowledgeBaseRetrievalStreamEvents>;
  @route("/digit-event") @get op digitEvent(): SSEStream<StreamEvents>;
  @route("/digit-stream") @get op digitStream(): SSEStream<`123Events`>;
}

namespace SseNamingResponseOnly {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union RetrievalStreamEvents {
    `response.completed`: PayloadEnvelope,
  }

  @route("/") @get op read(): SSEStream<RetrievalStreamEvents>;
}

namespace SseNamingWithRetrieval {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union RetrievalStreamEvents {
    `retrieval.started`: PayloadEnvelope,
    `response.completed`: PayloadEnvelope,
  }

  @route("/") @get op read(): SSEStream<RetrievalStreamEvents>;
}

namespace SseNamingOrderFirst {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union KnowledgeBaseRetrievalStreamEvents {
    `retrieval.started`: PayloadEnvelope,
    `baseRetrieval.completed`: PayloadEnvelope,
  }

  @route("/") @get op read(): SSEStream<KnowledgeBaseRetrievalStreamEvents>;
}

namespace SseNamingOrderSecond {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union KnowledgeBaseRetrievalStreamEvents {
    `baseRetrieval.completed`: PayloadEnvelope,
    `retrieval.started`: PayloadEnvelope,
  }

  @route("/") @get op read(): SSEStream<KnowledgeBaseRetrievalStreamEvents>;
}

namespace SseNamingCollision {
  model PayloadEnvelope {
    @data value: string;
  }

  @events
  union RetrievalStreamEvents {
    `retrieval.started`: PayloadEnvelope,
    `retrieval-started`: PayloadEnvelope,
  }

  @route("/") @get op read(): SSEStream<RetrievalStreamEvents>;
}

// Scenario: authored envelope hierarchy and reuse never define the generated hierarchy.
namespace SseSchemaIsolation {
  model AuthoredEnvelopeBase {}

  model FirstEnvelope extends AuthoredEnvelopeBase {
    @data value: string;
  }

  model SecondEnvelope extends AuthoredEnvelopeBase {
    @data value: string;
  }

  model SharedEnvelope {
    @data value: string;
  }

  @events
  union FirstEvents {
    first: FirstEnvelope,
  }

  @events
  union SecondEvents {
    second: SecondEnvelope,
  }

  @events
  union ReusableOneEvents {
    one: SharedEnvelope,
  }

  @events
  union ReusableTwoEvents {
    two: SharedEnvelope,
  }

  @route("/first") @get op first(): SSEStream<FirstEvents>;
  @route("/second") @get op second(): SSEStream<SecondEvents>;
  @route("/reusable-one") @get op reusableOne(): SSEStream<ReusableOneEvents>;
  @route("/reusable-two") @get op reusableTwo(): SSEStream<ReusableTwoEvents>;
  @route("/authored-base") @get op authoredBase(): AuthoredEnvelopeBase;
}

namespace Azure.SseSchemaDeduplication {
  model AzureCollisionEvent {
    value: string;
  }

  model SkippedEvent {
    value: string;
  }

  model SkippedEventMessageStreamEvent {
    value: string;
  }

  model Envelope {
    @data value: SkippedEvent;
  }

  @events
  union SkippedEvents {
    message: Envelope,
  }

  @route("/stream") @get op stream(): SSEStream<SkippedEvents>;
  @route("/ordinary-wrapper") @get op ordinaryWrapper(): SkippedEventMessageStreamEvent;
}

// Scenario: registered SSE schemas share ordinary deduplication rules and limitations.
namespace SseSchemaDeduplication {
  model CollisionEvent {
    value: string;
  }

  model CollisionEvent1 {
    value: string;
  }

  @clientName("ExactCollisionEvent", "java")
  model ExactOrdinary {
    value: string;
  }

  model CollisionEnvelope {
    @data value: CollisionEvent;
  }

  model ExactEnvelope {
    @data value: ExactOrdinary;
  }

  model AzureEnvelope {
    @data value: Azure.SseSchemaDeduplication.AzureCollisionEvent;
  }

  model SharedEnvelope {
    @data value: string;
  }

  model SharedEventMessageStreamEvent {
    value: string;
  }

  @events
  union CollisionEvents {
    message: CollisionEnvelope,
  }

  @events
  union ExactCollisionEvents {
    message: ExactEnvelope,
  }

  @events
  union AzureCollisionEvents {
    message: AzureEnvelope,
  }

  namespace One {
    @events
    union SharedEvents {
      message: SseSchemaDeduplication.SharedEnvelope,
    }
  }

  namespace Two {
    @events
    union SharedEvents {
      message: SseSchemaDeduplication.SharedEnvelope,
    }
  }

  @route("/collision") @get op collision(): SSEStream<CollisionEvents>;
  @route("/collision-one") @get op collisionOne(): CollisionEvent1;
  @route("/exact") @get op exact(): SSEStream<ExactCollisionEvents>;
  @route("/azure") @get op azure(): SSEStream<AzureCollisionEvents>;
  @route("/one") @get op one(): SSEStream<One.SharedEvents>;
  @route("/two") @get op two(): SSEStream<Two.SharedEvents>;
  @route("/again") @get op again(): SSEStream<One.SharedEvents>;
  @route("/ordinary-wrapper") @get op ordinaryWrapper(): SharedEventMessageStreamEvent;
}
