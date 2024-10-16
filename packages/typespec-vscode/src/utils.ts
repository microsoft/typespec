import type { ModuleResolutionResult, NodePackage, ResolveModuleHost } from "@typespec/compiler";
import { readFile, realpath, stat } from "fs/promises";
import { dirname, join, normalize, resolve } from "path";
import { pathToFileURL } from "url";
import { Executable } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";

/** normalize / and \\ to / */
export function normalizeSlash(str: string): string {
  return str.replaceAll(/\\/g, "/");
}

export function normalizePath(path: string): string {
  const normalized = normalize(path);
  const resolved = resolve(normalized);
  const result = normalizeSlash(resolved);
  return result;
}

export async function isFile(path: string) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function isDirectory(path: string) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delayInMs: number): T {
  let timer: NodeJS.Timeout | undefined;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delayInMs);
  } as T;
}

/**
 *
 * @param exe
 * @param win32Only only use Shell when the process.platform is "win32"
 * @returns
 */
export function useShellInExec(exe: Executable, win32Only: boolean = true): Executable {
  if (!win32Only || process.platform === "win32") {
    if (exe.options) {
      exe.options.shell = true;
    } else {
      exe.options = { shell: true };
    }
    if (exe.command.includes(" ")) {
      exe.command = `"${exe.command}"`;
    }
  }
  return exe;
}

/**
 * trigger action for the given curDir and all its parent dirs. return T to stop the loop or undefined to continue
 * @param cur if cur is a directory, the foreach will start from cur, otherwise, it will start from the parent directory of cur (file)
 * @param action
 * @returns
 */
export async function forCurAndParentDirectories<T>(
  cur: string,
  action: (dir: string) => T | undefined,
) {
  let curDir = undefined;
  try {
    const stats = await stat(cur);
    curDir = stats.isDirectory() ? cur : stats.isFile() ? dirname(cur) : undefined;
  } catch (e) {
    logger.error("Unexpected exception when checking whether cur is a file or directory", [e]);
    return undefined;
  }
  if (!curDir) {
    logger.error("Unexpected error, given cur is not a file or folder: " + cur);
    return undefined;
  }

  let lastFolder = "";
  let curFolder = curDir;
  while (curFolder !== lastFolder) {
    const r = action(curFolder);
    if (r !== undefined) {
      return r;
    }
    lastFolder = curFolder;
    curFolder = dirname(curFolder);
  }
  return undefined;
}

export function isWhitespaceString(str: string | undefined): boolean {
  if (str === undefined) return false;
  return /^\s*$/.test(str);
}

export function firstNonWhitespaceCharacterIndex(line: string): number {
  return line.search(/\S/);
}

export function distinctArray<T, P>(arr: T[], keySelector: (item: T) => P): T[] {
  const map = new Map<P, T>();
  for (const item of arr) {
    map.set(keySelector(item), item);
  }
  return Array.from(map.values());
}

/**
 *
 * @param baseDir the dir containing the package.json file
 * @returns
 */
export async function loadNodePackage(baseDir: string): Promise<NodePackage | undefined> {
  if (!baseDir) {
    throw new Error("baseDir is required");
  }
  const packageJsonPath = join(baseDir, "package.json");
  try {
    if (!isFile(packageJsonPath)) {
      return undefined;
    }

    const content = await logger.profile(`Loading NpmPackage: ${packageJsonPath}`, async () => {
      return await readFile(packageJsonPath, "utf-8");
    });
    const data = JSON.parse(content) as NodePackage;

    if (!data || !data.name || !data.version) {
      logger.error(
        `Invalid package.json file: ${packageJsonPath}. Failed to parse it as json or missing name or version.`,
      );
      return undefined;
    }
    return data;
  } catch (e) {
    logger.error(`Exception when loading package.json from ${baseDir}`, [e]);
    return undefined;
  }
}

export async function loadModule(
  baseDir: string,
  packageName: string,
): Promise<ModuleResolutionResult | undefined> {
  const { resolveModule } = await import("@typespec/compiler/module-resolver");

  const host: ResolveModuleHost = {
    realpath,
    readFile: (path: string) => readFile(path, "utf-8"),
    stat,
  };
  try {
    logger.debug(`Try to resolve module ${packageName} from local, baseDir: ${baseDir}`);
    const module = await logger.profile(`Resolving module ${packageName}`, async () => {
      return await resolveModule(host, packageName, {
        baseDir,
      });
    });
    return module;
  } catch (e) {
    logger.debug(`Exception when resolving module for ${packageName} from ${baseDir}`, [e]);
    return undefined;
  }
}

export async function loadModuleExports(
  baseDir: string,
  packageName: string,
): Promise<object | undefined> {
  try {
    const module = await loadModule(baseDir, packageName);
    if (!module) {
      return undefined;
    }
    const entrypoint = module.type === "file" ? module.path : module.mainFile;
    const path = pathToFileURL(entrypoint).href;
    const exports = await import(path);

    return exports;
  } catch (e) {
    logger.debug(`Exception when resolving module for ${packageName} from ${baseDir}`, [e]);
    return undefined;
  }
}
