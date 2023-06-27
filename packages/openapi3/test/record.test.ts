import { deepStrictEqual, ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: Record", () => {
  it("defines record inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { foodScores: Record<int32> };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.foodScores, {
      type: "object",
      additionalProperties: { type: "integer", format: "int32" },
    });
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model FoodScores is Record<int32> {}
      model Pet { foodScores: FoodScores };
      `
    );

    ok(res.isRef);
    ok(res.schemas.FoodScores, "expected definition named myArray");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.FoodScores, {
      type: "object",
      additionalProperties: { type: "integer", format: "int32" },
    });
  });
});
