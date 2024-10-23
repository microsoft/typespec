import assert, { notStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model } from "../../src/core/types.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";

describe("compiler: global namespace", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  describe("it adds top level entities to the global namespace", () => {
    it("adds top-level namespaces", async () => {
      testHost.addTypeSpecFile("main.tsp", `namespace Foo {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.namespaces.get("Foo"),
        "Namespace Foo was added to global namespace type",
      );
    });

    it("adds top-level models", async () => {
      testHost.addTypeSpecFile("main.tsp", `model MyModel {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type",
      );
    });

    it("adds top-level operations", async () => {
      testHost.addTypeSpecFile("main.tsp", `op myOperation(): string;`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type",
      );
    });
  });

  describe("it adds top level entities used in other files to the global namespace", () => {
    beforeEach(() => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
      import "./a.tsp";

      model Base {}
      `,
      );
    });

    it("adds top-level namespaces", async () => {
      testHost.addTypeSpecFile("a.tsp", `namespace Foo {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.namespaces.get("Foo"),
        "Namespace Foo was added to global namespace type",
      );
      assert(
        globalNamespaceType?.models.get("Base"),
        "Should still reference main file top-level entities",
      );
    });

    it("adds top-level models", async () => {
      testHost.addTypeSpecFile("a.tsp", `model MyModel {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type",
      );
    });

    it("adds top-level operations", async () => {
      testHost.addTypeSpecFile("a.tsp", `op myOperation(): string;`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type",
      );
    });
  });

  it("can override TypeSpec library things", async () => {
    testHost.addTypeSpecFile("./main.tsp", `@test model int32 { x: TypeSpec.int32 }`);

    const { int32 } = (await testHost.compile("./")) as { int32: Model };
    notStrictEqual(int32, int32.properties.get("x")!.type);
  });
});
