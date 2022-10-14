import { deepStrictEqual } from "assert";
import { createTestServerHost } from "../../testing/test-server-host.js";

describe("compiler: server: main file", () => {
  it("finds the main file and finds that main file imports document", async () => {
    const host = await createTestServerHost({
      // Simulate issue where realpath changes drive letter case different from VS Code.
      caseInsensitiveFileSystem: true,
      compilerHostOverrides: {
        async realpath(path) {
          return path.toUpperCase();
        },
      },
    });

    host.addCadlFile("./main.cadl", 'import "./common.cadl"; import "./subdir/subfile.cadl";');
    host.addCadlFile("./common.cadl", "model Base {}");
    const document = host.addOrUpdateDocument("./subdir/subfile.cadl", "model Sub extends Base {}");

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./subdir/subfile.cadl"), [], "No diagnostics expected");
  });
});
