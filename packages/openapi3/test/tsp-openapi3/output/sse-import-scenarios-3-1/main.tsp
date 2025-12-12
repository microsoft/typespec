import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "SSE Import Scenarios" })
@info(#{ version: "0.0.0" })
namespace SSEImportScenarios;

model UserConnect {
  username: string;
}

model UserMessage {
  text: string;
}

@oneOf
union ChannelEventsNoTerminal {
  {
    event?: "userconnect",
    data?: unknown,
  },
  {
    event?: "usermessage",
    data?: unknown,
  },
}

@oneOf
union ChannelEventsWithTerminal {
  {
    data?: "[done]",
  },
  {
    event?: "userconnect",
    data?: unknown,
  },
  {
    event?: "usermessage",
    data?: unknown,
  },
}

@oneOf
union ChannelEventWithCustomContentType {
  {
    event?: "binary",
    data?: unknown,
  },
}

@route("/channel/no-terminal") @get op subscribeToChannelNoTerminal(): {
  @header contentType: "text/event-stream";
};

@route("/channel/no-terminal-post") @post op subscribeToChannelNoTerminal(
  /** Request body for subscribing to a channel without terminal event. */
  @body body: {
    channelId?: string;
  },
): {
  @header contentType: "text/event-stream";
};

@route("/channel/with-terminal") @get op subscribeToChannelWithTerminal(): {
  @header contentType: "text/event-stream";
};

@route("/data/custom-content-type") @get op subscribeToDataStream(): {
  @header contentType: "text/event-stream";
};
