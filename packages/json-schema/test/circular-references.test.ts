import assert from "assert";
import { describe, it } from "vitest";
import { compileWithEnumExtension, expectDiagnosticEmpty } from "./utils.js";

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