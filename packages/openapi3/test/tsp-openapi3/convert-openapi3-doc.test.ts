import { formatTypeSpec } from "@typespec/compiler";
import { strictEqual } from "node:assert";
import { it } from "vitest";
import { convertOpenAPI3Document } from "../../src/index.js";

it("should convert an OpenAPI3 document to a formatted TypeSpec program", async () => {
  const tsp = await convertOpenAPI3Document({
    info: {
      title: "Test Service",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    paths: {},
    components: {
      schemas: {
        Foo: {
          type: "string",
        },
      },
    },
  });

  strictEqual(
    tsp,
    await formatTypeSpec(
      `
      import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service({
        title: "Test Service",
      })
      @info({
        version: "1.0.0",
      })
      namespace TestService;

      scalar Foo extends string;
        `,
      { printWidth: 100, tabWidth: 2 },
    ),
  );
});
