import { match, strictEqual } from "assert";
import { fileURLToPath, URL } from "url";
import { formatDiagnostic } from "../../core/diagnostics.js";
import { createProgram } from "../../core/program.js";
import { NodeHost } from "../../core/util.js";
import { createTestHost } from "../test-host.js";

const libs = ["simple"];

describe("compiler: libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        const mainFile = fileURLToPath(
          new URL(`../../../test/libraries/${lib}/main.cadl`, import.meta.url)
        );
        const program = await createProgram(NodeHost, mainFile, { noEmit: true });
        if (program.diagnostics.length > 0) {
          let message =
            "Unexpected diagnostics:\n" + program.diagnostics.map(formatDiagnostic).join("\n");
          throw new Error(message);
        }
      });
    });
  }

  it("detects compiler version mismatches", async () => {
    const testHost = await createTestHost();
    testHost.addCadlFile("main.cadl", "");
    testHost.addJsFile("./node_modules/@cadl-lang/compiler/index.js", "");
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].severity, "error");
    match(diagnostics[0].message, /Current Cadl compiler conflicts with local version/);
  });
});
