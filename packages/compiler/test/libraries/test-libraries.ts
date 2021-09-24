import { match, strictEqual } from "assert";
import { fileURLToPath, URL } from "url";
import { createProgram } from "../../core/program.js";
import { NodeHost } from "../../core/util.js";
import { createTestHost } from "../test-host.js";

const libs = ["simple"];

describe("cadl: libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        try {
          const mainFile = fileURLToPath(
            new URL(`../../../test/libraries/${lib}/main.cadl`, import.meta.url)
          );
          await createProgram(NodeHost, mainFile, { noEmit: true });
        } catch (e) {
          console.error(e.diagnostics);
          throw e;
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
