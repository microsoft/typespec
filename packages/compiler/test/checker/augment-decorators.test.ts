import { strictEqual } from "assert";
import { Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: checker: augment decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("run decorator without arguments", async () => {
    let blueThing: Type | undefined;

    testHost.addJsFile("test.js", {
      $blue(_: any, t: Type) {
        blueThing = t;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      @test model Foo { };

      @@blue(Foo);
      `
    );

    const { Foo } = await testHost.compile("test.cadl");
    strictEqual(Foo, blueThing);
  });

  it("run decorator with arguments", async () => {
    let customName: string | undefined;

    testHost.addJsFile("test.js", {
      $customName(_: any, t: Type, n: string) {
        customName = n;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      model Foo { };

      @@customName(Foo, "FooCustom");
      `
    );

    await testHost.compile("test.cadl");
    strictEqual(customName, "FooCustom");
  });
});
