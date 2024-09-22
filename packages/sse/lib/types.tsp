import "@typespec/http";

using Http;

namespace TypeSpec.SSE;

model SSEStream<Type> is HttpStream<Type, "text/event-stream">;
