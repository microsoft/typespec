import { ok, strictEqual } from "assert";
import { applyCodeFix as applyCodeFixReal } from "../core/code-fixes.js";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { createLinterRuleContext } from "../core/linter.js";
import { navigateProgram } from "../core/semantic-walker.js";
import {
  CodeFix,
  CompilerHost,
  Diagnostic,
  DiagnosticMessages,
  Entity,
  LinterRuleDefinition,
} from "../core/types.js";
import { DiagnosticMatch, expectDiagnosticEmpty, expectDiagnostics } from "./expect.js";
import { GetMarkedEntities, TemplateWithMarkers } from "./marked-template.js";
import { resolveVirtualPath, trimBlankLines } from "./test-utils.js";
import { BasicTestRunner, TestCompileResult, TesterInstance } from "./types.js";

export interface LinterRuleTester {
  expect<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
  ): LinterRuleTestExpect<GetMarkedEntities<T>>;
}

export interface LinterRuleTestExpect<T extends Record<string, Entity> = any> {
  toBeValid(): Promise<void>;
  toEmitDiagnostics(
    diagnostics:
      | DiagnosticMatch
      | DiagnosticMatch[]
      | ((res: TestCompileResult<T>) => DiagnosticMatch | DiagnosticMatch[]),
  ): Promise<void>;
  applyCodeFix(codeFixId: string): ApplyCodeFixExpect;
}

export interface ApplyCodeFixExpect {
  /**
   * Assert the content of the file(s) after the code fix is applied.
   * @param code Expected content. Pass a `string` for single-file assertions (main.tsp),
   * or a `Record<string, string>` to assert on specific files (partial match — only the
   * specified files are checked).
   *
   * @example Single file
   *
   * ```ts
   * await ruleTester
   *   .expect(`model Foo { name: string; }`)
   *   .applyCodeFix("rename-model")
   *   .toEqual(`model Bar { name: string; }`);
   * ```
   *
   * @example Multiple files (e.g. code fix writes augment decorators to a separate file)
   *
   * ```ts
   * await ruleTester
   *   .expect({
   *     "main.tsp": `import "./client.tsp";\nmodel Foo { name: string; }`,
   *     "client.tsp": ``,
   *   })
   *   .applyCodeFix("add-client-override")
   *   .toEqual({
   *     "client.tsp": `@@override(Foo.name, "clientName");\n`,
   *   });
   * ```
   */
  toEqual(code: string | Record<string, string>): Promise<void>;
}

export function createLinterRuleTester(
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  runner: BasicTestRunner | TesterInstance,
  ruleDef: LinterRuleDefinition<string, DiagnosticMessages>,
  libraryName: string,
): LinterRuleTester {
  return {
    expect,
  };

  function expect<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(code: T): LinterRuleTestExpect<GetMarkedEntities<T>> {
    return {
      toBeValid,
      toEmitDiagnostics,
      applyCodeFix,
    };

    async function toBeValid() {
      const [_, diagnostics] = await compileAndDiagnose(code);
      expectDiagnosticEmpty(diagnostics);
    }

    async function toEmitDiagnostics(
      match:
        | DiagnosticMatch
        | DiagnosticMatch[]
        | ((res: TestCompileResult<any>) => DiagnosticMatch | DiagnosticMatch[]),
    ) {
      const [result, diagnostics] = await compileAndDiagnose(code);
      let expected;
      if (typeof match === "function") {
        if ("autoCodeOffset" in runner) {
          throw new Error(
            ".toEmitDiagnostics with a function match can only be used with a TesterInstance",
          );
        }
        expected = match(result);
      } else {
        expected = match;
      }
      expectDiagnostics(diagnostics, expected);
    }

    function applyCodeFix(fixId: string) {
      return { toEqual };

      async function toEqual(expectedCode: string | Record<string, string>) {
        const [_, diagnostics] = await compileAndDiagnose(code);
        const codefix = diagnostics[0].codefixes?.find((x) => x.id === fixId);
        ok(codefix, `Codefix with id "${fixId}" not found.`);

        if (typeof expectedCode === "string") {
          await assertSingleFileCodeFix(codefix, expectedCode);
        } else {
          await assertMultiFileCodeFix(codefix, expectedCode);
        }
      }

      async function assertSingleFileCodeFix(codefix: CodeFix, expectedCode: string) {
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
        const offset = fs.get(resolveVirtualPath("./main.tsp"))?.indexOf(code as any);
        strictEqual(trimBlankLines(content.slice(offset)), trimBlankLines(expectedCode));
      }

      async function assertMultiFileCodeFix(
        codefix: CodeFix,
        expectedFiles: Record<string, string>,
      ) {
        const writtenFiles = new Map<string, string>();
        const host: CompilerHost = {
          ...runner.program.host,
          writeFile: (name, newContent) => {
            writtenFiles.set(name, newContent);
            return Promise.resolve();
          },
        };
        await applyCodeFixReal(host, codefix);

        ok(writtenFiles.size > 0, "No content was written to the host.");
        const fs = "keys" in runner.fs ? runner.fs : runner.fs.fs;
        for (const [filename, expected] of Object.entries(expectedFiles)) {
          const virtualPath = resolveVirtualPath(filename);
          const written = writtenFiles.get(virtualPath);
          ok(
            written !== undefined,
            `Expected file "${filename}" to be written by the code fix but it was not. Written files: ${[...writtenFiles.keys()].join(", ")}`,
          );
          const inputCode =
            typeof code === "string" ? code : (code as Record<string, any>)[filename];
          const originalContent = fs.get(virtualPath);
          const offset =
            typeof inputCode === "string" && originalContent
              ? originalContent.indexOf(inputCode)
              : undefined;
          const actual = offset !== undefined && offset >= 0 ? written.slice(offset) : written;
          strictEqual(trimBlankLines(actual), trimBlankLines(expected));
        }
      }
    }
  }

  async function compileAndDiagnose<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
  ): Promise<[TestCompileResult<GetMarkedEntities<T>> | undefined, readonly Diagnostic[]]> {
    const compilerOptions = { parseOptions: { comments: true } };
    let res;
    let codeDiagnostics;
    if (isLegacyTestRunner(runner)) {
      if (typeof code !== "string") {
        throw new Error(
          "Only string code is supported with BasicTestRunner. Use Tester.createInstance()",
        );
      }
      codeDiagnostics = await runner.diagnose(code, compilerOptions);
    } else {
      [res, codeDiagnostics] = await runner.compileAndDiagnose(code, { compilerOptions });
    }

    expectDiagnosticEmpty(codeDiagnostics);

    const diagnostics = createDiagnosticCollector();
    const rule = { ...ruleDef, id: `${libraryName}/${ruleDef.name}` };
    const context = createLinterRuleContext(
      runner.program,
      rule,
      rule.defaultOptions ?? ({} as any),
      diagnostics,
    );
    const listener = ruleDef.create(context);
    navigateProgram(runner.program, listener);
    if (listener.exit) {
      await listener.exit(runner.program);
    }
    // No diagnostics should have been reported to the program. If it happened the rule is calling reportDiagnostic directly and should NOT be doing that.
    expectDiagnosticEmpty(runner.program.diagnostics);
    return [res, diagnostics.diagnostics];
  }
}

// eslint-disable-next-line @typescript-eslint/no-deprecated
function isLegacyTestRunner(tester: BasicTestRunner | TesterInstance): tester is BasicTestRunner {
  return "autoCodeOffset" in tester;
}
