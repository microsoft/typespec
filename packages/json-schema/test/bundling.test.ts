import assert from "assert";
import { emitSchema } from "./utils.js";

describe("bundling", () => {
  it("works", async () => {
    const schemas = await emitSchema(
      `
      model Foo { }
      model Bar { }
    `,
      { bundleId: "test.json" }
    );

    const types = schemas["test.json"];
    assert.strictEqual(types.$defs.Foo.$id, "Foo");
    assert.strictEqual(types.$defs.Bar.$id, "Bar");
  });

  it("bundles non-schema dependencies by default", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model test { b: Bar }
      model Bar { }
    `,
      {},
      { emitNamespace: false }
    );

    assert.strictEqual(schemas["test.json"].$id, "test.json");
    assert.strictEqual(schemas["test.json"].$defs.Bar.$id, "Bar.json");
  });

  it("doesn't bundle non-schema dependencies when passing emitAllRefs", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model test { b: Bar }
      model Bar { }
    `,
      { emitAllRefs: true },
      { emitNamespace: false }
    );

    assert.strictEqual(schemas["test.json"].$id, "test.json");
    assert.strictEqual(schemas["test.json"].$defs, undefined);
    assert.strictEqual(schemas["Bar.json"].$id, "Bar.json");
  });
});
