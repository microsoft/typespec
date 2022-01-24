import assert from "assert";
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

export interface TestFileSystem {
  compilerHost: CompilerHost;
  fs: Map<string, string>;

  addCadlFile(path: string, contents: string): void;
  addJsFile(path: string, contents: any): void;
  addRealCadlFile(path: string, realPath: string): Promise<void>;
  addRealJsFile(path: string, realPath: string): Promise<void>;
}

export interface TestHost extends TestFileSystem {
  program: Program;
  testTypes: Record<string, Type>;

  compile(main: string, options?: CompilerOptions): Promise<Record<string, Type>>;
  diagnose(main: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    main: string,
    options?: CompilerOptions
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
}

class TestHostError extends Error {
  constructor(message: string, public code: "ENOENT" | "ERR_MODULE_NOT_FOUND") {
    super(message);
  }
}

export function resolveVirtualPath(path: string, ...paths: string[]) {
  return resolvePath(process.platform === "win32" ? "Z:/test" : "/test", path, ...paths);
}

export async function createTestFileSystem(): Promise<TestFileSystem> {
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
      return [...virtualFs.keys()]
        .filter((x) => x.startsWith(`${path}/`))
        .map((x) => x.replace(`${path}/`, ""));
    },

    async removeDir(path: string) {
      path = resolveVirtualPath(path);

      for (const key of virtualFs.keys()) {
        if (key.startsWith(`${path}/`)) {
          virtualFs.delete(key);
        }
      }
    },

    getLibDirs() {
      return [resolveVirtualPath(".cadl/lib"), resolveVirtualPath(".cadl/test-lib")];
    },

    getExecutionRoot() {
      return resolveVirtualPath(".cadl");
    },

    getJsImport(path) {
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

    logSink: NodeHost.logSink,
    mkdirp: async (path: string) => path,
  };

  // load standard library into the vfs
  for (const [relDir, virtualDir] of [
    ["../../lib", "./.cadl/dist/lib"],
    ["../../../lib", "./.cadl/lib"],
  ]) {
    const dir = resolvePath(fileURLToPath(import.meta.url), relDir);
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const realPath = resolvePath(dir, entry.name);
      const virtualPath = resolveVirtualPath(virtualDir, entry.name);
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

  return {
    addCadlFile,
    addJsFile,
    addRealCadlFile,
    addRealJsFile,
    compilerHost,
    fs: virtualFs,
  };

  function addCadlFile(path: string, contents: string) {
    virtualFs.set(resolveVirtualPath(path), contents);
  }

  function addJsFile(path: string, contents: any) {
    const key = resolveVirtualPath(path);
    virtualFs.set(key, ""); // don't need contents
    jsImports.set(key, new Promise((r) => r(contents)));
  }

  async function addRealCadlFile(path: string, existingPath: string) {
    virtualFs.set(resolveVirtualPath(path), await readFile(existingPath, "utf8"));
  }

  async function addRealJsFile(path: string, existingPath: string) {
    const key = resolveVirtualPath(path);
    const exports = await import(pathToFileURL(existingPath).href);

    virtualFs.set(key, "");
    jsImports.set(key, exports);
  }
}

export async function createTestHost(): Promise<TestHost> {
  let program: Program | undefined;
  const testTypes: Record<string, Type> = {};
  const fileSystem = await createTestFileSystem();

  // add test decorators
  fileSystem.addCadlFile(".cadl/test-lib/main.cadl", 'import "./test.js";');
  fileSystem.addJsFile(".cadl/test-lib/test.js", {
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
    ...fileSystem,
    compile,
    diagnose,
    compileAndDiagnose,
    testTypes,
    get program() {
      assert(
        program,
        "Program cannot be accessed without calling compile, diagnose, or compileAndDiagnose."
      );
      return program;
    },
  };

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
    const p = await createProgram(fileSystem.compilerHost, mainFile, options);
    program = p;
    logVerboseTestOutput((log) => logDiagnostics(p.diagnostics, p.logger));
    return [testTypes, p.diagnostics];
  }
}
