import assert from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("emitting extensions", () => {
  it("handles types", async () => {
    const schemas = await emitSchema(`
      @extension("x-named-model", Thing)
      @extension("x-model-template", Collection<Thing>)
      @extension("x-record", Record<{ name: string }>)
      model Foo {
        @extension("x-bool", boolean)
        @extension("x-bool-literal", typeof true)
        @extension("x-int", int8)
        @extension("x-int-literal", typeof 42)
        @extension("x-string", string)
        @extension("x-string-literal", typeof "hi")
        @extension("x-union", "one" | "two")
        @extension("x-null", typeof null)
        x: string;
      }

      model Collection<Item> {
        size: int32;
        item: Item[];
      }
      
      model Thing {
        name: string;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo["x-named-model"], { $ref: "Thing.json" });
    assert.deepStrictEqual(Foo["x-model-template"], { $ref: "CollectionThing.json" });
    assert.deepStrictEqual(Foo["x-record"], {
      additionalProperties: {
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
      },
      properties: {},
      type: "object",
    });
    assert.deepStrictEqual(Foo.properties.x["x-bool"], { type: "boolean" });
    assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], {
      const: true,
      type: "boolean",
    });
    assert.deepStrictEqual(Foo.properties.x["x-int"], {
      minimum: -128,
      maximum: 127,
      type: "integer",
    });
    assert.deepStrictEqual(Foo.properties.x["x-int-literal"], {
      const: 42,
      type: "number",
    });
    assert.deepStrictEqual(Foo.properties.x["x-string"], {
      type: "string",
    });
    assert.deepStrictEqual(Foo.properties.x["x-string-literal"], {
      const: "hi",
      type: "string",
    });
    assert.deepStrictEqual(Foo.properties.x["x-union"], {
      anyOf: [
        { const: "one", type: "string" },
        { const: "two", type: "string" },
      ],
    });
    assert.deepStrictEqual(Foo.properties.x["x-null"], {
      type: "null",
    });
  });

  it("handles Json-wrapped types", async () => {
    const schemas = await emitSchema(`
      @extension("x-anon-model", Json<{ name: "foo" }>)
      @extension("x-named-model", Json<Thing>)
      @extension("x-nested-anon-model", Json<{ items: [ {foo: "bar" }]}>)
      model Foo {
        @extension("x-bool-literal", Json<true>)
        @extension("x-int-literal", Json<42>)
        @extension("x-string-literal", Json<"hi">)
        x: string;
      }

      model Collection<Item> {
        size: 1;
        item: Item[];
      }
      
      model Thing {
        name: "thing";
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo["x-anon-model"], { name: "foo" });
    assert.deepStrictEqual(Foo["x-named-model"], { name: "thing" });
    assert.deepStrictEqual(Foo["x-nested-anon-model"], { items: [{ foo: "bar" }] });

    // Would expect this to be `{ size: 1, item: { name: "thing" }}` but it isn't.
    // assert.deepStrictEqual(Foo["x-model-template"], { size: 1, item: {} });

    assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], true);
    assert.deepStrictEqual(Foo.properties.x["x-int-literal"], 42);
    assert.deepStrictEqual(Foo.properties.x["x-string-literal"], "hi");
  });

  it.skip("handles values", async () => {
    const schemas = await emitSchema(`
      @extension("x-anon-model", #{ name: "foo" })
      @extension("x-nested-anon-model", #{ items: #[ #{foo: "bar" }]})
      model Foo {
        @extension("x-bool-literal", true)
        @extension("x-int-literal", 42)
        @extension("x-string-literal", "hi")
        @extension("x-null", null)
        x: string;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo["x-anon-model"], { name: "foo" });
    assert.deepStrictEqual(Foo["x-nested-anon-model"], { items: [{ foo: "bar" }] });

    assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], true);
    assert.deepStrictEqual(Foo.properties.x["x-int-literal"], 42);
    assert.deepStrictEqual(Foo.properties.x["x-string-literal"], "hi");
    assert.deepStrictEqual(Foo.properties.x["x-null"], null);
  });

  describe("breaking changes with value support", () => {
    it("supports in-line models types", async () => {
      const schemas = await emitSchema(`
        @extension("x-anon-model", { name: string })
        model Foo {
          x: string;
        }
      `);

      // What used to be emitted
      assert.deepStrictEqual(schemas["Foo.json"]["x-anon-model"], {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
        },
      });
    });

    it("treats scalar literals as types without 'typeof'", async () => {
      const schemas = await emitSchema(`
        model Foo {
          @extension("x-int-literal", 42)
          @extension("x-string-literal", "hi")
          @extension("x-bool-literal", true)
          @extension("x-null", null)
          x: string;
        }
      `);
      const Foo = schemas["Foo.json"];

      assert.deepStrictEqual(Foo.properties.x["x-int-literal"], {
        const: 42,
        type: "number",
      });
      assert.deepStrictEqual(Foo.properties.x["x-string-literal"], {
        const: "hi",
        type: "string",
      });
      assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], {
        const: true,
        type: "boolean",
      });
      assert.deepStrictEqual(Foo.properties.x["x-null"], {
        type: "null",
      });
    });
  });
});
