import { getDirectoryPath, joinPaths, normalizePath, resolvePath } from "../core/path-utils.js";
import type { PackageJson } from "../types/package-json.js";
import { resolvePackageExports } from "./esm/resolve-package-exports.js";
import { resolvePackageImports } from "./esm/resolve-package-imports.js";
import {
  EsmResolveError,
  InvalidPackageTargetError,
  NoMatchingConditionsError,
} from "./esm/utils.js";
import { parseNodeModuleSpecifier } from "./utils.js";

// Resolve algorithm of node https://nodejs.org/api/modules.html#modules_all_together

export interface ResolveModuleOptions {
  baseDir: string;

  /**
   * When resolution reach package.json returns the path to the file relative to it.
   * @default pkg.main
   */
  resolveMain?: (pkg: any) => string;

  /**
   * When resolution reach a directory without package.json look for those files to load in order.
   * @default `["index.mjs", "index.js"]`
   */
  directoryIndexFiles?: string[];

  /** List of conditions to match in package exports */
  readonly conditions?: string[];

  /**
   * If exports is defined ignore if the none of the given condition is found and fallback to using main field resolution.
   * By default it will throw an error.
   */
  readonly fallbackOnMissingCondition?: boolean;
}

export interface ResolveModuleHost {
  /**
   * Resolve the real path for the current host.
   */
  realpath(path: string): Promise<string>;

  /**
   * Get information about the given path
   */
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  /**
   * Read a utf-8 encoded file.
   */
  readFile(path: string): Promise<string>;
}

type ResolveModuleErrorCode =
  | "MODULE_NOT_FOUND"
  | "INVALID_MAIN"
  | "INVALID_MODULE"
  /** When an imports points to an invalid file. */
  | "INVALID_MODULE_IMPORT_TARGET"
  /** When an exports points to an invalid file. */
  | "INVALID_MODULE_EXPORT_TARGET";

export class ResolveModuleError extends Error {
  public constructor(
    public code: ResolveModuleErrorCode,
    message: string,
    public pkgJson?: PackageJsonFile,
  ) {
    super(message);
  }
}

const defaultDirectoryIndexFiles = ["index.mjs", "index.js"];

export type ModuleResolutionResult = ResolvedFile | ResolvedModule;

export interface ResolvedFile {
  type: "file";
  path: string;
}

export interface ResolvedModule {
  type: "module";

  /**
   * Root of the package. (Same level as package.json)
   */
  path: string;

  /**
   * Resolved main file for the module.
   */
  mainFile: string;

  /**
   * Value of package.json.
   */
  manifest: PackageJson;
}

/**
 * Resolve a module
 * @param host
 * @param specifier
 * @param options
 * @returns
 * @throws {ResolveModuleError} When the module cannot be resolved.
 */
