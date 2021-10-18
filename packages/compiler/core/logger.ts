import { computeTargetLocation } from "./diagnostics.js";
import { Logger, LogInfo, LogLevel, LogSink, ProcessedLog, SourceLocation } from "./types.js";

const LogLevels = {
  debug: 10,
  verbose: 20,
  info: 30,
  warning: 40,
  error: 50,
} as const;

export interface LoggerOptions {
  sink: LogSink;
  level?: LogLevel;
}

const defaultOptions = {
  level: "info",
} as const;

export function createLogger(options: LoggerOptions): Logger {
  const config = { ...defaultOptions, ...options };

  function log(log: LogInfo) {
    if (LogLevels[config.level] >= LogLevels[log.level]) {
      config.sink.log(processLog(log));
    }
  }

  return {
    log,
    debug: (message) => log({ level: "debug", message }),
    verbose: (message) => log({ level: "verbose", message }),
    info: (message) => log({ level: "info", message }),
    warn: (message) => log({ level: "warning", message }),
    error: (message) => log({ level: "error", message }),
  };
}

function processLog(log: LogInfo): ProcessedLog {
  return {
    level: log.level,
    code: log.code,
    message: log.message,
    sourceLocation: computeTargetLocation(log.target),
  };
}

export function createConsoleSink(): LogSink {
  function log(data: ProcessedLog) {
    console.log(formatLog(data));
  }

  return {
    log,
  };
}

export function formatLog(log: ProcessedLog): string {
  const code = log.code ? ` ${log.code}` : "";
  const level = log.level;
  const content = `${level}${code}: ${log.message}`;
  const location = log.sourceLocation;
  if (location?.file) {
    const formattedLocation = formatSourceLocation(location);
    return `${formattedLocation} - ${content}`;
  } else {
    return content;
  }
}

export function formatSourceLocation(location: SourceLocation) {
  const pos = location.file.getLineAndCharacterOfPosition(location.pos ?? 0);
  const line = pos.line + 1;
  const col = pos.character + 1;
  const path = location.file.path;
  return `${path}:${line}:${col}`;
}
