import assert, { strictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("jsonschema: scalar constraints", () => {
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

    function assertNumericConstraints(schema: any) {
      assert.strictEqual(schema.minimum, 1);
      assert.strictEqual(schema.maximum, 2);
      assert.strictEqual(schema.multipleOf, 10);
    }

    describe("on scalar declaration", () => {
      for (const numType of scalarNumberTypes) {
        it(`handles ${numType}`, async () => {
          const schemas = await emitSchema(`
          @minValue(1)
          @maxValue(2)
          @multipleOf(10)
          scalar Test extends ${numType};
        `);

          assertNumericConstraints(schemas["Test.json"]);
        });
      }

      it("on a union", async () => {
        const schemas = await emitSchema(`
      @minValue(1)
      @maxValue(2)
      @multipleOf(10)
      union Test {
        int32,
        string,
        null
      };
    `);
        assertNumericConstraints(schemas["Test.json"]);
      });
    });

    describe("@minValueExclusive/@maxValueExclusive", () => {
      for (const numType of scalarNumberTypes) {
        it(numType, async () => {
          const schemas = await emitSchema(
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            scalar Test extends ${numType};
          `,
          );

          strictEqual(schemas["Test.json"].exclusiveMinimum, 1);
          strictEqual(schemas["Test.json"].exclusiveMaximum, 2);
        });

        it("can be applied on a union", async () => {
          const schemas = await emitSchema(
            `
            @minValueExclusive(1)
            @maxValueExclusive(2)
            union Test {int32, string, null};
          `,
          );

          strictEqual(schemas["Test.json"].exclusiveMinimum, 1);
          strictEqual(schemas["Test.json"].exclusiveMaximum, 2);
        });
      }
    });

    describe("on property", () => {
      for (const numType of [...scalarNumberTypes, "int32 | string | null"]) {
        it(`handles ${numType} properties`, async () => {
          const schemas = await emitSchema(`
          model Test {
            @minValue(1)
            @maxValue(2)
            @multipleOf(10)
            prop: ${numType};
          }
        `);
          assertNumericConstraints(schemas["Test.json"].properties.prop);
        });
      }
    });
  });

  describe("string constraints", () => {
    function assertStringConstraints(schema: any) {
      assert.strictEqual(schema.minLength, 1);
      assert.strictEqual(schema.maxLength, 2);
      assert.strictEqual(schema.pattern, "a|b");
      assert.strictEqual(schema.format, "ipv4");
      assert.strictEqual(schema.contentEncoding, "base64url");
      assert.strictEqual(schema.contentMediaType, "application/jwt");
      assert.deepStrictEqual(schema.contentSchema, {
        $ref: "JwtToken.json",
      });
    }
    it("on scalar declaration", async () => {
      const schemas = await emitSchema(`
      @minLength(1)
      @maxLength(2)
      @pattern("a|b")
      @format("ipv4")
      @contentEncoding("base64url")
      @contentMediaType("application/jwt")
      @contentSchema(JwtToken)
      scalar shortString extends string;

      model JwtToken is Array<Record<string>>;
    `);
      assertStringConstraints(schemas["shortString.json"]);
    });

    it("on union", async () => {
      const schemas = await emitSchema(`
      @minLength(1)
      @maxLength(2)
      @pattern("a|b")
      @format("ipv4")
      @contentEncoding("base64url")
      @contentMediaType("application/jwt")
      @contentSchema(JwtToken)
      union Test {
        string, int32, null
      }

      model JwtToken is Array<Record<string>>;
    `);
      assertStringConstraints(schemas["Test.json"]);
    });

    it("on property", async () => {
      const schemas = await emitSchema(`
      model Test {
        @minLength(1)
        @maxLength(2)
        @pattern("a|b")
        @format("ipv4")
        @contentEncoding("base64url")
        @contentMediaType("application/jwt")
        @contentSchema(JwtToken)
        prop: string;
      }

      model JwtToken is Array<Record<string>>;
    `);
      assertStringConstraints(schemas["Test.json"].properties.prop);
    });
  });

  it("combine with constraint of base scalar", async () => {
    const schemas = await emitSchema(`
        @minValue(1)
        scalar base extends int32;

        @maxValue(2)
        scalar test extends base;
      `);
    strictEqual(schemas["test.json"].minimum, 1);
    strictEqual(schemas["test.json"].maximum, 2);
  });
});
