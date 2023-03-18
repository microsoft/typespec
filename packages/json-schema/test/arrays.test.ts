import assert from "assert";
import { emitSchema } from "./utils.js";

describe("arrays", () => {
  it("works with declarations", async () => {
    const schemas = await emitSchema(`
      model Foo is Array<string>;
      model Bar is Array<Foo>;
    `);

    const Foo = schemas["Foo.json"];
    const Bar = schemas["Bar.json"];

    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.type, "array");
    assert.deepStrictEqual(Foo.items, { type: "string" });

    assert.deepStrictEqual(Bar.items, { $ref: "Foo.json" });
  });

  it("works with literals", async () => {
    const schemas = await emitSchema(`
      model M { }
      model Foo {
        x: string[];
        y: M[];
      }
    `);

    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.properties.x.type, "array");
    assert.deepStrictEqual(Foo.properties.x.items, { type: "string" });

    assert.strictEqual(Foo.properties.y.type, "array");
    assert.deepStrictEqual(Foo.properties.y.items, { $ref: "M.json" });
  });
});
