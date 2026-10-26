import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;
@service
namespace SseGeneric;
@events
union GenericEvents<T> {
  value: T,
}
@route("/first") @get op first(): SSEStream<GenericEvents<int32>>;
@route("/second") @get op second(): SSEStream<GenericEvents<int64>>;
