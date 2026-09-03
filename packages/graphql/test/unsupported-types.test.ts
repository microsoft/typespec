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
});
