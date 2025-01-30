import type { Namespace } from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getSchema } from "../src/lib/schema.js";
import { compileAndDiagnose } from "./test-host.js";

describe("@schema", () => {
  it("Creates a schema with no name", async () => {
    const [program, { TestNamespace }, diagnostics] = await compileAndDiagnose<{
      TestNamespace: Namespace;
    }>(`
      @schema
      @test namespace TestNamespace {}
    `);
    expectDiagnosticEmpty(diagnostics);

    const schema = getSchema(program, TestNamespace);

    expect(schema?.type).toBe(TestNamespace);
    expect(schema?.name).toBeUndefined();
  });

  it("Creates a schema with a specified name", async () => {
    const [program, { TestNamespace }, diagnostics] = await compileAndDiagnose<{
      TestNamespace: Namespace;
    }>(`
      @schema(#{name: "MySchema"})
      @test namespace TestNamespace {}
    `);
    expectDiagnosticEmpty(diagnostics);

    const schema = getSchema(program, TestNamespace);

    expect(schema?.type).toBe(TestNamespace);
    expect(schema?.name).toBe("MySchema");
  });
});
