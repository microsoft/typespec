import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/expect.js";
import { compileValue, diagnoseValue } from "./utils.js";

describe("instantiate with constructor", () => {
  it("string", async () => {
    const value = await compileValue(`string("abc")`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "string");
    strictEqual(value.scalar?.name, "string");
    strictEqual(value.value, "abc");
  });
});

describe("implicit type", () => {
  it("doesn't pick scalar if const has no type (string literal)", async () => {
    const value = await compileValue(`a`, `const a = "abc";`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.type.kind, "String");
    strictEqual(value.type.value, "abc");
    strictEqual(value.scalar, undefined);
    strictEqual(value.value, "abc");
  });
  it("doesn't pick scalar if const has no type (string template )", async () => {
    const value = await compileValue(`a`, `const a = "one ${"abc"} def";`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.type.kind, "String");
    strictEqual(value.type.value, "one abc def");
    strictEqual(value.scalar, undefined);
    strictEqual(value.value, "one abc def");
  });

  it("instantiate if there is a single string option", async () => {
    const value = await compileValue(`a`, `const a: int32 | string = "abc";`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.type.kind, "Union");
    strictEqual(value.scalar?.name, "string");
    strictEqual(value.value, "abc");
  });

  it("emit diagnostics if there is multiple numeric choices", async () => {
    const diagnostics = await diagnoseValue(
      `a`,
      `
      const a: string | myString = "abc";
      scalar myString extends string;`,
    );
    expectDiagnostics(diagnostics, {
      code: "ambiguous-scalar-type",
      message: `Value "abc" type is ambiguous between string, myString. To resolve be explicit when instantiating this value(e.g. 'string("abc")').`,
    });
  });
});

describe("string templates", () => {
  it("create string value from string template if able to serialize to string", async () => {
    const value = await compileValue(`string("one \${"abc"} def")`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "string");
    strictEqual(value.scalar?.name, "string");
    strictEqual(value.value, "one abc def");
  });

  it("interpolate another const", async () => {
    const value = await compileValue(`string("one \${a} def")`, `const a = "abc";`);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.value, "one abc def");
  });

  it("emit error if string template is not serializable to string", async () => {
    const diagnostics = await diagnoseValue(`string("one \${boolean} def")`);
    expectDiagnostics(diagnostics, {
      code: "non-literal-string-template",
      message:
        "Value interpolated in this string template cannot be converted to a string. Only literal types can be automatically interpolated.",
    });
  });

  it("emit error if string template if interpolating non serializable value", async () => {
    const diagnostics = await diagnoseValue(`string("one \${a} def")`, `const a = #{a: "foo"};`);
    expectDiagnostics(diagnostics, {
      code: "non-literal-string-template",
      message:
        "Value interpolated in this string template cannot be converted to a string. Only literal types can be automatically interpolated.",
    });
  });

  it("only emit invalid-ref error when interpolating an invalid reference, not non-literal-string-template", async () => {
    const diagnostics = await diagnoseValue(`string("Some \${bad}")`);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier bad",
    });
  });
});

describe("::name metaproperty", () => {
  const cases: Array<[string, string, string]> = [
    ["model", "M::name", `model M {}`],
    ["model property", "M.p::name", `model M { p: string; }`],
    ["enum", "E::name", `enum E { x }`],
    ["enum member", "E.x::name", `enum E { x }`],
    ["union", "U::name", `union U { a: string }`],
    ["union variant", "U.a::name", `union U { a: string }`],
    ["scalar", "S::name", `scalar S;`],
    ["interface", "I::name", `interface I {}`],
    ["operation", "o::name", `op o(): void;`],
  ];

  it.each(cases)("returns a string value for %s", async (_, expr, declaration) => {
    const value = await compileValue(expr, declaration);
    strictEqual(value.valueKind, "StringValue");
    strictEqual(value.value, expr.split("::")[0].split(".").at(-1)!);
  });
});

describe("validate literal are assignable", () => {
  const cases: Array<[string, Array<["✔" | "✘", string, string?]>]> = [
    [
      "string",
      [
        ["✔", `""`],
        ["✔", `"abc"`],
        ["✔", `"one \${"abc"} def"`],
        ["✘", `123`, "Type '123' is not assignable to type 'string'"],
      ],
    ],
    [
      `"abc"`,
      [
        ["✔", `"abc"`],
        ["✔", `"a\${"b"}c"`],
        [`✘`, `string("abc")`, `Type 'string' is not assignable to type '"abc"'`],
      ],
    ],
  ];

  describe.each(cases)("%s", (scalarName, values) => {
    it.each(values)(`%s %s`, async (expected, value, message) => {
      const diagnostics = await diagnoseValue(`a`, `const a:${scalarName} = ${value};`);
      expectDiagnostics(diagnostics, expected === "✔" ? [] : [{ message: message ?? "" }]);
    });
  });
});
