import { Diagnostic, Program, Type } from "../core/index.js";
import { CompilerOptions } from "../core/options.js";
import { TestHost } from "./types.js";

export interface BasicTestRunner {
  readonly program: Program;
  readonly fs: Map<string, string>;

  /**
   * Compile the given code and assert no diagnostics are present.
   */
  compile(code: string, options?: CompilerOptions): Promise<Record<string, Type>>;

  /**
   * Compile the code and return the list of diagnostics.
   */
  diagnose(code: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;

  /**
   * Compile the code and return the test types as well as the list of diagnostics.
   */
  compileAndDiagnose(
    code: string,
    options?: CompilerOptions
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
}

export function createTestWrapper(
  host: TestHost,
  wrapper: (code: string) => string,
  defaultCompilerOptions?: CompilerOptions
): BasicTestRunner {
  defaultCompilerOptions ??= {};
  return {
    get program() {
      return host.program;
    },

    fs: host.fs,

    compile: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.compile("./main.cadl", { ...defaultCompilerOptions, ...options });
    },
    diagnose: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.diagnose("./main.cadl", { ...defaultCompilerOptions, ...options });
    },
    compileAndDiagnose: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.compileAndDiagnose("./main.cadl", { ...defaultCompilerOptions, ...options });
    },
  };
}
