import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { SSETestLibrary } from "../src/testing/index.js";

export async function createSSETestHost() {
  return createTestHost({
    libraries: [SSETestLibrary],
  });
}

export async function createSSETestRunner() {
  const host = await createSSETestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.SSE"] });
}
