import { ok } from "assert";
import {
  createTestHost,
  expectDiagnostics,
  resolveVirtualPath,
  TestHost,
} from "../../testing/index.js";

describe("compiler: imports", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  function expectFileLoaded(files: { cadl?: string[]; js?: string[] }) {
    const expectFileIn = (file: string, map: Map<string, unknown>) => {
      const vFile = resolveVirtualPath(file);
      ok(
        map.has(vFile),
        [
          `Expected ${vFile} to have been loaded but not present in:`,
          ...[...map.keys()].map((x) => ` - ${x}`),
        ].join("\n")
      );
    };
    if (files.cadl) {
      for (const file of files.cadl) {
        expectFileIn(file, host.program.sourceFiles);
      }
    }
    if (files.js) {
      for (const file of files.js) {
        expectFileIn(file, host.program.jsSourceFiles);
      }
    }
  }

  it("import relative cadl file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addCadlFile(
      "main.cadl",
      `
      import "./b.cadl";
      model A extends B { }
      `
    );
    host.addCadlFile(
      "b.cadl",
      `
      model B { }
      `
    );
    await host.compile("main.cadl");
    expectFileLoaded({ cadl: ["main.cadl", "b.cadl"] });
  });

  it("import relative JS file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addCadlFile(
      "main.cadl",
      `
      import "./blue.js";

      @blue
      model A  {}
      `
    );
    await host.compile("main.cadl");
    expectFileLoaded({ cadl: ["main.cadl"], js: ["blue.js"] });
  });

  it("import relative JS file in parent folder", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addCadlFile(
      "proj/main.cadl",
      `
      import "../blue.js";

      @blue
      model A  {}
      `
    );
    await host.compile("proj/main.cadl");
    expectFileLoaded({ cadl: ["proj/main.cadl"], js: ["blue.js"] });
  });

  it("import directory with main.cadl", async () => {
    host.addCadlFile(
      "main.cadl",
      `
      import "./test";

      model A { x: C }
      `
    );
    host.addCadlFile(
      "test/main.cadl",
      `
      model C { }
      `
    );

    await host.compile("main.cadl");
    expectFileLoaded({ cadl: ["main.cadl", "test/main.cadl"] });
  });

  it("import library", async () => {
    host.addCadlFile(
      "main.cadl",
      `
      import "my-lib";

      model A { x: C }
      `
    );
    host.addCadlFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        cadlMain: "./main.cadl",
      })
    );
    host.addCadlFile(
      "node_modules/my-lib/main.cadl",
      `
      model C { }
      `
    );

    await host.compile("main.cadl");
    expectFileLoaded({ cadl: ["main.cadl", "node_modules/my-lib/main.cadl"] });
  });

  it("emit diagnostic when trying to load invalid relative file", async () => {
    host.addCadlFile(
      "main.cadl",
      `
      import "./doesnotexists";
      `
    );

    const diagnostics = await host.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "./doesnotexists"`,
    });
  });

  it("emit diagnostic when trying to load invalid library", async () => {
    host.addCadlFile(
      "main.cadl",
      `
      import "@cadl-lang/doesnotexists";
      `
    );

    const diagnostics = await host.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "@cadl-lang/doesnotexists"`,
    });
  });
});
