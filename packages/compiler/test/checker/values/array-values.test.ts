import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/index.js";
import { compileValueType, diagnoseUsage, diagnoseValueType } from "./utils.js";

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
    message: "{ thisIsAModel: true } refers to a type, but is being used as a value here.",
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

describe("(LEGACY) case tuple to array value", () => {
  it("cast the value", async () => {
    const value = await compileValueType(
      "a",
      `
        #suppress "deprecated" "for testing"
        const a: string[] = ["foo", "bar"];`
    );

    strictEqual(value.valueKind, "ArrayValue");
    expect(value.values).toHaveLength(2);
    strictEqual(value.values[0].valueKind, "StringValue");
    strictEqual(value.values[0].value, "foo");
    strictEqual(value.values[1].valueKind, "StringValue");
    strictEqual(value.values[1].value, "bar");
  });
  it("emit a warning diagnostic", async () => {
    const { diagnostics, pos } = await diagnoseUsage(`
    const a: string[] = ┆["foo"];
  `);

    expectDiagnostics(diagnostics, {
      code: "deprecated",
      message:
        "Deprecated: Using a tuple as a value is deprecated. Use a tuple literal instead(with #[]).",
      pos,
    });
  });
});
