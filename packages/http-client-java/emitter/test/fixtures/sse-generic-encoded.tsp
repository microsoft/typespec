import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;
@service
namespace SseGenericEncoded;
@encode(string)
scalar EncodedInteger extends int64;
@events
union GenericEvents<T> {
  value: T,
}
@route("/first") @get op first(): SSEStream<GenericEvents<int64>>;
@route("/second") @get op second(): SSEStream<GenericEvents<EncodedInteger>>;
