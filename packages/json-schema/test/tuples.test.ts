import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { emitSchema } from "./utils.js";

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
          minItems: 2,
          maxItems: 2,
        },
      },
    },
  });
});

it("emit models referenced in tuple values as $ref", async () => {
  const schemas = await emitSchema(`
    model Bar { b: string }
    model Foo { a: [Bar] }
  `);
  deepStrictEqual(schemas, {
    "Bar.json": {
      $id: "Bar.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["b"],
      properties: {
        b: {
          type: "string",
        },
      },
    },
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
              $ref: "Bar.json",
            },
          ],
          minItems: 1,
          maxItems: 1,
        },
      },
    },
  });
});

it("emit self-referencing tuple as $ref without crashing", async () => {
  const schemas = await emitSchema(`
    model Foo { a?: [Foo] }
  `);
  deepStrictEqual(schemas, {
    "Foo.json": {
      $id: "Foo.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        a: {
          type: "array",
          prefixItems: [
            {
              $ref: "Foo.json",
            },
          ],
          minItems: 1,
          maxItems: 1,
        },
      },
    },
  });
});
