import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { StreamsTestLibrary } from "../src/testing/index.js";

export async function createStreamsTestHost() {
  return createTestHost({
    libraries: [StreamsTestLibrary],
  });
}

export async function createStreamsTestRunner() {
  const host = await createStreamsTestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Streams"] });
}
