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

  function expectFileLoaded(files: { typespec?: string[]; js?: string[] }) {
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
    if (files.typespec) {
      for (const file of files.typespec) {
        expectFileIn(file, host.program.sourceFiles);
      }
    }
    if (files.js) {
      for (const file of files.js) {
        expectFileIn(file, host.program.jsSourceFiles);
      }
    }
  }

  it("import relative typespec file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      model A extends B { }
      `
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `
    );
    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "b.tsp"] });
  });

  it("import relative JS file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";

      @blue
      model A  {}
      `
    );
    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp"], js: ["blue.js"] });
  });

  it("import relative JS file in parent folder", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "proj/main.tsp",
      `
      import "../blue.js";

      @blue
      model A  {}
      `
    );
    await host.compile("proj/main.tsp");
    expectFileLoaded({ typespec: ["proj/main.tsp"], js: ["blue.js"] });
  });

  it("import directory with main.tsp", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./test";

      model A { x: C }
      `
    );
    host.addTypeSpecFile(
      "test/main.tsp",
      `
      model C { }
      `
    );

    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "test/main.tsp"] });
  });

  it("import library", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";

      model A { x: C }
      `
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        typespecMain: "./main.tsp",
      })
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      model C { }
      `
    );

    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "node_modules/my-lib/main.tsp"] });
  });

  it("emit diagnostic when trying to load invalid relative file", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./doesnotexists";
      `
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "./doesnotexists"`,
    });
  });

  it("emit diagnostic when trying to load invalid library", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "@typespec/doesnotexists";
      `
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "@typespec/doesnotexists"`,
    });
  });
});
