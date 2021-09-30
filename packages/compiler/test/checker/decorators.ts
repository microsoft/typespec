import { ok } from "assert";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can have the same name as types", async () => {
    let called = false;
    testHost.addJsFile("test.js", {
      $foo() {
        called = true;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";
      model foo { };
      @foo()
      model MyFoo { };
      `
    );

    await testHost.compile("test.cadl");
    ok(called);
  });

  it("doesn't conflict with type bindings at global scope", async () => {
    testHost.addJsFile("test.js", {
      $foo(_: any, __: any, t: any) {},
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      model foo { }
      @foo(foo)
      model Bar { }
      `
    );

    await testHost.diagnose("test.cadl");
  });

  it("evaluates in outside-in order", async () => {
    let result = false;
    let blueThing: any;

    testHost.addJsFile("test.js", {
      $blue(_: any, t: any) {
        blueThing = t;
      },
      $isBlue(_: any, t: any) {
        result = blueThing === t;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      @isBlue
      @blue
      model Foo { };
      `
    );

    await testHost.diagnose("test.cadl");
    ok(result, "expected Foo to be blue in isBlue decorator");
  });
});
