import { beforeEach, describe, expect, it } from "vitest";
import { Model } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { BasicTestRunner } from "../../src/testing/types.js";
import { $ } from "../../src/typekit/index.js";
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

describe("$.entity.resolve", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost());
  });

  it("resolve resolves existing types", async () => {
    await runner.compile("");
    const tk = $(runner.program);
    const stringType = tk.entity.resolve("TypeSpec.string");
    expect(stringType).toBeDefined();
    expect(tk.builtin.string).toBe(stringType);

    const [stringTypeDiag, diagnostics] = tk.entity.resolve.withDiagnostics("TypeSpec.string");
    expect(stringTypeDiag).toBe(stringType);
    expect(diagnostics).toHaveLength(0);
  });

  it("resolve resolves existing values", async () => {
    await runner.compile(`const stringValue = "test";`);
    const tk = $(runner.program);
    const stringValue = tk.entity.resolve("stringValue");
    expect(stringValue).toBeDefined();
    expect(tk.value.is(stringValue!)).toBe(true);

    const [stringValueDiag, diagnostics] = tk.entity.resolve.withDiagnostics("stringValue");
    expect(tk.value.is(stringValueDiag!)).toBe(true);
    expect(diagnostics).toHaveLength(0);
  });

  it("resolve returns undefined and diagnostics for invalid references", async () => {
    await runner.compile("");
    const unknownType = $(runner.program).entity.resolve("UnknownModel");
    expect(unknownType).toBeUndefined();

    const [unknownTypeDiag, diagnostics] = $(runner.program).entity.resolve.withDiagnostics(
      "UnknownModel",
    );
    expect(unknownTypeDiag).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("invalid-ref");
  });
});
