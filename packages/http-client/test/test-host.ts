import { resolvePath } from "@typespec/compiler";
import { createTestHost, createTestWrapper, createTester } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/http-client"],
})
  .importLibraries()
  .using("HttpClient");

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
