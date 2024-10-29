import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";

export async function createTypespecHttpClientLibraryTestHost() {
  return createTestHost({
    libraries: [HttpTestLibrary],
  });
}

export async function createTypespecHttpClientLibraryTestRunner() {
  const host = await createTypespecHttpClientLibraryTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypeSpec.Http"],
  });
}
