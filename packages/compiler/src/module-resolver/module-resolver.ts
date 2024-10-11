import { getDirectoryPath, joinPaths, normalizePath, resolvePath } from "../core/path-utils.js";
import type { PackageJson } from "../types/package-json.js";
import { resolvePackageExports } from "./esm/resolve-package-exports.js";
import {
  EsmResolveError,
  InvalidPackageTargetError,
  NoMatchingConditionsError,
} from "./esm/utils.js";
import { NodeModuleSpecifier, parseNodeModuleSpecifier } from "./utils.js";

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
  /** When an exports points to an invalid file. */
  | "INVALID_MODULE_EXPORT_TARGET";
export class ResolveModuleError extends Error {
  public constructor(
    public code: ResolveModuleErrorCode,
    message: string,
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
  const realpath = async (x: string) => normalizePath(await host.realpath(x));

  const { baseDir } = options;
  const absoluteStart = await realpath(resolvePath(baseDir));

  if (!(await isDirectory(host, absoluteStart))) {
    throw new TypeError(`Provided basedir '${baseDir}'is not a directory.`);
  }

  // Check if the module name is referencing a path(./foo, /foo, file:/foo)
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(specifier)) {
    const res = resolvePath(absoluteStart, specifier);
    const m = (await loadAsFile(res)) || (await loadAsDirectory(res));
    if (m) {
      return m;
    }
  }

  // Try to resolve as a node_module package.
  const module = await resolveAsNodeModule(specifier, absoluteStart);
  if (module) return module;

  throw new ResolveModuleError(
    "MODULE_NOT_FOUND",
    `Cannot find module '${specifier}' from '${baseDir}'`,
  );

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
   * Try to import a package with that name in the current directory.
   */
  async function resolveSelf(
    { packageName, subPath }: NodeModuleSpecifier,
    dir: string,
  ): Promise<ResolvedModule | undefined> {
    const pkgFile = resolvePath(dir, "package.json");
    if (!(await isFile(host, pkgFile))) return undefined;
    const pkg = await readPackage(host, pkgFile);
    // Node Spec says that you shouldn't lookup past the first package.json. However we used to support that so keeping this.
    if (pkg.name !== packageName) return undefined;
    return loadPackage(dir, pkg, subPath);
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
      const self = await resolveSelf(module, dir);
      if (self) return self;
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

  /**
   * Try to load using package.json exports.
   * @param importSpecifier A combination of the package name and exports entry.
   * @param directory `node_modules` directory.
   */
  async function resolveNodePackageExports(
    subPath: string,
    pkg: PackageJson,
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
            throw new ResolveModuleError("INVALID_MODULE", "Not supported");
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
          throw new ResolveModuleError("INVALID_MODULE", error.message);
        }
      } else if (error instanceof InvalidPackageTargetError) {
        throw new ResolveModuleError("INVALID_MODULE_EXPORT_TARGET", error.message);
      } else if (error instanceof EsmResolveError) {
        throw new ResolveModuleError("INVALID_MODULE", error.message);
      } else {
        throw error;
      }
    }
    if (!match) return undefined;
    const resolved = await resolveEsmMatch(match);
    return {
      type: "module",
      mainFile: resolved,
      manifest: pkg,
      path: pkgDir,
    };
  }

  async function resolveEsmMatch(match: string) {
    const resolved = await realpath(fileURLToPath(match));
    if (await isFile(host, resolved)) {
      return resolved;
    }
    throw new ResolveModuleError(
      "INVALID_MODULE_EXPORT_TARGET",
      `Import "${specifier}" resolving to "${resolved}" is not a file.`,
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

  async function loadPackage(directory: string, pkg: PackageJson, subPath?: string) {
    const e = await resolveNodePackageExports(subPath ?? "", pkg, directory);
    if (e) return e;

    if (subPath !== undefined && subPath !== "") {
      return undefined;
    }
    return loadPackageLegacy(directory, pkg);
  }

  async function loadPackageLegacy(
    directory: string,
    pkg: PackageJson,
  ): Promise<ResolvedModule | undefined> {
    const mainFile = options.resolveMain ? options.resolveMain(pkg) : pkg.main;
    if (typeof mainFile !== "string") {
      throw new TypeError(`package "${pkg.name}" main must be a string but was '${mainFile}'`);
    }

    const mainFullPath = resolvePath(directory, mainFile);
    let loaded;
    try {
      loaded = (await loadAsFile(mainFullPath)) ?? (await loadAsDirectory(mainFullPath));
    } catch (e) {
      throw new Error(
        `Cannot find module '${mainFullPath}'. Please verify that the package.json has a valid "main" entry`,
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

async function readPackage(host: ResolveModuleHost, pkgfile: string): Promise<PackageJson> {
  const content = await host.readFile(pkgfile);
  return JSON.parse(content);
}

async function isDirectory(host: ResolveModuleHost, path: string) {
  try {
    const stats = await host.stat(path);
    return stats.isDirectory();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
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
