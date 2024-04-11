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
    strictEqual(object.valueKind, "ObjectValue");
    strictEqual(object.properties.size, 0);
  });

  it("single property", async () => {
    const object = await compileValueType(`#{name: "John"}`);
    strictEqual(object.valueKind, "ObjectValue");
    strictEqual(object.properties.size, 1);
    const nameProp = object.properties.get("name")?.value;
    strictEqual(nameProp?.valueKind, "StringValue");
    strictEqual(nameProp.value, "John");
  });

  it("multiple property", async () => {
    const object = await compileValueType(`#{name: "John", age: 21}`);
    strictEqual(object.valueKind, "ObjectValue");
    strictEqual(object.properties.size, 2);

    const nameProp = object.properties.get("name")?.value;
    strictEqual(nameProp?.valueKind, "StringValue");
    strictEqual(nameProp.value, "John");

    const ageProp = object.properties.get("age")?.value;
    strictEqual(ageProp?.valueKind, "NumericValue");
    strictEqual(ageProp.value.asNumber(), 21);
  });

  describe("spreading", () => {
    it("add the properties", async () => {
      const object = await compileValueType(
        `#{...Common, age: 21}`,
        `alias Common = #{ name: "John" };`
      );
      strictEqual(object.valueKind, "ObjectValue");
      strictEqual(object.properties.size, 2);

      const nameProp = object.properties.get("name")?.value;
      strictEqual(nameProp?.valueKind, "StringValue");
      strictEqual(nameProp.value, "John");

      const ageProp = object.properties.get("age")?.value;
      strictEqual(ageProp?.valueKind, "NumericValue");
      strictEqual(ageProp.value.asNumber(), 21);
    });

    it("override properties defined before if there is a name conflict", async () => {
      const object = await compileValueType(
        `#{name: "John", age: 21, ...Common, }`,
        `alias Common = #{ name: "Common" };`
      );
      strictEqual(object.valueKind, "ObjectValue");

      const nameProp = object.properties.get("name")?.value;
      strictEqual(nameProp?.valueKind, "StringValue");
      strictEqual(nameProp.value, "Common");
    });

    it("override properties spread before", async () => {
      const object = await compileValueType(
        `#{...Common, name: "John", age: 21 }`,
        `alias Common = #{ name: "John" };`
      );
      strictEqual(object.valueKind, "ObjectValue");

      const nameProp = object.properties.get("name")?.value;
      strictEqual(nameProp?.valueKind, "StringValue");
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
      ["StringValue", `"John"`],
      ["NumericValue", "21"],
      ["Boolean", "true"],
      ["EnumMember", "Direction.up", "enum Direction { up, down }"],
      ["ObjectValue", `#{nested: "foo"}`],
      ["ArrayValue", `#["foo"]`],
    ])("%s", async (kind, type, other?) => {
      const object = await compileValueType(`#{prop: ${type}}`, other);
      strictEqual(object.valueKind, "ObjectValue");
      const nameProp = object.properties.get("prop")?.value;
      strictEqual(nameProp?.valueKind, kind);
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
    strictEqual(object.valueKind, "ArrayValue");
    strictEqual(object.values.length, 0);
  });

  it("single value", async () => {
    const object = await compileValueType(`#["John"]`);
    strictEqual(object.valueKind, "ArrayValue");
    strictEqual(object.values.length, 1);
    const first = object.values[0];
    strictEqual(first.valueKind, "StringValue");
    strictEqual(first.value, "John");
  });

  it("multiple property", async () => {
    const object = await compileValueType(`#["John", 21]`);
    strictEqual(object.valueKind, "ArrayValue");
    strictEqual(object.values.length, 2);

    const nameProp = object.values[0];
    strictEqual(nameProp?.valueKind, "StringValue");
    strictEqual(nameProp.value, "John");

    const ageProp = object.values[1];
    strictEqual(ageProp?.valueKind, "NumericValue");
    strictEqual(ageProp.value, 21);
  });

  describe("valid property types", () => {
    it.each([
      ["StringValue", `"John"`],
      ["NumericValue", "21"],
      ["Boolean", "true"],
      ["EnumMember", "Direction.up", "enum Direction { up, down }"],
      ["ObjectValue", `#{nested: "foo"}`],
      ["ArrayValue", `#["foo"]`],
    ])("%s", async (kind, type, other?) => {
      const object = await compileValueType(`#[${type}]`, other);
      strictEqual(object.valueKind, "ArrayValue");
      const nameProp = object.values[0];
      strictEqual(nameProp?.valueKind, kind);
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

describe("numeric literals", () => {
  describe("instantiate from numeric literal", () => {
    it.each([
      "numeric",
      // Integers
      "integer",
      "int8",
      "int16",
      "int32",
      "int64",
      "safeint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      // Floats
      "float",
      "float32",
      "float64",
      // Decimals
      "decimal",
      "decimal128",
    ])("%s", async (scalarName) => {
      const value = await compileValueType(`${scalarName}(123)`);
      strictEqual(value.valueKind, "NumericValue");
      strictEqual(value.scalar?.name, scalarName);
      strictEqual(value.value.asNumber(), 123);
    });
  });

  describe("validate numeric literal is assignable", () => {
    // it.each([
    //   // numeric
    //   ["1234", "int8"],
    //   ["-12", "uint8"],
    //   ["1234", "int16"],
    //   ["-21", "uint16"],
    //   ["-12", "uint32"],
    //   ["1234", "int32"],
    //   ["-12", "uint64"],
    //   ["1234", "int64"],
    // ])("%s ⇏ %s", async (a, b) => {
    //   const { diagnostics, pos } = await diagnoseUsage(`
    //   const a = ${b}(┆${a});
    // `);
    //   expectDiagnostics(diagnostics, {
    //     code: "unassignable",
    //     message: `Type '${a}' is not assignable to type '${b}'`,
    //     pos,
    //   });
    // });
    const cases = [
      [
        "int8",
        [
          ["✔", "123"],
          ["✔", "-123"],
          ["✘", "1234"],
          ["✘", "-1234"],
        ],
      ],
    ] as const;
    describe.each(cases)("%s", (scalarName, perScalarCases) => {
      it.each(perScalarCases)("%s %s", async (pass, literal) => {
        const { diagnostics, pos } = await diagnoseUsage(`
        const a = ${scalarName}(┆${literal});
      `);
        if (pass === "✔") {
          expectDiagnosticEmpty(diagnostics);
        } else {
          expectDiagnostics(diagnostics, {
            code: "unassignable",
            message: `Type '${literal}' is not assignable to type '${scalarName}'`,
            pos,
          });
        }
      });
    });
  });

  describe("instantiate from another smaller numeric type", () => {
    it.each([
      // int8
      ["int8", "int8"],
      ["int8", "int16"],
      ["int8", "int32"],
      ["int8", "int64"],
      ["int8", "integer"],
      ["int8", "numeric"],
      // uint8
      ["uint8", "int16"],
      ["uint8", "int32"],
      ["uint8", "int64"],
      ["uint8", "integer"],
      ["uint8", "numeric"],
      // int32
      ["int32", "int32"],
      ["int32", "int64"],
      ["int32", "integer"],
      ["int32", "numeric"],
      // uint32
      ["uint32", "int64"],
      ["uint32", "integer"],
      ["uint32", "numeric"],
    ])("%s → %s", async (a, b) => {
      const value = await compileValueType(`${b}(${a}(123))`);
      strictEqual(value.valueKind, "NumericValue");
      strictEqual(value.scalar?.name, b);
      strictEqual(value.value.asNumber(), 123);
    });
  });

  describe("cannot instantiate from a larger numeric type", () => {
    it.each([
      // numeric
      ["numeric", "integer"],
      ["numeric", "int8"],
      ["numeric", "int16"],
      ["numeric", "int32"],
      ["numeric", "int64"],
      ["numeric", "safeint"],
      ["numeric", "uint8"],
      ["numeric", "uint16"],
      ["numeric", "uint32"],
      ["numeric", "uint64"],
      ["numeric", "float"],
      ["numeric", "float32"],
      ["numeric", "float64"],
      ["numeric", "decimal"],
      ["numeric", "decimal128"],

      // float32
      ["float32", "integer"],
      ["numeric", "int8"],
      ["numeric", "int16"],
      ["numeric", "int32"],
      ["numeric", "int64"],
      ["numeric", "safeint"],
      ["numeric", "uint8"],
      ["numeric", "uint16"],
      ["numeric", "uint32"],
      ["numeric", "uint64"],

      // uint8
      ["uint8", "int8"],
    ])("%s ⇏ %s", async (a, b) => {
      const { diagnostics, pos } = await diagnoseUsage(`
      const a = ${b}(┆${a}(123));
    `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: `Type '${a}' is not assignable to type '${b}'`,
        pos,
      });
    });
  });

  describe("custom numeric scalars", () => {
    it("instantiates a custom scalar", async () => {
      const value = await compileValueType(`int4(2)`, "scalar int4 extends integer;");
      strictEqual(value.valueKind, "NumericValue");
      strictEqual(value.scalar?.name, "int4");
      strictEqual(value.value.asNumber(), 2);
    });

    it("validate value is valid using @minValue and @maxValue", async () => {
      const value = await compileValueType(
        `int4(2)`,
        `@minValue(0) @maxValue(15) scalar uint4 extends integer;`
      );
      ok(false); // TODO: implement
    });
  });
});
