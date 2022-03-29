import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { OpenAPITestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, OpenAPITestLibrary],
  });
}
export async function createOpenAPITestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "@cadl-lang/rest"; import "@cadl-lang/openapi";using Cadl.Rest;using Cadl.Http;using OpenAPI;${code}`
  );
}
