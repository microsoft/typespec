import { fileURLToPath, pathToFileURL } from "url";
import { getDirectoryPath, joinPaths, normalizePath, resolvePath } from "../core/path-utils.js";
import { PackageJson } from "../types/package-json.js";
import { resolvePackageExports } from "./esm/resolve-package-exports.js";
import { InvalidModuleSpecifierError, parseNodeModuleImport } from "./esm/utils.js";

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
   * @default ["index.mjs", "index.js"]
   */
  directoryIndexFiles?: string[];
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

type ResolveModuleErrorCode = "MODULE_NOT_FOUND" | "INVALID_MAIN";
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
 * @param name
 * @param options
 * @returns
 */
export async function resolveModule(
  host: ResolveModuleHost,
  name: string,
  options: ResolveModuleOptions,
): Promise<ModuleResolutionResult> {
  const realpath = async (x: string) => normalizePath(await host.realpath(x));

  const { baseDir } = options;
  const absoluteStart = baseDir === "" ? "." : await realpath(resolvePath(baseDir));

  if (!(await isDirectory(host, absoluteStart))) {
    throw new TypeError(`Provided basedir '${baseDir}'is not a directory.`);
  }
  console.log("Trying to resolve as node_module3", {
    name,
    matchRelative: /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(name),
  });

  // Check if the module name is referencing a path(./foo, /foo, file:/foo)
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(name)) {
    const res = resolvePath(absoluteStart, name);
    const m = (await loadAsFile(res)) || (await loadAsDirectory(res));
    if (m) {
      return m;
    }
  }

  const self = await resolveSelf(name, absoluteStart);
  if (self) return self;

  const module = await resolveAsNodeModule(name, absoluteStart);
  if (module) return module;

  throw new ResolveModuleError(
    "MODULE_NOT_FOUND",
    `Cannot find module '${name}' from '${baseDir}'`,
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
    name: string,
    baseDir: string,
  ): Promise<ResolvedModule | undefined> {
    const dirs = listDirHierarchy(baseDir);
    for (const dir of dirs) {
      const nodeModulesDir = joinPaths(dir, "node_modules");
      try {
        const e = await resolvePackageExport(name, nodeModulesDir);

        if (e) return e;
      } catch (error) {
        if (error instanceof InvalidModuleSpecifierError) {
          // TODO: warn for backcompat
        } else {
          throw error; // TODO: convert to standard error
        }
      }
      const n = await loadPackageAtPath(joinPaths(nodeModulesDir, name));
      if (n) return n;
    }
    return undefined;
  }

  async function loadPackageAtPath(path: string): Promise<ResolvedModule | undefined> {
    const pkgFile = resolvePath(path, "package.json");

    if (await isFile(host, pkgFile)) {
      const pkg = await readPackage(host, pkgFile);
      const n = await loadPackage(path, pkg);
      if (n) return n;
    }
    return undefined;
  }

  /**
   * Try to load using package.json exports.
   * @param importSpecifier A combination of the package name and exports entry.
   * @param directory `node_modules` directory.
   */
  async function resolvePackageExport(
    importSpecifier: string,
    directory: string,
  ): Promise<ResolvedModule | undefined> {
    const module = parseNodeModuleImport(importSpecifier);
    if (module === null) return undefined;
    const pkgDir = resolvePath(directory, module.packageName);
    const pkgFile = resolvePath(pkgDir, "package.json");
    if (!(await isFile(host, pkgFile))) return undefined;
    const pkg = await readPackage(host, pkgFile);
    if (!pkg.exports) return undefined;
    const match = await resolvePackageExports(
      {
        packageUrl: pathToFileURL(pkgDir),
        importSpecifier,
        pkgJsonPath: pkgFile,
        moduleDirs: ["node_modules"],
        conditions: [],
        resolveId: function (id: string, baseDir: string) {
          throw new Error("Function not implemented.");
        },
      },
      "./" + module.subPath,
      pkg.exports,
    );
    if (!match) return undefined;
    const resolved = await resolveEsmMatch(match);
    return {
      type: "module",
      mainFile: resolved,
      manifest: pkg,
      path: pkgDir,
    };
  }

  async function resolveEsmMatch(match: string | URL) {
    const resolved = fileURLToPath(match);
    if (await isFile(host, resolved)) {
      return resolved;
    }
    throw new Error(`resolved ${resolved}`);
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
        `Package ${pkg.name} main file "${mainFile}" is invalid.`,
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
