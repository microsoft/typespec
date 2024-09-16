import { ok } from "assert";
import type { Diagnostic } from "../src/index.js";
import { expectDiagnosticEmpty } from "../src/testing/expect.js";

export interface Test<I extends unknown[], R> {
  compile(...args: I): Promise<R>;
  compileAndDiagnose(...args: I): Promise<[R | undefined, readonly Diagnostic[]]>;
  diagnose(...args: I): Promise<readonly Diagnostic[]>;
}
export function defineTest<T extends unknown[], R>(
  fn: (...args: T) => Promise<[R | undefined, readonly Diagnostic[]]>,
): Test<T, R> {
  return {
    compileAndDiagnose: fn,
    compile: async (...args) => {
      const [called, diagnostics] = await fn(...args);
      expectDiagnosticEmpty(diagnostics);
      ok(called, "Decorator was not called");

      return called;
    },
    diagnose: async (...args) => {
      const [_, diagnostics] = await fn(...args);
      return diagnostics;
    },
  };
}
