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
    @query com: string;
    @query comParam: string;
    @query tsptest: string;
    @query tsptestParam: string;
    @query reactor: string;
    @query reactorParam: string;
  }

  @get
  @route("/wrapped")
  op wrapped(...CollisionOptions): SSEStream<WrappedEvents>;

  @get
  @route("/grouped")
  op grouped(...CollisionOptions): SSEStream<WrappedEvents>;

  @get
  @route("/ordinary")
  op ordinary(...CollisionOptions): string;

  @get
  @route("/ordinary-grouped")
  op ordinaryGrouped(...CollisionOptions): string;
}

namespace Customization {
  op grouped(options: TspTest.SseNameCollisions.CollisionOptions): void;
  @@override(TspTest.SseNameCollisions.grouped, grouped);
  op ordinaryGrouped(options: TspTest.SseNameCollisions.CollisionOptions): void;
  @@override(TspTest.SseNameCollisions.ordinaryGrouped, ordinaryGrouped);
}
