import { Diagnostic, EventEmitter, SemanticNodeListener } from "@cadl-lang/compiler";
import {
  BasicTestRunner,
  DiagnosticMatch,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { LintRule } from "../types";

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
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    const listener = rule.create({ program: runner.program });
    for (const [name, cb] of Object.entries(listener)) {
      eventEmitter.on(name as any, cb as any);
    }

    return runner.program.diagnostics;
  }
}
