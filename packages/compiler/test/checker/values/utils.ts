import { ok } from "assert";
import { Diagnostic, Model, Type, Value, definePackageFlags } from "../../../src/index.js";
import {
  createTestHost,
  createTestRunner,
  expectDiagnosticEmpty,
  extractCursor,
} from "../../../src/testing/index.js";

export async function diagnoseUsage(
  code: string,
): Promise<{ diagnostics: readonly Diagnostic[]; pos: number; end?: number }> {
  const runner = await createTestRunner();
  let end;

  let { source, pos } = extractCursor(code);
  if (source.includes("┆")) {
    const endMatch = extractCursor(source);
    source = endMatch.source;
    end = endMatch.pos;
  }
  const diagnostics = await runner.diagnose(source);
  return { diagnostics, pos, end };
}

export async function compileAndDiagnoseValue(
  code: string,
  other?: string,
): Promise<[Value | undefined, readonly Diagnostic[]]> {
  const host = await createTestHost();
  let called: Value | undefined;
  host.addJsFile("dec.js", {
    $collect: (context: DecoratorContext, target: Type, value: Value) => {
      called = value;
    },
  });
  host.addTypeSpecFile(
    "main.tsp",
    `
      import "./dec.js";

      @collect(${code})
      model Test {}

      ${other ?? ""}
      `,
  );
  const diagnostics = await host.diagnose("main.tsp");
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
  const host = await createTestHost();
  host.addJsFile("collect.js", {
    $collect: () => {},
    $flags: definePackageFlags({ decoratorArgMarshalling: "new" }),
  });
  host.addTypeSpecFile(
    "main.tsp",
    `
      import "./collect.js";
      extern dec collect(target, value: ${constraint});

      ${disableDeprecatedSuppression ? "" : `#suppress "deprecated" "for testing"`}
      @collect(${code})
      @test model Test {}
      ${other ?? ""}
      `,
  );
  const [{ Test }, diagnostics] = (await host.compileAndDiagnose("main.tsp")) as [
    { Test: Model },
    Diagnostic[],
  ];
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
