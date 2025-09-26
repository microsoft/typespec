import { assert, describe, expect, it } from "vitest";
import { Model } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { $ } from "../../src/typekit/index.js";
import { getAssignables, getTypes } from "./utils.js";

describe("isAssignableTo", () => {
  it("validates against Type", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    // Can't actually assign a value to a type.
    expect(tk.value.isAssignableTo(tk.value.create("foo"), tk.builtin.string)).toBe(false);
  });

  it("validates against Value", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    // Can't actually assign a value to a value.
    expect(tk.value.isAssignableTo(tk.value.create("foo"), tk.value.create("foo") as any)).toBe(
      false,
    );
  });

  it("validates against MixedParameterConstraint", async () => {
    const { targetProp, program } = await getAssignables({ target: "valueof string" });
    expect(targetProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    expect(tk.value.isAssignableTo(tk.value.create("foo"), targetProp)).toBe(true);
    expect(tk.value.isAssignableTo(tk.value.create(123), targetProp)).toBe(false);
  });

  it("validates against Indeterminate", async () => {
    const {
      program,
      types: { Instance },
    } = await getAssignables({
      code: `
        model Template<A extends string> { field: A }
        @test model Instance is Template<"foo">;
      `,
    });
    const indeterminate = (Instance as Model).sourceModels[0].model!.templateMapper!.args[0];
    expect(indeterminate.entityKind).toBe("Indeterminate");

    const tk = $(program);
    // Can't actually assign a value to an indeterminate.
    expect(tk.value.isAssignableTo(tk.value.create("foo"), indeterminate)).toBe(false);
  });

  it("emits diagnostic when assigning incompatible values", async () => {
    const { targetProp, program } = await getAssignables({ target: "valueof string" });
    expect(targetProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    const invalidTest = tk.value.isAssignableTo.withDiagnostics(tk.value.create(123), targetProp);
    expect(invalidTest[0]).toBe(false);
    expectDiagnostics(invalidTest[1], { code: "unassignable" });
    const validTest = tk.value.isAssignableTo.withDiagnostics(tk.value.create("foo"), targetProp);
    expect(validTest[0]).toBe(true);
    expectDiagnosticEmpty(validTest[1]);
  });
});

describe("resolve", () => {
  it("resolves to the value type", async () => {
    const {
      context: { program },
    } = await getTypes(
      `
        const stringConstant = "hello";
        const aliasedConstant = stringConstant;
        enum Foo { one: 1, two: 2 }
        const fooOne = Foo.one;
        alias confused = "what am I?";
      `,
      [],
    );

    const tk = $(program);
    const stringConstant = tk.value.resolve("stringConstant");
    assert(tk.value.isString(stringConstant!));
    expect(stringConstant.value).toBe("hello");

    const aliasedConstant = tk.value.resolve("aliasedConstant", "StringValue");
    assert(tk.value.isString(aliasedConstant!));
    expect(aliasedConstant.value).toBe("hello");

    const enumValue = tk.value.resolve("fooOne", "EnumValue");
    expect(tk.enumMember.is(enumValue!.value)).toBe(true);

    // Not actually a value
    const confusedValue = tk.value.resolve("confused");
    expect(confusedValue).toBeUndefined();
  });

  it("throws an error for incorrect kind assertion", async () => {
    const {
      context: { program },
    } = await getTypes(
      `
        const stringConstant = "hello";
      `,
      [],
    );

    const tk = $(program);
    expect(() => tk.value.resolve("stringConstant", "BooleanValue")).toThrow(
      "Value kind mismatch: expected BooleanValue, got StringValue",
    );
  });

  it("returns undefined and diagnostics for invalid references", async () => {
    const {
      context: { program },
    } = await getTypes(``, []);

    const tk = $(program);
    const [unknownValue, diagnostics] = tk.value.resolve.withDiagnostics("unknownValue");
    expect(unknownValue).toBeUndefined();
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
    });
  });
});

it("'is' checks whether entity is a Value", async () => {
  const { sourceProp, program } = await getAssignables({ source: '"foo"' });

  const tk = $(program);
  // true cases
  expect(tk.value.is(tk.value.create("foo"))).toBe(true);
  expect(tk.value.is(tk.value.create(123))).toBe(true);
  expect(tk.value.is(tk.value.create(false))).toBe(true);

  // false cases
  expect(tk.value.is(sourceProp)).toBe(false);
  expect(tk.value.is(tk.literal.create("foo"))).toBe(false);
});
