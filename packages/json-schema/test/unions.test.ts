import assert from "assert";
import { describe, expect, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("emitting unions", () => {
  it("works with declarations", async () => {
    const schemas = await emitSchema(`
      union Foo {
        x: string;
        y: boolean;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.type, ["string", "boolean"]);
    assert.strictEqual(Foo.anyOf, undefined);
  });

  it("union description carries over", async () => {
    const schemas = await emitSchema(`
      /** Foo doc */
      union Foo {
        x: string;
        y: boolean;
      }
    `);

    assert.strictEqual(schemas["Foo.json"].description, "Foo doc");
  });

  it("works with declarations with anonymous variants", async () => {
    const schemas = await emitSchema(`
      union Foo {
        string;
        boolean;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.type, ["string", "boolean"]);
    assert.strictEqual(Foo.anyOf, undefined);
  });

  it("combines nullable property types and preserves defaults", async () => {
    const schemas = await emitSchema(`
      model Foo {
        optional?: string | null = null;
        value: string | boolean | integer | numeric | null;
      }
    `);

    expect(schemas["Foo.json"].properties).toEqual({
      optional: { type: ["string", "null"], default: null },
      value: { type: ["string", "boolean", "integer", "number", "null"] },
    });
  });

  it("deduplicates variants with the same JSON Schema type", async () => {
    const schemas = await emitSchema(`
      model Foo {
        value: string | int64 | decimal;
      }
    `);

    expect(schemas["Foo.json"].properties.value).toEqual({ type: "string" });
  });

  it("combines only bare types in mixed unions", async () => {
    const schemas = await emitSchema(`
      model Foo {
        value: string | Bar | null | int32 | utcDateTime | 1 | string[];
      }
      model Bar {}
    `);

    expect(schemas["Foo.json"].properties.value).toEqual({
      anyOf: [
        { type: ["string", "null"] },
        { $ref: "Bar.json" },
        { type: "integer", minimum: -2147483648, maximum: 2147483647 },
        { type: "string", format: "date-time" },
        { type: "number", const: 1 },
        { type: "array", items: { type: "string" } },
      ],
    });
  });

  it("preserves metadata on variants while combining other types", async () => {
    const schemas = await emitSchema(`
      union Foo {
        @doc("documented string")
        documented: string;
        @extension("x-kind", "flag")
        flag: boolean;
        number: numeric;
        nothing: null;
      }
    `);

    expect(schemas["Foo.json"].anyOf).toEqual([
      { type: "string", description: "documented string" },
      { type: "boolean", "x-kind": "flag" },
      { type: ["number", "null"] },
    ]);
  });

  it("preserves overlapping oneOf variants on unions and properties", async () => {
    const schemas = await emitSchema(`
      @oneOf
      union Foo { integer, numeric, null }
      model Bar {
        @oneOf
        value: integer | numeric | null;
        @oneOf
        overlapping: string | int64;
        ordinary: integer | numeric | null;
      }
    `);

    const variants = [{ type: "integer" }, { type: "number" }, { type: "null" }];
    expect(schemas["Foo.json"].oneOf).toEqual(variants);
    expect(schemas["Bar.json"].properties).toEqual({
      value: { oneOf: variants },
      overlapping: { oneOf: [{ type: "string" }, { type: "string" }] },
      ordinary: { type: ["integer", "number", "null"] },
    });
  });

  it("does not combine variants with type extensions", async () => {
    const schemas = await emitSchema(`
      union Value {
        @extension("type", "string")
        text: string;
        boolean;
        null;
      }
    `);

    expect(schemas["Value.json"].anyOf).toEqual([
      { type: "string" },
      { type: ["boolean", "null"] },
    ]);
  });

  it("preserves pending recursive references on variants with extensions", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema model Node { value: Value; }
      union Value {
        @extension("type", "object")
        node: Node;
        nothing: null;
      }
      `,
      {},
      { emitNamespace: false },
    );

    expect(schemas["Node.json"].$defs.Value).toEqual({
      anyOf: [{ type: "object", $ref: "Node.json" }, { type: "null" }],
    });
  });

  it("preserves references to named and recursive unions", async () => {
    const schemas = await emitSchema(`
      union Value { string, null, Value[] }
      model Foo {
        @oneOf
        exclusive: Value;
        ordinary: Value;
      }
    `);

    expect(schemas["Value.json"].anyOf).toEqual([
      { type: ["string", "null"] },
      { type: "array", items: { $ref: "Value.json" } },
    ]);
    expect(schemas["Foo.json"].properties).toEqual({
      exclusive: { $ref: "Value.json" },
      ordinary: { $ref: "Value.json" },
    });
  });

  it("preserves shared model references from oneOf properties", async () => {
    const schemas = await emitSchema(`
      model Foo {
        @oneOf
        exclusive: Bar | string | null;
        ordinary: Bar | string | null;
      }
      model Bar { next?: Bar }
    `);

    expect(schemas["Foo.json"].properties).toEqual({
      exclusive: {
        oneOf: [{ $ref: "Bar.json" }, { type: "string" }, { type: "null" }],
      },
      ordinary: { anyOf: [{ $ref: "Bar.json" }, { type: ["string", "null"] }] },
    });
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
      { type: "number", const: 1 },
      { type: "string", const: "hello" },
    ]);
  });

  it("handles extensions", async () => {
    const schemas = await emitSchema(`
      @extension("x-foo", Json<true>)
      union Foo {
        x: Bar;
        y: Baz;
      }

      model Bar { };
      model Baz { };
    `);
    const Foo = schemas["Foo.json"];
    assert.strictEqual(Foo["x-foo"], true);
  });

  it("handles oneOf decorator", async () => {
    const schemas = await emitSchema(`
      @oneOf
      union Foo {
        "a",
        "b"
      }

      model Bar {
        @oneOf
        prop: "a" | "b"
      }
    `);

    const Foo = schemas["Foo.json"];
    const Bar = schemas["Bar.json"];

    assert.ok(Foo.oneOf, "Foo uses oneOf");
    assert.ok(Bar.properties.prop.oneOf, "Bar.prop uses oneOf");
  });
  it("handles decorators on variants", async () => {
    const schemas = await emitSchema(`
      union Foo {
        @doc("doc text")
        @summary("summary text")
        @extension("x-key", Json<"x-value">)
        bar: string;

        @doc("other model doc")
        @summary("other model summary")
        @extension("x-key-2", Json<"x-value-2">)
        baz: OtherModel;
      }

      model OtherModel {}
    `);

    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo.anyOf, [
      {
        description: "doc text",
        title: "summary text",
        type: "string",
        "x-key": "x-value",
      },
      {
        $ref: "OtherModel.json",
        description: "other model doc",
        title: "other model summary",
        "x-key-2": "x-value-2",
      },
    ]);
  });
});

describe("union templates", () => {
  it("combines type arrays from inline union instantiations", async () => {
    const schemas = await emitSchema(`
      union U<T> { string, T }
      model Foo {
        value: U<boolean | null> | integer;
      }
    `);

    expect(schemas["Foo.json"].properties.value).toEqual({
      type: ["string", "boolean", "null", "integer"],
    });
  });

  it("applies property-level oneOf only to the outer inline union", async () => {
    const schemas = await emitSchema(`
      union U<T> { string, T }
      model Foo {
        @oneOf
        value: U<boolean | null> | integer;
      }
    `);

    expect(schemas["Foo.json"].properties.value).toEqual({
      oneOf: [{ type: ["string", "boolean", "null"] }, { type: "integer" }],
    });
  });

  it("can be referenced from a property", async () => {
    const schemas = await emitSchema(
      `
      union U<T> { "a", T }
      @jsonSchema model Foo {
        prop: U<"b">;
      };
      `,
    );
    expect(schemas["Foo.json"].properties.prop).toEqual({
      anyOf: [
        { type: "string", const: "a" },
        { type: "string", const: "b" },
      ],
    });
  });
  it("can be referenced in another union", async () => {
    const schemas = await emitSchema(
      `
      union U<T> { "a", T }
      @jsonSchema union Foo {string, U<"b"> }
      `,
    );
    expect(schemas["Foo.json"].anyOf).toEqual([
      { type: "string" },
      {
        anyOf: [
          { type: "string", const: "a" },
          { type: "string", const: "b" },
        ],
      },
    ]);
  });
});
