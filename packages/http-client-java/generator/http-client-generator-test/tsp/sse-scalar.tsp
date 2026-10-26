import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;
@service
@server("https://example.org")
namespace TspTest.SseScalar;
@events
union ScalarEvents {
  int32,
}
@route("/scalar") @get op receive(): SSEStream<ScalarEvents>;
