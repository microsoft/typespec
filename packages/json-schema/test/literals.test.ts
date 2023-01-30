import assert from "assert";
import { emitSchema } from "./utils.js";

describe("literals", () => {
  it("handles booleans", async () => {
    const schemas = await emitSchema(`
      model Test {
        a: true,
        b: false
      }
    `);

    assert.deepStrictEqual(schemas["Test.json"].properties.a, { type: "boolean", enum: [true] });
    assert.deepStrictEqual(schemas["Test.json"].properties.b, { type: "boolean", enum: [false] });
  });

  it("handles strings", async () => {
    const schemas = await emitSchema(`
      model Test {
        a: "hi",
      }
    `);

    assert.deepStrictEqual(schemas["Test.json"].properties.a, { type: "string", enum: ["hi"] });
  });

  it("handles numbers", async () => {
    const schemas = await emitSchema(`
      model Test {
        a: 1,
      }
    `);

    assert.deepStrictEqual(schemas["Test.json"].properties.a, { type: "number", enum: [1] });
  });
});
