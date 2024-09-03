import assert, { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("emitting models", () => {
  it("works", async () => {
    const schemas = await emitSchema(`
      model Foo {
        x: string;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.properties, { x: { type: "string" } });
    assert.deepStrictEqual(Foo.required, ["x"]);
  });

  it("works with model property references", async () => {
    const schemas = await emitSchema(`
      model Foo {
        x: Bar.y
      }

      model Bar {
        @maxLength(20)
        y: string;
      }
    `);

    assert.deepStrictEqual(schemas["Foo.json"].properties, {
      x: { type: "string", maxLength: 20 },
    });
  });

  it("handles inheritance", async () => {
    const schemas = await emitSchema(`
      model Foo {}
      model Bar extends Foo {}
    `);

    assert.deepStrictEqual(schemas["Bar.json"].allOf, [{ $ref: "Foo.json" }]);
  });

  it("handles templates instantiated with declarations", async () => {
    const schemas = await emitSchema(`
      model Foo {
        prop: Template<Foo>
      }

      model Template<T> {
        x: T
      }

    `);

    assert.deepStrictEqual(schemas["Foo.json"].properties.prop, { $ref: "TemplateFoo.json" });
    assert(schemas["TemplateFoo.json"]);
  });

  it("works with minProperties and maxProperties", async () => {
    const { "Foo.json": Foo } = await emitSchema(`
      @minProperties(1)
      @maxProperties(2)
      model Foo is Record<unknown>;
    `);

    assert.strictEqual(Foo.minProperties, 1);
    assert.strictEqual(Foo.maxProperties, 2);
  });

  it("works with @doc, @summary, and @deprecated", async () => {
    const { "Foo.json": Foo } = await emitSchema(`
      @doc("a")
      @summary("a")
      #deprecated "bad api"
      model Foo {
        @doc("b")
        @summary("b")
        #deprecated "bad api"
        b: string;
      }
    `);

    assert.strictEqual(Foo.description, "a");
    assert.strictEqual(Foo.title, "a");
    assert.strictEqual(Foo.deprecated, true);
    assert.strictEqual(Foo.properties.b.description, "b");
    assert.strictEqual(Foo.properties.b.title, "b");
    assert.strictEqual(Foo.properties.b.deprecated, true);
  });

  it("handles extensions", async () => {
    const { "Foo.json": Foo } = await emitSchema(`
      @extension("x-hi", typeof "bye")
      model Foo {
        @extension("x-hi", Json<"hello">)
        b: string;
      }
    `);

    assert.deepStrictEqual(Foo["x-hi"], { type: "string", const: "bye" });
    assert.deepStrictEqual(Foo.properties.b["x-hi"], "hello");
  });

  it("handles Record<T>", async () => {
    const schemas = await emitSchema(
      `
      model ExtendsRecord extends Record<string> {};
      model IsRecord is Record<{ x: int32, y: int32}>;
      model HasProp {
        x: Record<string>;
      }
    `,
      { emitAllRefs: true }
    );

    assert.deepStrictEqual(schemas["ExtendsRecord.json"].allOf[0], { $ref: "RecordString.json" });
    assert.deepStrictEqual(schemas["RecordString.json"].additionalProperties, { type: "string" });
    assert.deepStrictEqual(schemas["IsRecord.json"].additionalProperties, {
      type: "object",
      properties: {
        x: {
          type: "integer",
          minimum: -2147483648,
          maximum: 2147483647,
        },
        y: {
          type: "integer",
          minimum: -2147483648,
          maximum: 2147483647,
        },
      },
      required: ["x", "y"],
    });
    assert.deepStrictEqual(schemas["HasProp.json"].properties.x, { $ref: "RecordString.json" });
  });

  it("handles instantiations of intrinsics", async () => {
    const schemas = await emitSchema(
      `
        model Test {
          "never": Record<never>;
          "unknown": Record<unknown>;
          "void": Record<void>;
          "null": Record<null>;
        }
      `,
      { emitAllRefs: true }
    );

    assert.deepStrictEqual(schemas["RecordNever.json"].additionalProperties, { not: {} });
    assert.deepStrictEqual(schemas["RecordUnknown.json"].additionalProperties, {});
    assert.deepStrictEqual(schemas["RecordVoid.json"].additionalProperties, { not: {} });
    assert.deepStrictEqual(schemas["RecordNull.json"].additionalProperties, { type: "null" });
  });

  it("handles instantiations of literal types", async () => {
    const schemas = await emitSchema(
      `
        model Test {
          "string": Record<"hi">;
          "number": Record<1.2>;
          "boolean": Record<true>;
        }
      `,
      { emitAllRefs: true }
    );
    assert.deepStrictEqual(schemas["Test.json"].properties.string.additionalProperties, {
      type: "string",
      const: "hi",
    });
    assert.deepStrictEqual(schemas["Test.json"].properties.number.additionalProperties, {
      type: "number",
      const: 1.2,
    });
    assert.deepStrictEqual(schemas["Test.json"].properties.boolean.additionalProperties, {
      type: "boolean",
      const: true,
    });
  });

  it("handles instantiations of type expressions", async () => {
    const schemas = await emitSchema(
      `
        model A { x: int32 }
        model B { y: int32 }
        model Test {
          "union": Record<int32 | int16>;
          "intersection": Record<A & B>;
          "speakableInstantiation": Record<Record<int32>>;
          "unspeakableInstantiation": Record<Record<A & B>>;
        }
      `,
      { emitAllRefs: true }
    );

    assert.deepStrictEqual(schemas["Test.json"].properties.union.additionalProperties, {
      anyOf: [
        {
          type: "integer",
          minimum: -2147483648,
          maximum: 2147483647,
        },
        {
          type: "integer",
          minimum: -32768,
          maximum: 32767,
        },
      ],
    });

    assert.deepStrictEqual(schemas["Test.json"].properties.intersection.additionalProperties, {
      type: "object",
      properties: {
        x: {
          type: "integer",
          minimum: -2147483648,
          maximum: 2147483647,
        },
        y: {
          type: "integer",
          minimum: -2147483648,
          maximum: 2147483647,
        },
      },
      required: ["x", "y"],
    });

    assert.deepStrictEqual(
      schemas["Test.json"].properties.unspeakableInstantiation.additionalProperties,
      {
        type: "object",
        properties: {},
        additionalProperties: {
          type: "object",
          properties: {
            x: {
              type: "integer",
              minimum: -2147483648,
              maximum: 2147483647,
            },
            y: {
              type: "integer",
              minimum: -2147483648,
              maximum: 2147483647,
            },
          },
          required: ["x", "y"],
        },
      }
    );
    assert.deepStrictEqual(schemas["RecordRecordInt32.json"].additionalProperties, {
      $ref: "RecordInt32.json",
    });
  });

  describe("default values", () => {
    it("specify default value on enum property", async () => {
      const res = await emitSchema(
        `
        model Foo {
          optionalEnum?: MyEnum = MyEnum.a;
        };
        
        enum MyEnum {
          a: "a-value",
          b,
        }
        `
      );

      deepStrictEqual(res["Foo.json"].properties.optionalEnum, {
        $ref: "MyEnum.json",
        default: "a-value",
      });
    });

    it("specify default value on string property", async () => {
      const res = await emitSchema(
        `
        model Foo {
          optional?: string = "abc";
        }
        `
      );

      deepStrictEqual(res["Foo.json"].properties.optional, {
        type: "string",
        default: "abc",
      });
    });

    it("specify default value on numeric property", async () => {
      const res = await emitSchema(
        `
        model Foo {
          optional?: int32 = 123;
        }
        `
      );

      deepStrictEqual(res["Foo.json"].properties.optional, {
        type: "integer",
        minimum: -2147483648,
        maximum: 2147483647,
        default: 123,
      });
    });

    it("specify default value on boolean property", async () => {
      const res = await emitSchema(
        `
        model Foo {
          optional?: boolean = true;
        }
        `
      );

      deepStrictEqual(res["Foo.json"].properties.optional, {
        type: "boolean",
        default: true,
      });
    });

    it("specify default value on union with variant", async () => {
      const res = await emitSchema(
        `
        model Foo {
          optionalUnion?: MyUnion = MyUnion.a;
        };
        
        union MyUnion {
          a: "a-value",
          b: "b-value",
        }
        `
      );

      deepStrictEqual(res["Foo.json"].properties.optionalUnion, {
        $ref: "MyUnion.json",
        default: "a-value",
      });
    });
  });
});
