import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { EventsTestLibrary } from "@typespec/events/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { StreamsTestLibrary } from "@typespec/streams/testing";
import { SSETestLibrary } from "../src/testing/index.js";

export async function createSSETestHost() {
  return createTestHost({
    libraries: [EventsTestLibrary, HttpTestLibrary, StreamsTestLibrary, SSETestLibrary],
  });
}

export async function createSSETestRunner() {
  const host = await createSSETestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Events", "TypeSpec.SSE"] });
}
