import type { ModuleResolutionResult, ResolveModuleHost } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { readFile, realpath, stat } from "fs/promises";
import { dirname, normalize, resolve } from "path";
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

export interface ExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  error: string;
  spawnOptions: SpawnOptions;
}

export interface executionEvents {
  onStdioOut?: (data: string) => void;
  onStdioError?: (error: string) => void;
  onError?: (error: any, stdout: string, stderr: string) => void;
  onExit?: (code: number | null, stdout: string, stderror: string) => void;
}

export async function spawnExecution(
  command: string,
  args: string[],
  options: any,
  on?: executionEvents,
): Promise<ExecOutput> {
  let stdout = "";
  let stderr = "";
  let retCode = 0;

  const child = spawn(command, args, options);

  child.stdout.on("data", (data) => {
    stdout += data.toString();
    on?.onStdioOut?.(data.toString());
  });

  child.stderr.on("data", (data) => {
    stderr += data.toString();
    on?.onStdioError?.(data.toString());
  });

  if (on && on.onError) {
    child.on("error", (error: any) => {
      on.onError!(error, stdout, stderr);
    });
  }
  if (on && on.onExit) {
    child.on("exit", (code) => {
      on.onExit!(code, stdout, stderr);
    });
  }

  child.on("close", (code) => {
    retCode = code ?? 0;
  });

  child.on("exit", (code) => {
    retCode = code ?? 0;
  });

  return {
    stdout: stdout,
    stderr: stderr,
    exitCode: retCode,
    error: stderr,
    spawnOptions: options,
  };
}

export async function promisifySpawn(
  command: string,
  args: string[],
  options: SpawnOptions,
  on?: executionEvents,
): Promise<ExecOutput> {
  const shell = process.platform === "win32";
  const cmd = shell && command.includes(" ") ? `"${command}"` : command;
  let stdout = "";
  let stderr = "";
  let retCode = 0;

  const spawnOptions: SpawnOptions = {
    shell,
    stdio: "pipe",
    windowsHide: true,
    ...options,
  };
  const child = spawn(cmd, args, spawnOptions);

  child.stdout?.on("data", (data) => {
    stdout += data.toString();
    if (on && on.onStdioOut) {
      on.onStdioOut(data.toString());
    }
  });

  child.stderr?.on("data", (data) => {
    stderr += data.toString();
    if (on && on.onStdioError) {
      on.onStdioError(data.toString());
    }
  });

  child.on("error", (error) => {
    if (on && on.onError) {
      on.onError(error, stdout, stderr);
    }
    stderr += error.message;
  });

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      stderr += error.message;
      resolve({
        stdout: stdout,
        stderr: stderr,
        exitCode: 0x1212,
        error: stderr,
        spawnOptions: spawnOptions,
      });
    });
    child.on("close", (code) => {
      retCode = code ?? 0;
      resolve({
        stdout: stdout,
        stderr: stderr,
        exitCode: retCode,
        error: stderr,
        spawnOptions: spawnOptions,
      });
    });

    child.on("exit", (code) => {
      retCode = code ?? 0;
      if (on && on.onExit) {
        on.onExit(code, stdout, stderr);
      }
      resolve({
        stdout: stdout,
        stderr: stderr,
        exitCode: retCode,
        error: stderr,
        spawnOptions: spawnOptions,
      });
    });
  });
}
