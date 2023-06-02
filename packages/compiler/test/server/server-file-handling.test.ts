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

  it("finds main file out of workspace", async () => {
    const host = await createTestServerHost({ workspaceDir: "./work" });

    host.addTypeSpecFile(
      "./main.tsp",
      `
      import "./work/test.tsp",
      model Base {}
      `
    );

    const document = host.addOrUpdateDocument(
      "./work/test.tsp",
      `
      model Sub extends Base {}
      `
    );

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./work/test.tsp"), [], "No diagnostics expected");
  });

  it("works with standalone file", async () => {
    // NOTE: When no main.tsp is found, server uses the file itself as the
    // main file. This test stresses the main file searching loop to walk
    // all the way to root of file system.

    const host = await createTestServerHost();

    const document = host.addOrUpdateDocument(
      "./test.tsp",
      `
      model Test {}
      `
    );

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./test.tsp"), [], "No diagnostics expected");
  });
});
