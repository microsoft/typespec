import { codeFrameColumns } from "@babel/code-frame";
import chalk, { ChalkInstance } from "chalk";
import { getSourceLocation } from "./diagnostics.js";
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
    sourceLocation: getSourceLocation(log.target),
  };
}

export interface FormatLogOptions {
  pretty?: boolean;
}

export interface LogSinkOptions extends FormatLogOptions {}

export function createConsoleSink(options: LogSinkOptions = {}): LogSink {
  function log(data: ProcessedLog) {
    // eslint-disable-next-line no-console
    console.log(formatLog(data, options));
  }

  return {
    log,
  };
}

export function formatLog(log: ProcessedLog, options: FormatLogOptions): string {
  const code = log.code ? ` ${log.code}` : "";
  const level = formatLevel(options, log.level);
  const content = `${level}${code}: ${log.message}`;
  const location = log.sourceLocation;
  if (location?.file) {
    const formattedLocation = formatSourceLocation(location);
    const sourcePreview = formatSourcePreview(location);
    return `${formattedLocation} - ${content}${sourcePreview}`;
  } else {
    return content;
  }
}

function color(options: FormatLogOptions, text: string, color: ChalkInstance) {
  return options.pretty ? color(text) : text;
}

function formatLevel(options: FormatLogOptions, level: LogLevel) {
  switch (level) {
    case "error":
      return color(options, "error", chalk.red);
    case "warning":
      return color(options, "warning", chalk.yellow);
    default:
      return level;
  }
}

function formatSourceLocation(location: SourceLocation) {
  const { line, column } = getLineAndColumn(location);
  const path = location.file.path;

  return `${path}:${line}:${column}`;
}

/**
 * Create a preview of where the log location is.
 *
 * ----------------------------------------------
 *   4 |
 *   5 | @route("/alpha/{id}")
 * > 6 | op doAlpha(@path id: string): abc;
 *     |                               ^
 *   7 |
 *   8 | @route("/beta/{id}")
 *   9 | op doBeta(@path id: string): string;
 */
function formatSourcePreview(location: SourceLocation) {
  const { line, column } = getLineAndColumn(location);

  const result = codeFrameColumns(location.file.text, { start: { line, column } });
  return `\n${result}`;
}

function getLineAndColumn(location: SourceLocation): { line: number; column: number } {
  const pos = location.file.getLineAndCharacterOfPosition(location.pos ?? 0);
  const line = pos.line + 1;
  const column = pos.character + 1;
  return { line, column };
}
