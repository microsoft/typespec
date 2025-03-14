import { setTypeSpecNamespace } from "@typespec/compiler";
import {
  BasicTestRunner,
  TestHost,
  createTestWrapper,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { createLibraryLinterTestHost } from "./test-host.js";

describe("library-linter", () => {
  let runner: BasicTestRunner;
  let host: TestHost;

  beforeEach(async () => {
    host = await createLibraryLinterTestHost();
    runner = createTestWrapper(host);
  });

  describe("missing namespace", () => {
    it("emit diagnostics when model is missing namespace", async () => {
      const diagnostics = await runner.diagnose("model Foo {}");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message: "Model 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when operation is missing namespace", async () => {
      const diagnostics = await runner.diagnose("op test(): string;");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message:
          "Operation 'test' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when interface is missing namespace", async () => {
      const diagnostics = await runner.diagnose("interface Foo {}");
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-namespace",
        message:
          "Interface 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when decorator is missing namespace", async () => {
      host.addJsFile("./mylib.js", {
        $myDec: () => null,
      });
      const diagnostics = await runner.diagnose(`
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
      host.addJsFile("dec.js", decorators);
      const diagnostics = await runner.diagnose(`import "./dec.js";`);
      expectDiagnostics(diagnostics, {
        code: "@typespec/library-linter/missing-signature",
        message: `Decorator function $foo is missing a decorator declaration. Add "extern dec foo(...args);" to the library tsp.`,
        severity: "warning",
      });
    });
  });
});
