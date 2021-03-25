import { readdir, readFile } from "fs/promises";
import { basename, isAbsolute, join, normalize, relative, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL, URL } from "url";
import { createProgram } from "../compiler/program.js";
import { CompilerHost, Type } from "../compiler/types";

export interface TestHost {
  addAdlFile(path: string, contents: string): void;
  addJsFile(path: string, contents: any): void;
  compile(main: string): Promise<Record<string, Type>>;
  testTypes: Record<string, Type>;
}

export async function createTestHost(): Promise<TestHost> {
  const testTypes: Record<string, Type> = {};

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
        if (target.kind === "Model" || target.kind === "Namespace") {
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
    compile,
    testTypes,
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

  async function compile(main: string) {
    try {
      const program = await createProgram(compilerHost, {
        mainFile: main,
        noEmit: true,
      });

      return testTypes;
    } catch (e) {
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
