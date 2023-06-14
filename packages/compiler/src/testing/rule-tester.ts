import {
  Diagnostic,
  DiagnosticMessages,
  LinterRuleDefinition,
  createDiagnosticCollector,
  navigateProgram,
} from "../core/index.js";
import { createLinterRuleContext } from "../core/linter.js";
import { DiagnosticMatch, expectDiagnosticEmpty, expectDiagnostics } from "./expect.js";
import { BasicTestRunner } from "./types.js";

export interface LinterRuleTester {
  expect(code: string): LinterRuleTestExpect;
}

export interface LinterRuleTestExpect {
  toBeValid(): Promise<void>;
  toEmitDiagnostics(diagnostics: DiagnosticMatch | DiagnosticMatch[]): Promise<void>;
}

export function createLinterRuleTester(
  runner: BasicTestRunner,
  ruleDef: LinterRuleDefinition<string, DiagnosticMessages>,
  libraryName: string
): LinterRuleTester {
  return {
    expect,
  };

  function expect(code: string): LinterRuleTestExpect {
    return {
      toBeValid,
      toEmitDiagnostics,
    };

    async function toBeValid() {
      const diagnostics = await diagnose(code);
      expectDiagnosticEmpty(diagnostics);
    }

    async function toEmitDiagnostics(match: DiagnosticMatch | DiagnosticMatch[]) {
      const diagnostics = await diagnose(code);
      expectDiagnostics(diagnostics, match);
    }
  }

  async function diagnose(code: string): Promise<readonly Diagnostic[]> {
    await runner.diagnose(code);

    const diagnostics = createDiagnosticCollector();
    const rule = { ...ruleDef, id: `${libraryName}:${ruleDef.name}` };
    const context = createLinterRuleContext(runner.program, rule, diagnostics);
    const listener = ruleDef.create(context);
    navigateProgram(runner.program, listener);
    // No diagnostics should have been reported to the program. If it happened the rule is calling reportDiagnostic directly and should NOT be doing that.
    expectDiagnosticEmpty(runner.program.diagnostics);
    return diagnostics.diagnostics;
  }
}
