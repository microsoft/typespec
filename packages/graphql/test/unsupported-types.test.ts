import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("unsupported types", () => {
  it("emits warning and falls back to String for numeric literals", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Test {
          a: 42;
        }
        @query op getTest(): Test;
      }
    `);

    expect(result.graphQLOutput).toContain("a: String!");
    const warnings = result.diagnostics.filter(
      (d) => d.code === "@typespec/graphql/unsupported-type",
    );
    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain("Number");
  });

  it("emits warning and falls back to String for string literals", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Test {
          a: "foo";
        }
        @query op getTest(): Test;
      }
    `);

    expect(result.graphQLOutput).toContain("a: String!");
    const warnings = result.diagnostics.filter(
      (d) => d.code === "@typespec/graphql/unsupported-type",
    );
    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain("String");
  });

  it.each([
    "@query op get(): TypeRef<string>;",
    "@query op get(type: TypeRef<string>): string;",
    "model Item { type: TypeRef<string>; } @query op get(): Item;",
    "model Item { types: (TypeRef<string> | null)[]; } @query op get(): Item;",
  ])("diagnoses compile-time references before rendering: %s", async (code) => {
    const result = await emitSingleSchemaWithDiagnostics(`@schema namespace Test { ${code} }`);
    expectDiagnostics(result.diagnostics, {
      code: "@typespec/graphql/type-reference-not-supported",
    });
    expect(result.graphQLOutput).toBeUndefined();
  });

  it("allows type references in omitted metadata models", async () => {
    const result = await emitSingleSchemaWithDiagnostics(
      `
        @schema namespace Test {
          model Registration { type: TypeRef = typeref(string); }
          @query op get(): string;
        }
      `,
      { "omit-unreachable-types": true },
    );
    expectDiagnosticEmpty(result.diagnostics);
    expect(result.graphQLOutput).toContain("get: String!");
    expect(result.graphQLOutput).not.toContain("Registration");
  });
});
