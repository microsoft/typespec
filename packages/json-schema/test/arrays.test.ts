import assert from "assert";
import { describe, it } from "vitest";
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

  it("works with minItems and maxItems", async () => {
    const { "Foo.json": Foo, "Bar.json": Bar } = await emitSchema(`
      @minItems(1)
      @maxItems(2)
      model Foo is Array<string>;
      model Bar {
        @minItems(1)
        @maxItems(2)
        x: string[];
      }
    `);

    assert.strictEqual(Foo.minItems, 1);
    assert.strictEqual(Foo.maxItems, 2);
    assert.strictEqual(Bar.properties.x.minItems, 1);
    assert.strictEqual(Bar.properties.x.maxItems, 2);
  });

  it("works with contains, minContains, and maxContains", async () => {
    const { "Foo.json": Foo, "Bar.json": Bar } = await emitSchema(`
      @contains(string)
      @minContains(1)
      @maxContains(2)
      @uniqueItems
      model Foo is Array<unknown>;
      model Bar {
        @contains(string)
        @minContains(1)
        @maxContains(2)
        @uniqueItems
        x: unknown[];
      }
    `);

    assert.strictEqual(Foo.minContains, 1);
    assert.strictEqual(Foo.maxContains, 2);
    assert.deepStrictEqual(Foo.contains, { type: "string" });
    assert.strictEqual(Foo.uniqueItems, true);
    assert.strictEqual(Bar.properties.x.minContains, 1);
    assert.strictEqual(Bar.properties.x.maxContains, 2);
    assert.deepStrictEqual(Bar.properties.x.contains, { type: "string" });
    assert.strictEqual(Bar.properties.x.uniqueItems, true);
  });

  it("works with prefixItems", async () => {
    const { "Foo.json": Foo, "Bar.json": Bar } = await emitSchema(`
      @prefixItems([string, { x: string }, Foo])
      model Foo is Array<unknown>;
      model Bar {
        @prefixItems([string, { x: string }, Foo])
        x: unknown[];
      }
    `);

    assert.strictEqual(Foo.prefixItems.length, 3);
    assert.deepStrictEqual(Foo.prefixItems[0], { type: "string" });
    assert.deepStrictEqual(Foo.prefixItems[1], {
      type: "object",
      properties: { x: { type: "string" } },
      required: ["x"],
    });
    assert.deepStrictEqual(Foo.prefixItems[2], { $ref: "Foo.json" });
    assert.strictEqual(Bar.properties.x.prefixItems.length, 3);
    assert.deepStrictEqual(Bar.properties.x.prefixItems[0], { type: "string" });
    assert.deepStrictEqual(Bar.properties.x.prefixItems[1], {
      type: "object",
      properties: { x: { type: "string" } },
      required: ["x"],
    });
    assert.deepStrictEqual(Bar.properties.x.prefixItems[2], { $ref: "Foo.json" });
  });
});
