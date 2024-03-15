import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Diagnostic, Type } from "../../src/index.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

async function compileAndDiagnoseValueType(
  code: string,
  other?: string
): Promise<[Type | undefined, readonly Diagnostic[]]> {
  const host = await createTestHost();
  let called: Type | undefined;
  host.addJsFile("dec.js", {
    $collect: (context: DecoratorContext, target: Type, value: Type) => {
      called = value;
    },
  });
  host.addTypeSpecFile(
    "main.tsp",
    `
      import "./dec.js";

      @collect(${code})
      model Test {}

      ${other ?? ""}
      `
  );
  const diagnostics = await host.diagnose("main.tsp");
  return [called, diagnostics];
}

async function compileValueType(code: string, other?: string): Promise<Type> {
  const [called, diagnostics] = await compileAndDiagnoseValueType(code, other);
  expectDiagnosticEmpty(diagnostics);
  ok(called, "Decorator was not called");

  return called;
}

async function diagnoseValueType(code: string, other?: string): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileAndDiagnoseValueType(code, other);
  return diagnostics;
}

describe("object literals", () => {
  it("no properties", async () => {
    const object = await compileValueType(`#{}`);
    strictEqual(object.kind, "ObjectLiteral");
    strictEqual(object.properties.size, 0);
  });

  it("single property", async () => {
    const object = await compileValueType(`#{name: "John"}`);
    strictEqual(object.kind, "ObjectLiteral");
    strictEqual(object.properties.size, 1);
    const nameProp = object.properties.get("name");
    strictEqual(nameProp?.kind, "String");
    strictEqual(nameProp.value, "John");
  });

  it("multiple property", async () => {
    const object = await compileValueType(`#{name: "John", age: 21}`);
    strictEqual(object.kind, "ObjectLiteral");
    strictEqual(object.properties.size, 2);

    const nameProp = object.properties.get("name");
    strictEqual(nameProp?.kind, "String");
    strictEqual(nameProp.value, "John");

    const ageProp = object.properties.get("age");
    strictEqual(ageProp?.kind, "Number");
    strictEqual(ageProp.value, 21);
  });

  describe("spreading", () => {
    it("add the properties", async () => {
      const object = await compileValueType(
        `#{...Common, age: 21}`,
        `alias Common = #{ name: "John" };`
      );
      strictEqual(object.kind, "ObjectLiteral");
      strictEqual(object.properties.size, 2);

      const nameProp = object.properties.get("name");
      strictEqual(nameProp?.kind, "String");
      strictEqual(nameProp.value, "John");

      const ageProp = object.properties.get("age");
      strictEqual(ageProp?.kind, "Number");
      strictEqual(ageProp.value, 21);
    });

    it("override properties defined before if there is a name conflict", async () => {
      const object = await compileValueType(
        `#{name: "John", age: 21, ...Common, }`,
        `alias Common = #{ name: "Common" };`
      );
      strictEqual(object.kind, "ObjectLiteral");

      const nameProp = object.properties.get("name");
      strictEqual(nameProp?.kind, "String");
      strictEqual(nameProp.value, "Common");
    });

    it("override properties spread before", async () => {
      const object = await compileValueType(
        `#{...Common, name: "John", age: 21 }`,
        `alias Common = #{ name: "John" };`
      );
      strictEqual(object.kind, "ObjectLiteral");

      const nameProp = object.properties.get("name");
      strictEqual(nameProp?.kind, "String");
      strictEqual(nameProp.value, "John");
    });

    it("emit diagnostic is spreading something else than an object literal", async () => {
      const diagnostics = await diagnoseValueType(
        `#{...Common, age: 21}`,
        `alias Common = { name: "John" };`
      );
      expectDiagnostics(diagnostics, {
        code: "spread-object",
        message: "Cannot spread properties of non-object type.",
      });
    });
  });

  describe("valid property types", () => {
    it.each([
      ["String", `"John"`],
      ["Number", "21"],
      ["Boolean", "true"],
      ["ObjectLiteral", `#{nested: "foo"}`],
      ["TupleLiteral", `#["foo"]`],
    ])("%s", async (kind, type) => {
      const object = await compileValueType(`#{prop: ${type}}`);
      strictEqual(object.kind, "ObjectLiteral");
      const nameProp = object.properties.get("prop");
      strictEqual(nameProp?.kind, kind);
    });
  });

  it("emit diagnostic if referencing a non literal type", async () => {
    const diagnostics = await diagnoseValueType(`#{ prop: { thisIsAModel: true }}`);
    expectDiagnostics(diagnostics, {
      code: "not-literal",
      message: "Type must be a literal type.",
    });
  });
});

describe.only("tuple literals", () => {
  it("no values", async () => {
    const object = await compileValueType(`#[]`);
    strictEqual(object.kind, "TupleLiteral");
    strictEqual(object.values.length, 0);
  });

  it("single value", async () => {
    const object = await compileValueType(`#["John"]`);
    strictEqual(object.kind, "TupleLiteral");
    strictEqual(object.values.length, 1);
    const first = object.values[0];
    strictEqual(first.kind, "String");
    strictEqual(first.value, "John");
  });

  it("multiple property", async () => {
    const object = await compileValueType(`#["John", 21]`);
    strictEqual(object.kind, "TupleLiteral");
    strictEqual(object.values.length, 2);

    const nameProp = object.values[0];
    strictEqual(nameProp?.kind, "String");
    strictEqual(nameProp.value, "John");

    const ageProp = object.values[1];
    strictEqual(ageProp?.kind, "Number");
    strictEqual(ageProp.value, 21);
  });

  describe("valid property types", () => {
    it.each([
      ["String", `"John"`],
      ["Number", "21"],
      ["Boolean", "true"],
      ["ObjectLiteral", `#{nested: "foo"}`],
      ["TupleLiteral", `#["foo"]`],
    ])("%s", async (kind, type) => {
      const object = await compileValueType(`#[${type}]`);
      strictEqual(object.kind, "TupleLiteral");
      const nameProp = object.values[0];
      strictEqual(nameProp?.kind, kind);
    });
  });

  it("emit diagnostic if referencing a non literal type", async () => {
    const diagnostics = await diagnoseValueType(`#[{ thisIsAModel: true }]`);
    expectDiagnostics(diagnostics, {
      code: "not-literal",
      message: "Type must be a literal type.",
    });
  });
});
