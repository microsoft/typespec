import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ oapiForModel, objectSchemaIndexer }) => {
  describe("extends Record<T>", () => {
    it(`doesn't set ${objectSchemaIndexer} on model itself`, async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], undefined);
    });

    it("links to an allOf of the Record<unknown> schema", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet.allOf, [{ type: "object", [objectSchemaIndexer]: {} }]);
    });

    it("include model properties", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> { name: string };`);
      deepStrictEqual(res.schemas.Pet.properties, {
        name: { type: "string" },
      });
    });
  });

  describe("is Record<T>", () => {
    it(`set ${objectSchemaIndexer} on model itself`, async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {});
    });

    it("set additional properties type", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<string> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {
        type: "string",
      });
    });

    it("include model properties", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<unknown> { name: string };`);
      deepStrictEqual(res.schemas.Pet.properties, {
        name: { type: "string" },
      });
    });
  });

  describe("referencing Record<T>", () => {
    it(`add ${objectSchemaIndexer} inline for property of type Record<unknown>`, async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { details: Record<unknown> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet.properties.details, {
        type: "object",
        [objectSchemaIndexer]: {},
      });
    });
  });

  it(`set ${objectSchemaIndexer} if model extends Record with leaf type`, async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @doc("value")
      scalar Value;
      model Pet is Record<Value> {};
      `,
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {
      $ref: "#/components/schemas/Value",
    });
  });
});
