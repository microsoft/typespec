import type { ModuleResolutionResult, PackageJson, ResolveModuleHost } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { mkdtemp, readdir, readFile, realpath, stat } from "fs/promises";
import { dirname } from "path";
import { CancellationToken } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import which from "which";
import { parseDocument } from "yaml";
import logger from "./log/logger.js";
import { getDirectoryPath, isUrl, joinPaths } from "./path-utils.js";
import { ResultCode } from "./types.js";

const ERROR_CODE_ENOENT = "ENOENT";

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

export async function createTempDir(tmpRoot: string, prefix: string): Promise<string | undefined> {
  try {
    return await mkdtemp(joinPaths(tmpRoot, prefix));
  } catch (e) {
    logger.error("Failed to create temp folder", [e]);
    return undefined;
  }
}

export function isWhitespaceStringOrUndefined(str: string | undefined): boolean {
  return str === undefined || str.trim() === "";
}

export function* listParentFolder(folder: string, includeSelf: boolean) {
  if (isWhitespaceStringOrUndefined(folder)) {
    return;
  }
  let cur = folder;
  if (!includeSelf) {
    cur = dirname(cur);
    if (cur === folder) {
      return;
    }
  }

  let last = "";
  while (cur !== last) {
    yield cur;
    last = cur;
    cur = dirname(cur);
  }
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

export function tryParseJson(str: string): any | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

export async function tryReadFileOrUrl(
  pathOrUrl: string,
): Promise<{ content: string; url: string } | undefined> {
  if (isUrl(pathOrUrl)) {
    const result = await tryReadUrl(pathOrUrl);
    return result;
  } else {
    const result = await tryReadFile(pathOrUrl);
    return result ? { content: result, url: pathOrUrl } : undefined;
  }
}

export async function tryReadFile(path: string): Promise<string | undefined> {
  try {
    const content = await readFile(path, "utf-8");
    return content;
  } catch (e) {
    logger.debug(`Failed to read file: ${path}`, [e]);
    return undefined;
  }
}

export async function tryReadDir(path: string): Promise<string[] | undefined> {
  try {
    return await readdir(path);
  } catch (e) {
    return undefined;
  }
}

export async function tryReadUrl(
  url: string,
): Promise<{ content: string; url: string } | undefined> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const content = await response.text();
    return { content, url: response.url };
  } catch (e) {
    logger.debug(`Failed to fetch from url: ${url}`, [e]);
    return undefined;
  }
}

export function tryParseYaml(str: string): any | undefined {
  try {
    return parseDocument(str);
  } catch {
    return undefined;
  }
}
export interface ExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  error: any;
  spawnOptions: SpawnOptions;
}
export interface spawnExecutionEvents {
  onStdioOut?: (data: string) => void;
  onStdioError?: (error: string) => void;
  onError?: (error: any, stdout: string, stderr: string) => void;
  onExit?: (code: number | null, stdout: string, stderror: string) => void;
}

/**
 * The promise will be rejected if the process exits with non-zero code or error occurs. Please make sure the rejection is handled property with try-catch
 *
 * @param exe
 * @param args
 * @param cwd
 * @returns
 */
export function spawnExecutionAndLogToOutput(
  exe: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
  logStderrAsError: boolean = false,
): Promise<ExecOutput> {
  return spawnExecution(exe, args, cwd, env, {
    onStdioOut: (data) => {
      logger.info(data.trim());
    },
    onStdioError: (error) => {
      if (logStderrAsError) {
        logger.error(error.trim());
      } else {
        logger.info(error.trim());
      }
    },
    onError: (error) => {
      if (error?.code === ERROR_CODE_ENOENT) {
        logger.error(`Cannot find ${exe} executable. Make sure it can be found in your path.`);
      }
    },
  });
}

/**
 * The promise will be rejected if the process exits with non-zero code or error occurs. Please make sure the rejection is handled property with try-catch
 *
 * @param exe
 * @param args
 * @param cwd
 * @param on
 * @returns
 */
export function spawnExecution(
  exe: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
  on?: spawnExecutionEvents,
): Promise<ExecOutput> {
  const shell = process.platform === "win32";
  const cmd = shell && exe.includes(" ") ? `"${exe}"` : exe;
  let stdout = "";
  let stderr = "";

  const options: SpawnOptions = {
    shell,
    stdio: "pipe",
    windowsHide: true,
    cwd,
  };
  if (env) {
    options.env = { ...process.env, ...env };
  }
  const child = spawn(cmd, args, options);

  child.stdout!.on("data", (data) => {
    stdout += data.toString();
    if (on && on.onStdioOut) {
      try {
        on.onStdioOut!(data.toString());
      } catch (e) {
        logger.error("Unexpected error in onStdioOut", [e]);
      }
    }
  });
  child.stderr!.on("data", (data) => {
    stderr += data.toString();
    if (on && on.onStdioError) {
      try {
        on.onStdioError!(data.toString());
      } catch (e) {
        logger.error("Unexpected error in onStdioError", [e]);
      }
    }
  });
  if (on && on.onError) {
    child.on("error", (error: any) => {
      try {
        on.onError!(error, stdout, stderr);
      } catch (e) {
        logger.error("Unexpected error in onError", [e]);
      }
    });
  }
  if (on && on.onExit) {
    child.on("exit", (code) => {
      try {
        on.onExit!(code, stdout, stderr);
      } catch (e) {
        logger.error("Unexpected error in onExit", [e]);
      }
    });
  }
  return new Promise((res, rej) => {
    child.on("error", (error: any) => {
      rej({
        stdout,
        stderr,
        exitCode: -1,
        error: error,
        spawnOptions: options,
      });
    });
    child.on("exit", (exitCode) => {
      if (exitCode === 0 || exitCode === null) {
        res({
          stdout,
          stderr,
          exitCode: exitCode ?? 0,
          error: "",
          spawnOptions: options,
        });
      } else {
        rej({
          stdout,
          stderr,
          exitCode: exitCode,
          error: `${exe} ${args.join(" ")} failed with exit code ${exitCode}`,
          spawnOptions: options,
        });
      }
    });
  });
}

