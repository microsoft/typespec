import { createSourceFile, getSourceFileKindFromExt, resolvePath } from "@typespec/compiler";
import { LibraryImportOptions, importLibrary, importTypeSpecCompiler } from "./core.js";
import { BrowserHost, PlaygroundTspLibrary } from "./types.js";

export function resolveVirtualPath(path: string, ...paths: string[]) {
  return resolvePath("/test", path, ...paths);
}

/**
 * Create the browser host from the list of libraries.
 * @param libsToLoad List of libraries to load. Those must be set in the webpage importmap.
 * @param importOptions Import configuration.
 * @returns
 */
export async function createBrowserHost(
  libsToLoad: readonly string[],
  importOptions: LibraryImportOptions = {}
): Promise<BrowserHost> {
  const virtualFs = new Map<string, string>();
  const jsImports = new Map<string, Promise<any>>();

  const libraries: Record<string, PlaygroundTspLibrary> = {};
  for (const libName of libsToLoad) {
    const { _TypeSpecLibrary_, $lib, $linter } = (await importLibrary(
      libName,
      importOptions
    )) as any;
    libraries[libName] = {
      name: libName,
      isEmitter: $lib?.emitter,
      definition: $lib,
      packageJson: JSON.parse(_TypeSpecLibrary_.typespecSourceFiles["package.json"]),
      linter: $linter,
    };
    for (const [key, value] of Object.entries<any>(_TypeSpecLibrary_.typespecSourceFiles)) {
      virtualFs.set(`/test/node_modules/${libName}/${key}`, value);
    }
    for (const [key, value] of Object.entries<any>(_TypeSpecLibrary_.jsSourceFiles)) {
      addJsImport(`/test/node_modules/${libName}/${key}`, value);
    }
  }

  function addJsImport(path: string, value: any) {
    virtualFs.set(path, "");
    jsImports.set(path, value);
  }
  return {
    compiler: await importTypeSpecCompiler(importOptions),
    libraries,
    async readUrl(url: string) {
      const contents = virtualFs.get(url);
      if (contents === undefined) {
        const e = new Error(`File ${url} not found.`);
        (e as any).code = "ENOENT";
        throw e;
      }
      return createSourceFile(contents, url);
    },
    async readFile(path: string) {
      path = resolveVirtualPath(path);
      const contents = virtualFs.get(path);
      if (contents === undefined) {
        const e = new Error(`File ${path} not found.`);
        (e as any).code = "ENOENT";
        throw e;
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

    async rm(path: string) {
      path = resolveVirtualPath(path);

      for (const key of virtualFs.keys()) {
        if (key === path || key.startsWith(`${path}/`)) {
          virtualFs.delete(key);
        }
      }
    },

    getLibDirs() {
      return [resolveVirtualPath("/test/node_modules/@typespec/compiler/lib")];
    },

    getExecutionRoot() {
      return resolveVirtualPath(".tsp");
    },

    async getJsImport(path) {
      path = resolveVirtualPath(path);
      const module = await jsImports.get(path);
      if (module === undefined) {
        const e = new Error(`Module ${path} not found`);
        (e as any).code = "MODULE_NOT_FOUND";
        throw e;
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
      const e = new Error(`File ${path} not found.`);
      (e as any).code = "ENOENT";
      throw e;
    },

    // symlinks not supported in test-host
    async realpath(path) {
      return path;
    },

    getSourceFileKind: getSourceFileKindFromExt,

    logSink: console,
    mkdirp: async (path: string) => path,
    fileURLToPath(path) {
      return path.replace("inmemory:/", "");
    },
    pathToFileURL(path) {
      return "inmemory:/" + resolveVirtualPath(path);
    },
  };
}
