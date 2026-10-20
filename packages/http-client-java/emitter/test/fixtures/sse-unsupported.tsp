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
namespace SseUnsupportedTest;

model FirstEvent {
  @data
  value: string;
}

model SecondEvent {
  @data
  value: string;
}

@events
union UnsupportedEvents {
  first: FirstEvent,
  second: SecondEvent,
}

@route("/events")
@get
op getEvents(): SSEStream<UnsupportedEvents>;
