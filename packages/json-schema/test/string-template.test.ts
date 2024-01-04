import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema, emitSchemaWithDiagnostics } from "./utils.js";

describe("json-schema: string templates", () => {
  describe("handle interpolating literals", () => {
    it("string", async () => {
      const schemas = await emitSchema(`
      model Test {
        a: "Start \${"abc"} end",
      }
    `);

      deepStrictEqual(schemas["Test.json"].properties.a, {
        type: "string",
        const: "Start abc end",
      });
    });

    it("number", async () => {
      const schemas = await emitSchema(`
      model Test {
        a: "Start \${123} end",
      }
    `);

      deepStrictEqual(schemas["Test.json"].properties.a, {
        type: "string",
        const: "Start 123 end",
      });
    });

    it("boolean", async () => {
      const schemas = await emitSchema(`
      model Test {
        a: "Start \${true} end",
      }
    `);

      deepStrictEqual(schemas["Test.json"].properties.a, {
        type: "string",
        const: "Start true end",
      });
    });
  });

  it("emit diagnostics if interpolation value are not literals", async () => {
    const [schemas, diagnostics] = await emitSchemaWithDiagnostics(`
      model Test {
        a: "Start \${Bar} end",
      }
      model Bar {}
    `);

    deepStrictEqual(schemas["Test.json"].properties.a, {
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
