import { codeFrameColumns } from "@babel/code-frame";
import isUnicodeSupported from "is-unicode-supported";
import { relative } from "path/posix";
import pc from "picocolors";
import { Formatter } from "picocolors/types.js";
import { getRelativePathFromDirectory } from "../path-utils.js";
import { LogLevel, LogSink, ProcessedLog, SourceLocation, TrackActionTask } from "../types.js";
import { supportsHyperlink } from "./support-hyperlinks.js";

export interface FormatLogOptions {
  pathRelativeTo?: string;
  pretty?: boolean;
  excludeLogLevel?: boolean;
}

export interface ConsoleSinkOptions extends FormatLogOptions {
  /** @internal */
  trackAction?: boolean;
}

export function createConsoleSink(options: ConsoleSinkOptions = {}): LogSink {
  function log(data: ProcessedLog) {
    const isTTY = process.stdout?.isTTY && !process.env.CI;
    if (isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
    // eslint-disable-next-line no-console
    console.log(formatLog(data, options));
  }

  return {
    log,
    getPath: (path) =>
      options.pathRelativeTo
        ? getRelativePathFromDirectory(options.pathRelativeTo, path, false)
        : path,
    trackAction: options.trackAction
      ? (message, finalMessage, action) => trackAction(message, finalMessage, action, options)
      : undefined,
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
    ? relative(options.pathRelativeTo, location.file.path)
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

type ActionStatus = "pending" | "success" | "failed" | "warn";

export async function trackAction<T>(
  message: string,
  finalMessage: string,
  asyncAction: (task: TrackActionTask) => Promise<T>,
  options: FormatLogOptions,
): Promise<T> {
  const task = {
    message,
    status: "pending" as ActionStatus,
    fail(message?: string) {
      if (message) {
        task.message = message;
      }
      task.status = "failed";
    },
    warn(message?: string) {
      if (message) {
        task.message = message;
      }
      task.status = "warn";
    },
  };

  const isTTY = process.stdout?.isTTY && !process.env.CI;
  let interval;
  if (isTTY) {
    const spinner = createSpinner();

    interval = setInterval(() => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`\r${color(options, spinner(), pc.yellow)} ${task.message}`);
    }, 200);
  } else {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  try {
    const result = await asyncAction(task);
    if (interval) {
      clearInterval(interval);
      clearLastLine();
    }

    switch (task.status) {
      case "failed":
        // eslint-disable-next-line no-console
        console.log(`${color(options, "x", pc.red)} ${task.message}`);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.log(`${color(options, "⚠", pc.yellow)} ${finalMessage}`);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`${color(options, "✔", pc.green)} ${finalMessage}`);
    }
    return result;
  } catch (error) {
    if (interval) {
      clearInterval(interval);
      clearLastLine();
    }

    // eslint-disable-next-line no-console
    console.log(`${color(options, "x", pc.red)} ${task.message}`);
    throw error;
  }
}

function clearLastLine(): void {
  process.stdout.write("\r\x1b[K");
}

function createSpinner(): () => string {
  let index = 0;

  return () => {
    index = ++index % spinnerFrames.length;
    return spinnerFrames[index];
  };
}

export const spinnerFrames = isUnicodeSupported()
  ? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  : ["-", "\\", "|", "/"];
