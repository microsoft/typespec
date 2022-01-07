import { readdir, readFile } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import {
  createSourceFile,
  formatDiagnostic,
  logDiagnostics,
  logVerboseTestOutput,
} from "../core/diagnostics.js";
import { CompilerOptions } from "../core/options.js";
import { getAnyExtensionFromPath, resolvePath } from "../core/path-utils.js";
import { createProgram, Program } from "../core/program.js";
import { CompilerHost, Diagnostic, Type } from "../core/types.js";
import { NodeHost } from "../core/util.js";

export interface TestHost {
  addCadlFile(path: string, contents: string): void;
  addJsFile(path: string, contents: any): void;
  addRealCadlFile(path: string, realPath: string): Promise<void>;
  addRealJsFile(path: string, realPath: string): Promise<void>;
  compile(main: string, options?: CompilerOptions): Promise<Record<string, Type>>;
  diagnose(main: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    main: string,
    options?: CompilerOptions
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
  testTypes: Record<string, Type>;
  program: Program;
  /**
   * Virtual filesystem used in the tests.
   */
  fs: Map<string, string>;
}

class TestHostError extends Error {
  constructor(message: string, public code: "ENOENT" | "ERR_MODULE_NOT_FOUND") {
    super(message);
  }
}

function resolveVFsPath(path: string) {
  return resolvePath("/", path);
}

export async function createTestHost(): Promise<TestHost> {
  const testTypes: Record<string, Type> = {};
  let program: Program = undefined as any; // in practice it will always be initialized
  const virtualFs = new Map<string, string>();
  const jsImports = new Map<string, Promise<any>>();
  const compilerHost: CompilerHost = {
    async readUrl(url: string) {
      const contents = virtualFs.get(url);
      if (contents === undefined) {
        throw new TestHostError(`File ${url} not found.`, "ENOENT");
      }
      return createSourceFile(contents, url);
    },
    async readFile(path: string) {
      path = resolveVFsPath(path);
      const contents = virtualFs.get(path);
      if (contents === undefined) {
        throw new TestHostError(`File ${path} not found.`, "ENOENT");
      }
      return createSourceFile(contents, path);
    },

    async writeFile(path: string, content: string) {
      path = resolveVFsPath(path);
      virtualFs.set(path, content);
    },

    async readDir(path: string) {
      path = resolveVFsPath(path);
      return [...virtualFs.keys()]
        .filter((x) => x.startsWith(`${path}/`))
        .map((x) => x.replace(`${path}/`, ""));
    },

    async removeDir(path: string) {
      path = resolveVFsPath(path);

      for (const key of virtualFs.keys()) {
        if (key.startsWith(`${path}/`)) {
          virtualFs.delete(key);
        }
      }
    },

    getLibDirs() {
      return [resolveVFsPath("/.cadl/lib"), resolveVFsPath("/.cadl/test-lib")];
    },

    getExecutionRoot() {
      return "/.cadl";
    },

    getJsImport(path) {
      path = resolveVFsPath(path);
      const module = jsImports.get(path);
      if (module === undefined) {
        throw new TestHostError(`Module ${path} not found`, "ERR_MODULE_NOT_FOUND");
      }
      return module;
    },

    async stat(path: string) {
      path = resolveVFsPath(path);

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

    logSink: NodeHost.logSink,
    mkdirp: async (path: string) => path,
  };

  // load standard library into the vfs
  for (const [relDir, virtualDir] of [
    ["../../lib", "/.cadl/dist/lib"],
    ["../../../lib", "/.cadl/lib"],
  ]) {
    const dir = resolvePath(fileURLToPath(import.meta.url), relDir);
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const realPath = resolvePath(dir, entry.name);
      const virtualPath = resolvePath(virtualDir, entry.name);
      if (entry.isFile()) {
        switch (getAnyExtensionFromPath(entry.name)) {
          case ".cadl":
            const contents = await readFile(realPath, "utf-8");
            virtualFs.set(virtualPath, contents);
            break;
          case ".js":
          case ".mjs":
            jsImports.set(virtualPath, import(pathToFileURL(realPath).href));
            virtualFs.set(virtualPath, ""); // don't need contents.
            break;
        }
      }
    }
  }

  // add test decorators
  addCadlFile("/.cadl/test-lib/main.cadl", 'import "./test.js";');
  addJsFile("/.cadl/test-lib/test.js", {
    $test(_: any, target: Type, name?: string) {
      if (!name) {
        if (
          target.kind === "Model" ||
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
    addCadlFile,
    addJsFile,
    addRealCadlFile,
    addRealJsFile,
    compile,
    diagnose,
    compileAndDiagnose,
    testTypes,
    get program() {
      return program;
    },
    fs: virtualFs,
  };

  function addCadlFile(path: string, contents: string) {
    virtualFs.set(resolveVFsPath(path), contents);
  }

  function addJsFile(path: string, contents: any) {
    const key = resolveVFsPath(path);
    virtualFs.set(key, ""); // don't need contents
    jsImports.set(key, new Promise((r) => r(contents)));
  }

  async function addRealCadlFile(path: string, existingPath: string) {
    virtualFs.set(resolveVFsPath(path), await readFile(existingPath, "utf8"));
  }

  async function addRealJsFile(path: string, existingPath: string) {
    const key = resolveVFsPath(path);
    const exports = await import(pathToFileURL(existingPath).href);

    virtualFs.set(key, "");
    jsImports.set(key, exports);
  }

  async function compile(main: string, options: CompilerOptions = {}) {
    const [testTypes, diagnostics] = await compileAndDiagnose(main, options);
    if (diagnostics.length > 0) {
      let message = "Unexpected diagnostics:\n" + diagnostics.map(formatDiagnostic).join("\n");
      throw new Error(message);
    }
    return testTypes;
  }

  async function diagnose(main: string, options: CompilerOptions = {}) {
    const [, diagnostics] = await compileAndDiagnose(main, options);
    return diagnostics;
  }

  async function compileAndDiagnose(
    mainFile: string,
    options: CompilerOptions = {}
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]> {
    if (options.noEmit === undefined) {
      // default for tests is noEmit
      options = { ...options, noEmit: true };
    }

    program = await createProgram(compilerHost, mainFile, options);
    logVerboseTestOutput((log) => logDiagnostics(program.diagnostics, program.logger));
    return [testTypes, program.diagnostics];
  }
}
