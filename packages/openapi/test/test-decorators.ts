import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual } from "assert";
import { getExtensions } from "../src/decorators.js";
import { createOpenAPITestRunner } from "./test-host.js";

describe("openapi: decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createOpenAPITestRunner();
  });

  describe("@operationId", () => {
    it("emit diagnostic if use on non operation", async () => {
      const diagnostics = await runner.diagnose(`
        @operationId("foo")
        model Foo {
          
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/openapi/decorator-wrong-type",
        message: "Cannot use @operationId on a Model",
      });
    });
  });

  describe("@extension", () => {
    it("apply extension on model", async () => {
      const { Foo } = await runner.compile(`
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
