import { ChildProcess, spawn, SpawnOptions } from "child_process";

export class CommandFailedError extends Error {
  constructor(
    msg: string,
    public proc: ChildProcess,
  ) {
    super(msg);
  }
}

/**
 * Return the correct executable name if on unix or windows(with .cmd extension)
 * @param cmd to run
 * @returns
 */
export function xplatCmd(cmd: string) {
  return process.platform === "win32" ? `${cmd}.cmd` : cmd;
}

export interface RunOptions extends SpawnOptions {
  silent?: boolean;
  encoding?: string;
  ignoreCommandNotFound?: boolean;
  throwOnNonZeroExit?: boolean;
}

/** Run the given command and exit if command return non zero exit code. */
export async function runOrExit(
  command: string,
  args: string[],
  options?: RunOptions,
): Promise<ExecResult> {
  return exitOnFailedCommand(() => run(command, args, options));
}

export async function exitOnFailedCommand<T>(cb: () => Promise<T>): Promise<T> {
  try {
    return await cb();
  } catch (e: any) {
    if (e instanceof CommandFailedError) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      process.exit(e.proc.exitCode ?? -1);
    } else {
      throw e;
    }
  }
}

const isCmdOnWindows = ["pnpm", "npm", "code", "code-insiders", "docusaurus", "tsc", "prettier"];

/** Run the given command or throw CommandFailedError if the command returns non zero exit code. */
export async function run(
  command: string,
  args: string[],
  options?: RunOptions,
): Promise<ExecResult> {
  if (!options?.silent) {
    // eslint-disable-next-line no-console
    console.log();
    // eslint-disable-next-line no-console
    console.log(`> ${command} ${args.join(" ")}`);
  }

  options = {
    stdio: "inherit",
    throwOnNonZeroExit: true,
    ...options,
  };

  if (
    process.platform === "win32" &&
    (isCmdOnWindows.includes(command) || isCmdOnWindows.some((x) => command.endsWith(`/${x}`)))
  ) {
    command += ".cmd";
  }

  try {
    const result = await execAsync(command, args, options);
    if (options.throwOnNonZeroExit && result.exitCode !== undefined && result.exitCode !== 0) {
      throw new CommandFailedError(
        `Command \`${command} ${args.join(" ")}\` failed with exit code ${result.exitCode}`,
        result.proc,
      );
    }
    return result;
  } catch (e: any) {
    if (options.ignoreCommandNotFound && e.code === "ENOENT") {
      // eslint-disable-next-line no-console
      console.log(`Skipped: Command \`${command}\` not found.`);
      return { exitCode: 0, stdout: "", stderr: "" } as any;
    } else {
      throw e;
    }
  }
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  proc: ChildProcess;
}
export async function execAsync(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<ExecResult> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (data) => stdout.push(data));
    child.stderr?.on("data", (data) => stderr.push(data));

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

export function clearScreen() {
  process.stdout.write("\x1bc");
}

export function logWithTime(msg: string) {
  const time = new Date().toLocaleTimeString();
  // eslint-disable-next-line no-console
  console.log(`[${time}] ${msg}`);
}
