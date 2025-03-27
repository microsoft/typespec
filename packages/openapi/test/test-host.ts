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

export async function createOpenAPITestRunnerWithDecorators(decorators: Record<string, any>) {
  const host = await createOpenAPITestHost();
  host.addJsFile("dec.js", decorators);
  return createTestWrapper(host, {
    wrapper(code) {
      return `
      import "./dec.js";
      using OpenAPI;
      ${code}`;
    },
  });
}
