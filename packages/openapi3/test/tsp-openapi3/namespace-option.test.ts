import { formatTypeSpec } from "@typespec/compiler";
import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { convertOpenAPI3Document } from "../../src/index.js";

describe("namespace option", () => {
  const testDocument = {
    info: {
      title: "My Test Service - With Special Characters!",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    paths: {
      "/ping": {
        get: {
          operationId: "ping",
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
    },
  };

  it("should use default namespace generation when no namespace option is provided", async () => {
    const tsp = await convertOpenAPI3Document(testDocument);

    const expectedNamespace = "MyTestServiceWithSpecialCharacters";
    strictEqual(tsp.includes(`namespace ${expectedNamespace};`), true);
  });

  it("should use custom namespace when namespace option is provided", async () => {
    const customNamespace = "CustomNamespace";
    const tsp = await convertOpenAPI3Document(testDocument, { namespace: customNamespace });

    strictEqual(tsp.includes(`namespace ${customNamespace};`), true);
  });

  it("should clean up special characters in custom namespace", async () => {
    const customNamespace = "My Custom - Namespace! With Special Characters";
    const tsp = await convertOpenAPI3Document(testDocument, { namespace: customNamespace });

    const cleanedNamespace = "MyCustomNamespaceWithSpecialCharacters";
    strictEqual(tsp.includes(`namespace ${cleanedNamespace};`), true);
  });

  it("should preserve service info when using custom namespace", async () => {
    const customNamespace = "CustomNamespace";
    const tsp = await convertOpenAPI3Document(testDocument, { namespace: customNamespace });

    // Should still have the original service title
    strictEqual(tsp.includes(`title: "My Test Service - With Special Characters!"`), true);
    // But use custom namespace
    strictEqual(tsp.includes(`namespace ${customNamespace};`), true);
  });

  it("should generate expected TypeSpec structure with custom namespace", async () => {
    const customNamespace = "TestServiceNamespace";
    const tsp = await convertOpenAPI3Document(testDocument, { namespace: customNamespace });

    const expectedOutput = await formatTypeSpec(
      `
      import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "My Test Service - With Special Characters!" })
      @info(#{ version: "1.0.0" })
      namespace TestServiceNamespace;

      @route("/ping") @get op ping(): OkResponse;
      `,
      { printWidth: 100, tabWidth: 2 },
    );

    strictEqual(tsp, expectedOutput);
  });
});