export function isExecOutputCmdNotFound(output: ExecOutput): boolean {
  if (output.exitCode === 0 || output.exitCode === null) {
    return false;
  }
  if (output.error?.code === ERROR_CODE_ENOENT) {
    return true;
  }
  if (output.spawnOptions.shell) {
    // when starting with shell, our cmd will be wrapped so can't get the error code, so check the stderr
    return output.stderr.includes("not recognized as an internal or external command");
  }
  return false;
}

/**
 * if the operation is cancelled, the promise will be rejected with {@link ResultCode.Cancelled}
 * if the operation is timeout, the promise will be rejected with {@link ResultCode.Timeout}
 *
 * @param action
 * @param token
 * @param timeoutInMs
 * @returns
 */
export function createPromiseWithCancelAndTimeout<T>(
  action: Promise<T>,
  token: CancellationToken,
  timeoutInMs: number,
) {
  return new Promise<T>((resolve, reject) => {
    token.onCancellationRequested(() => {
      reject(ResultCode.Cancelled);
    });
    setTimeout(() => {
      reject(ResultCode.Timeout);
    }, timeoutInMs);
    action.then(resolve, reject);
  });
}

export function* listParentFolders(from: string, includeSelf: boolean) {
  if (includeSelf) {
    yield from;
  }
  let last = from;
  let current = getDirectoryPath(from);
  while (current !== last) {
    yield current;
    last = current;
    current = getDirectoryPath(current);
  }
}

/**
 *
 * @param folder the folder (inclusive) to start searching (up) for package.json
 * @returns
 */
export async function searchAndLoadPackageJson(
  folder: string,
): Promise<{ packageJsonFolder?: string; packageJsonFile?: string; packageJson?: PackageJson }> {
  for (const f of listParentFolders(folder, true /* include self */)) {
    const path = joinPaths(f, "package.json");
    if (await isFile(path)) {
      const json = await loadPackageJsonFile(path);
      if (json) {
        return { packageJsonFolder: f, packageJsonFile: path, packageJson: json };
      } else {
        return { packageJsonFolder: undefined, packageJsonFile: undefined, packageJson: undefined };
      }
    }
  }
  return { packageJsonFolder: undefined, packageJsonFile: undefined, packageJson: undefined };
}

/**
 *
 * @param rootPackageJsonFolder the folder containing package.json.
 * @param depPackageName
 * @returns
 */
export async function loadDependencyPackageJson(
  rootPackageJsonFolder: string,
  depPackageName: string,
): Promise<PackageJson | undefined> {
  const path = joinPaths(rootPackageJsonFolder, "node_modules", depPackageName, "package.json");
  if (!(await isFile(path))) {
    return undefined;
  }
  return await loadPackageJsonFile(path);
}

/**
 *
 * @param packageJsonPath the path to the package.json file. Please be aware that it's the caller's responsibility to ensure the path given is package.json, no further check will be done.
 * @returns
 */
export async function loadPackageJsonFile(
  packageJsonPath: string,
): Promise<PackageJson | undefined> {
  const content = await tryReadFile(packageJsonPath);
  if (!content) return undefined;
  const packageJson = tryParseJson(content);
  if (!packageJson) return undefined;
  return packageJson as PackageJson;
}

/**
 * @returns the path to the installed node executable, or empty string if not found.
 */
export async function checkInstalledNode(): Promise<string> {
  return checkInstalledExecutable("node");
}

export async function checkInstalledTspCli(): Promise<string> {
  return checkInstalledExecutable("tsp");
}

export async function checkInstalledNpm(): Promise<string> {
  return checkInstalledExecutable("npm");
}

export async function checkInstalledExecutable(exe: string): Promise<string> {
  try {
    return await which(exe);
  } catch (e) {
    return "";
  }
}

export async function parseJsonFromFile(filePath: string): Promise<string | undefined> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    const content = JSON.parse(fileContent);
    return content;
  } catch (e) {
    logger.error(`Failed to load JSON file: ${filePath}`, [e]);
    return;
  }
}

/**
 * Throttle the function to be called at most once in every blockInMs milliseconds. This utility
 * is useful when your event handler will trigger the same event multiple times in a short period.
 *
 * @param fn Underlying function to be throttled
 * @param blockInMs Block time in milliseconds
 * @returns a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, blockInMs: number): T {
  let time: number | undefined;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (time === undefined || now - time >= blockInMs) {
      time = now;
      fn.apply(this, args);
    }
  } as T;
}
