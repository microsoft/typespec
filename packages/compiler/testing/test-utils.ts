import { Diagnostic, Type } from "../core/index.js";
import { CompilerOptions } from "../core/options.js";
import { TestHost } from "./types.js";

export interface TestRunner {
  compile(code: string, options?: CompilerOptions): Promise<Record<string, Type>>;
  diagnose(code: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    code: string,
    options?: CompilerOptions
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
}

export function createTestWrapper(host: TestHost, wrapper: (code: string) => string): TestRunner {
  return {
    compile: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.compile("./main.cadl", options);
    },
    diagnose: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.diagnose("./main.cadl", options);
    },
    compileAndDiagnose: (code: string, options?: CompilerOptions) => {
      host.addCadlFile("./main.cadl", wrapper(code));
      return host.compileAndDiagnose("./main.cadl", options);
    },
  };
}
