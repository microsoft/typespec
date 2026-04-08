import assert, { notStrictEqual } from "assert";
import { describe, it } from "vitest";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: global namespace", () => {
  describe("it adds top level entities to the global namespace", () => {
    it("adds top-level namespaces", async () => {
      const { program } = await Tester.compile(`namespace Foo {}`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.namespaces.get("Foo"),
        "Namespace Foo was added to global namespace type",
      );
    });

    it("adds top-level models", async () => {
      const { program } = await Tester.compile(`model MyModel {}`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type",
      );
    });

    it("adds top-level operations", async () => {
      const { program } = await Tester.compile(`op myOperation(): string;`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type",
      );
    });
  });

  describe("it adds top level entities used in other files to the global namespace", () => {
    it("adds top-level namespaces", async () => {
      const { program } = await Tester.files({ "a.tsp": `namespace Foo {}` })
        .import("./a.tsp")
        .compile(`model Base {}`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
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
      const { program } = await Tester.files({ "a.tsp": `model MyModel {}` })
        .import("./a.tsp")
        .compile(`model Base {}`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.models.get("MyModel"),
        "model MyModel was added to global namespace type",
      );
    });

    it("adds top-level operations", async () => {
      const { program } = await Tester.files({ "a.tsp": `op myOperation(): string;` })
        .import("./a.tsp")
        .compile(`model Base {}`);

      const globalNamespaceType = program.checker.getGlobalNamespaceType();
      assert(
        globalNamespaceType?.operations.get("myOperation"),
        "operation myOperation was added to global namespace type",
      );
    });
  });

  it("can override TypeSpec library things", async () => {
    const { int32 } = await Tester.compile(t.code`model ${t.model("int32")} { x: TypeSpec.int32 }`);
    notStrictEqual(int32, int32.properties.get("x")!.type);
  });
});
