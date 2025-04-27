import { readFile } from "fs/promises";
import { compilerAssert } from "../core/diagnostics.js";
import { NodeHost } from "../core/node-host.js";
import { CompilerOptions } from "../core/options.js";
import { getRelativePathFromDirectory, joinPaths, resolvePath } from "../core/path-utils.js";
import { Program, compile as coreCompile } from "../core/program.js";
import { createSourceLoader } from "../core/source-loader.js";
import { Diagnostic, NoTarget, SourceFile, Type } from "../core/types.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { StandardTestLibrary, createTestFileSystem } from "./test-host.js";
import { resolveVirtualPath } from "./test-utils.js";
import { TestFileSystem } from "./types.js";

export interface TestCompileResult {
  readonly program: Program;
  readonly types: Record<string, Type>;
}

export interface JsFileDef {
  [key: string]: string | unknown;
}

interface TestCompileOptions {
  readonly files?: Record<string, string | JsFileDef>;
  readonly options?: CompilerOptions;
}

interface Testable {
  compile(main: string, options?: TestCompileOptions): Promise<TestCompileResult>;
  diagnose(main: string, options?: TestCompileOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    main: string,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult, readonly Diagnostic[]]>;
}

// Immutable structure meant to be reused
export interface Tester extends Testable {
  // addImports(): TestHostBuilder;
  // addUsing(...names: string[]): TestHostBuilder;
  wrap(fn: (x: string) => string): Tester;
  // createHost(): TestHostV2;
}

export interface TesterInstance extends Testable {}

export function createTester(base: string, options: { libraries: string[] }): Tester {
  const fs = createTestFileSystem();
  let loaded: Promise<void> | undefined;

  return createTesterInternal({
    fs: async () => {
      await load();
      return fs;
    },
  });

  function load(): Promise<void> {
    if (loaded) return loaded;

    loaded = loadInternal();
    return loaded;

    async function loadInternal() {
      const sl = await createSourceLoader({ ...NodeHost, realpath: async (x) => x });
      const selfName = JSON.parse(await readFile(resolvePath(base, "package.json"), "utf8")).name;
      for (const lib of options.libraries) {
        await sl.importPath(lib, NoTarget, base);
      }

      await fs.addTypeSpecLibrary(StandardTestLibrary);
      fs.addTypeSpecFile(".tsp/test-lib/main.tsp", 'import "./test.js";');
      fs.addJsFile(".tsp/test-lib/test.js", {
        namespace: "TypeSpec",
        $test(_: any, target: Type) {},
      });

      function computeVirtualPath(file: SourceFile): string {
        const context = sl.resolution.locationContexts.get(file);
        compilerAssert(
          context?.type === "library",
          `Unexpected: all source files should be in a library but ${file.path} was in '${context?.type}'`,
        );
        const relativePath = getRelativePathFromDirectory(base, file.path, false);
        if (context.metadata.name === selfName) {
          return joinPaths("node_modules", selfName, relativePath);
        } else {
          return relativePath;
        }
      }

      for (const file of sl.resolution.sourceFiles.values()) {
        const relativePath = computeVirtualPath(file.file);
        fs.addTypeSpecFile(resolveVirtualPath(relativePath), file.file.text);
      }
      for (const file of sl.resolution.jsSourceFiles.values()) {
        const relativePath = computeVirtualPath(file.file);
        fs.addJsFile(resolveVirtualPath(relativePath), file.esmExports);
      }
      for (const [path, lib] of sl.resolution.loadedLibraries) {
        fs.addTypeSpecFile(
          resolvePath("node_modules", path, "package.json"),
          (lib.manifest as any).file.text,
        );
      }
      fs.freeze();
    }
  }
}

interface TesterInternalParams {
  fs: () => Promise<TestFileSystem>;
  wraps?: ((code: string) => string)[];
}
function createTesterInternal(params: TesterInternalParams) {
  const testable = createInstance();
  return {
    ...testable,
    wrap,
  };

  function wrap(fn: (x: string) => string): Tester {
    return createTesterInternal({
      ...params,
      wraps: [...(params.wraps ?? []), fn],
    });
  }

  function createInstance(): TesterInstance {
    return createTesterInstance({
      ...params,
      fs: async () => {
        const fs = await params.fs();
        return fs.clone();
      },
    });
  }
}

function createTesterInstance(params: TesterInternalParams): TesterInstance {
  return {
    compileAndDiagnose,
    compile,
    diagnose,
  };

  async function compileAndDiagnose(
    code: string,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult, readonly Diagnostic[]]> {
    const fs = await params.fs();
    if (params.wraps) {
      for (const wrap of params.wraps) {
        code = wrap(code);
      }
    }
    fs.addTypeSpecFile("main.tsp", code);
    const program = await coreCompile(fs.compilerHost, resolveVirtualPath("main.tsp"));
    return [{ program, types: {} }, program.diagnostics];
  }

  async function compile(code: string, options?: TestCompileOptions): Promise<TestCompileResult> {
    const [result, diagnostics] = await compileAndDiagnose(code, options);
    expectDiagnosticEmpty(diagnostics);
    return result;
  }
  async function diagnose(
    code: string,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]> {
    const [_, diagnostics] = await compileAndDiagnose(code, options);
    return diagnostics;
  }
}
