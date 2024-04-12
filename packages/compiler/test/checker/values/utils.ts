import { ok } from "assert";
import { Diagnostic, Type, Value } from "../../../src/index.js";
import {
  createTestHost,
  createTestRunner,
  expectDiagnosticEmpty,
  extractCursor,
} from "../../../src/testing/index.js";

export async function diagnoseUsage(
  code: string
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

export async function compileAndDiagnoseValueType(
  code: string,
  other?: string
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
      `
  );
  const diagnostics = await host.diagnose("main.tsp");
  return [called, diagnostics];
}

export async function compileValueType(code: string, other?: string): Promise<Value> {
  const [called, diagnostics] = await compileAndDiagnoseValueType(code, other);
  expectDiagnosticEmpty(diagnostics);
  ok(called, "Decorator was not called");

  return called;
}

export async function diagnoseValueType(
  code: string,
  other?: string
): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileAndDiagnoseValueType(code, other);
  return diagnostics;
}
