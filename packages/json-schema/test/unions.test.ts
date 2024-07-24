import assert from "assert";
import { describe, it } from "vitest";
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
    assert.deepStrictEqual(Foo.anyOf, [{ type: "string" }, { type: "boolean" }]);
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
    assert.deepStrictEqual(Foo.anyOf, [{ type: "string" }, { type: "boolean" }]);
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
