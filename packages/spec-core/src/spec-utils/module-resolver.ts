import { getDirectoryPath, joinPaths, resolvePath } from "@typespec/compiler";

export interface ResolveModuleOptions {
  baseDir: string;
  resolveMain?: (pkg: any) => string;
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

type ResolveModuleErrorCode = "MODULE_NOT_FOUND";
export class ResolveModuleError extends Error {
  public constructor(
    public code: ResolveModuleErrorCode,
    message: string,
  ) {
    super(message);
  }
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
) {
  const { baseDir } = options;
  const absoluteStart = baseDir === "" ? "." : await host.realpath(resolvePath(baseDir));

  if (!(await isDirectory(host, absoluteStart))) {
    throw new TypeError(`Provided basedir '${baseDir}'is not a directory.`);
  }

  // Check if the module name is referencing a path(./foo, /foo, file:/foo)
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(name)) {
    const res = resolvePath(absoluteStart, name);
    const m = (await loadAsFile(res)) || (await loadAsDirectory(res));
    if (m) return host.realpath(m);
  }

  const module = await findAsNodeModule(name, absoluteStart);
  if (module) return host.realpath(module);

  throw new ResolveModuleError(
    "MODULE_NOT_FOUND",
    `Cannot find module '${name} ' from '${baseDir}'`,
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

  function getPackageCandidates(name: string, baseDir: string) {
    const dirs = listAllParentDirs(baseDir);
    return dirs.map((x) => joinPaths(x, "node_modules", name));
  }

  async function findAsNodeModule(name: string, baseDir: string): Promise<string | undefined> {
    const dirs = getPackageCandidates(name, baseDir);
    for (const dir of dirs) {
      if (await isDirectory(host, dir)) {
        const n = await loadAsDirectory(dir);
        if (n) return n;
      }
    }
    return undefined;
  }

  async function loadAsDirectory(directory: string): Promise<string | undefined> {
    const pkgFile = resolvePath(directory, "package.json");
    if (await isFile(host, pkgFile)) {
      const pkg = await readPackage(host, pkgFile);
      const mainFile = options.resolveMain ? options.resolveMain(pkg) : pkg.main;
      if (typeof mainFile !== "string") {
        throw new TypeError(`package "${pkg.name}" main must be a string but was '${mainFile}'`);
      }

      const mainFullPath = resolvePath(directory, mainFile);
      try {
        return loadAsFile(mainFullPath) ?? loadAsDirectory(mainFullPath);
      } catch (e) {
        throw new Error(
          `Cannot find module '${mainFullPath}'. Please verify that the package.json has a valid "main" entry`,
        );
      }
    }

    // Try to load index file
    return loadAsFile(joinPaths(directory, "index"));
  }

  async function loadAsFile(file: string): Promise<string | undefined> {
    if (await isFile(host, file)) {
      return file;
    }

    const extensions = [".js"];
    for (const ext of extensions) {
      const fileWithExtension = file + ext;
      if (await isFile(host, fileWithExtension)) {
        return fileWithExtension;
      }
    }
    return undefined;
  }
}

async function readPackage(host: ResolveModuleHost, pkgfile: string) {
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
