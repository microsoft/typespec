import assert from "assert";
import { emitSchema } from "./utils.js";

describe("bundling", () => {
  it("works", async () => {
    const schemas = await emitSchema(
      `
      model Foo { }
      model Bar { }
    `,
      { bundle: true }
    );

    const types = schemas["types.json"];
    assert.strictEqual(types.$defs.Foo.$id, "Foo");
    assert.strictEqual(types.$defs.Bar.$id, "Bar");
  });
});
