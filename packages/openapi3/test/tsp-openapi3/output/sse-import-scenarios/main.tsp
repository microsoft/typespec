import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
import "@typespec/streams";
import "@typespec/sse";
import "@typespec/events";

using Http;
using OpenAPI;
using SSE;

@service(#{ title: "SSE Import Scenarios" })
@info(#{ version: "0.0.0" })
namespace SSEImportScenarios;

model UserConnect {
  username: string;
}

model UserMessage {
  text: string;
}

@events
union ChannelEventsNoTerminal {
  userconnect: UserConnect,
  usermessage: UserMessage,
}

@events
union ChannelEventsWithTerminal {
  userconnect: UserConnect,
  usermessage: UserMessage,

  @TypeSpec.Events.contentType("text/plain")
  @TypeSpec.SSE.terminalEvent
  @extension("x-ms-sse-terminal-event", true)
  "[done]",
}

@events
union ChannelEventWithCustomContentType {
  @TypeSpec.Events.contentType("application/octet-stream")
  binary: Base64,
}

@route("/channel/no-terminal") @get op subscribeToChannelNoTerminal(
): SSEStream<ChannelEventsNoTerminal>;

@route("/channel/with-terminal") @get op subscribeToChannelWithTerminal(
): SSEStream<ChannelEventsWithTerminal>;

@route("/data/custom-content-type") @get op subscribeToDataStream(
): SSEStream<ChannelEventWithCustomContentType>;
