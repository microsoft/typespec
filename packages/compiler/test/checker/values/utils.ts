import { ok } from "assert";
import { Diagnostic, Type, Value, definePackageFlags } from "../../../src/index.js";
import { expectDiagnosticEmpty, extractCursor, mockFile, t } from "../../../src/testing/index.js";
import { Tester } from "../../tester.js";

export async function diagnoseUsage(
  code: string,
): Promise<{ diagnostics: readonly Diagnostic[]; pos: number; end?: number }> {
  let end;

  let { source, pos } = extractCursor(code);
  if (source.includes("┆")) {
    const endMatch = extractCursor(source);
    source = endMatch.source;
    end = endMatch.pos;
  }
  const diagnostics = await Tester.diagnose(source);
  return { diagnostics, pos, end };
}

export async function compileAndDiagnoseValue(
  code: string,
  other?: string,
): Promise<[Value | undefined, readonly Diagnostic[]]> {
  let called: Value | undefined;
  const diagnostics = await Tester.files({
    "dec.js": mockFile.js({
      $collect: (_: any, __: Type, value: Value) => {
        called = value;
      },
    }),
  }).diagnose(`
      import "./dec.js";

      @collect(${code})
      model Test {}

      ${other ?? ""}
      `);
  return [called, diagnostics];
}

export async function compileValue(code: string, other?: string): Promise<Value> {
  const [called, diagnostics] = await compileAndDiagnoseValue(code, other);
  expectDiagnosticEmpty(diagnostics);
  ok(called, "Decorator was not called");

  return called;
}

export async function diagnoseValue(code: string, other?: string): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileAndDiagnoseValue(code, other);
  return diagnostics;
}

export async function compileAndDiagnoseValueOrType(
  constraint: string,
  code: string,
  {
    other,
    disableDeprecatedSuppression,
  }: { other?: string; disableDeprecatedSuppression?: boolean },
): Promise<[Type | Value | undefined, readonly Diagnostic[]]> {
  const [{ Test }, diagnostics] = await Tester.files({
    "collect.js": mockFile.js({
      $collect: () => {},
      $flags: definePackageFlags({}),
    }),
  }).compileAndDiagnose(
    t.code`
      import "./collect.js";
      extern dec collect(target, value: ${constraint});

      ${disableDeprecatedSuppression ? "" : `#suppress "deprecated" "for testing"`}
      @collect(${code})
      model ${t.model("Test")} {}
      ${other ?? ""}
      `,
  );
  const dec = Test.decorators.find((x) => x.definition?.name === "@collect");
  ok(dec);

  return [dec.args[0].value, diagnostics];
}

export async function compileValueOrType(
  constraint: string,
  code: string,
  other?: string,
): Promise<Value | Type> {
  const [called, diagnostics] = await compileAndDiagnoseValueOrType(constraint, code, { other });
  expectDiagnosticEmpty(diagnostics);
  ok(called, "Decorator was not called");

  return called;
}

export async function diagnoseValueOrType(
  constraint: string,
  code: string,
  other?: string,
): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileAndDiagnoseValueOrType(constraint, code, { other });
  return diagnostics;
}
