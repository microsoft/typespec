import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/index.js";
import { compileValueType, diagnoseUsage, diagnoseValueType } from "./utils.js";

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
      `const Common = #{ name: "John" };`
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
      `const Common = #{ name: "Common" };`
    );
    strictEqual(object.valueKind, "ObjectValue");

    const nameProp = object.properties.get("name")?.value;
    strictEqual(nameProp?.valueKind, "StringValue");
    strictEqual(nameProp.value, "Common");
  });

  it("override properties spread before", async () => {
    const object = await compileValueType(
      `#{...Common, name: "John", age: 21 }`,
      `const Common = #{ name: "John" };`
    );
    strictEqual(object.valueKind, "ObjectValue");

    const nameProp = object.properties.get("name")?.value;
    strictEqual(nameProp?.valueKind, "StringValue");
    strictEqual(nameProp.value, "John");
  });

  it("emit diagnostic is spreading a model", async () => {
    const diagnostics = await diagnoseValueType(
      `#{...Common, age: 21}`,
      `alias Common = { name: "John" };`
    );
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "(anonymous model) refers to a type, but is being used as a value here.",
    });
  });

  it("emit diagnostic is spreading a non-object values", async () => {
    const diagnostics = await diagnoseValueType(
      `#{...Common, age: 21}`,
      `const Common = #["abc"];`
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
    ["BooleanValue", "true"],
    ["NullValue", "null"],
    ["EnumValue", "Direction.up", "enum Direction { up, down }"],
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
