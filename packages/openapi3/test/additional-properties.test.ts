import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok } from "assert";
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
    deepStrictEqual(res.schemas.Pet.additionalProperties, {});
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
    deepStrictEqual(res.schemas.Pet.properties.details, {
      type: "object",
      additionalProperties: {},
      "x-typespec-name": "Record<unknown>",
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
    deepStrictEqual(res.schemas.Pet.additionalProperties, {
      type: "string",
    });
  });

  it("emits error if model extends record with incompatible value type", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      model Pet extends Record<string> { age: int16 };
      `
    );
    expectDiagnostics(diagnostics, [
      {
        code: "unassignable",
        message: "Type 'TypeSpec.int16' is not assignable to type 'TypeSpec.string'",
      },
    ]);
  });

  it("set additionalProperties if model extends Record with leaf type", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @doc("value")
      scalar Value;
      model Pet extends Record<Value> {};
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.additionalProperties, {
      $ref: "#/components/schemas/Value",
    });
  });
});
