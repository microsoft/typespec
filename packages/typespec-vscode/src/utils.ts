import type { ModuleResolutionResult, ResolveModuleHost } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { readFile, realpath, stat } from "fs/promises";
import { dirname } from "path";
import { CancellationToken } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";
import { isUrl } from "./path-utils.js";

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
): Promise<ExecOutput> {
  return spawnExecution(exe, args, cwd, {
    onStdioOut: (data) => {
      logger.info(data.trim());
    },
    onStdioError: (error) => {
      logger.error(error.trim());
    },
    onError: (error) => {
      if (error?.code === "ENOENT") {
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

/**
 * if the operation is cancelled, the promise will be rejected with reason==="cancelled"
 * if the operation is timeout, the promise will be rejected with reason==="timeout"
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
      reject("cancelled");
    });
    setTimeout(() => {
      reject("timeout");
    }, timeoutInMs);
    action.then(resolve, reject);
  });
}
