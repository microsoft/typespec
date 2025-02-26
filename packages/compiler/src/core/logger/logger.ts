import { getSourceLocation } from "../diagnostics.js";
import { getChildLogs } from "../helpers/logger-child-utils.js";
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
    trackAction: (action, log) => trackAction(action, log),
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

export async function trackAction<T>(asyncAction: () => Promise<T>, log: LogInfo): Promise<T> {
  const isTTY = process.stdout?.isTTY && !process.env.CI;
  let interval;
  if (isTTY) {
    const spinner = createSpinner();

    interval = setInterval(() => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`\r${spinner()} ${log.message}`);
    }, 200);
  }

  try {
    return await asyncAction();
  } finally {
    if (interval) {
      clearInterval(interval);
      clearLastLine();
      getChildLogs().forEach((message) => process.stdout.write(`${message}\n`));
    }
  }
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

function isUnicodeSupported() {
  const { env } = process;
  const { TERM, TERM_PROGRAM } = env;

  if (process.platform !== "win32") {
    return TERM !== "linux"; // Linux console (kernel)
  }

  return (
    Boolean(env.WT_SESSION) || // Windows Terminal
    Boolean(env.TERMINUS_SUBLIME) || // Terminus (<0.2.27)
    env.ConEmuTask === "{cmd::Cmder}" || // ConEmu and cmder
    TERM_PROGRAM === "Terminus-Sublime" ||
    TERM_PROGRAM === "vscode" ||
    TERM === "xterm-256color" ||
    TERM === "alacritty" ||
    TERM === "rxvt-unicode" ||
    TERM === "rxvt-unicode-256color" ||
    env.TERMINAL_EMULATOR === "JetBrains-JediTerm"
  );
}
function clearLastLine(): void {
  process.stdout.write("\r\x1b[K");
}
