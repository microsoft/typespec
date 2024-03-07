import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("jsonschema: tuples", () => {
  it("emit tuples as items", async () => {
    const schemas = await emitSchema(`
      model Foo {
        a: [string, int32]
      }
    `);
    deepStrictEqual(schemas, {
      "Foo.json": {
        $id: "Foo.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["a"],
        properties: {
          a: {
            type: "array",
            prefixItems: [
              {
                type: "string",
              },
              {
                type: "integer",
                minimum: -2147483648,
                maximum: 2147483647,
              },
            ],
          },
        },
      },
    });
  });
});
