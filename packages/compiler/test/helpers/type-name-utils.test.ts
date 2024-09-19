import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { TypeNameOptions, getTypeName } from "../../src/core/index.js";
import { createTestRunner } from "../../src/testing/test-host.js";

describe("compiler: TypeNameUtils", () => {
  async function getNameFor(code: string, options: TypeNameOptions = {}) {
    const runner = await createTestRunner();
    const { target } = await runner.compile(code);
    return getTypeName(target, options);
  }

  async function assertNameFor(code: string, name: string, options: TypeNameOptions = {}) {
    strictEqual(await getNameFor(code, options), name);
  }

  describe("Namespaces", () => {
    it("single namespace returned as its name", () =>
      assertNameFor(`@test("target") namespace Foo {}`, "Foo"));
    it("join namespace and subnamespaces", () =>
      assertNameFor(`@test("target") namespace Foo.Bar {}`, "Foo.Bar"));
    it("keeps TypeSpec as top level namespace", () =>
      assertNameFor(`@test("target") namespace TypeSpec.Foo.Bar {}`, "TypeSpec.Foo.Bar"));
    it("keeps TypeSpec as bottom level namespace", () =>
      assertNameFor(`@test("target") namespace Foo.Bar.TypeSpec {}`, "Foo.Bar.TypeSpec"));
    it("filter out some namespace with callback", () =>
      assertNameFor(`@test("target") namespace Foo.Bar.Baz {}`, "Baz", {
        namespaceFilter: (ns) => ns.name !== "Bar",
      }));
  });

  describe("scalar", () => {
    it("simple scalar", () => assertNameFor(`@test("target") scalar unreal;`, "unreal"));
    it("include namespace qualifier", () =>
      assertNameFor(`namespace Foo { @test("target") scalar unreal; }`, "Foo.unreal"));

    it("keeps TypeSpec as top level namespace", () =>
      assertNameFor(
        `namespace TypeSpec.Foo {@test("target") scalar unreal; }`,
        "TypeSpec.Foo.unreal",
      ));
    it("keeps TypeSpec as bottom level namespace", () =>
      assertNameFor(
        `namespace Foo.TypeSpec {@test("target") scalar unreal; }`,
        "Foo.TypeSpec.unreal",
      ));
  });

  describe("union", () => {
    it("simple named union", () => assertNameFor(`@test("target") union Pet {}`, "Pet"));
    it("include namespace qualifier", () =>
      assertNameFor(`namespace Foo { @test("target") union Pet {} }`, "Foo.Pet"));
  });

  describe("Standard library", () => {
    async function getNameForRef(ref: string) {
      const runner = await createTestRunner();
      await runner.compile("");
      return getTypeName(runner.program.resolveTypeReference(ref)[0]!);
    }

    it("omit the TypeSpec qualifier", async () => {
      strictEqual(await getNameForRef("TypeSpec.string"), "string");
    });

    it("omit the TypeSpec.Reflection qualifier", async () => {
      strictEqual(await getNameForRef("TypeSpec.Reflection.Operation"), "Operation");
    });
  });
});
