import type { ModuleResolutionResult, ResolveModuleHost } from "@typespec/compiler";
import { exec, spawn, SpawnOptions } from "child_process";
import { readFile, realpath, stat } from "fs/promises";
import path, { dirname, normalize, resolve } from "path";
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

export async function executeCommand(
  command: string,
  args: string[],
  options: any,
  on?: executionEvents,
): Promise<ExecOutput> {
  let stdoutstr: string = "";
  let errMessage: string = "";
  let retcode = 0;
  if (args.length > 0) {
    command = `${command} ${args.join(" ")}`;
  }
  // exec(command, options, (error, stdout, stderr) => {
  //   if (error) {
  //     // logger.error(`Error: ${error.message}`);
  //     errMessage += error.message;
  //     retcode = error.code ?? 0;
  //     if (on && on.onError) {
  //       on.onError(error, stdout.toString(), stderr.toString());
  //     }
  //   }
  //   if (stderr) {
  //     // logger.error(`Stderr: ${stderr}`);
  //     errMessage += stderr;
  //     if (on && on.onStdioError) {
  //       on.onStdioError(stderr.toString());
  //     }
  //   }
  //   stdoutstr += stdout;
  //   on?.onStdioOut?.(stdout.toString());
  //   // logger.info(`Stdout: ${stdout}`);
  // });

  const child = exec(command, options);
  child.stdout?.on("data", (data) => {
    // logger.info(`Stdout: ${data}`);
    stdoutstr += data.toString();
    on?.onStdioOut?.(data.toString());
  });

  child.stderr?.on("data", (data) => {
    errMessage += data.toString();
    on?.onStdioError?.(data.toString());
  });

  if (on && on.onError) {
    child.on("error", (error: any) => {
      on.onError!(error, stdoutstr, errMessage);
    });
  }
  if (on && on.onExit) {
    child.on("exit", (code) => {
      on.onExit!(code, stdoutstr, errMessage);
    });
  }

  child.on("close", (code) => {
    // logger.info(`Child process exited with code ${code}`);
    retcode = code ?? 0;
  });

  child.on("exit", (code) => {
    // logger.info(`Child process exited with code ${code}`);
    retcode = code ?? 0;
  });

  return {
    stdout: stdoutstr,
    stderr: errMessage,
    exitCode: retcode,
    error: errMessage,
    spawnOptions: options,
  };
}

export async function promisifyExec(
  command: string,
  args: string[],
  options: any,
  on?: executionEvents,
): Promise<ExecOutput> {
  // let stdoutstr: string = "";
  // let errMessage: string = "";
  // let retcode = 0;
  // if (args.length > 0) {
  //   command = `${command} ${args.join(" ")}`;
  // }

  // const execPromise = promisify(exec);

  // const { stdout, stderr } = await execPromise(command, options);
  // if (stdout) {
  //   stdoutstr += stdout;
  //   on?.onStdioOut?.(stdout.toString());
  // }
  // if (stderr) {
  //   errMessage += stderr;
  //   // retcode = 1;
  //   on?.onStdioError?.(stderr.toString());
  // }
  // logger.info(`Stdout: ${stdout}`);
  // return {
  //   stdout: stdoutstr,
  //   stderr: errMessage,
  //   exitCode: retcode,
  //   error: errMessage,
  //   spawnOptions: options,
  // };

  let stdout: string = "";
  let stderr: string = "";
  let retcode = 0;
  if (args.length > 0) {
    command = `${command} ${args.join(" ")}`;
  }
  return await new Promise((resolve, reject) => {
    const child = exec(command, options);
    child.stdout?.on("data", (data) => {
      // logger.info(`Stdout: ${data}`);
      stdout += data.toString();
      on?.onStdioOut?.(data.toString());
    });
    child.on("error", (error) => {
      stderr += error.message;
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
      on?.onStdioError?.(data.toString());
    });
    child.on("close", (code) => {
      retcode = code ?? 0;
      resolve({
        stdout: stdout,
        stderr: stderr,
        exitCode: retcode,
        error: stderr,
        spawnOptions: options,
      });
    });
    child.on("exit", (code) => {
      retcode = code ?? 0;
      resolve({
        stdout: stdout,
        stderr: stderr,
        exitCode: retcode,
        error: stderr,
        spawnOptions: options,
      });
    });
  });
}

export async function spawnExecution(
  command: string,
  args: string[],
  options: any,
  on?: executionEvents,
): Promise<ExecOutput> {
  let stdout = "";
  let stderr = "";
  let retcode = 0;

  const child = spawn(command, args, options);

  child.stdout.on("data", (data) => {
    // logger.info(`Stdout: ${data}`);
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
    // logger.info(`Child process exited with code ${code}`);
    retcode = code ?? 0;
  });

  child.on("exit", (code) => {
    // logger.info(`Child process exited with code ${code}`);
    retcode = code ?? 0;
  });

  return {
    stdout: stdout,
    stderr: stderr,
    exitCode: retcode,
    error: stderr,
    spawnOptions: options,
  };
}

export async function resolveTypeSpecCli(absolutePath: string): Promise<Executable | undefined> {
  if (!path.isAbsolute(absolutePath) || (await isFile(absolutePath))) {
    return undefined;
  }
  const modelInfo = await loadModule(absolutePath, "@typespec/compiler");
  if (modelInfo) {
    //const cli = modelInfo.executables.find((exe) => exe.name === "tsp");
    const cmdPath = path.resolve(modelInfo.path, "cmd/tsp.js");
    return {
      command: "node",
      args: [cmdPath],
    };
  }
  return undefined;
}
