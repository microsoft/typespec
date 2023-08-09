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
      model Bar { b: Baz }
      model Baz { }
    `,
      {},
      { emitNamespace: false }
    );

    assert.strictEqual(schemas["test.json"].$id, "test.json");
    assert.strictEqual(schemas["test.json"].$defs.Bar.$id, "Bar.json");
    assert.strictEqual(schemas["test.json"].$defs.Baz.$id, "Baz.json");
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

  it("doesn't create duplicate defs for transitive references", async () => {
    const schemas = await emitSchema(
      `
      model A {}
      
      model B {
        refA: A;
      }
      
      @jsonSchema
      model C {
        refB: B;
      }
      
      @jsonSchema
      model D {
        refB: B;
      }
    `,
      {},
      { emitNamespace: false, emitTypes: ["C", "D"] }
    );

    const depSchemas = {
      B: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "B.json",
        type: "object",
        properties: {
          refA: {
            $ref: "A.json",
          },
        },
        required: ["refA"],
      },
      A: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "A.json",
        type: "object",
        properties: {},
      },
    };
    assert.deepStrictEqual(schemas["C.json"].$defs, depSchemas);
    assert.deepStrictEqual(schemas["D.json"].$defs, depSchemas);
  });
});
