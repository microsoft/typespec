import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Diagnostic, Type, Value } from "../../src/index.js";
import {
  createTestHost,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../src/testing/index.js";

async function diagnoseUsage(
  code: string
): Promise<{ diagnostics: readonly Diagnostic[]; pos: number }> {
  const runner = await createTestRunner();
  const { source, pos } = extractCursor(code);
  const diagnostics = await runner.diagnose(source);
  return { diagnostics, pos };
}

async function compileAndDiagnoseValueType(
  code: string,
  other?: string
): Promise<[Value | undefined, readonly Diagnostic[]]> {
  const host = await createTestHost();
  let called: Value | undefined;
  host.addJsFile("dec.js", {
    $collect: (context: DecoratorContext, target: Type, value: Value) => {
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

async function compileValueType(code: string, other?: string): Promise<Value> {
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
      ["EnumMember", "Direction.up", "enum Direction { up, down }"],
      ["ObjectLiteral", `#{nested: "foo"}`],
      ["TupleLiteral", `#["foo"]`],
    ])("%s", async (kind, type, other?) => {
      const object = await compileValueType(`#{prop: ${type}}`, other);
      strictEqual(object.kind, "ObjectLiteral");
      const nameProp = object.properties.get("prop");
      strictEqual(nameProp?.kind, kind);
    });
  });

  it("emit diagnostic if referencing a non literal type", async () => {
    const diagnostics = await diagnoseValueType(`#{ prop: { thisIsAModel: true }}`);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "(anonymous model) refers to a type, but is being used as a value here.",
    });
  });

  describe("emit diagnostic when used in", () => {
    it("emit diagnostic when used in a model", async () => {
      const { diagnostics, pos } = await diagnoseUsage(`
        model Test {
          prop: ┆#{ name: "John" };
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "A value cannot be used as a type.",
        pos,
      });
    });

    it("emit diagnostic when used in template constraint", async () => {
      const { diagnostics, pos } = await diagnoseUsage(`
        model Test<T extends ┆#{ name: "John" }> {}
      `);
      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "A value cannot be used as a type.",
        pos,
      });
    });
  });
});

describe("tuple literals", () => {
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
      ["EnumMember", "Direction.up", "enum Direction { up, down }"],
      ["ObjectLiteral", `#{nested: "foo"}`],
      ["TupleLiteral", `#["foo"]`],
    ])("%s", async (kind, type, other?) => {
      const object = await compileValueType(`#[${type}]`, other);
      strictEqual(object.kind, "TupleLiteral");
      const nameProp = object.values[0];
      strictEqual(nameProp?.kind, kind);
    });
  });

  it("emit diagnostic if referencing a non literal type", async () => {
    const diagnostics = await diagnoseValueType(`#[{ thisIsAModel: true }]`);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "(anonymous model) refers to a type, but is being used as a value here.",
    });
  });

  describe("emit diagnostic when used in", () => {
    it("emit diagnostic when used in a model", async () => {
      const { diagnostics, pos } = await diagnoseUsage(`
        model Test {
          prop: ┆#["John"];
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "A value cannot be used as a type.",
        pos,
      });
    });

    it("emit diagnostic when used in template constraint", async () => {
      const { diagnostics, pos } = await diagnoseUsage(`
        model Test<T extends ┆#["John"]> {}
      `);
      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "A value cannot be used as a type.",
        pos,
      });
    });
  });
});
