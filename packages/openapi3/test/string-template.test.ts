import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ emitOpenApiWithDiagnostics, openApiFor }) => {
  describe("handle interpolating literals", () => {
    it("string", async () => {
      const schemas = await openApiFor(`
        model Test {
          a: "Start \${"abc"} end",
        }
      `);

      deepStrictEqual(schemas.components?.schemas?.Test.properties.a, {
        type: "string",
        enum: ["Start abc end"],
      });
    });

    it("number", async () => {
      const schemas = await openApiFor(`
      model Test {
        a: "Start \${123} end",
      }
    `);

      deepStrictEqual(schemas.components?.schemas?.Test.properties.a, {
        type: "string",
        enum: ["Start 123 end"],
      });
    });

    it("boolean", async () => {
      const schemas = await openApiFor(`
      model Test {
        a: "Start \${true} end",
      }
    `);

      deepStrictEqual(schemas.components?.schemas?.Test.properties.a, {
        type: "string",
        enum: ["Start true end"],
      });
    });
  });

  it("emit diagnostics if interpolation value are not literals", async () => {
    const [schemas, diagnostics] = await emitOpenApiWithDiagnostics(`
      model Test {
        a: "Start \${Bar} end",
      }
      model Bar {}
    `);

    deepStrictEqual(schemas.components?.schemas?.Test.properties?.a, {
      type: "string",
    });

    expectDiagnostics(diagnostics, {
      code: "non-literal-string-template",
      severity: "warning",
      message:
        "Value interpolated in this string template cannot be converted to a string. Only literal types can be automatically interpolated.",
    });
  });
});
