import { ok } from "assert";
import { diagnoseOpenApiFor, oapiForModel } from "./test-host.js";

describe("openapi3: Additional properties", () => {
  it("set additionalProperties true if model extends Record<unknown>", async () => {
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

  it("pass if model extends record with compatible value type", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet extends Record<string> { name: string };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    ok(
      "additionalProperties" in res.schemas.Pet === false,
      "Schemas unexpectedly has additionalProperties."
    );
  });

  it("emits error if model extends record with incompatible value type", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      model Pet extends Record<string> { age: int16 };
      `
    );

    ok(diagnostics.length === 1, "Expected diagnostics.");
    ok(diagnostics[0].message === "Type 'Cadl.int16' is not assignable to type 'Cadl.string'");
  });
});
