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

    assert.strictEqual(Foo.$id, "Foo");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.properties, { x: { type: "string" } });
  });
});
