import { ok, strictEqual } from "assert";
import { diagnoseOpenApiFor, oapiForModel } from "./test-host.js";

describe("openapi3: Additional properties", () => {
  it("set additionalProperties if model extends Record<unknown>", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet extends Record<unknown> { age: int16 };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    strictEqual(res.schemas.Pet.additionalProperties, {});
  });

  it("set additionalProperties on property if property type is Record<unknown>", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { details: Record<unknown> };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    strictEqual(res.schemas.Pet.properties.details, {
      type: "object",
      additionalProperties: true,
    });
  });

  it("set additionalProperties if model extends Record with a named type that extends unknown", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @doc("value")
      scalar Value extends unknown;

      model Pet extends Record<Value> { age: int16 };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    strictEqual(res.schemas.Pet.additionalProperties, {
      description: "value",
    });
  });

  it("set additionalProperties if model extends Record with compatible value type", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet extends Record<string> { name: string };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    strictEqual(res.schemas.Pet.additionalProperties, {
      type: "string",
    });
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

  it("set additionalProperties if model extends Record with leaf type", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Value {};
      model Pet extends Record<Foo> {};
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    strictEqual(res.schemas.Pet.additionalProperties, {
      $ref: "#/components/schemas/Value",
    });
  });
});
