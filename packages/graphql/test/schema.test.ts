import { describe, expect, it } from "vitest";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("@schema", () => {
  it("loads the schema decorator without issue", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema
      namespace Test {}
    `);
    expect(result.diagnostics).toEqual([]);
  });

  it("loads the schema decorator with a name", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema({name: "TestSchema"})
      namespace Test {}
    `);
    expect(result.diagnostics).toEqual([]);
  });
});
