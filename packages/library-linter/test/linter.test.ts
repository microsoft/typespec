import {
  BasicTestRunner,
  createTestWrapper,
  expectDiagnostics,
  TestHost,
} from "@cadl-lang/compiler/testing";
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
        code: "@cadl-lang/library-linter/missing-namespace",
        message: "Model 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when operation is missing namespace", async () => {
      const diagnostics = await runner.diagnose("op test(): string;");
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/library-linter/missing-namespace",
        message:
          "Operation 'test' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when interface is missing namespace", async () => {
      const diagnostics = await runner.diagnose("interface Foo {}");
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/library-linter/missing-namespace",
        message:
          "Interface 'Foo' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when js function is missing namespace", async () => {
      host.addJsFile("./mylib.js", {
        myFunc: () => null,
      });
      const diagnostics = await runner.diagnose(`
        import "./mylib.js";
        namespace Foo { model Bar {}}
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/library-linter/missing-namespace",
        message:
          "Function 'myFunc' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });

    it("emit diagnostics when decorator is missing namespace", async () => {
      host.addJsFile("./mylib.js", {
        $myDec: () => null,
      });
      const diagnostics = await runner.diagnose(`
        import "./mylib.js";
        namespace Foo { model Bar {}}
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/library-linter/missing-namespace",
        message:
          "Decorator '@myDec' is not in a namespace. This is bad practice for a published library.",
        severity: "warning",
      });
    });
  });
});