export async function resolveModule(
  host: ResolveModuleHost,
  specifier: string,
  options: ResolveModuleOptions,
): Promise<ModuleResolutionResult> {
  const { baseDir } = options;
  const absoluteStart = await realpath(resolvePath(baseDir));

  // Check if the module name is referencing a path(./foo, /foo, file:/foo)
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(specifier)) {
    const res = resolvePath(absoluteStart, specifier);
    const m = (await loadAsFile(res)) || (await loadAsDirectory(res));
    if (m) {
      return m;
    }
  }

  // If specifier starts with '#', resolve subpath imports.
  if (specifier.startsWith("#")) {
    const dirs = listDirHierarchy(baseDir);
    for (const dir of dirs) {
      const pkgFile = resolvePath(dir, "package.json");
      if (!(await isFile(host, pkgFile))) continue;

      const pkg = await readPackage(host, pkgFile);
      const module = await resolveNodePackageImports(pkg, dir);
      if (module) return module;
    }
  }

  // Try to resolve package itself.
  const self = await resolveSelf(specifier, absoluteStart);
  if (self) return self;

  // Try to resolve as a node_module package.
  const module = await resolveAsNodeModule(specifier, absoluteStart);
  if (module) return module;

  throw new ResolveModuleError(
    "MODULE_NOT_FOUND",
    `Cannot find module '${specifier}' from '${baseDir}'`,
  );

  async function realpath(path: string): Promise<string> {
    try {
      return normalizePath(await host.realpath(path));
    } catch (e: any) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") {
        return path;
      }
      throw e;
    }
  }

  /**
   * Returns a list of all the parent directory and the given one.
   */
  function listDirHierarchy(baseDir: string): string[] {
    const paths = [baseDir];
    let current = getDirectoryPath(baseDir);
    while (current !== paths[paths.length - 1]) {
      paths.push(current);
      current = getDirectoryPath(current);
    }

    return paths;
  }

  /**
   * Equivalent implementation to node LOAD_PACKAGE_SELF
   * Resolve if the import is importing the current package.
   */
  async function resolveSelf(name: string, baseDir: string): Promise<ResolvedModule | undefined> {
    for (const dir of listDirHierarchy(baseDir)) {
      const pkgFile = resolvePath(dir, "package.json");
      if (!(await isFile(host, pkgFile))) continue;
      const pkg = await readPackage(host, pkgFile);
      if (pkg.name === name) {
        return loadPackage(dir, pkg);
      } else {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Equivalent implementation to node LOAD_NODE_MODULES with a few non supported features.
   * Cannot load any random file under the load path(only packages).
   */
  async function resolveAsNodeModule(
    importSpecifier: string,
    baseDir: string,
  ): Promise<ResolvedModule | undefined> {
    const module = parseNodeModuleSpecifier(importSpecifier);
    if (module === null) return undefined;
    const dirs = listDirHierarchy(baseDir);

    for (const dir of dirs) {
      const n = await loadPackageAtPath(
        joinPaths(dir, "node_modules", module.packageName),
        module.subPath,
      );
      if (n) return n;
    }
    return undefined;
  }

  async function loadPackageAtPath(
    path: string,
    subPath?: string,
  ): Promise<ResolvedModule | undefined> {
    const pkgFile = resolvePath(path, "package.json");
    if (!(await isFile(host, pkgFile))) return undefined;

    const pkg = await readPackage(host, pkgFile);
    const n = await loadPackage(path, pkg, subPath);
    if (n) return n;
    return undefined;
  }

  async function resolveNodePackageImports(
    pkg: PackageJsonFile,
    pkgDir: string,
  ): Promise<ResolvedModule | undefined> {
    if (!pkg.imports) return undefined;

    let match: string | undefined | null;
    try {
      match = await resolvePackageImports(
        {
          packageUrl: pathToFileURL(pkgDir),
          specifier,
          moduleDirs: ["node_modules"],
          conditions: options.conditions ?? [],
          ignoreDefaultCondition: options.fallbackOnMissingCondition,
          resolveId: async (id, baseDir) => {
            const resolved = await resolveAsNodeModule(id, fileURLToPath(baseDir.toString()));
            return resolved && pathToFileURL(resolved.mainFile);
          },
        },
        pkg.imports,
      );
    } catch (error) {
      if (error instanceof InvalidPackageTargetError) {
        throw new ResolveModuleError("INVALID_MODULE_IMPORT_TARGET", error.message, pkg);
      } else if (error instanceof EsmResolveError) {
        throw new ResolveModuleError("INVALID_MODULE", error.message, pkg);
      } else {
        throw error;
      }
    }
    if (!match) return undefined;
    const resolved = await resolveEsmMatch(match, true, pkg);
    return {
      type: "module",
      mainFile: resolved,
      manifest: pkg,
      path: pkgDir,
    };
  }

  /**
   * Try to load using package.json exports.
   * @param importSpecifier A combination of the package name and exports entry.
   * @param directory `node_modules` directory.
   */
  async function resolveNodePackageExports(
    subPath: string,
    pkg: PackageJsonFile,
    pkgDir: string,
  ): Promise<ResolvedModule | undefined> {
    if (!pkg.exports) return undefined;

    let match: string | undefined | null;
    try {
      match = await resolvePackageExports(
        {
          packageUrl: pathToFileURL(pkgDir),
          specifier: specifier,
          moduleDirs: ["node_modules"],
          conditions: options.conditions ?? [],
          ignoreDefaultCondition: options.fallbackOnMissingCondition,
          resolveId: (id: string, baseDir: string) => {
            throw new ResolveModuleError("INVALID_MODULE", "Not supported", pkg);
          },
        },
        subPath === "" ? "." : `./${subPath}`,
        pkg.exports,
      );
    } catch (error) {
      if (error instanceof NoMatchingConditionsError) {
        // For back compat we allow to fallback to main field for the `.` entry.
        if (subPath === "") {
          return;
        } else {
          throw new ResolveModuleError("INVALID_MODULE", error.message, pkg);
        }
      } else if (error instanceof InvalidPackageTargetError) {
        throw new ResolveModuleError("INVALID_MODULE_EXPORT_TARGET", error.message, pkg);
      } else if (error instanceof EsmResolveError) {
        throw new ResolveModuleError("INVALID_MODULE", error.message, pkg);
      } else {
        throw error;
      }
    }
    if (!match) return undefined;
    const resolved = await resolveEsmMatch(match, false, pkg);
    return {
      type: "module",
      mainFile: resolved,
      manifest: pkg,
      path: await realpath(pkgDir),
    };
  }

  async function resolveEsmMatch(match: string, isImports: boolean, pkg: PackageJsonFile) {
    const resolved = await realpath(fileURLToPath(match));
    if (await isFile(host, resolved)) {
      return resolved;
    }
    throw new ResolveModuleError(
      isImports ? "INVALID_MODULE_IMPORT_TARGET" : "INVALID_MODULE_EXPORT_TARGET",
      `Import "${specifier}" resolving to "${resolved}" is not a file.`,
      pkg,
    );
  }

  async function loadAsDirectory(directory: string): Promise<ModuleResolutionResult | undefined> {
    const pkg = await loadPackageAtPath(directory);
    if (pkg) {
      return pkg;
    }

    for (const file of options.directoryIndexFiles ?? defaultDirectoryIndexFiles) {
      const resolvedFile = await loadAsFile(joinPaths(directory, file));
      if (resolvedFile) {
        return resolvedFile;
      }
    }
    return undefined;
  }

  async function loadPackage(directory: string, pkg: PackageJsonFile, subPath?: string) {
    const e = await resolveNodePackageExports(subPath ?? "", pkg, directory);
    if (e) return e;

    if (subPath !== undefined && subPath !== "") {
      return undefined;
    }
    return loadPackageLegacy(directory, pkg);
  }

  async function loadPackageLegacy(
    directory: string,
    pkg: PackageJsonFile,
  ): Promise<ResolvedModule | undefined> {
    const mainFile = options.resolveMain ? options.resolveMain(pkg) : pkg.main;
    if (mainFile === undefined || mainFile === null) {
      throw new ResolveModuleError(
        "INVALID_MODULE",
        `Package ${pkg.name} is missing a main file or exports field.`,
        pkg,
      );
    }
    if (typeof mainFile !== "string") {
      throw new ResolveModuleError(
        "INVALID_MAIN",
        `Package ${pkg.name} main file "${mainFile}" must be a string.`,
        pkg,
      );
    }

    const mainFullPath = resolvePath(directory, mainFile);
    let loaded;
    try {
      loaded = (await loadAsFile(mainFullPath)) ?? (await loadAsDirectory(mainFullPath));
    } catch (e) {
      throw new ResolveModuleError(
        "INVALID_MAIN",
        `Package ${pkg.name} main file "${mainFile}" is not pointing to a valid file or directory.`,
        pkg,
      );
    }

    if (loaded) {
      if (loaded.type === "module") {
        return loaded;
      }
      return {
        type: "module",
        path: await realpath(directory),
        mainFile: loaded.path,
        manifest: pkg,
      };
    } else {
      throw new ResolveModuleError(
        "INVALID_MAIN",
        `Package ${pkg.name} main file "${mainFile}" is not pointing to a valid file or directory.`,
        pkg,
      );
    }
  }

  async function loadAsFile(file: string): Promise<ResolvedFile | undefined> {
    if (await isFile(host, file)) {
      return resolvedFile(file);
    }

    const extensions = [".mjs", ".js"];
    for (const ext of extensions) {
      const fileWithExtension = file + ext;
      if (await isFile(host, fileWithExtension)) {
        return resolvedFile(fileWithExtension);
      }
    }
    return undefined;
  }

  async function resolvedFile(path: string): Promise<ResolvedFile> {
    return { type: "file", path: await realpath(path) };
  }
}

interface PackageJsonFile extends PackageJson {
  readonly file: {
    readonly path: string;
    readonly text: string;
  };
}

async function readPackage(host: ResolveModuleHost, pkgfile: string): Promise<PackageJsonFile> {
  const content = await host.readFile(pkgfile);
  return {
    ...JSON.parse(content),
    file: {
      path: pkgfile,
      text: content,
    },
  };
}

async function isFile(host: ResolveModuleHost, path: string) {
  try {
    const stats = await host.stat(path);
    return stats.isFile();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}
function pathToFileURL(path: string): string {
  return `file://${path}`;
}

function fileURLToPath(url: string) {
  if (!url.startsWith("file://")) throw new Error("Cannot convert non file: URL to path");

  const pathname = url.slice("file://".length);

  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2)! | 0x20;

      if (pathname[n + 1] === "2" && third === 102) {
        throw new Error("Invalid url to path: must not include encoded / characters");
      }
    }
  }

  return decodeURIComponent(pathname);
}
