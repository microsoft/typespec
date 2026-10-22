import "@typespec/http";
import "@typespec/rest";
import "@typespec/events";
import "@typespec/sse";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Events;
using TypeSpec.SSE;

@service
@server("https://example.org")
namespace SseArrayUnsupportedTest;

model MapArrayEvent {
  @data
  value: Record<string>[];
}

@events
union UnsupportedArrayEvents {
  values: MapArrayEvent,
}

@route("/events")
@get
op getEvents(): SSEStream<UnsupportedArrayEvents>;
