import assert from "assert";
import type { RmOptions } from "fs";
import { readFile } from "fs/promises";
import { globby } from "globby";
import { fileURLToPath, pathToFileURL } from "url";
import { logDiagnostics, logVerboseTestOutput } from "../core/diagnostics.js";
import { createLogger } from "../core/logger/logger.js";
import { NodeHost } from "../core/node-host.js";
import { CompilerOptions } from "../core/options.js";
import { getAnyExtensionFromPath, resolvePath } from "../core/path-utils.js";
import { Program, compile as compileProgram } from "../core/program.js";
import type { CompilerHost, Diagnostic, StringLiteral, Type } from "../core/types.js";
import { createSourceFile, getSourceFileKindFromExt } from "../index.js";
import { createStringMap } from "../utils/misc.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { createTestWrapper, findTestPackageRoot, resolveVirtualPath } from "./test-utils.js";
import {
  BasicTestRunner,
  TestFileSystem,
  TestHost,
  TestHostConfig,
  TestHostError,
  TypeSpecTestLibrary,
} from "./types.js";

export interface TestHostOptions {
  caseInsensitiveFileSystem?: boolean;
  excludeTestLib?: boolean;
  compilerHostOverrides?: Partial<CompilerHost>;
}

function createTestCompilerHost(
  virtualFs: Map<string, string>,
  jsImports: Map<string, Record<string, any>>,
  options?: TestHostOptions,
): CompilerHost {
  const libDirs = [resolveVirtualPath(".tsp/lib/std")];
  if (!options?.excludeTestLib) {
    libDirs.push(resolveVirtualPath(".tsp/test-lib"));
  }

  return {
    async readUrl(url: string) {
      const contents = virtualFs.get(url);
      if (contents === undefined) {
        throw new TestHostError(`File ${url} not found.`, "ENOENT");
      }
      return createSourceFile(contents, url);
    },
    async readFile(path: string) {
      path = resolveVirtualPath(path);
      const contents = virtualFs.get(path);
      if (contents === undefined) {
        throw new TestHostError(`File ${path} not found.`, "ENOENT");
      }
      return createSourceFile(contents, path);
    },

    async writeFile(path: string, content: string) {
      path = resolveVirtualPath(path);
      virtualFs.set(path, content);
    },

    async readDir(path: string) {
      path = resolveVirtualPath(path);
      const fileFolder = [...virtualFs.keys()]
        .filter((x) => x.startsWith(`${path}/`))
        .map((x) => x.replace(`${path}/`, ""))
        .map((x) => {
          const index = x.indexOf("/");
          return index !== -1 ? x.substring(0, index) : x;
        });
      return [...new Set(fileFolder)];
    },

    async rm(path: string, options: RmOptions) {
      path = resolveVirtualPath(path);

      if (options.recursive && !virtualFs.has(path)) {
        for (const key of virtualFs.keys()) {
          if (key.startsWith(`${path}/`)) {
            virtualFs.delete(key);
          }
        }
      } else {
        virtualFs.delete(path);
      }
    },

    getLibDirs() {
      return libDirs;
    },

    getExecutionRoot() {
      return resolveVirtualPath(".tsp");
    },

    async getJsImport(path) {
      path = resolveVirtualPath(path);
      const module = jsImports.get(path);
      if (module === undefined) {
        throw new TestHostError(`Module ${path} not found`, "ERR_MODULE_NOT_FOUND");
      }
      return module;
    },

    async stat(path: string) {
      path = resolveVirtualPath(path);

      if (virtualFs.has(path)) {
        return {
          isDirectory() {
            return false;
          },
          isFile() {
            return true;
          },
        };
      }

      for (const fsPath of virtualFs.keys()) {
        if (fsPath.startsWith(path) && fsPath !== path) {
          return {
            isDirectory() {
              return true;
            },
            isFile() {
              return false;
            },
          };
        }
      }

      throw new TestHostError(`File ${path} not found`, "ENOENT");
    },

    // symlinks not supported in test-host
    async realpath(path) {
      return path;
    },
    getSourceFileKind: getSourceFileKindFromExt,

    logSink: NodeHost.logSink,
    mkdirp: async (path: string) => path,
    fileURLToPath,
    pathToFileURL(path: string) {
      return pathToFileURL(path).href;
    },

    ...options?.compilerHostOverrides,
  };
}

export async function createTestFileSystem(options?: TestHostOptions): Promise<TestFileSystem> {
  const virtualFs = createStringMap<string>(!!options?.caseInsensitiveFileSystem);
  const jsImports = createStringMap<Promise<any>>(!!options?.caseInsensitiveFileSystem);

  const compilerHost = createTestCompilerHost(virtualFs, jsImports, options);
  return {
    addTypeSpecFile,
    addJsFile,
    addRealTypeSpecFile,
    addRealJsFile,
    addTypeSpecLibrary,
    compilerHost,
    fs: virtualFs,
  };

  function addTypeSpecFile(path: string, contents: string) {
    virtualFs.set(resolveVirtualPath(path), contents);
  }

  function addJsFile(path: string, contents: any) {
    const key = resolveVirtualPath(path);
    virtualFs.set(key, ""); // don't need contents
    jsImports.set(key, new Promise((r) => r(contents)));
  }

  async function addRealTypeSpecFile(path: string, existingPath: string) {
    virtualFs.set(resolveVirtualPath(path), await readFile(existingPath, "utf8"));
  }

  async function addRealJsFile(path: string, existingPath: string) {
    const key = resolveVirtualPath(path);
    const exports = await import(pathToFileURL(existingPath).href);

    virtualFs.set(key, "");
    jsImports.set(key, exports);
  }

  async function addTypeSpecLibrary(testLibrary: TypeSpecTestLibrary) {
    for (const { realDir, pattern, virtualPath } of testLibrary.files) {
      const lookupDir = resolvePath(testLibrary.packageRoot, realDir);
      const entries = await findFilesFromPattern(lookupDir, pattern);
      for (const entry of entries) {
        const fileRealPath = resolvePath(lookupDir, entry);
        const fileVirtualPath = resolveVirtualPath(virtualPath, entry);
        switch (getAnyExtensionFromPath(fileRealPath)) {
          case ".tsp":
          case ".json":
            const contents = await readFile(fileRealPath, "utf-8");
            addTypeSpecFile(fileVirtualPath, contents);
            break;
          case ".js":
          case ".mjs":
            await addRealJsFile(fileVirtualPath, fileRealPath);
            break;
        }
      }
    }
  }
}

export const StandardTestLibrary: TypeSpecTestLibrary = {
  name: "@typespec/compiler",
  packageRoot: await findTestPackageRoot(import.meta.url),
  files: [
    { virtualPath: "./.tsp/dist/src/lib", realDir: "./dist/src/lib", pattern: "*" },
    { virtualPath: "./.tsp/lib", realDir: "./lib", pattern: "**" },
  ],
};

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
    if (options.noEmit === undefined) {
      // default for tests is noEmit
      options = { ...options, noEmit: true };
    }
    const p = await compileProgram(fileSystem.compilerHost, mainFile, options);
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
