import assert, { strictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("bundling", () => {
  it("works", async () => {
    const schemas = await emitSchema(
      `
      model Foo { }
      model Bar { }
    `,
      { bundleId: "test.json" },
    );

    const types = schemas["test.json"];
    assert.strictEqual(types.$defs.Foo.$id, "Foo.json");
    assert.strictEqual(types.$defs.Bar.$id, "Bar.json");
  });

  it("doesn't create bundled schemas for referenced non-JSON Schema types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model testModel { a: nonModel, b: nonArray, c: nonUnion, d: nonEnum, e: nonScalar  }
      @jsonSchema
      model testArray is Array<nonModel>;
      @jsonSchema
      union testUnion { nonModel }
      @jsonSchema
      enum testEnum { a, b }
      @jsonSchema
      scalar testScalar extends nonScalar;
      
      model nonModel { b: Baz }
      model Baz { }
      model nonArray is Array<nonModel>;
      scalar nonScalar extends string;
      enum nonEnum { a, b }
      union nonUnion { nonModel }

    `,
      { bundleId: "test.json" },
      {
        emitNamespace: false,
        emitTypes: ["testModel", "testArray", "testUnion", "testEnum", "testScalar"],
      },
    );

    const defs = Object.keys(schemas["test.json"].$defs);
    strictEqual(defs.length, 5);
    ["testModel", "testArray", "testUnion", "testEnum", "testScalar"].forEach((name) => {
      assert(defs.indexOf(name) !== -1, "defs should contain " + name);
    });
  });
  it("with emitAllRefs, creates bundled schemas for referenced non-JSON Schema types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model testModel { a: nonModel, b: nonArray, c: nonUnion, d: nonEnum, e: nonScalar  }
      @jsonSchema
      model testArray is Array<nonModel>;
      @jsonSchema
      union testUnion { nonModel }
      @jsonSchema
      enum testEnum { a, b }
      @jsonSchema
      scalar testScalar extends nonScalar;
      
      model nonModel { b: Baz }
      model Baz { }
      model nonArray is Array<nonModel>;
      scalar nonScalar extends string;
      enum nonEnum { a, b }
      union nonUnion { nonModel }

    `,
      { bundleId: "test.json", emitAllRefs: true },
      {
        emitNamespace: false,
        emitTypes: ["testModel", "testArray", "testUnion", "testEnum", "testScalar"],
      },
    );

    const defs = Object.keys(schemas["test.json"].$defs);
    strictEqual(defs.length, 11);
    [
      "testModel",
      "testArray",
      "testUnion",
      "testEnum",
      "testScalar",
      "nonModel",
      "Baz",
      "nonArray",
      "nonScalar",
      "nonEnum",
      "nonUnion",
    ].forEach((name) => {
      assert(defs.indexOf(name) !== -1, "defs should contain " + name);
    });
  });

  it("with emitAllModels, creates bundled schemas for all data types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model testModel { a: nonModel, b: nonArray, c: nonUnion, d: nonEnum, e: nonScalar  }
      @jsonSchema
      model testArray is Array<nonModel>;
      @jsonSchema
      union testUnion { nonModel }
      @jsonSchema
      enum testEnum { a, b }
      @jsonSchema
      scalar testScalar extends nonScalar;
      
      model nonModel { b: Baz }
      model Baz { }
      model nonArray is Array<nonModel>;
      scalar nonScalar extends string;
      enum nonEnum { a, b }
      union nonUnion { nonModel }

    `,
      { bundleId: "test.json", emitAllModels: true },
      {
        emitNamespace: false,
      },
    );

    const defs = Object.keys(schemas["test.json"].$defs);
    strictEqual(defs.length, 11);
    [
      "testModel",
      "testArray",
      "testUnion",
      "testEnum",
      "testScalar",
      "nonModel",
      "Baz",
      "nonArray",
      "nonScalar",
      "nonEnum",
      "nonUnion",
    ].forEach((name) => {
      assert(defs.indexOf(name) !== -1, "defs should contain " + name);
    });
  });
});
