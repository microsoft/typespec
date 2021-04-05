import { strictEqual, ok } from "assert";
import { ModelType, NamespaceType, Type } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("loader", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("loads ADL and JS files", async () => {
    testHost.addJsFile("blue.js", { blue() {} });
    testHost.addAdlFile(
      "a.adl",
      `
      import "./b.adl";
      import "./blue.js";

      @blue
      model A extends B, C { }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      import "./test";
      model B { }
      `
    );
    testHost.addAdlFile(
      "test/main.adl",
      `
      import "./c.adl";
      `
    );
    testHost.addAdlFile(
      "test/c.adl",
      `
      model C { }
      `
    );

    await testHost.compile("a.adl");
  });
});
