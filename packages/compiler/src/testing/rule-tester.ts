import { ok, strictEqual } from "assert";
import { applyCodeFix as applyCodeFixReal } from "../core/code-fixes.js";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { createLinterRuleContext } from "../core/linter.js";
import { navigateProgram } from "../core/semantic-walker.js";
import {
  CompilerHost,
  Diagnostic,
  DiagnosticMessages,
  LinterRuleDefinition,
} from "../core/types.js";
import { DiagnosticMatch, expectDiagnosticEmpty, expectDiagnostics } from "./expect.js";
import { resolveVirtualPath, trimBlankLines } from "./test-utils.js";
import { BasicTestRunner, TesterInstance } from "./types.js";

export interface LinterRuleTester {
  expect(code: string): LinterRuleTestExpect;
}

export interface LinterRuleTestExpect {
  toBeValid(): Promise<void>;
  toEmitDiagnostics(diagnostics: DiagnosticMatch | DiagnosticMatch[]): Promise<void>;
  applyCodeFix(codeFixId: string): ApplyCodeFixExpect;
}

export interface ApplyCodeFixExpect {
  toEqual(code: string): Promise<void>;
}

export function createLinterRuleTester(
  runner: BasicTestRunner | TesterInstance,
  ruleDef: LinterRuleDefinition<string, DiagnosticMessages>,
  libraryName: string,
): LinterRuleTester {
  return {
    expect,
  };

  function expect(code: string): LinterRuleTestExpect {
    return {
      toBeValid,
      toEmitDiagnostics,
      applyCodeFix,
    };

    async function toBeValid() {
      const diagnostics = await diagnose(code);
      expectDiagnosticEmpty(diagnostics);
    }

    async function toEmitDiagnostics(match: DiagnosticMatch | DiagnosticMatch[]) {
      const diagnostics = await diagnose(code);
      expectDiagnostics(diagnostics, match);
    }

    function applyCodeFix(fixId: string) {
      return { toEqual };

      async function toEqual(expectedCode: string) {
        const diagnostics = await diagnose(code);
        const codefix = diagnostics[0].codefixes?.find((x) => x.id === fixId);
        ok(codefix, `Codefix with id "${fixId}" not found.`);
        let content: string | undefined;
        const host: CompilerHost = {
          ...runner.program.host,
          writeFile: (name, newContent) => {
            content = newContent;
            return Promise.resolve();
          },
        };
        await applyCodeFixReal(host, codefix);

        ok(content, "No content was written to the host.");
        const fs = "keys" in runner.fs ? runner.fs : runner.fs.fs;
        const offset = fs.get(resolveVirtualPath("./main.tsp"))?.indexOf(code);
        strictEqual(trimBlankLines(content.slice(offset)), trimBlankLines(expectedCode));
      }
    }
  }

  async function diagnose(code: string): Promise<readonly Diagnostic[]> {
    await runner.diagnose(code, { parseOptions: { comments: true } });

    const diagnostics = createDiagnosticCollector();
    const rule = { ...ruleDef, id: `${libraryName}/${ruleDef.name}` };
    const context = createLinterRuleContext(runner.program, rule, diagnostics);
    const listener = ruleDef.create(context);
    navigateProgram(runner.program, listener);
    // No diagnostics should have been reported to the program. If it happened the rule is calling reportDiagnostic directly and should NOT be doing that.
    expectDiagnosticEmpty(runner.program.diagnostics);
    return diagnostics.diagnostics;
  }
}
