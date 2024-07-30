// NOTE: We could also use { shell: true } to let windows find the .cmd, but that breaks

import { SpawnSyncOptionsWithStringEncoding, spawnSync } from "child_process";
import pc from "picocolors";
import { inspect } from "util";
import { logDiagnostics } from "../diagnostics.js";
import { Colors, ExternalError } from "../external-error.js";
import { createConsoleSink } from "../logger/console-sink.js";
import { createLogger } from "../logger/logger.js";
import { NodeHost } from "../node-host.js";
import { getBaseFileName } from "../path-utils.js";
import { Diagnostic } from "../types.js";
import { CliCompilerHost } from "./types.js";

// ENOENT checking and handles spaces poorly in some cases.
const isCmdOnWindows = ["code", "code-insiders", "npm"];

export interface RunOptions extends Partial<SpawnSyncOptionsWithStringEncoding> {
  readonly debug?: boolean;
  readonly extraEnv?: NodeJS.ProcessEnv;
  readonly allowNotFound?: boolean;
  readonly allowedExitCodes?: number[];
}

export interface CliHostArgs {
  pretty?: boolean;
  debug?: boolean;
}

export function withCliHost<T extends CliHostArgs>(
  fn: (host: CliCompilerHost, args: T) => void | Promise<void>
): (args: T) => void | Promise<void> {
  return (args: T) => {
    const host = createCLICompilerHost(args);
    return fn(host, args);
  };
}

/**
 * Resolve Cli host automatically using cli args and handle diagnostics returned by the action.
 */
export function withCliHostAndDiagnostics<T extends CliHostArgs>(
  fn: (host: CliCompilerHost, args: T) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>
): (args: T) => void | Promise<void> {
  return async (args: T) => {
    const host = createCLICompilerHost(args);
    const diagnostics = await fn(host, args);
    logDiagnostics(diagnostics, host.logSink);
    logDiagnosticCount(diagnostics);
    if (diagnostics.some((d) => d.severity === "error")) {
      process.exit(1);
    }
  };
}

export function createCLICompilerHost(options: CliHostArgs): CliCompilerHost {
  const logSink = createConsoleSink({ pretty: options.pretty });
  const logger = createLogger({ sink: logSink, level: options.debug ? "trace" : "warning" });
  return { ...NodeHost, logSink, logger, debug: options.debug ?? false };
}

export function run(
  host: CliCompilerHost,
  command: string,
  commandArgs: string[],
  options?: RunOptions
) {
  const logger = host.logger;
  if (options) {
    logger.trace(inspect(options, { depth: null }));
  }
  logger.trace(`> ${command} ${commandArgs.join(" ")}\n`);

  if (options?.extraEnv) {
    options.env = {
      ...(options?.env ?? process.env),
      ...options.extraEnv,
    };
  }

  const baseCommandName = getBaseFileName(command);
  if (process.platform === "win32" && isCmdOnWindows.includes(command)) {
    command += ".cmd";
  }

  const useShell = process.platform === "win32";
  const hasSpace = command.includes(" ");
  let commandToSpawn = command;
  if (useShell && hasSpace) {
    // for command having space (which should be a path), we need to wrap it into " for it to be executed properly in shell
    // but for short command like 'npm', we shouldn't wrap it which would trigger error
    commandToSpawn = `"${command}"`;
    logger.trace(`Command to spawn updated to: ${commandToSpawn}\n`);
  }
  const finalOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf-8",
    stdio: "inherit",
    shell: useShell,
    ...(options ?? {}),
  };

  const proc = spawnSync(commandToSpawn, commandArgs, finalOptions);
  logger.trace(inspect(proc, { depth: null }));

  if (proc.error) {
    if ((proc.error as any).code === "ENOENT" && !options?.allowNotFound) {
      logger.error(`error: Command '${baseCommandName}' not found.`);
      if (options?.debug && proc.error.stack) {
        logger.error(proc.error.stack);
      }
      process.exit(1);
    } else {
      throw proc.error;
    }
  }

  if (proc.status !== 0 && !options?.allowedExitCodes?.includes(proc.status ?? 0)) {
    logger.error(
      `error: Command '${baseCommandName} ${commandArgs.join(" ")}' failed with exit code ${
        proc.status
      }.`
    );
    process.exit(proc.status || 1);
  }

  return proc;
}

export function logDiagnosticCount(diagnostics: readonly Diagnostic[]) {
  if (diagnostics.length === 0) {
    return;
  }
  const errorCount = diagnostics.filter((x) => x.severity === "error").length;
  const warningCount = diagnostics.filter((x) => x.severity === "warning").length;

  const addSuffix = (count: number, suffix: string) =>
    count > 1 ? `${count} ${suffix}s` : count === 1 ? `${count} ${suffix}` : undefined;
  const errorText = addSuffix(errorCount, "error");
  const warningText = addSuffix(warningCount, "warning");

  // eslint-disable-next-line no-console
  console.log(`\nFound ${[errorText, warningText].filter((x) => x !== undefined).join(", ")}.`);
}

export function logInternalCompilerError(error: unknown) {
  /* eslint-disable no-console */
  if (error instanceof ExternalError) {
    // ExternalError should already have all the relevant information needed when thrown.
    console.error(error.render(color));
  } else {
    console.error("Internal compiler error!");
    console.error("File issue at https://github.com/microsoft/typespec");
    console.error();
    console.error(error);
  }
  /* eslint-enable no-console */
}
/**
 * Handle an internal compiler error.
 *
 * NOTE: An expected error, like one thrown for bad input, shouldn't reach
 * here, but be handled somewhere else. If we reach here, it should be
 * considered a bug and therefore we should not suppress the stack trace as
 * that risks losing it in the case of a bug that does not repro easily.
 *
 * @param error error thrown
 */
export function handleInternalCompilerError(error: unknown) {
  logInternalCompilerError(error);
  process.exit(1);
}

function color(text: string, color: Colors) {
  return pc[color](text);
}
