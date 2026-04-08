import { setTypeSpecNamespace } from "@typespec/compiler";
import { expectDiagnostics, mockFile } from "@typespec/compiler/testing";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

describe("library-linter", () => {
  describe("missing namespace", () => {
    it("emit diagnostics when model is missing namespace", async () => {
      const diagnostics = await Tester.diagnose("model Foo {}");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message: "Model 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when operation is missing namespace", async () => {
      const diagnostics = await Tester.diagnose("op test(): string;");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message:
          "Operation 'test' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when interface is missing namespace", async () => {
      const diagnostics = await Tester.diagnose("interface Foo {}");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message:
          "Interface 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when decorator is missing namespace", async () => {
      const diagnostics = await Tester.files({
        "./mylib.js": mockFile.js({ $myDec: () => null }),
      }).diagnose(`
        import "./mylib.js";
        extern dec myDec(target: unknown);
        namespace Foo { model Bar {}}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message:
          "Decorator '@myDec' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });
  });

  describe("missing extern dec", () => {
    it("emit diagnostics when decorator is missing extern dec", async () => {
      const decorators = {
        $foo: (...args: unknown[]) => null,
      };
      setTypeSpecNamespace("Testing", decorators.$foo);
      const diagnostics = await Tester.files({
        "dec.js": mockFile.js(decorators),
      }).diagnose(`import "./dec.js";`);
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-signature",
        message: `Decorator function $foo is missing a decorator declaration. Add "extern dec foo(...args);" to the library tsp.`,
        severity: "warning",
      });
    });
  });
});
