import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

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
      `,
    );

    const document = host.addOrUpdateDocument(
      "./work/test.tsp",
      `
      model Sub extends Base {}
      `,
    );

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./work/test.tsp"), [], "No diagnostics expected");
  });

  it("finds tspMain in package.json that has already been read by something else", async () => {
    const host = await createTestServerHost();

    host.addTypeSpecFile(
      "./lib/package.json",
      JSON.stringify({
        name: "test",
        version: "1.0.0",
        tspMain: "./entrypoint.tsp",
      }),
    );

    host.addTypeSpecFile(
      "./lib/entrypoint.tsp",
      `
      import "./lib1.tsp";
      import "./lib2.tsp";
      `,
    );

    host.addTypeSpecFile(
      "./lib/lib1.tsp",
      `
      model Lib1 {}
      `,
    );

    host.addTypeSpecFile(
      "./lib/lib2.tsp",
      `
      model Lib2 extends Lib1 {}
      `,
    );

    // First, open user document that loads library, reading it's
    // package.json elsewhere than where the language server main file
    // resolution happens, that caches package.json data.
    const userDoc = host.addOrUpdateDocument(
      "./test.tsp",
      `
      import "./lib";
      model User extends Lib1 {}
      `,
    );

    // Second, open a doc in the lib after that
    const libDoc = host.openDocument("./lib/lib2.tsp");

    // Neither document should have any squiggles
    await host.server.checkChange({ document: userDoc });
    deepStrictEqual(
      host.getDiagnostics("./test.tsp"),
      [],
      "No diagnostics expected in user document",
    );

    await host.server.checkChange({ document: libDoc });
    deepStrictEqual(
      host.getDiagnostics("./lib/lib2.tsp"),
      [],
      "No diagnostics expected in library document",
    );
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
      `,
    );

    await host.server.checkChange({ document });
    deepStrictEqual(host.getDiagnostics("./test.tsp"), [], "No diagnostics expected");
  });
});
