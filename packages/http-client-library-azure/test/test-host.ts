import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";

export async function createTypespecHttpClientLibraryAzureTestHost() {
  return createTestHost({
    libraries: [HttpTestLibrary],
  });
}

export async function createTypespecHttpClientLibraryAzureTestRunner() {
  const host = await createTypespecHttpClientLibraryAzureTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypeSpec.Http"],
  });
}
