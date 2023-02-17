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

    host.addTypeSpecFile("./main.tsp", 'import "./common.tsp"; import "./subdir/subfile.tsp";');
    host.addTypeSpecFile("./common.tsp", "model Base {}");
    const document = host.addOrUpdateDocument("./subdir/subfile.tsp", "model Sub extends Base {}");

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./subdir/subfile.tsp"), [], "No diagnostics expected");
  });
});
