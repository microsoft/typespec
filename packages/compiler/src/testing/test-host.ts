import assert from "assert";
import { globby } from "globby";
import { logDiagnostics, logVerboseTestOutput } from "../core/diagnostics.js";
import { createLogger } from "../core/logger/logger.js";
import { CompilerOptions } from "../core/options.js";
import { compile as compileProgram, Program } from "../core/program.js";
import type { Diagnostic, Type } from "../core/types.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { createTestFileSystem } from "./fs.js";
import { addTestLib, StandardTestLibrary } from "./test-compiler-host.js";
import { createTestWrapper, resolveVirtualPath } from "./test-utils.js";
import { BasicTestRunner, TestHost, TestHostConfig, TypeSpecTestLibrary } from "./types.js";

/** Use {@link createTester} */
export async function createTestHost(config: TestHostConfig = {}): Promise<TestHost> {
  const testHost = await createTestHostInternal();
  await testHost.addTypeSpecLibrary(StandardTestLibrary);
  if (config.libraries) {
    for (const library of config.libraries) {
      await testHost.addTypeSpecLibrary(library);
    }
  }
  return testHost;
}

/** Use {@link createTester} */
export async function createTestRunner(host?: TestHost): Promise<BasicTestRunner> {
  const testHost = host ?? (await createTestHost());
  return createTestWrapper(testHost);
}

async function createTestHostInternal(): Promise<TestHost> {
  let program: Program | undefined;
  const libraries: TypeSpecTestLibrary[] = [];
  const fileSystem = await createTestFileSystem();
  const testTypes = addTestLib(fileSystem);

  return {
    ...fileSystem,
    addTypeSpecLibrary: async (lib) => {
      if (lib !== StandardTestLibrary) {
        libraries.push(lib);
      }
      await fileSystem.addTypeSpecLibrary(lib);
    },
    compile,
    diagnose,
    compileAndDiagnose,
    testTypes,
    libraries,
    get program() {
      assert(
        program,
        "Program cannot be accessed without calling compile, diagnose, or compileAndDiagnose.",
      );
      return program;
    },
  };

  async function compile(main: string, options: CompilerOptions = {}) {
    const [testTypes, diagnostics] = await compileAndDiagnose(main, options);
    expectDiagnosticEmpty(diagnostics);
    return testTypes;
  }

  async function diagnose(main: string, options: CompilerOptions = {}) {
    const [, diagnostics] = await compileAndDiagnose(main, options);
    return diagnostics;
  }

  async function compileAndDiagnose(
    mainFile: string,
    options: CompilerOptions = {},
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]> {
    const p = await compileProgram(fileSystem.compilerHost, resolveVirtualPath(mainFile), options);
    program = p;
    logVerboseTestOutput((log) =>
      logDiagnostics(p.diagnostics, createLogger({ sink: fileSystem.compilerHost.logSink })),
    );
    return [testTypes, p.diagnostics];
  }
}

export async function findFilesFromPattern(directory: string, pattern: string): Promise<string[]> {
  return globby(pattern, {
    cwd: directory,
    onlyFiles: true,
  });
}
