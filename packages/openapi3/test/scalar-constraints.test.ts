import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { oapiForModel } from "./test-host.js";

describe("scalar constraints", () => {
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

    describe("@minValue/@maxValue", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await oapiForModel(
            "Test",
            `
            @minValue(1)
            @maxValue(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas.schemas.Test.minimum, 1);
          strictEqual(schemas.schemas.Test.maximum, 2);
        });
      }

      it("can be applied on a union", async () => {
        const schemas = await oapiForModel(
          "Test",
          `
          @minValue(1)
          @maxValue(2)
          union Test {int32, string, null};
        `,
        );

        strictEqual(schemas.schemas.Test.minimum, 1);
        strictEqual(schemas.schemas.Test.maximum, 2);
      });
    });

    describe("@minValueExclusive/@maxValueExclusive", () => {
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
});
