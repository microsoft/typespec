import { joinPaths, normalizePath, resolvePath } from "../core/path-utils.js";
import { resolvePackageExports } from "./esm/resolve-package-exports.js";
import { resolvePackageImports } from "./esm/resolve-package-imports.js";
import {
  EsmResolveError,
  InvalidPackageTargetError,
  NoMatchingConditionsError,
} from "./esm/utils.js";
import { NodePackageResolver } from "./node-package-resolver.js";
import {
  ModuleResolutionResult,
  NodePackage,
  ResolvedFile,
  ResolvedModule,
  ResolveModuleHost,
} from "./types.js";
import {
  fileURLToPath,
  isFile,
  listDirHierarchy,
  NodeModuleSpecifier,
  parseNodeModuleSpecifier,
  pathToFileURL,
  readPackage,
} from "./utils.js";

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
    public pkgJson?: NodePackage,
  ) {
    super(message);
  }
}

const defaultDirectoryIndexFiles = ["index.mjs", "index.js"];

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
  const nodePackageResolver = new NodePackageResolver(host);
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
  const moduleSpecifier = parseNodeModuleSpecifier(specifier);
  if (moduleSpecifier !== null) {
    const pkg = await nodePackageResolver.resolve(moduleSpecifier.packageName, absoluteStart);
    const n = pkg && (await loadPackage(pkg, moduleSpecifier.subPath));
    if (n) return n;
  }

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
   * Equivalent implementation to node LOAD_NODE_MODULES with a few non supported features.
   * Cannot load any random file under the load path(only packages).
   */
  async function resolveAsNodeModule(
    specifier: NodeModuleSpecifier,
    baseDir: string,
  ): Promise<ResolvedModule | undefined> {
    const pkg = await nodePackageResolver.resolveFromNodeModules(specifier.packageName, baseDir);
    if (pkg) {
      return await loadPackage(pkg, specifier.subPath);
    } else {
      return undefined;
    }
  }

  async function loadPackageAtPath(
    path: string,
    subPath?: string,
  ): Promise<ResolvedModule | undefined> {
    const pkgFile = resolvePath(path, "package.json");
    if (!(await isFile(host, pkgFile))) return undefined;

    const pkg = await readPackage(host, pkgFile);
    const n = await loadPackage(pkg, subPath);
    if (n) return n;
    return undefined;
  }

  async function resolveNodePackageImports(
    pkg: NodePackage,
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
            const specifier = parseNodeModuleSpecifier(id);
            if (specifier === null) return undefined;
            const resolved = await resolveAsNodeModule(
              specifier,
              fileURLToPath(baseDir.toString()),
            );
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
    pkg: NodePackage,
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

  async function resolveEsmMatch(match: string, isImports: boolean, pkg: NodePackage) {
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

  async function loadPackage(
    pkg: NodePackage,
    subPath?: string,
  ): Promise<ResolvedModule | undefined> {
    const e = await resolveNodePackageExports(subPath ?? "", pkg, pkg.dir);
    if (e) return e;

    if (subPath !== undefined && subPath !== "") {
      return undefined;
    }
    return loadPackageLegacy(pkg.dir, pkg);
  }

  async function loadPackageLegacy(
    directory: string,
    pkg: NodePackage,
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
