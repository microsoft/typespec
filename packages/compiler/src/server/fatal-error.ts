import { inspect } from "util";
import type { ServerLog } from "./types.js";

export type FatalErrorWriter = (message: string) => void;

export function writeServerFatalError(
  write: FatalErrorWriter,
  pendingMessages: readonly ServerLog[],
  error: unknown,
) {
  for (const pending of pendingMessages) {
    write(`${formatPendingServerLog(pending)}\n`);
  }
  write(`${formatFatalError(error)}\n`);
}

export function formatFatalError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  return typeof error === "string" ? error : inspect(error);
}

function formatPendingServerLog(log: ServerLog): string {
  const detail =
    log.detail === undefined
      ? undefined
      : typeof log.detail === "string"
        ? log.detail
        : inspect(log.detail);
  return detail === undefined
    ? `[${log.level}] ${log.message}`
    : `[${log.level}] ${log.message}:\n${detail}`;
}
