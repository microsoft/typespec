import { Diagnostic, navigateProgram } from "@cadl-lang/compiler";
import {
  BasicTestRunner,
  DiagnosticMatch,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { LintRule } from "../types.js";

export interface RuleTester {
  expect(code: string): RuleTestExpect;
}

export interface RuleTestExpect {
  toBeValid(): Promise<void>;
  toEmitDiagnostics(diagnostics: DiagnosticMatch | DiagnosticMatch[]): Promise<void>;
}

export function createRuleTester(runner: BasicTestRunner, rule: LintRule): RuleTester {
  return {
    expect,
  };

  function expect(code: string): RuleTestExpect {
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
    await runner.diagnose(code, {
      miscOptions: { "disable-linter": true },
    });
    const listener = rule.create({ program: runner.program });
    navigateProgram(runner.program, listener);
    return runner.program.diagnostics;
  }
}
