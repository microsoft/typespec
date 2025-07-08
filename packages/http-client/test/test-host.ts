import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { VersioningTestLibrary } from "@typespec/versioning/testing";
import { TypespecHttpClientTestLibrary } from "../src/testing/index.js";

export async function createTypespecHttpClientTestHost() {
  return createTestHost({
    libraries: [TypespecHttpClientTestLibrary, HttpTestLibrary, VersioningTestLibrary],
  });
}

export async function createTypespecHttpClientTestRunner() {
  const host = await createTypespecHttpClientTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypeSpec.Http", "TypeSpec.HttpClient", "TypeSpec.Versioning"],
  });
}
