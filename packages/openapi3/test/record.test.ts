import { deepStrictEqual, ok } from "assert";
import { it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ oapiForModel, objectSchemaIndexer }) => {
  it("defines record inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { foodScores: Record<int32> };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.foodScores, {
      type: "object",
      [objectSchemaIndexer]: { type: "integer", format: "int32" },
    });
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model FoodScores is Record<int32> {}
      model Pet { foodScores: FoodScores };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.FoodScores, "expected definition named myArray");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.FoodScores, {
      type: "object",
      [objectSchemaIndexer]: { type: "integer", format: "int32" },
    });
  });

  it(`specify ${objectSchemaIndexer} when "...Record<T>"`, async () => {
    const res = await oapiForModel(
      "Person",
      `
      model Person {age: int32, ...Record<string>}
      `,
    );

    deepStrictEqual(res.schemas.Person, {
      type: "object",
      properties: { age: { type: "integer", format: "int32" } },
      [objectSchemaIndexer]: { type: "string" },
      required: ["age"],
    });
  });

  it(`specify ${objectSchemaIndexer} of anyOf when multiple "...Record<T>"`, async () => {
    const res = await oapiForModel(
      "Person",
      `
      model Person {age: int32, ...Record<string>, ...Record<boolean>}
      `,
    );

    deepStrictEqual(res.schemas.Person, {
      type: "object",
      properties: { age: { type: "integer", format: "int32" } },
      [objectSchemaIndexer]: { anyOf: [{ type: "string" }, { type: "boolean" }] },
      required: ["age"],
    });
  });
});
