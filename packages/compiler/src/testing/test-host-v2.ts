import {
  CompilerOptions,
  Diagnostic,
  NoTarget,
  NodeHost,
  Program,
  SourceFile,
  Type,
  compile,
  compilerAssert,
  getRelativePathFromDirectory,
  joinPaths,
  resolvePath,
} from "@typespec/compiler";
import { readFile } from "fs/promises";
import { createSourceLoader } from "../core/source-loader.js";
import { StandardTestLibrary, createTestFileSystem } from "./test-host.js";
import { resolveVirtualPath } from "./test-utils.js";

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
  // compile(
  //   main: string,
  //   options?: TestCompileOptions
  // ): Promise<TestCompileResult>;
  // diagnose(
  //   main: string,
  //   options?: TestCompileOptions
  // ): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    main: string,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult, readonly Diagnostic[]]>;
}

// Immutable structure meant to be reused
export interface TestHostBuilder extends Testable {
  // addImports(): TestHostBuilder;
  // addUsing(...names: string[]): TestHostBuilder;
  // wrap(fn: (x: string) => string): TestHostBuilder;
  // createHost(): TestHostV2;
}

export function createTestHostBuilder(
  base: string,
  options: { libraries: string[] },
): TestHostBuilder {
  let loaded: Promise<void> | undefined;
  const fs = createTestFileSystem();
  fs.addTypeSpecFile(".keep", ""); // dummy so it knows / is a directory TODO: better way to do this?

  return {
    compileAndDiagnose,
  };

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
    }
  }

  async function compileAndDiagnose(
    main: string,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult, readonly Diagnostic[]]> {
    await load();
    fs.addTypeSpecFile("main.tsp", main);
    const program = await compile(fs.compilerHost, resolveVirtualPath("main.tsp"));
    return [{ program, types: {} }, program.diagnostics];
  }
}
