import { ok } from "assert";
import { createTestHost, TestHost } from "../test-host.js";

describe("adl: decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can have the same name as types", async () => {
    let called = false;
    testHost.addJsFile("test.js", {
      foo() {
        called = true;
      },
    });

    testHost.addAdlFile(
      "test.adl",
      `
      import "./test.js";
      model foo { };
      @foo()
      model MyFoo { };
      `
    );

    await testHost.compile("test.adl");
    ok(called);
  });

  it("doesn't conflict with type bindings at global scope", async () => {
    testHost.addJsFile("test.js", {
      foo(_: any, __: any, t: any) {
        console.log(t);
      },
    });

    testHost.addAdlFile(
      "test.adl",
      `
      import "./test.js";

      model foo { }
      @foo(foo)
      model Bar { }
      `
    );

    await testHost.diagnose("test.adl");
  });
});
