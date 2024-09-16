import { NodeHost } from "@typespec/compiler";
import { CliHost, CliHostArgs, Logger } from "./types.js";

export function withCliHost<T extends CliHostArgs>(
  fn: (host: CliHost, args: T) => void | Promise<void>,
): (args: T) => void | Promise<void> {
  return (args: T) => {
    const host = createCliHost();
    return fn(host, args);
  };
}

export function createCliHost(): CliHost {
  const logger = createConsoleLogger();
  return {
    ...NodeHost,
    logger,
  };
}

export function createConsoleLogger(): Logger {
  // eslint-disable-next-line no-console
  const log = console.log;
  return {
    trace: (message) => log({ level: "trace", message }),
    warn: (message) => log({ level: "warning", message }),
    error: (message) => log({ level: "error", message }),
  };
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
export function handleInternalCompilerError(error: unknown): never {
  /* eslint-disable no-console */
  console.error("Internal compiler error!");
  console.error("File issue at https://github.com/microsoft/typespec");
  console.error();
  console.error(error);
  /* eslint-enable no-console */

  process.exit(1);
}
