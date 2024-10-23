import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("jsonschema: interfaces", () => {
  it("emit nothing", async () => {
    const schemas = await emitSchema(`
      interface Foo {}
    `);

    deepStrictEqual(schemas, {});
  });
});
