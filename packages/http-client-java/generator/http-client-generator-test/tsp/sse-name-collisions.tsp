import "@typespec/http";
import "@typespec/events";
import "@typespec/sse";
import "@azure-tools/typespec-client-generator-core";
using TypeSpec.Http;
using TypeSpec.Events;
using TypeSpec.SSE;
using Azure.ClientGenerator.Core;

@service
@server("https://example.org")
namespace TspTest.SseNameCollisions {
  @events
  union WrappedEvents {
    @terminalEvent update: string,
  }

  model CollisionOptions {
    @query response: string;
    @query response1: string;
  }

  @get
  @route("/wrapped")
  op wrapped(...CollisionOptions): SSEStream<WrappedEvents>;

  @get
  @route("/grouped")
  op grouped(...CollisionOptions): SSEStream<WrappedEvents>;
}

namespace Customization {
  op grouped(options: TspTest.SseNameCollisions.CollisionOptions): void;
  @@override(TspTest.SseNameCollisions.grouped, grouped);
}
