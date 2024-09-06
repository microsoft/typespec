import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { StreamTestLibrary } from "../src/testing/index.js";

export async function createStreamTestHost() {
  return createTestHost({
    libraries: [StreamTestLibrary],
  });
}

export async function createStreamTestRunner() {
  const host = await createStreamTestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Streams"] });
}
