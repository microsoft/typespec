/* eslint-disable vitest/no-identical-title */
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./works-for.js";

describe("numeric constraints", () => {
  const scalarNumberTypes = [
    "int8",
    "int16",
    "int32",
    "uint8",
    "uint16",
    "uint32",
    "integer",
    "float32",
    "float64",
    "numeric",
    "float",
    "safeint",
  ];

  worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
    describe("@minValue/@maxValue/@multipleOf", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValue(1)
            @maxValue(2)
            @JsonSchema.multipleOf(10)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.multipleOf, 10);
        });
      }

      it("can be applied on a union", async () => {
        const schemas = await oapiForModel(
          "Test",
          `
          @minValue(1)
          @maxValue(2)
          @JsonSchema.multipleOf(10)
          union Test {int32, string, null};
        `,
        );

        strictEqual(schemas.schemas.Test.minimum, 1);
        strictEqual(schemas.schemas.Test.maximum, 2);
        strictEqual(schemas.schemas.Test.multipleOf, 10);
      });
    });
  });

  worksFor(["3.0.0"], ({ oapiForModel }) => {
    describe("@minValueExclusive/@maxValueExclusive (boolean)", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
        });

        it("can be applied on a union", async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            union Test {int32, string, null};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
          strictEqual(schemas.schemas.Test.maximum, 2);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, true);
        });
      }
    });
  });

  worksFor(["3.1.0"], ({ oapiForModel }) => {
    describe("@minValueExclusive/@maxValueExclusive (value)", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMinimum, 1);
          strictEqual(schemas.schemas.Test.maximum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, 2);
        });

        it("can be applied on a union", async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            union Test {int32, string, null};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMinimum, 1);
          strictEqual(schemas.schemas.Test.maximum, undefined);
          strictEqual(schemas.schemas.Test.exclusiveMaximum, 2);
        });
      }
    });
  });
});

describe("string constraints", () => {
  function assertStringConstraints(schema: any) {
    strictEqual(schema.minLength, 1);
    strictEqual(schema.maxLength, 2);
    strictEqual(schema.pattern, "a|b");
    strictEqual(schema.format, "ipv4");
  }

  const decorators = `
    @minLength(1)
    @maxLength(2)
    @pattern("a|b")
    @format("ipv4")`;

  worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
    it("on scalar declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${decorators}
      scalar Test extends string;
    `,
      );

      assertStringConstraints(schemas.schemas.Test);
    });
    it("on union declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${decorators}
      union Test {string, int32, null};
    `,
      );

      assertStringConstraints(schemas.schemas.Test);
    });
  });

  worksFor(["3.1.0"], ({ oapiForModel }) => {
    const jsonSchemaDecorators = `
      @JsonSchema.contentEncoding("base64url")
      @JsonSchema.contentMediaType("application/jwt")
      @JsonSchema.contentSchema(JwtToken)
    `;

    function assertJsonSchemaStringConstraints(schema: any) {
      strictEqual(schema.contentEncoding, "base64url");
      strictEqual(schema.contentMediaType, "application/jwt");
      deepStrictEqual(schema.contentSchema, { $ref: "#/components/schemas/JwtToken" });
    }

    it("on scalar declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${jsonSchemaDecorators}
      scalar Test extends string;
      model JwtToken is Array<Record<string>>;
    `,
      );

      assertJsonSchemaStringConstraints(schemas.schemas.Test);
    });

    it("on union declaration", async () => {
      const schemas = await oapiForModel(
        "Test",
        `
      ${jsonSchemaDecorators}
      union Test {string, int32, null};
      model JwtToken is Array<Record<string>>;
    `,
      );

      assertJsonSchemaStringConstraints(schemas.schemas.Test);
    });
  });
});
