import { readdir, readFile } from "fs/promises";
import { basename, extname, isAbsolute, relative, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { formatDiagnostic, logDiagnostics, logVerboseTestOutput } from "../compiler/diagnostics.js";
import { CompilerOptions } from "../compiler/options.js";
import { createProgram, Program } from "../compiler/program.js";
import { CompilerHost, Diagnostic, Type } from "../compiler/types.js";

export interface TestHost {
  addAdlFile(path: string, contents: string): void;
  addJsFile(path: string, contents: any): void;
  addRealAdlFile(path: string, realPath: string): Promise<void>;
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

export async function createTestHost(): Promise<TestHost> {
  const testTypes: Record<string, Type> = {};
  let program: Program = undefined as any; // in practice it will always be initialized
  const virtualFs = new Map<string, string>();
  const jsImports = new Map<string, Promise<any>>();
  const compilerHost: CompilerHost = {
    async readFile(path: string) {
      const contents = virtualFs.get(path);
      if (contents === undefined) {
        throw new TestHostError(`File ${path} not found.`, "ENOENT");
      }
      return contents;
    },

    async readDir(path: string) {
      const contents = [];

      for (const fsPath of virtualFs.keys()) {
        if (isContainedIn(path, fsPath)) {
          contents.push({
            isFile() {
              return true;
            },
            isDirectory() {
              return false;
            },
            name: basename(fsPath),
          });
        }
      }

      return contents;
    },

    async writeFile(path: string, content: string) {
      virtualFs.set(path, content);
    },

    getLibDirs() {
      return [resolve("/.adl/lib"), resolve("/.adl/test-lib")];
    },

    getExecutionRoot() {
      return "/.adl";
    },

    getJsImport(path) {
      const module = jsImports.get(path);
      if (module === undefined) {
        throw new TestHostError(`Module ${path} not found`, "ERR_MODULE_NOT_FOUND");
      }
      return module;
    },

    getCwd() {
      return "/";
    },

    async stat(path: string) {
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
  };

  // load standard library into the vfs
  for (const [relDir, virtualDir] of [
    ["../../lib", "/.adl/dist/lib"],
    ["../../../lib", "/.adl/lib"],
  ]) {
    const dir = resolve(fileURLToPath(import.meta.url), relDir);
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const realPath = resolve(dir, entry.name);
      const virtualPath = resolve(virtualDir, entry.name);
      if (entry.isFile()) {
        switch (extname(entry.name)) {
          case ".adl":
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
  addAdlFile("/.adl/test-lib/main.adl", 'import "./test.js";');
  addJsFile("/.adl/test-lib/test.js", {
    test(_: any, target: Type, name?: string) {
      if (!name) {
        if (
          target.kind === "Model" ||
          target.kind === "Namespace" ||
          target.kind === "Enum" ||
          target.kind === "Operation"
        ) {
          name = target.name;
        } else {
          throw new Error("Need to specify a name for test type");
        }
      }

      testTypes[name] = target;
    },
  });

  return {
    addAdlFile,
    addJsFile,
    addRealAdlFile,
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

  function addAdlFile(path: string, contents: string) {
    virtualFs.set(resolve(compilerHost.getCwd(), path), contents);
  }

  function addJsFile(path: string, contents: any) {
    const key = resolve(compilerHost.getCwd(), path);
    virtualFs.set(key, ""); // don't need contents
    jsImports.set(key, new Promise((r) => r(contents)));
  }

  async function addRealAdlFile(path: string, existingPath: string) {
    virtualFs.set(resolve(compilerHost.getCwd(), path), await readFile(existingPath, "utf8"));
  }

  async function addRealJsFile(path: string, existingPath: string) {
    const key = resolve(compilerHost.getCwd(), path);
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
    logVerboseTestOutput((log) => logDiagnostics(program.diagnostics, log));
    return [testTypes, program.diagnostics];
  }

  function isContainedIn(a: string, b: string) {
    const rel = relative(a, b);
    // if paths are equal, rel will be empty string
    // if rel starts with "..", then b isn't inside a
    // if paths are completely unreated, rel will be an absolute path
    // if the rel path contains multiple segments, it's in a subdirectory
    return (rel === "" || !rel.startsWith("..") || !isAbsolute(rel)) && rel.split(sep).length === 1;
  }
}
