import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { TypeNameOptions, getTypeName } from "../../src/index.js";
import { Tester } from "../tester.js";

describe("compiler: TypeNameUtils", () => {
  async function getNameFor(code: string, options: TypeNameOptions = {}) {
    const { target } = (await Tester.compile(code)) as any;
    return getTypeName(target, options);
  }

  async function assertNameFor(code: string, name: string, options: TypeNameOptions = {}) {
    strictEqual(await getNameFor(code, options), name);
  }

  describe("Namespaces", () => {
    it("single namespace returned as its name", () =>
      assertNameFor(`namespace /*target*/Foo {}`, "Foo"));
    it("join namespace and subnamespaces", () =>
      assertNameFor(`namespace Foo./*target*/Bar {}`, "Foo.Bar"));
    it("keeps TypeSpec as top level namespace", () =>
      assertNameFor(`namespace TypeSpec.Foo./*target*/Bar {}`, "TypeSpec.Foo.Bar"));
    it("keeps TypeSpec as bottom level namespace", () =>
      assertNameFor(`namespace Foo.Bar./*target*/TypeSpec {}`, "Foo.Bar.TypeSpec"));
    it("filter out some namespace with callback", () =>
      assertNameFor(`namespace Foo.Bar./*target*/Baz {}`, "Baz", {
        namespaceFilter: (ns) => ns.name !== "Bar",
      }));
  });

  describe("scalar", () => {
    it("simple scalar", () => assertNameFor(`scalar /*target*/unreal;`, "unreal"));
    it("include namespace qualifier", () =>
      assertNameFor(`namespace Foo { scalar /*target*/unreal; }`, "Foo.unreal"));
    it("keeps TypeSpec as top level namespace", () =>
      assertNameFor(`namespace TypeSpec.Foo { scalar /*target*/unreal; }`, "TypeSpec.Foo.unreal"));
    it("keeps TypeSpec as bottom level namespace", () =>
      assertNameFor(`namespace Foo.TypeSpec { scalar /*target*/unreal; }`, "Foo.TypeSpec.unreal"));
  });

  describe("union", () => {
    it("simple named union", () => assertNameFor(`union /*target*/Pet {}`, "Pet"));
    it("include namespace qualifier", () =>
      assertNameFor(`namespace Foo { union /*target*/Pet {} }`, "Foo.Pet"));
  });

  describe("Standard library", () => {
    it("omit the TypeSpec qualifier", async () => {
      const { program } = await Tester.compile(``);
      strictEqual(getTypeName(program.resolveTypeReference("TypeSpec.string")[0]!), "string");
    });

    it("omit the TypeSpec.Reflection qualifier", async () => {
      const { program } = await Tester.compile(``);
      strictEqual(
        getTypeName(program.resolveTypeReference("TypeSpec.Reflection.Operation")[0]!),
        "Operation",
      );
    });
  });
});
