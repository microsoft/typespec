import { assert } from "console";
import { createTestHost, TestHost } from "../test-host.js";

describe("adl: global namespace", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  describe("it adds top level entities to the global namespace", () => {
    it("adds top-level namespaces", async () => {
      testHost.addAdlFile("main.adl", `namespace Foo {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.namespaces.get("Foo"),
        "Namespace Foo was added to global namespace type"
      );
    });

    it("adds top-level models", async () => {
      testHost.addAdlFile("main.adl", `model MyModel {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type"
      );
    });

    it("adds top-level oeprations", async () => {
      testHost.addAdlFile("main.adl", `op myOperation(): string;`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type"
      );
    });
  });

  describe("it adds top level entities used in other files to the global namespace", () => {
    beforeEach(() => {
      testHost.addAdlFile(
        "main.adl",
        `
      import "./a.adl";

      model Base {}
      `
      );
    });

    it("adds top-level namespaces", async () => {
      testHost.addAdlFile("a.adl", `namespace Foo {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.namespaces.get("Foo"),
        "Namespace Foo was added to global namespace type"
      );
      assert(
        globalNamespaceType?.namespaces.get("Base"),
        "Should still reference main file top-level entities"
      );
    });

    it("adds top-level models", async () => {
      testHost.addAdlFile("a.adl", `model MyModel {}`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type"
      );
    });

    it("adds top-level oeprations", async () => {
      testHost.addAdlFile("a.adl", `op myOperation(): string;`);

      await testHost.compile("./");

      const globalNamespaceType = testHost.program.checker?.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type"
      );
    });
  });
});
