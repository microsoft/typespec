import { deepStrictEqual, ok } from "assert";
import { describe, expect, it } from "vitest";
import { OpenAPI3SchemaProperty } from "../src/types.js";
import { oapiForModel, openApiFor } from "./test-host.js";

describe("openapi3: nullable properties", () => {
  it("makes nullable schema when union with null", async () => {
    const res = await openApiFor(
      `
        model Thing {
          id: string;
          properties: Thing | null;
        }
        op doStuff(): Thing;
        `,
    );
    deepStrictEqual(res.components.schemas.Thing.properties.properties, {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/Thing" }],
      nullable: true,
    });
  });

  it("handles a nullable enum", async () => {
    const res = await oapiForModel(
      "X",
      `
        enum A {
          a: 1
        }
        
        model X {
          prop: A | null
        }
        `,
    );
    deepStrictEqual(res.schemas.X.properties.prop.oneOf, [
      {
        $ref: "#/components/schemas/A",
      },
    ]);
    ok(res.schemas.X.properties.prop.nullable);
  });

  describe("when used in circular references", () => {
    async function expectInCircularReference(ref: string, value: OpenAPI3SchemaProperty) {
      const res = await openApiFor(
        `
        model Test {
          children: ${ref} | null;
        }
        
        op test(filters: ${ref}): {}[];
        `,
      );
      expect(res.components.schemas.Test.properties.children).toEqual(value);
    }
    it("keep nullable array inline", async () => {
      await expectInCircularReference("Test[]", {
        type: "array",
        items: { $ref: "#/components/schemas/Test" },
        nullable: true,
      });
    });

    it("keep nullable Record<T> inline", async () => {
      await expectInCircularReference("Record<Test>", {
        type: "object",
        additionalProperties: { $ref: "#/components/schemas/Test" },
        nullable: true,
      });
    });
  });
});
