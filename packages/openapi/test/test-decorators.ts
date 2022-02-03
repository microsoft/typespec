import { deepStrictEqual, strictEqual } from "assert";
import { getExtensions } from "../src/decorators.js";
import { compile, compileAndDiagnose } from "./test-host.js";

describe("openapi: decorators", () => {
  describe("@operationId", () => {
    it("emit diagnostic if use on non operation", async () => {
      const [_, diagnostics] = await compileAndDiagnose(`
        @operationId("foo")
        model Foo {
          
        }
      `);

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "@cadl-lang/openapi/decorator-wrong-type");
      strictEqual(diagnostics[0].message, "Cannot use @operationId on a Model");
    });
  });

  describe("@extension", () => {
    it("apply extension on model", async () => {
      const { Foo } = await compile(`
        @extension("x-custom", "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(Foo)), { "x-custom": "Bar" });
    });
  });
});
