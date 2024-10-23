import assert, { strictEqual } from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("referencing non-JSON Schema types", () => {
  it("inlines into the defs of each referencing schema by default", async () => {
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
      {},
      {
        emitNamespace: false,
        emitTypes: ["testModel", "testArray", "testUnion", "testEnum", "testScalar"],
      },
    );

    validateInlinedSchema(schemas["testModel.json"], [
      "nonModel",
      "Baz",
      "nonArray",
      "nonScalar",
      "nonEnum",
      "nonUnion",
    ]);
    validateInlinedSchema(schemas["testArray.json"], ["nonModel", "Baz"]);
    validateInlinedSchema(schemas["testUnion.json"], ["nonModel", "Baz"]);

    strictEqual(schemas["nonModel.json"], undefined);
    strictEqual(schemas["nonArray.json"], undefined);
    strictEqual(schemas["nonUnion.json"], undefined);
    strictEqual(schemas["nonEnum.json"], undefined);
    strictEqual(schemas["nonScalar.json"], undefined);
    strictEqual(schemas["Baz.json"], undefined);

    function validateInlinedSchema(schema: Record<string, any>, expectedDefs: string[]) {
      const defs = schema.$defs;

      strictEqual(typeof defs, "object");

      for (const expectedDef of expectedDefs) {
        strictEqual(typeof defs[expectedDef], "object", `def ${expectedDef} should be present`);
        strictEqual(defs[expectedDef].$id, undefined, `def ${expectedDef} shouldn't have id`);
        strictEqual(defs[expectedDef].$schema, undefined, `def ${expectedDef} shouldn't have id`);
      }

      const unseenDefs = new Set(expectedDefs);
      for (const ref of findRefs(schema)) {
        const defNameMatch = /^#\/\$defs\/(\w+)$/.exec(ref);
        assert(defNameMatch !== null, "Found bad ref to def - " + ref);
        const defName = defNameMatch[1];
        unseenDefs.delete(defName);
      }

      strictEqual(
        unseenDefs.size,
        0,
        "Expected all defs to be referenced, left with " + [...unseenDefs].join(", "),
      );
    }

    function* findRefs(root: any) {
      const stack = [root];

      while (stack.length > 0) {
        const current = stack.pop();
        for (const [key, value] of Object.entries(current)) {
          if (key === "$ref") {
            yield value as string;
          } else if (typeof value === "object" && value !== null) {
            stack.push(value);
          }
        }
      }
    }
  });

  it("with emitAllModels, creates schemas for all types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model test { b: Bar }
      model Bar { }
    `,
      { emitAllModels: true },
      { emitNamespace: false },
    );

    assert.strictEqual(schemas["test.json"].$id, "test.json");
    assert.strictEqual(schemas["test.json"].$defs, undefined);
    assert.strictEqual(schemas["Bar.json"].$id, "Bar.json");
  });

  it("with emitAllRefs, creates schemas for referenced types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model test { b: Bar }
      model Bar { }
    `,
      { emitAllRefs: true },
      { emitNamespace: false },
    );

    assert.strictEqual(schemas["test.json"].$id, "test.json");
    assert.strictEqual(schemas["test.json"].$defs, undefined);
    assert.strictEqual(schemas["Bar.json"].$id, "Bar.json");
  });

  it("doesn't create duplicate defs for transitive references", async () => {
    const schemas = await emitSchema(
      `
      model A {}
      
      model B {
        refA: A;
      }
      
      @jsonSchema
      model C {
        refB: B;
      }
      
      @jsonSchema
      model D {
        refB: B;
      }
    `,
      {},
      { emitNamespace: false, emitTypes: ["C", "D"] },
    );

    const depSchemas = {
      B: {
        type: "object",
        properties: {
          refA: {
            $ref: "#/$defs/A",
          },
        },
        required: ["refA"],
      },
      A: {
        type: "object",
        properties: {},
      },
    };
    assert.deepStrictEqual(schemas["C.json"].$defs, depSchemas);
    assert.deepStrictEqual(schemas["D.json"].$defs, depSchemas);
  });

  it("doesn't include types which are not referenced, but does when getAllModels is set", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model A {}
      
      model B {}
    `,
      {},
      { emitNamespace: false, emitTypes: ["A"] },
    );

    assert(schemas["A.json"] !== undefined);
    assert(Object.keys(schemas).length === 1);

    const amSchemas = await emitSchema(
      `
      @jsonSchema
      model A {}
      
      model B {}
    `,
      { emitAllModels: true },
      { emitNamespace: false, emitTypes: ["A"] },
    );

    assert(amSchemas["A.json"] !== undefined);
    assert(amSchemas["B.json"] !== undefined);
    assert(Object.keys(amSchemas).length === 2);
  });

  it("handles circular refs among non-json schema types", async () => {
    const schemas = await emitSchema(
      `
      @jsonSchema
      model R {
        test: A;
      }
      
      model A {
        a: B;
      }
      
      model B {
        a: A;
      }
    `,
      {},
      { emitNamespace: false, emitTypes: ["R"] },
    );
    assert(schemas["R.json"] !== undefined);
    assert(Object.keys(schemas).length === 1);
    assert(Object.keys(schemas["R.json"].$defs).length === 2);
  });
});
