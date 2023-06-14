import {
  Diagnostic,
  LinterRuleDefinition,
  createDiagnosticCollector,
  navigateProgram,
} from "@typespec/compiler";
import {
  BasicTestRunner,
  DiagnosticMatch,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { createLinterRuleContext } from "../core/linter.js";

export interface RuleTester {
  expect(code: string): RuleTestExpect;
}

export interface RuleTestExpect {
  toBeValid(): Promise<void>;
  toEmitDiagnostics(diagnostics: DiagnosticMatch | DiagnosticMatch[]): Promise<void>;
}

export function createRuleTester(
  runner: BasicTestRunner,
  ruleDef: LinterRuleDefinition<string, any>,
  libraryName: string
): RuleTester {
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
