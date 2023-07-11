// NOTE: We could also use { shell: true } to let windows find the .cmd, but that breaks

import { SpawnSyncOptionsWithStringEncoding, spawnSync } from "child_process";
import { inspect } from "util";
import { createConsoleSink } from "../logger/console-sink.js";
import { createLogger } from "../logger/logger.js";
import { NodeHost } from "../node-host.js";
import { getBaseFileName } from "../path-utils.js";
import { CompilerHost, Diagnostic } from "../types.js";
import { ExternalError } from "../util.js";

// ENOENT checking and handles spaces poorly in some cases.
const isCmdOnWindows = ["code", "code-insiders", "npm"];

export interface RunOptions extends Partial<SpawnSyncOptionsWithStringEncoding> {
  readonly debug?: boolean;
  readonly extraEnv?: NodeJS.ProcessEnv;
  readonly allowNotFound?: boolean;
  readonly allowedExitCodes?: number[];
}

export function createCLICompilerHost(options: { pretty?: boolean }): CompilerHost {
  return { ...NodeHost, logSink: createConsoleSink({ pretty: options.pretty }) };
}

export function run(command: string, commandArgs: string[], options?: RunOptions) {
  const logger = createLogger({
    sink: NodeHost.logSink,
    level: options?.debug ? "trace" : "warning",
  });
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

  const finalOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf-8",
    stdio: "inherit",
    ...(options ?? {}),
  };

  const proc = spawnSync(command, commandArgs, finalOptions);
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
  const errorCount = diagnostics.filter((x) => x.severity === "error").length;
  const warningCount = diagnostics.filter((x) => x.severity === "warning").length;

  const addSuffix = (count: number, suffix: string) =>
    count > 1 ? `${count} ${suffix}s` : count === 1 ? `${count} ${suffix}` : undefined;
  const errorText = addSuffix(errorCount, "error");
  const warningText = addSuffix(warningCount, "warning");

  console.log(`\nFound ${[errorText, warningText].filter((x) => x !== undefined).join(", ")}.`);
}

export function internalCompilerError(error: unknown): never {
  // NOTE: An expected error, like one thrown for bad input, shouldn't reach
  // here, but be handled somewhere else. If we reach here, it should be
  // considered a bug and therefore we should not suppress the stack trace as
  // that risks losing it in the case of a bug that does not repro easily.
  if (error instanceof ExternalError) {
    // ExternalError should already have all the relevant information needed when thrown.
    console.error(error);
  } else {
    console.error("Internal compiler error!");
    console.error("File issue at https://github.com/microsoft/typespec");
    console.error();
    console.error(error);
  }

  process.exit(1);
}
