import { RmOptions } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { CompilerPackageRoot, NodeHost } from "../core/node-host.js";
import { createSourceFile, getSourceFileKindFromExt } from "../core/source-file.js";
import { CompilerHost, StringLiteral, Type } from "../core/types.js";
import { resolveVirtualPath } from "./fs.js";
import { TestFileSystem, TestHostError, TypeSpecTestLibrary } from "./types.js";

export const StandardTestLibrary: TypeSpecTestLibrary = {
  name: "@typespec/compiler",
  packageRoot: CompilerPackageRoot,
  files: [
    { virtualPath: "./.tsp/dist/src/lib", realDir: "./dist/src/lib", pattern: "**" },
    { virtualPath: "./.tsp/lib", realDir: "./lib", pattern: "**" },
  ],
};

export interface TestHostOptions {
  caseInsensitiveFileSystem?: boolean;
  excludeTestLib?: boolean;
  compilerHostOverrides?: Partial<CompilerHost>;
}

export function createTestCompilerHost(
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

    logSink: { log: NodeHost.logSink.log },
    mkdirp: async (path: string) => path,
    fileURLToPath,
    pathToFileURL(path: string) {
      return pathToFileURL(path).href;
    },

    ...options?.compilerHostOverrides,
  };
}

export function addTestLib(fs: TestFileSystem): Record<string, Type> {
  const testTypes: Record<string, Type> = {};
  // add test decorators
  fs.add(".tsp/test-lib/main.tsp", 'import "./test.js";');
  fs.addJsFile(".tsp/test-lib/test.js", {
    namespace: "TypeSpec",
    $test(_: any, target: Type, nameLiteral?: StringLiteral) {
      let name = nameLiteral?.value;
      if (!name) {
        if ("name" in target && typeof target.name === "string") {
          name = target.name;
        } else {
          throw new Error("Need to specify a name for test type");
        }
      }

      testTypes[name] = target;
    },
  });
  return testTypes;
}
