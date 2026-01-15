import { describe, expect, it } from "vitest";
import { resolveVirtualPath } from "../../../compiler/src/testing/fs.js";
import { Tester } from "../../test/test-host.js";
import { removeVersionFromSpec } from "./patch.js";

async function removeVersion(code: string, version: string) {
  const { program, pos, fs } = await Tester.compile(code);
  await removeVersionFromSpec(program, version);
  return { content: fs.fs.get(resolveVirtualPath("main.tsp"))!, pos };
}

async function removeTestVersion(code: string) {
  const { content, pos } = await removeVersion(
    `
    @service
    @versioned(Versions)
    namespace MyService;

    enum Versions { v1, v2, v3, v4 }
    /*pos:codeStart*/${code}
  `,
    "v2",
  );

  return content.substring(pos["pos:codeStart"].pos).trim();
}

describe("replace removed version with the next one", () => {
  it("@added", async () => {
    const result = await removeTestVersion(`
    @added(Versions.v2) model Foo {}
  `);
    expect(result).toEqual(`@added(Versions.v3) model Foo {}`);
  });

  it("@removed", async () => {
    const result = await removeTestVersion(`
    @removed(Versions.v2) model Foo {}
  `);
    expect(result).toEqual(`@removed(Versions.v3) model Foo {}`);
  });

  it("@renamedFrom", async () => {
    const result = await removeTestVersion(`
    @renamedFrom(Versions.v2, "Bar") model Foo {}
  `);
    expect(result).toEqual(`@renamedFrom(Versions.v3, "Bar") model Foo {}`);
  });

  it("@madeOptional", async () => {
    const result = await removeTestVersion(`
    model Foo { @madeOptional(Versions.v2) prop?: string; }
  `);
    expect(result).toEqual(`model Foo { @madeOptional(Versions.v3) prop?: string; }`);
  });

  it("@madeRequired", async () => {
    const result = await removeTestVersion(`
    model Foo { @madeRequired(Versions.v2) prop: string; }
  `);
    expect(result).toEqual(`model Foo { @madeRequired(Versions.v3) prop: string; }`);
  });

  it("@typeChangedFrom", async () => {
    const result = await removeTestVersion(`
    model Foo { @typeChangedFrom(Versions.v2, int32) prop: string; }
  `);
    expect(result).toEqual(`model Foo { @typeChangedFrom(Versions.v3, int32) prop: string; }`);
  });

  it("@returnTypeChangedFrom", async () => {
    const result = await removeTestVersion(`
    @returnTypeChangedFrom(Versions.v2, void) op foo(): string;
  `);
    expect(result).toEqual(`@returnTypeChangedFrom(Versions.v3, void) op foo(): string;`);
  });
});

it("doesn't replace when the version doesn't match", async () => {
  const result = await removeTestVersion(`
    @added(Versions.v1) model Foo {}
  `);
  expect(result).toEqual(`@added(Versions.v1) model Foo {}`);
});

describe("it removes types if it was removed in the newTarget version", () => {
  it("model", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) model Foo {}
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });
  it("enum", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) enum Foo { A, B }
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });
  it("op", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) op Foo(): void;
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });

  it("model property", async () => {
    const result = await removeTestVersion(`
      model Foo {
        @added(Versions.v2) @removed(Versions.v3) prop: string;
        other: string;
      }
    `);
    expect(result).toEqual(`model Foo {
        other: string;
      }`);
  });

  it("enum member", async () => {
    const result = await removeTestVersion(`
      enum Foo {
        @added(Versions.v2) @removed(Versions.v3) A,
        B,
      }
    `);
    expect(result).toEqual(`enum Foo {
        B,
      }`);
  });

  it("union", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) union Foo { a: string, b: int32 }
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });

  it("union variant", async () => {
    const result = await removeTestVersion(`
      union Foo {
        @added(Versions.v2) @removed(Versions.v3) a: string,
        b: int32,
      }
    `);
    expect(result).toEqual(`union Foo {
        b: int32,
      }`);
  });

  it("scalar", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) scalar Foo extends string;
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });

  it("interface", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v2) @removed(Versions.v3) interface Foo { op test(): void; }
      model Bar {}
    `);
    expect(result).toEqual(`model Bar {}`);
  });
});

describe("it removes `@removed` and `@added` when @removed is fast-forwarded to @added version", () => {
  it("added before removed", async () => {
    const result = await removeTestVersion(`
      @added(Versions.v3) @removed(Versions.v2) model Foo {}
    `);
    expect(result).toEqual(`model Foo {}`);
  });
  it("added after removed", async () => {
    const result = await removeTestVersion(`
      @removed(Versions.v2) @added(Versions.v3) model Foo {}
    `);
    expect(result).toEqual(`model Foo {}`);
  });
  it("other decorator in between", async () => {
    const result = await removeTestVersion(`
      @removed(Versions.v2) @doc("Abc") @added(Versions.v3) model Foo {}
    `);
    expect(result).toEqual(`@doc("Abc")  model Foo {}`);
  });
});
