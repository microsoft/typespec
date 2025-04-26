import { resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestHostBuilder,
  createTestWrapper,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { OpenAPITestLibrary } from "../src/testing/index.js";

export const HostBuilder = createTestHostBuilder(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi"],
});

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
