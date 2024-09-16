import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: response status codes", () => {
  async function expectStatusCodes(code: string, statusCodes: string[]) {
    const res = await openApiFor(code);
    deepStrictEqual(Object.keys(res.paths["/"].get.responses), statusCodes);
  }
  it("map single status code", async () => {
    await expectStatusCodes(
      `
      op read(): {@statusCode _: 200, content: string};
      `,
      ["200"],
    );
  });

  it("map multiple status code", async () => {
    await expectStatusCodes(
      `
      op read(): {@statusCode _: 200 | 201 | 204, content: string};
      `,
      ["200", "201", "204"],
    );
  });

  it("map simple status code range", async () => {
    await expectStatusCodes(
      `
      op read(): {@minValue(400) @maxValue(499) @statusCode _: int32, content: string};
      `,
      ["4XX"],
    );
  });

  it("map status code range going over multiple hundreds", async () => {
    await expectStatusCodes(
      `
      op read(): {@minValue(400) @maxValue(599) @statusCode _: int32, content: string};
      `,
      ["4XX", "5XX"],
    );
  });

  it("emit diagnostic if status code range is not supported", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      op read(): {@minValue(455) @maxValue(495) @statusCode _: int32, content: string};
      `,
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi3/unsupported-status-code-range",
        message:
          "Status code range '455 to '495' is not supported. OpenAPI 3.0 can only represent range 1XX, 2XX, 3XX, 4XX and 5XX. Example: `@minValue(400) @maxValue(499)` for 4XX.",
      },
    ]);
  });
});
