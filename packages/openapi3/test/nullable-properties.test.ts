import { deepStrictEqual, ok } from "assert";
import { describe, expect, it } from "vitest";
import { OpenAPI3Schema, OpenAPISchema3_1, Refable } from "../src/types.js";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0"], ({ oapiForModel, openApiFor }) => {
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
    deepStrictEqual(res.schemas.X.properties.prop.allOf, [
      {
        $ref: "#/components/schemas/A",
      },
    ]);
    ok(res.schemas.X.properties.prop.nullable);
  });

  describe("when used in circular references", () => {
    async function expectInCircularReference(ref: string, value: Refable<OpenAPI3Schema>) {
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

worksFor(["3.1.0"], ({ oapiForModel, openApiFor }) => {
  // eslint-disable-next-line vitest/no-identical-title
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
      anyOf: [{ $ref: "#/components/schemas/Thing" }, { type: "null" }],
    });
  });

  // eslint-disable-next-line vitest/no-identical-title
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
    deepStrictEqual(res.schemas.X.properties.prop, {
      anyOf: [{ $ref: "#/components/schemas/A" }, { type: "null" }],
    });
  });

  // eslint-disable-next-line vitest/no-identical-title
  describe("when used in circular references", () => {
    async function expectInCircularReference(ref: string, value: Refable<OpenAPISchema3_1>) {
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
        anyOf: [{ type: "array", items: { $ref: "#/components/schemas/Test" } }, { type: "null" }],
      });
    });

    it("keep nullable Record<T> inline", async () => {
      await expectInCircularReference("Record<Test>", {
        anyOf: [
          { type: "object", unevaluatedProperties: { $ref: "#/components/schemas/Test" } },
          { type: "null" },
        ],
      });
    });
  });
});
