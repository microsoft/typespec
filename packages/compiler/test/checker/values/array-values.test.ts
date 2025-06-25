import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/index.js";
import { compileValue, diagnoseUsage, diagnoseValue } from "./utils.js";

it("no values", async () => {
  const object = await compileValue(`#[]`);
  strictEqual(object.valueKind, "ArrayValue");
  strictEqual(object.values.length, 0);
});

it("single value", async () => {
  const object = await compileValue(`#["John"]`);
  strictEqual(object.valueKind, "ArrayValue");
  strictEqual(object.values.length, 1);
  const first = object.values[0];
  strictEqual(first.valueKind, "StringValue");
  strictEqual(first.value, "John");
});

it("multiple property", async () => {
  const object = await compileValue(`#["John", 21]`);
  strictEqual(object.valueKind, "ArrayValue");
  strictEqual(object.values.length, 2);

  const nameProp = object.values[0];
  strictEqual(nameProp?.valueKind, "StringValue");
  strictEqual(nameProp.value, "John");

  const ageProp = object.values[1];
  strictEqual(ageProp?.valueKind, "NumericValue");
  strictEqual(ageProp.value.asNumber(), 21);
});

describe("valid property types", () => {
  it.each([
    ["StringValue", `"John"`],
    ["NumericValue", "21"],
    ["BooleanValue", "true"],
    ["NullValue", "null"],
    ["EnumValue", "Direction.up", "enum Direction { up, down }"],
    ["ObjectValue", `#{nested: "foo"}`],
    ["ArrayValue", `#["foo"]`],
  ])("%s", async (kind, type, other?) => {
    const object = await compileValue(`#[${type}]`, other);
    strictEqual(object.valueKind, "ArrayValue");
    const nameProp = object.values[0];
    strictEqual(nameProp?.valueKind, kind);
  });
});

it("emit diagnostic if referencing a non literal type", async () => {
  const diagnostics = await diagnoseValue(`#[{ thisIsAModel: true }]`);
  expectDiagnostics(diagnostics, {
    code: "expect-value",
    message:
      "{ thisIsAModel: true } refers to a model type, but is being used as a value here. Use #{} to create an object value.",
  });
});

it("emit diagnostic when trying to use a tuple", async () => {
  const { diagnostics, pos } = await diagnoseUsage(`
    model Test<T extends valueof string[]> {}
    model Test1 is Test<┆["John"]> {}
  `);
  expectDiagnostics(diagnostics, {
    code: "expect-value",
    pos,
    message:
      "Is a tuple type, but is being used as a value here. Use #[] to create an array value.",
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
