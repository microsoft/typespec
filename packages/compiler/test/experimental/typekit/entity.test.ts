import { describe, expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { Model } from "../../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../../src/testing/expect.js";
import { getAssignables } from "./utils.js";

describe("$.entity.isAssignableTo", () => {
  it("validates MixedParameterConstraint against Type", async () => {
    const { sourceProp, program } = await getAssignables({ source: "string" });
    expect(sourceProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    expect(tk.entity.isAssignableTo(sourceProp, tk.builtin.string)).toBe(true);
    expect(tk.entity.isAssignableTo(sourceProp, tk.builtin.int8)).toBe(false);
  });

  it("validates MixedParameterConstraint against Value", async () => {
    const { sourceProp, program } = await getAssignables({ source: `"foo"` });
    expect(sourceProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    // Can't actually assign to a value.
    expect(tk.entity.isAssignableTo(sourceProp, tk.value.create("foo"))).toBe(false);
  });

  it("validates MixedParameterConstraint against MixedParameterConstraint", async () => {
    const { sourceProp, targetProp, program } = await getAssignables({
      source: `"foo"`,
      target: "string",
    });
    expect(sourceProp.entityKind).toBe("MixedParameterConstraint");
    expect(targetProp.entityKind).toBe("MixedParameterConstraint");

    const tk = $(program);
    expect(tk.entity.isAssignableTo(sourceProp, targetProp)).toBe(true);
    expect(tk.entity.isAssignableTo(targetProp, sourceProp)).toBe(false);
  });

  it("validates MixedParameterConstraint against Indeterminate", async () => {
    const {
      sourceProp,
      targetProp: invalidSourceProp,
      program,
      types: { Instance },
    } = await getAssignables({
      source: `"foo"`,
      target: "string",
      code: `
        model Template<A extends string> { field: A }
        @test model Instance is Template<"foo">;
      `,
    });
    expect(sourceProp.entityKind).toBe("MixedParameterConstraint");
    const indeterminate = (Instance as Model).sourceModels[0].model!.templateMapper!.args[0];
    expect(indeterminate.entityKind).toBe("Indeterminate");

    const tk = $(program);
    expect(tk.entity.isAssignableTo(sourceProp, indeterminate)).toBe(true);
    expect(tk.entity.isAssignableTo(invalidSourceProp, indeterminate)).toBe(false);
  });

  it("validates Indeterminate against Type", async () => {
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
    expect(tk.entity.isAssignableTo(indeterminate, tk.builtin.string)).toBe(true);
    expect(tk.entity.isAssignableTo(indeterminate, tk.builtin.int8)).toBe(false);
  });

  it("validates Indeterminate against Value", async () => {
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
    // Can't actually assign to a value.
    expect(tk.entity.isAssignableTo(indeterminate, tk.value.create("foo"))).toBe(false);
  });

  it("validates Indeterminate against MixedParameterConstraint", async () => {
    const {
      sourceProp: invalidTargetProp,
      targetProp,
      program,
      types: { Instance },
    } = await getAssignables({
      target: "valueof string",
      source: "int8",
      code: `
        model Template<A extends string> { field: A }
        @test model Instance is Template<"foo">;
      `,
    });
    const indeterminate = (Instance as Model).sourceModels[0].model!.templateMapper!.args[0];
    expect(indeterminate.entityKind).toBe("Indeterminate");

    const tk = $(program);
    expect(tk.entity.isAssignableTo(indeterminate, targetProp)).toBe(true);
    expect(tk.entity.isAssignableTo(indeterminate, invalidTargetProp)).toBe(false);
  });

  it("validates Indeterminate against Indeterminate", async () => {
    const {
      program,
      types: { Instance },
    } = await getAssignables({
      target: "valueof string",
      code: `
        model Template<A extends string> { field: A }
        @test model Instance is Template<"foo">;
      `,
    });
    const indeterminate = (Instance as Model).sourceModels[0].model!.templateMapper!.args[0];
    expect(indeterminate.entityKind).toBe("Indeterminate");

    const tk = $(program);
    expect(tk.entity.isAssignableTo(indeterminate, indeterminate)).toBe(true);
  });

  it("emits diagnostic when assigning incompatible types", async () => {
    const { program } = await getAssignables({});

    const tk = $(program);
    const invalidTest = tk.entity.isAssignableTo.withDiagnostics(
      tk.literal.create("foo"),
      tk.builtin.boolean,
    );
    expect(invalidTest[0]).toBe(false);
    expectDiagnostics(invalidTest[1], { code: "unassignable" });

    const validTest = tk.entity.isAssignableTo.withDiagnostics(
      tk.literal.create("foo"),
      tk.builtin.string,
    );
    expect(validTest[0]).toBe(true);
    expectDiagnosticEmpty(validTest[1]);
  });
});
