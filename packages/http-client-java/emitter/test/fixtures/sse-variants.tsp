import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;

@service
@server("https://example.org")
namespace SseVariants;

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

@events
union Unnamed {
  string,
}
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
@events
union Mixed {
  Payload,
  update: Payload,
}
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
