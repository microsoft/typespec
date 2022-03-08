import { fileURLToPath, URL } from "url";
import { NodeHost } from "../../core/nodeHost.js";
import { createProgram } from "../../core/program.js";
import { createTestHost, expectDiagnosticEmpty, expectDiagnostics } from "../../testing/index.js";

const libs = ["simple"];

describe("compiler: libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        const mainFile = fileURLToPath(
          new URL(`../../../test/libraries/${lib}/main.cadl`, import.meta.url)
        );
        const program = await createProgram(NodeHost, mainFile, { noEmit: true });
        expectDiagnosticEmpty(program.diagnostics);
      });
    });
  }

  it("detects compiler version mismatches", async () => {
    const testHost = await createTestHost();
    testHost.addCadlFile("main.cadl", "");
    testHost.addJsFile("./node_modules/@cadl-lang/compiler/index.js", {});
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "compiler-version-mismatch",
      severity: "error",
      message: /Current Cadl compiler conflicts with local version/,
    });
  });
});
