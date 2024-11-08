import { getSourceLocation } from "../diagnostics.js";
import type { Logger, LogInfo, LogLevel, LogSink, ProcessedLog } from "../types.js";

const LogLevels = {
  trace: 10,
  warning: 40,
  error: 50,
} as const;

export interface LoggerOptions {
  sink: LogSink;
  level?: LogLevel;
}

const defaultOptions = {
  level: "trace",
} as const;

export function createLogger(options: LoggerOptions): Logger {
  const config = { ...defaultOptions, ...options };

  function log(log: LogInfo) {
    if (LogLevels[config.level] <= LogLevels[log.level]) {
      config.sink.log(processLog(log));
    }
  }

  return {
    log,
    trace: (message) => log({ level: "trace", message }),
    warn: (message) => log({ level: "warning", message }),
    error: (message) => log({ level: "error", message }),
  };
}

function processLog(log: LogInfo): ProcessedLog {
  return {
    level: log.level,
    code: log.code,
    message: log.message,
    sourceLocation: getSourceLocation(log.target, { locateId: true }),
  };
}
