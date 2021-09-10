import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: loader", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("loads Cadl and JS files", async () => {
    testHost.addJsFile("blue.js", { $blue() {} });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./b.cadl";
      import "./blue.js";

      @blue
      model A extends B { x: C }
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      import "./test";
      model B { }
      `
    );
    testHost.addCadlFile(
      "test/main.cadl",
      `
      import "./c.cadl";
      `
    );
    testHost.addCadlFile(
      "test/c.cadl",
      `
      model C { }
      `
    );

    await testHost.compile("main.cadl");
  });
});
