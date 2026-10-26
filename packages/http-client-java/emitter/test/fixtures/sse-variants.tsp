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

@events
union Direct {
  string,
}
@events
union Collections {
  Envelope,
}
@events
union Mixed {
  Payload,
  update: Payload,
}
@events
union Literals {
  string,

  @TypeSpec.Events.contentType("text/plain")
  @terminalEvent
  "[DONE]",

  true,
  42,
}
@events
union Ambiguous {
  string,
  Payload,
}
@events
union MessageConflict {
  string,
  message: Payload,
}
@route("/direct") @get op direct(): SSEStream<Direct>;
@route("/collections") @get op collections(): SSEStream<Collections>;
@route("/mixed") @get op mixed(): SSEStream<Mixed>;
@route("/literals") @get op literals(): SSEStream<Literals>;
@route("/ambiguous") @get op ambiguous(): SSEStream<Ambiguous>;
@route("/message-conflict") @get op messageConflict(): SSEStream<MessageConflict>;

@events
union NumericOverlap {
  message: 42,
  42.0,
}
@events
union EncodingOverlap {
  @TypeSpec.Events.contentType("text/plain") "\"quoted\"",
  "quoted",
}
@events
union UnsupportedEncoding {
  @TypeSpec.Events.contentType("text/plain") 42,
}
@events
union UnsupportedPayloadEncoding {
  @TypeSpec.Events.contentType("application/xml") Payload,
}
@events
union StringLiteralOnly {
  @terminalEvent "stop",
}
@route("/numeric-overlap") @get op numericOverlap(): SSEStream<NumericOverlap>;
@route("/encoding-overlap") @get op encodingOverlap(): SSEStream<EncodingOverlap>;
@route("/unsupported-encoding") @get op unsupportedEncoding(): SSEStream<UnsupportedEncoding>;
@route("/unsupported-payload-encoding") @get op unsupportedPayloadEncoding(
): SSEStream<UnsupportedPayloadEncoding>;
@route("/literal-only") @get op literalOnly(): SSEStream<StringLiteralOnly>;

@events
union DistinctPreciseWireValues {
  @TypeSpec.Events.contentType("text/plain") "42.0000000000000000001",
  42,
}
@events
union NumericEncodingOverlap {
  @TypeSpec.Events.contentType("text/plain") "4.20e1",
  42,
}
@route("/precise-wire") @get op preciseWire(): SSEStream<DistinctPreciseWireValues>;
@route("/numeric-encoding-overlap") @get op numericEncodingOverlap(
): SSEStream<NumericEncodingOverlap>;

@events
union RoundedNumericLiteral {
  43.0000000000000000001,
}
@events
union OutOfRangeNumericLiteral {
  2147483648,
}
@route("/rounded-number") @get op roundedNumber(): SSEStream<RoundedNumericLiteral>;
@route("/out-of-range-number") @get op outOfRangeNumber(): SSEStream<OutOfRangeNumericLiteral>;
