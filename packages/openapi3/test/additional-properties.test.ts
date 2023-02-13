import { ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: Additional properties", () => {
  it("defines array inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet extends Record<unknown> { age: int16 };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    ok(res.schemas.Pet.additionalProperties === true, "Additional properties not found.");
  });
});
