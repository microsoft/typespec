import assert from "assert";
import { globby } from "globby";
import { logDiagnostics, logVerboseTestOutput } from "../core/diagnostics.js";
import { createLogger } from "../core/logger/logger.js";
import { CompilerOptions } from "../core/options.js";
import { compile as compileProgram, Program } from "../core/program.js";
import type { Diagnostic, StringLiteral, Type } from "../core/types.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { createTestFileSystem } from "./fs.js";
import { StandardTestLibrary } from "./test-compiler-host.js";
import { createTestWrapper, resolveVirtualPath } from "./test-utils.js";
import { BasicTestRunner, TestHost, TestHostConfig, TypeSpecTestLibrary } from "./types.js";

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

export async function createTestRunner(host?: TestHost): Promise<BasicTestRunner> {
  const testHost = host ?? (await createTestHost());
  return createTestWrapper(testHost);
}

async function createTestHostInternal(): Promise<TestHost> {
  let program: Program | undefined;
  const libraries: TypeSpecTestLibrary[] = [];
  const testTypes: Record<string, Type> = {};
  const fileSystem = await createTestFileSystem();

  // add test decorators
  fileSystem.addTypeSpecFile(".tsp/test-lib/main.tsp", 'import "./test.js";');
  fileSystem.addJsFile(".tsp/test-lib/test.js", {
    namespace: "TypeSpec",
    $test(_: any, target: Type, nameLiteral?: StringLiteral) {
      let name = nameLiteral?.value;
      if (!name) {
        if (
          target.kind === "Model" ||
          target.kind === "Scalar" ||
          target.kind === "Namespace" ||
          target.kind === "Enum" ||
          target.kind === "Operation" ||
          target.kind === "ModelProperty" ||
          target.kind === "EnumMember" ||
          target.kind === "Interface" ||
          (target.kind === "Union" && !target.expression)
        ) {
          name = target.name!;
        } else {
          throw new Error("Need to specify a name for test type");
        }
      }

      testTypes[name] = target;
    },
  });

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
