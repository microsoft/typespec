import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("compiler: imports", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("import relative cadl file", async () => {
    testHost.addJsFile("blue.js", { $blue() {} });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./b.cadl";
      model A extends B { }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      model B { }
      `
    );
    await testHost.compile("main.cadl");
  });

  it("import relative JS file", async () => {
    testHost.addJsFile("blue.js", { $blue() {} });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./blue.js";

      @blue
      model A  {}
      `
    );
    await testHost.compile("main.cadl");
  });

  it("import directory with main.cadl", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./test";

      model A { x: C }
      `
    );
    testHost.addCadlFile(
      "test/main.cadl",
      `
      model C { }
      `
    );

    await testHost.compile("main.cadl");
  });

  it("import library", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "my-lib";

      model A { x: C }
      `
    );
    testHost.addCadlFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        cadlMain: "./main.cadl",
      })
    );
    testHost.addCadlFile(
      "node_modules/my-lib/main.cadl",
      `
      model C { }
      `
    );

    await testHost.compile("main.cadl");
  });

  it("emit diagnostic when trying to load invalid relative file", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./doesnotexists";
      `
    );

    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "./doesnotexists"`,
    });
  });

  it("emit diagnostic when trying to load invalid library", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "@cadl-lang/doesnotexists";
      `
    );

    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "@cadl-lang/doesnotexists"`,
    });
  });
});
