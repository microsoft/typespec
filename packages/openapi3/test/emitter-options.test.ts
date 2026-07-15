import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { diagnoseOpenApiFor } from "./test-host.js";

// The openapi3 emitter declares its options as a TypeSpec model
// (`options/main.tsp`, exported via package.json `exports["./options"].typespec`).
// These tests make sure the compiler validates user options against that model.
describe("openapi3: emitter options validation", () => {
  it("accepts all documented options", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "file-type": "json",
      "new-line": "lf",
      "omit-unreachable-types": true,
      "include-x-typespec-name": "inline-only",
      "safeint-strategy": "int64",
      "seal-object-schemas": true,
      "operation-id-strategy": "fqn",
    });
    expectDiagnostics(diagnostics, []);
  });

  it("accepts file-type as an array of values", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "file-type": ["json", "yaml"],
    } as any);
    expectDiagnostics(diagnostics, []);
  });

  it("accepts openapi-versions including 3.2.0", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "openapi-versions": ["3.0.0", "3.1.0", "3.2.0"],
    } as any);
    expectDiagnostics(diagnostics, []);
  });

  it("accepts operation-id-strategy as an object", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "operation-id-strategy": { kind: "parent-container", separator: "_" },
    } as any);
    expectDiagnostics(diagnostics, []);
  });

  it("rejects a value outside a union option", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "enum-strategy": "not-valid",
    } as any);
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Value "not-valid" is not one of the allowed values: "default", "annotated"`,
    });
  });

  it("rejects a value of the wrong type", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "omit-unreachable-types": "yes",
    } as any);
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Type '"yes"' is not assignable to type 'boolean'`,
    });
  });

  it("rejects an unknown option", async () => {
    const diagnostics = await diagnoseOpenApiFor(`op test(): void;`, {
      "totally-unknown": true,
    } as any);
    expect(diagnostics.some((d) => d.code === "invalid-emitter-options")).toBe(true);
  });
});
