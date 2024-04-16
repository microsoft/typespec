import { ok, strictEqual } from "assert";
import { it } from "vitest";
import { Diagnostic, Model, Type, Value, isType, isValue } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";

export async function compileAndDiagnoseValueOrType(
  constraint: string,
  code: string,
  other?: string
): Promise<[Type | Value | undefined, readonly Diagnostic[]]> {
  const host = await createTestHost();
  host.addTypeSpecFile(
    "main.tsp",
    `
      @test model Test<T extends ${constraint}> {}
      alias Instance = Test<${code}>;

      ${other ?? ""}
      `
  );
  const [{ Test }, diagnostics] = await host.compileAndDiagnose("main.tsp");
  const arg = (Test as Model).templateMapper?.args[0];
  return [arg, diagnostics];
}

export async function compileValueOrType(
  constraint: string,
  code: string,
  other?: string
): Promise<Value | Type> {
  const [called, diagnostics] = await compileAndDiagnoseValueOrType(constraint, code, other);
  expectDiagnosticEmpty(diagnostics);
  ok(called, "Decorator was not called");

  return called;
}

export async function diagnoseValueOrType(
  constraint: string,
  code: string,
  other?: string
): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileAndDiagnoseValueOrType(constraint, code, other);
  return diagnostics;
}

it("extends valueof string returns a string value", async () => {
  const entity = await compileValueOrType("valueof string", `"hello"`);
  ok(isValue(entity));
  strictEqual(entity.valueKind, "StringValue");
});

it("extends valueof int32 returns a numeric value", async () => {
  const entity = await compileValueOrType("valueof int32", `123`);
  ok(isValue(entity));
  strictEqual(entity.valueKind, "NumericValue");
});

it("extends string returns a string literal type", async () => {
  const entity = await compileValueOrType("string", `"hello"`);
  ok(isType(entity));
  strictEqual(entity.kind, "String");
});

it("extends int32 returns a numeric literal type", async () => {
  const entity = await compileValueOrType("int32", `123`);
  ok(isType(entity));
  strictEqual(entity.kind, "Number");
});

it("value wins over type if both are accepted", async () => {
  const entity = await compileValueOrType("(valueof string) | string", `"hello"`);
  ok(isValue(entity));
  strictEqual(entity.valueKind, "StringValue");
});

it("ambiguous valueof with type option still emit ambiguous error", async () => {
  const diagnostics = await diagnoseValueOrType("(valueof int32 | int64) | int32", `123`);
  expectDiagnostics(diagnostics, {
    code: "ambiguous-scalar-type",
    message:
      "Value 123 type is ambiguous between int32, int64. To resolve be explicit when instantiating this value(e.g. 'int32(123)').",
  });
});
