import assert from "assert";
import { emitSchema } from "./utils.js";

describe("emitting enums", () => {
  it("is a proper schema", async () => {
    const schemas = await emitSchema(`
      enum Foo { }
    `);
    const Foo = schemas["Foo.json"];

    assert.strictEqual(Foo.$id, "Foo.json");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
  });

  it("handles numbers", async () => {
    const schemas = await emitSchema(`
      enum Foo {
        a: 1;
        b: 2;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepEqual(Foo.type, "number");
    assert.deepStrictEqual(Foo.enum, [1, 2]);
  });

  it("handles strings", async () => {
    const schemas = await emitSchema(`
      enum Foo {
        a: "hi";
        b: "bye";
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepEqual(Foo.type, "string");
    assert.deepStrictEqual(Foo.enum, ["hi", "bye"]);
  });

  it("handles both numbers and strings", async () => {
    const schemas = await emitSchema(`
      enum Foo {
        a: "hi";
        b: 2;
      }
    `);
    const Foo = schemas["Foo.json"];

    assert.deepStrictEqual(Foo.type, ["string", "number"]);
    assert.deepStrictEqual(Foo.enum, ["hi", 2]);
  });

  it("handles extensions", async () => {
    const schemas = await emitSchema(`
      @extension("x-foo", Json<"foo">)
      enum Foo {
        a: "hi";
        b: 2;
      }
    `);
    const Foo = schemas["Foo.json"];
    assert.strictEqual(Foo["x-foo"], "foo");
  });
});
