import { deepStrictEqual, strictEqual } from "assert";
import { getExtensions } from "../src/decorators.js";
import { compile, compileAndDiagnose } from "./testHost.js";

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

  describe("@useRef", () => {
    it("emit diagnostic if use on non model or model property", async () => {
      const [_, diagnostics] = await compileAndDiagnose(`
        @useRef("#/components/Schema")
        op foo(): string;
      `);

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "@cadl-lang/openapi/decorator-wrong-type");
      strictEqual(
        diagnostics[0].message,
        "useRef decorator can only be applied to models and operation parameters."
      );
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
