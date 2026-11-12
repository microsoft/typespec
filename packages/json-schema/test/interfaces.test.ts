import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { emitSchema } from "./utils.js";

it("emit nothing", async () => {
  const schemas = await emitSchema(`
    interface Foo {}
  `);

  deepStrictEqual(schemas, {});
});
