import assert from "assert";
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
      @deprecated("bad api")
      model Foo {
        @doc("b")
        @summary("b")
        @deprecated("bad api")
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
      @extension("x-hi", "bye")
      model Foo {
        @extension("x-hi", Json<"hello">)
        b: string;
      }
    `);

    assert.deepStrictEqual(Foo["x-hi"], { type: "string", const: "bye" });
    assert.deepStrictEqual(Foo.properties.b["x-hi"], "hello");
  });

  it("handles Record<T>", async () => {
    const schemas = await emitSchema(`
      model ExtendsRecord extends Record<string> {};
      model IsRecord is Record<{ x: int32, y: int32}>;
      model HasProp {
        x: Record<string>;
      }
    `);

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
});
