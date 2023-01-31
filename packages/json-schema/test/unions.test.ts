import assert from "assert";
import { emitSchema } from "./utils.js";

describe("emitting unions", () => {
  it("works with declarations", async () => {
    const schemas = await emitSchema(`
      union Foo {
        x: string;
        y: int32;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.anyOf, [{ type: "string" }, { type: "integer" }]);
  });

  it("works with references", async () => {
    const schemas = await emitSchema(`
      union Foo {
        x: Bar;
        y: Baz;
      }

      model Bar { };
      model Baz { };
    `);
    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo.anyOf, [{ $ref: "Bar.json" }, { $ref: "Baz.json" }]);
  });

  it("handles union expressions", async () => {
    const schemas = await emitSchema(`
      model Foo {
        x: 1 | "hello";
      }
    `);

    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo.properties.x.anyOf, [
      { type: "number", enum: [1] },
      { type: "string", enum: ["hello"] },
    ]);
  });
});
