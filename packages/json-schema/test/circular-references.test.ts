import { describe, it } from "vitest";
import { expectDiagnosticEmpty } from "./utils.js";
import type { Diagnostic, Program } from "@typespec/compiler";
import { createTestHost } from "@typespec/compiler/testing";
import { JsonSchemaTestLibrary } from "../src/testing/index.js";

export async function compileWithEnumExtension(code: string): Promise<{program: Program, diagnostics: readonly Diagnostic[]}> {
  const host = await createTestHost({
    libraries: [JsonSchemaTestLibrary],
  });

  const fullCode = `
    import "@typespec/json-schema"; 
    using JsonSchema; 
    ${code}
  `;

  host.addTypeSpecFile("main.tsp", fullCode);
  await host.compileAndDiagnose("main.tsp", {
    noEmit: true,
  });

  // At this point diagnostics should be properly populated
  return {
    program: host.program,
    diagnostics: host.program.diagnostics
  };
}

describe("json-schema: circular references", () => {
  it("can use enum values in @extension decorator without circular reference errors", async () => {
    const { diagnostics } = await compileWithEnumExtension(`
      @jsonSchema
      namespace Test;
      
      const MetadataTag = "x-metadata";
      
      enum MetadataValue {
        Foo: "foo",
        Bar: "bar"
      }
      
      @extension(MetadataTag, MetadataValue.Foo)
      model Car {
        kind: string;
        brand: string;
        "model": string;
      }
    `);
    
    expectDiagnosticEmpty(diagnostics);
  });

  it("can use enum values of different types in @extension decorator", async () => {
    const { diagnostics } = await compileWithEnumExtension(`
      @jsonSchema
      namespace Test;
      
      const MetadataTag = "x-metadata";
      
      enum NumericMetadata {
        One: 1,
        Two: 2
      }
      
      @extension(MetadataTag, NumericMetadata.One)
      model Truck {
        brand: string;
      }
    `);
    
    expectDiagnosticEmpty(diagnostics);
  });
});
