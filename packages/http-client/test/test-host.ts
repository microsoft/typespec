import { resolvePath } from "@typespec/compiler";
import { createTestHost, createTestWrapper, createTester } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { HttpClientTestLibrary } from "../src/testing/index.js";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/http-client"],
})
  .importLibraries()
  .using("TypeSpec.HttpClient");

export async function createTypespecHttpClientLibraryTestHost() {
  return createTestHost({
    libraries: [HttpTestLibrary, HttpClientTestLibrary],
  });
}

export async function createTypespecHttpClientLibraryTestRunner() {
  const host = await createTypespecHttpClientLibraryTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypeSpec.Http", "TypeSpec.HttpClient"],
  });
}
