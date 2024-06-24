import { NodeHost } from "@typespec/compiler";
import { CliHost, CliHostArgs, Logger } from "./types.js";

export function withCliHost<T extends CliHostArgs>(
  fn: (host: CliHost, args: T) => void | Promise<void>
): (args: T) => void | Promise<void> {
  return (args: T) => {
    const host = createCliHost(args);
    return fn(host, args);
  };
}

export function createCliHost(options: CliHostArgs): CliHost {
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
