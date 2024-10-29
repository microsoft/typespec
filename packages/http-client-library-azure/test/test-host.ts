import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { TypespecHttpClientLibraryAzureTestLibrary } from "../src/testing/index.js";

export async function createTypespecX2FHttpClientLibraryAzureTestHost() {
  return createTestHost({
    libraries: [TypespecHttpClientLibraryAzureTestLibrary],
  });
}

export async function createTypespecX2FHttpClientLibraryAzureTestRunner() {
  const host = await createTypespecX2FHttpClientLibraryAzureTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypespecX2FHttpClientLibraryAzure"]
  });
}

