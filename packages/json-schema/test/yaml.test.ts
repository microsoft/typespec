import assert from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("emitting models to yaml", () => {
  it("works", async () => {
    const schemas = await emitSchema(
      `
      model Foo {
        x: string;
      }
    `,
      { "file-type": "yaml" },
    );
    const Foo = schemas["Foo.yaml"];

    assert.strictEqual(Foo.$id, "Foo.yaml");
    assert.strictEqual(Foo.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.deepStrictEqual(Foo.properties, { x: { type: "string" } });
  });
});
