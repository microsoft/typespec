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
});
