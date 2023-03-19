import assert from "assert";
import { emitSchema } from "./utils.js";

describe("emitting scalars with constraints", () => {
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

  describe("number decl constraints", () => {
    for (const numType of scalarNumberTypes) {
      it(`handles ${numType}`, async () => {
        const schemas = await emitSchema(`
          @minValue(1)
          @maxValue(2)
          @multipleOf(10)
          scalar Test extends ${numType};
        `);

        assert.strictEqual(schemas["Test.json"].minimum, 1);
        assert.strictEqual(schemas["Test.json"].maximum, 2);
        assert.strictEqual(schemas["Test.json"].multipleOf, 10);
      });
    }
  });

  describe("number property constraints", () => {
    for (const numType of scalarNumberTypes) {
      it(`handles ${numType} properties`, async () => {
        const schemas = await emitSchema(`
          model Test {
            @minValue(1)
            @maxValue(2)
            @multipleOf(10)
            prop: ${numType};
          }
        `);

        assert.strictEqual(schemas["Test.json"].properties.prop.minimum, 1);
        assert.strictEqual(schemas["Test.json"].properties.prop.maximum, 2);
        assert.strictEqual(schemas["Test.json"].properties.prop.multipleOf, 10);
      });
    }
  });

  it("handles string decl constraints", async () => {
    const schemas = await emitSchema(`
      @minLength(1)
      @maxLength(2)
      @pattern("a|b")
      @format("ipv4")
      scalar shortString extends string;
    `);

    assert.strictEqual(schemas["shortString.json"].minLength, 1);
    assert.strictEqual(schemas["shortString.json"].maxLength, 2);
    assert.strictEqual(schemas["shortString.json"].pattern, "a|b");
    assert.strictEqual(schemas["shortString.json"].format, "ipv4");
  });

  it("handles string property constraints", async () => {
    const schemas = await emitSchema(`
      model Test {
        @minLength(1)
        @maxLength(2)
        @pattern("a|b")
        @format("ipv4")
        prop: string;
      }
    `);

    assert.strictEqual(schemas["Test.json"].properties.prop.minLength, 1);
    assert.strictEqual(schemas["Test.json"].properties.prop.maxLength, 2);
    assert.strictEqual(schemas["Test.json"].properties.prop.pattern, "a|b");
    assert.strictEqual(schemas["Test.json"].properties.prop.format, "ipv4");
  });
});
