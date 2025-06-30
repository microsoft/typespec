import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getRef } from "../src/decorators.js";
import { ApiTester, SimpleTester } from "./test-host.js";

describe("openapi3: decorators", () => {
  describe("@useRef", () => {
    it("emit diagnostic if use on non model or property", async () => {
      const diagnostics = await SimpleTester.diagnose(`
        @useRef("foo")
        op foo(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @useRef decorator to foo since it is not assignable to Model | ModelProperty",
      });
    });

    it("emit diagnostic if ref is not a string", async () => {
      const diagnostics = await SimpleTester.diagnose(`
        @useRef(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("emit diagnostic if ref is not passed", async () => {
      const diagnostics = await SimpleTester.diagnose(`
        @useRef
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument-count",
          message: "Expected 1 arguments, but got 0.",
        },
      ]);
    });

    it("set external reference", async () => {
      const { Foo, program } = await ApiTester.compile(t.code`
        import "@typespec/openapi3";
        using OpenAPI;

        @useRef("../common.json#/definitions/Foo")
        model ${t.model("Foo")} {}
      `);

      strictEqual(getRef(program, Foo), "../common.json#/definitions/Foo");
    });
  });
});
