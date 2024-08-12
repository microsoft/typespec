import { createTestWrapper } from "@typespec/compiler/testing";
import assert from "node:assert";
import { convertOpenAPI3Document } from "../../src/index.js";
import { OpenAPI3Document, OpenAPI3Schema, Refable } from "../../src/types.js";
import { createOpenAPITestHost } from "../test-host.js";

export async function createConverterTestRunner() {
  const host = await createOpenAPITestHost();

  return createTestWrapper(host, {
    wrapper(code) {
      // Find the 1st namespace declaration and decorate it
      const serviceIndex = code.indexOf("@service");
      return `${code.slice(0, serviceIndex)}@test\n${code.slice(serviceIndex)}`;
    },
  });
}

export interface OpenAPI3Options {
  schemas?: Record<string, Refable<OpenAPI3Schema>>;
}

export async function tspForOpenAPI3({ schemas }: OpenAPI3Options) {
  const openApi3Doc: OpenAPI3Document = {
    info: {
      title: "Test Service",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    paths: {},
    components: {
      schemas: {
        ...(schemas as any),
      },
    },
  };

  const runner = await createConverterTestRunner();
  const code = await convertOpenAPI3Document(openApi3Doc);
  const { TestService } = await runner.compile(code);
  assert(
    TestService?.kind === "Namespace",
    `Expected TestService to be a namespace, instead got ${TestService?.kind}`
  );
  return TestService;
}
