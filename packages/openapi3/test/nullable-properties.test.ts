import { deepStrictEqual, ok } from "assert";
import { describe, expect, it } from "vitest";
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
        `
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
        `
    );
    deepStrictEqual(res.schemas.X.properties.prop.oneOf, [
      {
        $ref: "#/components/schemas/A",
      },
    ]);
    ok(res.schemas.X.properties.prop.nullable);
  });

  describe("when used in circular references", () => {
    it("nullable array keeps it inline", async () => {
      const res = await openApiFor(
        `
        model FilterNode {
          childNodes: FilterNode[] | null; // note e.g. that the ' | null ' here affects, and the post op further down.
        }
        
        op TheSearch(filters: FilterNode[]): {}[];
        `
      );
      expect(res.components.schemas.FilterNode.properties.childNodes).toEqual({
        type: "array",
        items: { $ref: "#/components/schemas/FilterNode" },
        nullable: true,
      });
    });

    it("nullable Record<T> keeps it inline", async () => {
      const res = await openApiFor(
        `
        model FilterNode {
          childNodes: Record<FilterNode> | null; // note e.g. that the ' | null ' here affects, and the post op further down.
        }
        
        op TheSearch(filters: Record<FilterNode>[]): {}[];
        `
      );
      expect(res.components.schemas.FilterNode.properties.childNodes).toEqual({
        type: "object",
        additionalProperties: { $ref: "#/components/schemas/FilterNode" },
        nullable: true,
      });
    });
  });
});
