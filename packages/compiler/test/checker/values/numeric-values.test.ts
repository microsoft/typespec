import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../../src/testing/expect.js";
import { compileValueType, diagnoseUsage } from "./utils.js";

const numericScalars = [
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
];

describe("instantiate with constructor", () => {
  it.each(numericScalars)("%s", async (scalarName) => {
    const value = await compileValueType(`${scalarName}(123)`);
    strictEqual(value.valueKind, "NumericValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, scalarName);
    strictEqual(value.scalar?.name, scalarName);
    strictEqual(value.value.asNumber(), 123);
  });
});

describe("instantiate from implicit const type", () => {
  it.each(numericScalars)("%s", async (scalarName) => {
    const value = await compileValueType(`a`, `const a:${scalarName} = 123;`);
    strictEqual(value.valueKind, "NumericValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, scalarName);
    strictEqual(value.scalar?.name, scalarName);
    strictEqual(value.value.asNumber(), 123);
  });
});

describe("validate numeric literal is assignable", () => {
  const cases: Array<[string, Array<["✔" | "✘", string]>]> = [
    // signed integers
    [
      "int8",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✘", "128"],
        ["✘", "-129"],
        ["✘", "1234"],
        ["✘", "-1234"],
      ],
    ],
    [
      "int16",
      [
        ["✔", "0"],
        ["✔", "31489"],
        ["✔", "-31489"],
        ["✘", "32768"],
        ["✘", "33489"],
        ["✘", "-32769"],
        ["✘", "-33489"],
      ],
    ],
    [
      "int32",
      [
        ["✔", "-2147483648"],
        ["✔", "2147483647"],
        ["✘", "2147483648"],
        ["✘", "-2147483649"],
      ],
    ],
    [
      "int64",
      [
        ["✔", "0"],
        ["✔", "-9223372036854775808"],
        ["✔", "9223372036854775807"],
        ["✘", "-9223372036854775809"],
        ["✘", "9223372036854775808"],
      ],
    ],
    [
      "integer",
      [
        ["✔", "0"],
        ["✔", "-9223372036854775808"],
        ["✔", "9223372036854775807"],
        ["✔", "-9223372036854775809"],
        ["✔", "9223372036854775808"],
      ],
    ],
    // unsigned integers
    [
      "uint8",
      [
        ["✔", "0"],
        ["✔", "128"],
        ["✔", "255"],
        ["✘", "256"],
        ["✘", "-0"],
        ["✘", "-1"],
      ],
    ],
    [
      "uint16",
      [
        ["✔", "0"],
        ["✔", "65535"],
        ["✘", "65536"],
        ["✘", "-0"],
        ["✘", "-1"],
      ],
    ],
    [
      "uint32",
      [
        ["✔", "0"],
        ["✔", "4294967295"],
        ["✘", "42949672956"],
        ["✘", "-0"],
        ["✘", "-1"],
      ],
    ],
    [
      "uint64",
      [
        ["✔", "0"],
        ["✔", "18446744073709551615"],
        ["✘", "18446744073709551616"],
        ["✘", "-0"],
        ["✘", "-1"],
      ],
    ],
    // floats
    [
      "float32",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✘", "3.4e40"],
        ["✘", "-3.4e40"],
      ],
    ],
    [
      "float64",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✘", "3.4e309"],
        ["✘", "-3.4e309"],
      ],
    ],
    [
      "float",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✔", "3.4e309"],
        ["✔", "-3.4e309"],
      ],
    ],
    // decimal
    [
      "decimal128",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✔", "3.4e309"],
        ["✔", "-3.4e309"],
      ],
    ],
    [
      "decimal",
      [
        ["✔", "0"],
        ["✔", "123"],
        ["✔", "-123"],
        ["✔", "127"],
        ["✔", "-128"],
        ["✔", "3.4e309"],
        ["✔", "-3.4e309"],
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
    // ["uint8", "int16"], https://github.com/microsoft/typespec/issues/3156
    // ["uint8", "int32"],
    // ["uint8", "int64"],
    ["uint8", "integer"],
    ["uint8", "numeric"],
    // int32
    ["int32", "int32"],
    ["int32", "int64"],
    ["int32", "integer"],
    ["int32", "numeric"],
    // uint32
    // ["uint32", "int64"],
    ["uint32", "integer"],
    ["uint32", "numeric"],
  ])("%s → %s", async (a, b) => {
    const value = await compileValueType(`${b}(${a}(123))`);
    strictEqual(value.valueKind, "NumericValue");
    strictEqual(value.scalar?.name, b);
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, b);
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
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "int4");
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
