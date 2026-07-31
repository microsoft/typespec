import { createSourceFile, getSourceFileKindFromExt, resolvePath } from "@typespec/compiler";
import { importLibrary, importTypeSpecCompiler, type LibraryImportOptions } from "./core.js";
import type { BrowserHost, PlaygroundTspLibrary } from "./types.js";

export function resolveVirtualPath(path: string, ...paths: string[]) {
  return resolvePath("/test", path, ...paths);
}

/**
 * @internal
 */
export interface BrowserHostCreateOptions {
  readonly compiler: typeof import("@typespec/compiler");
  readonly libraries: Record<string, PlaygroundTspLibrary & { _TypeSpecLibrary_: any }>;

  /**
   * Libraries that are known to the playground but have not been imported yet, keyed by name.
   * Each entry imports the library when called. See {@link BrowserHost.loadLibrary}.
   */
  readonly deferredLibraries?: Record<string, () => Promise<LoadedPlaygroundTspLibrary>>;
}

/**
 * @internal
 */
export function createBrowserHostInternal(options: BrowserHostCreateOptions): BrowserHost {
  const virtualFs = new Map<string, string>();
  const jsImports = new Map<string, Promise<any>>();

  const libraries: Record<string, PlaygroundTspLibrary & { _TypeSpecLibrary_?: any }> = {
    ...options.libraries,
  };

  const deferredLoaders = new Map(Object.entries(options.deferredLibraries ?? {}));
  const pendingLoads = new Map<string, Promise<void>>();

  for (const name of deferredLoaders.keys()) {
    // A placeholder keeps the emitter visible in the UI (dropdown, settings) without paying the
    // cost of importing it. It is replaced by the real library on the first `loadLibrary` call.
    libraries[name] = {
      name,
      isEmitter: true,
      deferred: true,
      packageJson: { name, version: "" } as any,
    };
  }

  function registerLibraryFiles(
    libName: string,
    lib: PlaygroundTspLibrary & { _TypeSpecLibrary_: any },
  ) {
    for (const [key, value] of Object.entries<any>(lib._TypeSpecLibrary_.typespecSourceFiles)) {
      virtualFs.set(`/test/node_modules/${libName}/${key}`, value);
    }
    for (const [key, value] of Object.entries<any>(lib._TypeSpecLibrary_.jsSourceFiles)) {
      addJsImport(`/test/node_modules/${libName}/${key}`, value);
    }
  }

  function updatePackageJson() {
    virtualFs.set(
      `/test/package.json`,
      JSON.stringify({
        name: "playground-pkg",
        dependencies: Object.fromEntries(
          // Deferred libraries have no files registered yet, so listing them would make the
          // compiler resolve a dependency it cannot read.
          Object.values(libraries)
            .filter((x) => !x.deferred)
            .map((x) => [x.name, x.packageJson.version]),
        ),
      }),
    );
  }

  function loadLibrary(name: string): Promise<void> {
    const loader = deferredLoaders.get(name);
    if (loader === undefined) {
      return Promise.resolve();
    }
    let pending = pendingLoads.get(name);
    if (pending === undefined) {
      pending = loader().then(
        (lib) => {
          libraries[name] = lib;
          registerLibraryFiles(name, lib);
          updatePackageJson();
          deferredLoaders.delete(name);
        },
        (error) => {
          // Drop the cached promise so a later compilation can retry after a transient failure.
          pendingLoads.delete(name);
          throw error;
        },
      );
      pendingLoads.set(name, pending);
    }
    return pending;
  }

  for (const [libName, lib] of Object.entries(options.libraries)) {
    registerLibraryFiles(libName, lib);
  }
  updatePackageJson();

  function addJsImport(path: string, value: any) {
    virtualFs.set(path, "");
    jsImports.set(path, value);
  }
  return {
    compiler: options.compiler,
    libraries,
    loadLibrary,
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
      if (
        virtualFs.has(resolveVirtualPath("/test/node_modules/@typespec/compiler/lib/std/main.tsp"))
      ) {
        return [resolveVirtualPath("/test/node_modules/@typespec/compiler/lib/std")];
      } else {
        // To load older version of the compiler < 0.55.0
        return [resolveVirtualPath("/test/node_modules/@typespec/compiler/lib")];
      }
    },

    getExecutionRoot() {
      return resolveVirtualPath("/test/node_modules/@typespec/compiler");
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

/**
 * A library that has been imported, along with the raw bundle payload used to populate the
 * in-memory file system.
 * @internal
 */
export type LoadedPlaygroundTspLibrary = PlaygroundTspLibrary & { _TypeSpecLibrary_: any };

async function importPlaygroundLibrary(
  libName: string,
  importOptions: LibraryImportOptions,
): Promise<LoadedPlaygroundTspLibrary> {
  const { _TypeSpecLibrary_, $lib, $linter } = (await importLibrary(libName, importOptions)) as any;
  return {
    name: libName,
    isEmitter: $lib?.emitter,
    definition: $lib,
    packageJson: JSON.parse(_TypeSpecLibrary_.typespecSourceFiles["package.json"]),
    linter: $linter,
    _TypeSpecLibrary_,
  };
}

/**
 * Load libraries in parallel from the given list.
 * @param libsToLoad List of library names. Must be available in the webpage importmap.
 * @param importOptions Import configuration.
 */
export async function loadLibraries(
  libsToLoad: readonly string[],
  importOptions: LibraryImportOptions = {},
): Promise<Record<string, LoadedPlaygroundTspLibrary>> {
  const entries = await Promise.all(
    libsToLoad.map(async (libName) => {
      return [libName, await importPlaygroundLibrary(libName, importOptions)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/**
 * Options for creating the browser host.
 */
export interface BrowserHostOptions {
  /**
   * Emitters that should not be imported until they are used.
   *
   * Importing a library evaluates its module, which for some emitters means downloading a large
   * runtime up front. Names listed here are shown in the emitter list right away but are only
   * imported once selected, which keeps the initial load cheap.
   *
   * Only use this for pure emitters: a deferred library cannot be referenced by an `import`
   * statement in the TypeSpec source, since its files are not registered until it is loaded.
   */
  readonly deferredEmitters?: readonly string[];
}

/**
 * Create the browser host from the list of libraries.
 * @param libsToLoad List of libraries to load. Those must be set in the webpage importmap.
 * @param importOptions Import configuration.
 * @param options Additional host options.
 * @returns
 */
export async function createBrowserHost(
  libsToLoad: readonly string[],
  importOptions: LibraryImportOptions = {},
  options: BrowserHostOptions = {},
): Promise<BrowserHost> {
  const deferredEmitters = new Set(options.deferredEmitters ?? []);
  const eagerLibs = libsToLoad.filter((x) => !deferredEmitters.has(x));

  const [libraries, compiler] = await Promise.all([
    loadLibraries(eagerLibs, importOptions),
    importTypeSpecCompiler(importOptions),
  ]);

  const deferredLibraries = Object.fromEntries(
    libsToLoad
      .filter((x) => deferredEmitters.has(x))
      .map((name) => [name, () => importPlaygroundLibrary(name, importOptions)] as const),
  );

  return createBrowserHostInternal({
    compiler,
    libraries,
    deferredLibraries,
  });
}
