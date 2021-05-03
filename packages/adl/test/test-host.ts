import { readdir, readFile } from "fs/promises";
import { basename, isAbsolute, join, normalize, relative, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { CompilerOptions } from "../compiler/options";
import { Program } from "../compiler/program";
import { createProgram } from "../compiler/program.js";
import { CompilerHost, Type } from "../compiler/types";

export interface TestHost {
  addAdlFile(path: string, contents: string): void;
  addJsFile(path: string, contents: any): void;
  addRealAdlFile(path: string, realPath: string): Promise<void>;
  addRealJsFile(path: string, realPath: string): Promise<void>;
  compile(main: string, options?: CompilerOptions): Promise<Record<string, Type>>;
  testTypes: Record<string, Type>;
  program: Program;
  /**
   * Virtual filesystem used in the tests.
   */
  fs: { [name: string]: string };
}

export async function createTestHost(): Promise<TestHost> {
  const testTypes: Record<string, Type> = {};
  let program: Program = undefined as any; // in practice it will always be initialized
  const virtualFs: { [name: string]: string } = {};
  const jsImports: { [path: string]: Promise<any> } = {};
  const compilerHost: CompilerHost = {
    async readFile(path: string) {
      return virtualFs[path];
    },

    async readDir(path: string) {
      const contents = [];

      for (const fsPath of Object.keys(virtualFs)) {
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
      virtualFs[path] = content;
    },

    getLibDirs() {
      return [resolve("/.adl/lib"), resolve("/.adl/test-lib")];
    },

    getExecutionRoot() {
      return "/.adl";
    },

    getJsImport(path) {
      return jsImports[path];
    },

    getCwd() {
      return "/";
    },

    async stat(path: string) {
      if (virtualFs.hasOwnProperty(path)) {
        return {
          isDirectory() {
            return false;
          },
          isFile() {
            return true;
          },
        };
      }

      for (const fsPath of Object.keys(virtualFs)) {
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

      throw { code: "ENOENT" };
    },

    // symlinks not supported in test-host
    async realpath(path) {
      return path;
    },
  };

  // load standard library into the vfs
  for (const relDir of ["../../lib", "../../../lib"]) {
    const dir = resolve(fileURLToPath(import.meta.url), relDir);
    const contents = await readdir(dir, { withFileTypes: true });
    for (const entry of contents) {
      if (entry.isFile()) {
        const path = join(dir, entry.name);
        const virtualDir = compilerHost.getLibDirs()[0];
        const key = normalize(join(virtualDir, entry.name));

        if (entry.name.endsWith(".js")) {
          jsImports[key] = import(pathToFileURL(path).href);
          virtualFs[key] = ""; // don't need contents.
        } else {
          const contents = await readFile(path, "utf-8");
          virtualFs[key] = contents;
        }
      }
    }
  }

  // add test decorators
  addJsFile("/.adl/test-lib/test.js", {
    test(_: any, target: Type, name?: string) {
      if (!name) {
        if (target.kind === "Model" || target.kind === "Namespace" || target.kind === "Enum") {
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
    testTypes,
    get program() {
      return program;
    },
    fs: virtualFs,
  };

  function addAdlFile(path: string, contents: string) {
    virtualFs[resolve(compilerHost.getCwd(), path)] = contents;
  }

  function addJsFile(path: string, contents: any) {
    const key = resolve(compilerHost.getCwd(), path);
    // don't need file contents;
    virtualFs[key] = "";
    jsImports[key] = new Promise((r) => r(contents));
  }

  async function addRealAdlFile(path: string, existingPath: string) {
    virtualFs[resolve(compilerHost.getCwd(), path)] = await readFile(existingPath, "utf8");
  }

  async function addRealJsFile(path: string, existingPath: string) {
    const key = resolve(compilerHost.getCwd(), path);
    const exports = await import(pathToFileURL(existingPath).href);

    virtualFs[key] = "";
    jsImports[key] = exports;
  }

  async function compile(main: string, options: CompilerOptions = {}) {
    // default is noEmit
    if (!options.hasOwnProperty("noEmit")) {
      options.noEmit = true;
    }

    try {
      program = await createProgram(compilerHost, {
        mainFile: main,
        ...options,
      });

      return testTypes;
    } catch (e) {
      if (e.diagnostics) {
        throw e.diagnostics;
      }
      throw e;
    }
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
