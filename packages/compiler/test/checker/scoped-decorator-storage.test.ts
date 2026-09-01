import { beforeEach, describe, expect, it } from "vitest";
import { getAutoDecoratorValue } from "../../src/core/auto-decorator.js";
import type { CompilerOptions } from "../../src/core/options.js";
import type { Program } from "../../src/core/program.js";
import type { Scope } from "../../src/core/scope.js";
import type { Model } from "../../src/core/types.js";
import { Realm } from "../../src/experimental/realm.js";
import { createTestHost, expectDiagnosticEmpty, type TestHost } from "../../src/testing/index.js";

const features = ["auto-decorators", "scoped-decorators"];

function projectOptions(): CompilerOptions {
  return {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features,
      diagnostics: [],
      outputDir: "tsp-output",
    },
  };
}

let host: TestHost;

beforeEach(async () => {
  host = await createTestHost();
});

/** Compile `code` with a `@clientName(name: string)` auto decorator in scope. */
async function compileWithClientName(
  code: string,
): Promise<{ program: Program; Foo: Model; value: (scope?: Scope) => unknown }> {
  host.addTypeSpecFile(
    "main.tsp",
    `auto dec clientName(target: unknown, name: valueof string);
    ${code}`,
  );
  await host.compile("main.tsp", projectOptions());
  const program = host.program;
  expectDiagnosticEmpty(program.diagnostics);

  const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
  expect(Foo).toBeDefined();
  return {
    program,
    Foo,
    value: (scope?: Scope) => getAutoDecoratorValue(program, "clientName", Foo, scope)?.["name"],
  };
}

describe("resolution", () => {
  it("returns the scoped value when the scope matches", async () => {
    const { value } = await compileWithClientName(`
      @clientName("CsharpFoo") when emitter("@typespec/http-client-csharp")
      model Foo {}`);

    expect(value({ emitter: "@typespec/http-client-csharp" })).toBe("CsharpFoo");
  });

  it("returns undefined when no scope matches and there is no unscoped default", async () => {
    const { value } = await compileWithClientName(`
      @clientName("CsharpFoo") when emitter("@typespec/http-client-csharp")
      model Foo {}`);

    expect(value({ emitter: "@typespec/http-client-python" })).toBeUndefined();
  });

  it("falls back to the unscoped value when no scope matches", async () => {
    const { value } = await compileWithClientName(`
      @clientName("DefaultFoo")
      @clientName("CsharpFoo") when emitter("@typespec/http-client-csharp")
      model Foo {}`);

    expect(value({ emitter: "@typespec/http-client-python" })).toBe("DefaultFoo");
    expect(value({ emitter: "@typespec/http-client-csharp" })).toBe("CsharpFoo");
  });

  it("ignores scoped values entirely when queried without a scope", async () => {
    const { value } = await compileWithClientName(`
      @clientName("DefaultFoo")
      @clientName("CsharpFoo") when emitter("@typespec/http-client-csharp")
      model Foo {}`);

    expect(value()).toBe("DefaultFoo");
  });

  it("resolves each alternative in a '|' condition list", async () => {
    const { value } = await compileWithClientName(`
      @clientName("DotNetFoo") when emitter("@typespec/http-client-csharp") | language("csharp")
      model Foo {}`);

    expect(value({ emitter: "@typespec/http-client-csharp" })).toBe("DotNetFoo");
    expect(value({ language: "csharp" })).toBe("DotNetFoo");
    expect(value({ language: "python" })).toBeUndefined();
  });

  it("keeps independent values per dimension", async () => {
    const { value } = await compileWithClientName(`
      @clientName("CsharpFoo") when language("csharp")
      @clientName("PythonFoo") when language("python")
      model Foo {}`);

    expect(value({ language: "csharp" })).toBe("CsharpFoo");
    expect(value({ language: "python" })).toBe("PythonFoo");
  });

  it("the topmost application wins, matching unscoped last-write-wins semantics", async () => {
    // Decorators are applied bottom-up (`checkDecorators` unshifts), so the topmost
    // application is the last one to run — same as repeated unscoped auto decorators.
    const { value } = await compileWithClientName(`
      @clientName("Topmost") when language("csharp")
      @clientName("Lower") when language("csharp")
      model Foo {}`);

    expect(value({ language: "csharp" })).toBe("Topmost");
  });

  it("does not report duplicate-decorator for repeated scoped applications", async () => {
    // compileWithClientName asserts there are no diagnostics at all, which is the point:
    // several scoped applications of the same decorator are the whole feature.
    await compileWithClientName(`
      @clientName("CsharpFoo") when language("csharp")
      @clientName("PythonFoo") when language("python")
      model Foo {}`);
  });

  it("matches only when every dimension in the condition is satisfied", async () => {
    const { value } = await compileWithClientName(`
      @clientName("Scoped") when target("client")
      model Foo {}`);

    expect(value({ target: "client" })).toBe("Scoped");
    expect(value({ emitter: "client" })).toBeUndefined();
  });
});

describe("composition with realm clones", () => {
  it("resolves scoped state through a realm clone", async () => {
    const { program, Foo, value } = await compileWithClientName(`
      @clientName("CsharpFoo") when language("csharp")
      model Foo {}`);

    const realm = new Realm(program, "test");
    const clone = realm.clone(Foo);

    expect(clone).not.toBe(Foo);
    expect(
      getAutoDecoratorValue(program, "clientName", clone, { language: "csharp" })?.["name"],
    ).toBe("CsharpFoo");
    // Sanity: unscoped lookups now resolve through clones too.
    expect(value({ language: "csharp" })).toBe("CsharpFoo");
  });

  it("resolves scoped state through a chain of clones", async () => {
    const { program, Foo } = await compileWithClientName(`
      @clientName("CsharpFoo") when language("csharp")
      model Foo {}`);

    const first = new Realm(program, "first");
    const second = new Realm(program, "second");
    const clone = second.clone(first.clone(Foo));

    expect(
      getAutoDecoratorValue(program, "clientName", clone, { language: "csharp" })?.["name"],
    ).toBe("CsharpFoo");
  });
});
