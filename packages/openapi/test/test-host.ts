import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { OpenAPITestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [HttpTestLibrary, RestTestLibrary, OpenAPITestLibrary],
  });
}
export async function createOpenAPITestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.OpenAPI"] });
}
