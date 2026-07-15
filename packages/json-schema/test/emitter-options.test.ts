import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emitSchema, emitSchemaWithDiagnostics } from "./utils.js";

// The json-schema emitter declares its options as a TypeSpec model
// (`options/main.tsp`, exported via package.json `exports["./options"].typespec`).
// These tests make sure the compiler validates user options against that model.
describe("json-schema: emitter options validation", () => {
  it("accepts all documented options", async () => {
    await emitSchema(`model Foo {}`, {
      "file-type": "json",
      "int64-strategy": "string",
      bundleId: "bundle",
      emitAllModels: true,
      emitAllRefs: true,
      "seal-object-schemas": true,
      "polymorphic-models-strategy": "oneOf",
    });
  });

  it("rejects a value outside a union option", async () => {
    const [, diagnostics] = await emitSchemaWithDiagnostics(`model Foo {}`, {
      "polymorphic-models-strategy": "not-valid",
    } as any);
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Value "not-valid" is not one of the allowed values: "ignore", "oneOf", "anyOf"`,
    });
  });

  it("rejects a value of the wrong type", async () => {
    const [, diagnostics] = await emitSchemaWithDiagnostics(`model Foo {}`, {
      emitAllModels: "yes",
    } as any);
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Type '"yes"' is not assignable to type 'boolean'`,
    });
  });

  it("rejects an unknown option", async () => {
    const [, diagnostics] = await emitSchemaWithDiagnostics(`model Foo {}`, {
      "totally-unknown": true,
    } as any);
    expect(diagnostics.some((d) => d.code === "invalid-emitter-options")).toBe(true);
  });
});
