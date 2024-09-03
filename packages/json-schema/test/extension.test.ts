import { DecoratorContext, Type } from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import assert from "assert";
import { describe, it } from "vitest";
import { setExtension } from "../src/index.js";
import { emitSchema, emitSchemaWithDiagnostics } from "./utils.js";

it("handles types", async () => {
  const [schemas, diagnostics] = await emitSchemaWithDiagnostics(`
      @extension("x-model-expression", { name: string })
      @extension("x-model-expression-val", { name: "foo" })
      @extension("x-tuple", [string, string])
      @extension("x-tuple-val", ["foo"])
      @extension("x-array", string[])
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

  assert.deepStrictEqual(Foo["x-model-expression"], {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
      },
    },
  });
  assert.deepStrictEqual(Foo["x-model-expression-val"], {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        const: "foo",
      },
    },
  });
  assert.deepStrictEqual(Foo["x-tuple"], {
    prefixItems: [{ type: "string" }, { type: "string" }],
    type: "array",
  });
  assert.deepStrictEqual(Foo["x-tuple-val"], {
    prefixItems: [{ type: "string", const: "foo" }],
    type: "array",
  });
  assert.deepStrictEqual(Foo["x-array"], {
    items: { type: "string" },
    type: "array",
  });
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

  expectDiagnosticEmpty(diagnostics);
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

  assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], true);
  assert.deepStrictEqual(Foo.properties.x["x-int-literal"], 42);
  assert.deepStrictEqual(Foo.properties.x["x-string-literal"], "hi");
});

// These tests are skipped - can enable if @extension is updated to support `valueof unknown`
it("handles values", async () => {
  const schemas = await emitSchema(`
      @extension("x-anon-model", #{ name: "foo" })
      @extension("x-nested-anon-model", #{ items: #[ #{foo: "bar" }]})
      @extension("x-tuple", #["foo"])
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
  assert.deepStrictEqual(Foo["x-tuple"], ["foo"]);

  assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], true);
  assert.deepStrictEqual(Foo.properties.x["x-int-literal"], 42);
  assert.deepStrictEqual(Foo.properties.x["x-string-literal"], "hi");
  assert.deepStrictEqual(Foo.properties.x["x-null"], null);
});

describe("setExtension", () => {
  it("handles values", async () => {
    const schemas = await emitSchema(
      `
        extern dec setExtension(target: unknown, key: valueof string, value: (valueof unknown));

        @setExtension("x-anon-model", #{ name: "foo" })
        @setExtension("x-nested-anon-model", #{ items: #[ #{foo: "bar" }]})
        model Foo {
          @setExtension("x-bool-literal", true)
          @setExtension("x-int-literal", 42)
          @setExtension("x-string-literal", "hi")
          @setExtension("x-null", null)
          x: string;
        }
      `,
      undefined,
      {
        emitNamespace: true,
        decorators: {
          namespace: "test",
          $flags: { decoratorArgMarshalling: "new" },
          $setExtension(context: DecoratorContext, target: Type, key: string, value: unknown) {
            setExtension(context.program, target, key, value);
          },
        },
      }
    );

    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo["x-anon-model"], { name: "foo" });
    assert.deepStrictEqual(Foo["x-nested-anon-model"], { items: [{ foo: "bar" }] });

    assert.deepStrictEqual(Foo.properties.x["x-bool-literal"], true);
    assert.deepStrictEqual(Foo.properties.x["x-int-literal"], 42);
    assert.deepStrictEqual(Foo.properties.x["x-string-literal"], "hi");
    assert.deepStrictEqual(Foo.properties.x["x-null"], null);
  });
});
