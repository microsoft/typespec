import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual } from "assert";
import { getExtensions, getExternalDocs } from "../src/decorators.js";
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
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @operationId decorator to Model",
      });
    });

    it("emit diagnostic if operation id is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @operationId(123)
        op foo(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
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

      deepStrictEqual(Object.fromEntries(getExtensions(runner.program, Foo)), {
        "x-custom": "Bar",
      });
    });

    it("apply extension with complex value", async () => {
      const { Foo } = await runner.compile(`
        @extension("x-custom", {foo: 123, bar: "string"})
        @test
        model Foo {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(runner.program, Foo)), {
        "x-custom": { foo: 123, bar: "string" },
      });
    });

    it("emit diagnostics when passing non string extension key", async () => {
      const diagnostics = await runner.diagnose(`
        @extension(123, "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("emit diagnostics when passing extension key not starting with `x-`", async () => {
      const diagnostics = await runner.diagnose(`
        @extension("foo", "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/openapi/invalid-extension-key",
        message: `OpenAPI extension must start with 'x-' but was 'foo'`,
      });
    });
  });

  describe("@externalDocs", () => {
    it("emit diagnostic if url is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @externalDocs(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("emit diagnostic if description is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @externalDocs("https://example.com", 123)
        model Foo {}

      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("set the external url", async () => {
      const { Foo } = await runner.compile(`
        @externalDocs("https://example.com")
        @test 
        model Foo {}
      `);

      deepStrictEqual(getExternalDocs(runner.program, Foo), { url: "https://example.com" });
    });

    it("set the external url with description", async () => {
      const { Foo } = await runner.compile(`
        @externalDocs("https://example.com", "More info there")
        @test 
        model Foo {}
      `);

      deepStrictEqual(getExternalDocs(runner.program, Foo), {
        url: "https://example.com",
        description: "More info there",
      });
    });
  });
});
