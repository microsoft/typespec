import { codeFrameColumns } from "@babel/code-frame";
import { relative } from "path/posix";
import pc from "picocolors";
import { Formatter } from "picocolors/types.js";
import { getChildLogs } from "../helpers/logger-child-utils.js";
import { LogLevel, LogSink, ProcessedLog, SourceLocation } from "../types.js";
import { supportsHyperlink } from "./support-hyperlinks.js";

export interface FormatLogOptions {
  pathRelativeTo?: string;
  pretty?: boolean;
  excludeLogLevel?: boolean;
}

export interface ConsoleSinkOptions extends FormatLogOptions {}

export function createConsoleSink(options: ConsoleSinkOptions = {}): LogSink {
  function log(data: ProcessedLog) {
    // eslint-disable-next-line no-console
    console.log(formatLog(data, options));
  }

  return {
    log,
    trackAction: (action, startLog, logChildLogs, endLog) =>
      trackAction(action, startLog, logChildLogs, endLog),
  };
}

const supportHyperLinks = supportsHyperlink(process.stdout);
function hyperlink(text: string, url: string | undefined, options: FormatLogOptions) {
  if (supportHyperLinks && url && options.pretty) {
    return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
  }
  return text;
}

export function formatLog(log: ProcessedLog, options: FormatLogOptions): string {
  const code = log.code ? ` ${hyperlink(color(options, log.code, pc.gray), log.url, options)}` : "";
  const level: string = options.excludeLogLevel === true ? "" : formatLevel(options, log.level);
  const content = level || code ? `${level}${code}: ${log.message}` : log.message;
  const root = log.sourceLocation;
  if (root?.file) {
    const formattedLocation = formatSourceLocation(options, root);
    const sourcePreview = formatSourcePreview(options, root);
    const message = [`${formattedLocation} - ${content}${sourcePreview}`];

    for (const related of log.related ?? []) {
      const formattedLocation = formatSourceLocation(options, related.location);
      const sourcePreview = formatSourcePreview(options, related.location);
      message.push(indent(`${formattedLocation} - ${related.message}${sourcePreview}`));
    }

    return message.join("\n");
  } else {
    return content;
  }
}

function color(options: FormatLogOptions, text: string, color: Formatter) {
  return options.pretty ? color(text) : text;
}

function formatLevel(options: FormatLogOptions, level: LogLevel) {
  switch (level) {
    case "error":
      return color(options, "error", pc.red);
    case "warning":
      return color(options, "warning", pc.yellow);
    case "trace":
      return color(options, "trace", pc.green);
  }
}

function formatSourceLocation(options: FormatLogOptions, location: SourceLocation) {
  const postition = getLineAndColumn(location);
  const prePath = options.pathRelativeTo
    ? relative(process.cwd(), location.file.path)
    : location.file.path;

  const path = color(options, prePath, pc.cyan);
  const line = color(options, postition.start.line.toString(), pc.yellow);
  const column = color(options, postition.start.column.toString(), pc.yellow);
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
function formatSourcePreview(options: FormatLogOptions, location: SourceLocation) {
  if (!options.pretty || location.isSynthetic) {
    return "";
  }
  const postion = getLineAndColumn(location);

  const result = codeFrameColumns(location.file.text, postion, {
    linesAbove: 0,
    linesBelow: 0,
  });
  return `\n${result}`;
}

function indent(code: string) {
  return code
    .split("\n")
    .map((x) => `  ${x}`)
    .join("\n");
}

interface RealLocation {
  start: { line: number; column: number };
  end?: { line: number; column: number };
}

function getLineAndColumn(location: SourceLocation): RealLocation {
  const pos = location.file.getLineAndCharacterOfPosition(location.pos ?? 0);
  const end = location.end ? location.file.getLineAndCharacterOfPosition(location.end) : undefined;
  const result: RealLocation = {
    start: { line: pos.line + 1, column: pos.character + 1 },
  };
  if (end) {
    result.end = { line: end.line + 1, column: end.character + 1 };
  }
  return result;
}

async function trackAction<T>(
  asyncAction: () => Promise<T>,
  startLog: ProcessedLog,
  logChildLogs: boolean = false,
  endLog?: ProcessedLog,
): Promise<T> {
  // eslint-disable-next-line no-console
  console.log(startLog.message);

  try {
    return await asyncAction();
  } finally {
    if (endLog) {
      // eslint-disable-next-line no-console
      console.log(endLog);
    }

    if (logChildLogs) {
      const childLogs = getChildLogs();
      // eslint-disable-next-line no-console
      childLogs.forEach((message) => console.log(message));
    }
  }
}
