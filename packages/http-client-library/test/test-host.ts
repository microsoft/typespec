import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { TypespecHttpClientLibraryTestLibrary } from "../src/testing/index.js";

export async function createTypespecX2FHttpClientLibraryTestHost() {
  return createTestHost({
    libraries: [TypespecHttpClientLibraryTestLibrary],
  });
}

export async function createTypespecX2FHttpClientLibraryTestRunner() {
  const host = await createTypespecX2FHttpClientLibraryTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypespecX2FHttpClientLibrary"]
  });
}

