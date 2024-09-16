import { getDirectoryPath, joinPaths, resolvePath } from "./path-utils.js";

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

/**
 * Type for package.json https://docs.npmjs.com/cli/v8/configuring-npm/package-json
 */
export interface NodePackage {
  name: string;
  description?: string;
  type?: "module" | "commonjs";
  main?: string;
  version: string;
  tspMain?: string;
  homepage?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  private?: boolean;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
  manifest: NodePackage;
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
  const realpath = async (x: string) => resolvePath(await host.realpath(x));

  const { baseDir } = options;
  const absoluteStart = baseDir === "" ? "." : await realpath(resolvePath(baseDir));

  if (!(await isDirectory(host, absoluteStart))) {
    throw new TypeError(`Provided basedir '${baseDir}'is not a directory.`);
  }

  // Check if the module name is referencing a path(./foo, /foo, file:/foo)
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(name)) {
    const res = resolvePath(absoluteStart, name);
    const m = (await loadAsFile(res)) || (await loadAsDirectory(res));
    if (m) {
      return m;
    }
  }

  const module = await findAsNodeModule(name, absoluteStart);
  if (module) return module;

  throw new ResolveModuleError(
    "MODULE_NOT_FOUND",
    `Cannot find module '${name}' from '${baseDir}'`,
  );

  /**
   * Returns a list of all the parent directory and the given one.
   */
  function listAllParentDirs(baseDir: string): string[] {
    const paths = [baseDir];
    let current = getDirectoryPath(baseDir);
    while (current !== paths[paths.length - 1]) {
      paths.push(current);
      current = getDirectoryPath(current);
    }

    return paths;
  }

  function getPackageCandidates(
    name: string,
    baseDir: string,
  ): Array<{ path: string; type: "node_modules" | "self" }> {
    const dirs = listAllParentDirs(baseDir);
    return dirs.flatMap((x) => [
      { path: x, type: "self" },
      { path: joinPaths(x, "node_modules", name), type: "node_modules" },
    ]);
  }

  async function findAsNodeModule(
    name: string,
    baseDir: string,
  ): Promise<ResolvedModule | undefined> {
    const dirs = getPackageCandidates(name, baseDir);
    for (const { type, path } of dirs) {
      if (type === "node_modules") {
        if (await isDirectory(host, path)) {
          const n = await loadAsDirectory(path, true);
          if (n) return n;
        }
      } else if (type === "self") {
        const pkgFile = resolvePath(path, "package.json");

        if (await isFile(host, pkgFile)) {
          const pkg = await readPackage(host, pkgFile);
          if (pkg.name === name) {
            const n = await loadPackage(path, pkg);
            if (n) return n;
          }
        }
      }
    }
    return undefined;
  }

  async function loadAsDirectory(directory: string): Promise<ModuleResolutionResult | undefined>;
  async function loadAsDirectory(
    directory: string,
    mustBePackage: true,
  ): Promise<ResolvedModule | undefined>;
  async function loadAsDirectory(
    directory: string,
    mustBePackage?: boolean,
  ): Promise<ModuleResolutionResult | undefined> {
    const pkgFile = resolvePath(directory, "package.json");
    if (await isFile(host, pkgFile)) {
      const pkg = await readPackage(host, pkgFile);
      return loadPackage(directory, pkg);
    }
    if (mustBePackage) {
      return undefined;
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
    pkg: NodePackage,
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

async function readPackage(host: ResolveModuleHost, pkgfile: string): Promise<NodePackage> {
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
