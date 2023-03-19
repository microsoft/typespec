import assert from "assert";
import { emitSchema } from "./utils.js";

describe("emitting scalars", () => {
  it("works with scalars extending built-in scalars", async () => {
    const schemas = await emitSchema(`
      scalar Test extends uint8;
    `);

    assert.deepStrictEqual(schemas["Test.json"], { type: "integer", minimum: 0, maximum: 255 });
  });

  it("throws errors for scalars not extending built-in scalars", async () => {
    await assert.rejects(async () => {
      await emitSchema(`
        scalar Test;
      `);
    });
  });
});
