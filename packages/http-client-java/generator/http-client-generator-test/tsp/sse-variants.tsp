import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;

@service
@server("https://example.org")
namespace TspTest.SseVariants;

model Payload {
  value: string;
}

model CollectionsEnvelope {
  @data value: Record<Payload[]>[];
}

@events
union DirectTextEvents {
  string,
}
@events
union DirectNumberEvents {
  int32,
}
@events
union DirectModelEvents {
  Payload,
}
@events
union DirectArrayEvents {
  string[],
}
@events
union DirectCollectionsEvents {
  CollectionsEnvelope,
}
@events
union DirectTerminalEvents {
  @terminalEvent string,
}

@events
union BooleanTerminalEvents {
  @terminalEvent true,
}
@events
union NumberTerminalEvents {
  @terminalEvent 42.5,
}

@events
union VariantsStreamEvents {
  string,
  update: Payload,

  @TypeSpec.Events.contentType("text/plain")
  @terminalEvent
  "[DONE]",

  true,
  42,
}

@events
union LiteralStreamEvents {
  @TypeSpec.Events.contentType("text/plain") "raw",
  "quoted",
  "",
  true,
  false,
  42,
  42.5,
  @terminalEvent "stop",
}

@events
union NamedLiteralStreamEvents {
  @TypeSpec.Events.contentType("text/plain")
  @terminalEvent
  done: "[DONE]",
}

@route("/text") @get op text(): SSEStream<DirectTextEvents>;
@route("/number") @get op number(): SSEStream<DirectNumberEvents>;
@route("/model") @get op modelPayload(): SSEStream<DirectModelEvents>;
@route("/array") @get op arrays(): SSEStream<DirectArrayEvents>;
@route("/collections") @get op collections(): SSEStream<DirectCollectionsEvents>;
@route("/terminal") @get op terminal(): SSEStream<DirectTerminalEvents>;
@route("/boolean-terminal") @get op booleanTerminal(): SSEStream<BooleanTerminalEvents>;
@route("/number-terminal") @get op numberTerminal(): SSEStream<NumberTerminalEvents>;
@route("/mixed") @get op mixed(): SSEStream<VariantsStreamEvents>;
@route("/literals") @get op literals(): SSEStream<LiteralStreamEvents>;
@route("/named-literal") @get op namedLiteral(): SSEStream<NamedLiteralStreamEvents>;
