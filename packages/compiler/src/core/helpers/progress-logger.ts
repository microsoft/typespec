import { Direction } from "readline";
import { LogSink, ProcessedLog } from "../types.js";

export class ConsoleSink implements LogSink {
  log(log: ProcessedLog): void {
    process.stdout.write(log.message);
  }
  cursorTo(position: number): void {
    process.stdout.cursorTo(position);
  }
  clearLine(line: Direction): void {
    process.stdout.clearLine(line);
  }
}

const logMessages: string[] = [];
let childLogPrefix = "";
const logger = new ConsoleSink();

export async function actionWithProgressSpinner<T>(
  asyncAction: () => Promise<T>,
  startMessage: string,
  finishMessage?: string,
  printChildMessage: boolean = false,
): Promise<T> {
  const isTTY = process.stdout?.isTTY && !process.env.CI;
  let interval;
  if (isTTY) {
    const spinner = createSpinner();
    interval = setInterval(() => {
      logger.clearLine(0);
      logger.cursorTo(0);
      logger.log({
        level: "trace",
        message: `\r${spinner()} ${startMessage}`,
      });
    }, 200);
  }

  try {
    return await asyncAction();
  } finally {
    if (interval) {
      clearInterval(interval);
      stopSpinner(finishMessage, printChildMessage);
    } else if (finishMessage) {
      console.log(finishMessage);
    }
  }
}

export function stopSpinner(finishMessage?: string, printChildMessage: boolean = false): void {
  clearLastLine();

  if (finishMessage) {
    logger.log({
      level: "trace",
      message: `${finishMessage}\n`,
    });
  }

  if (printChildMessage) {
    printChildMessages();
  }

  childLogPrefix = "";
  logMessages.length = 0;
}

export function setChildLogPrefix(message: string): void {
  childLogPrefix = message;
}

export function addChildLog(message: string): void {
  logMessages.push(`\t${childLogPrefix}${message}`);
}

function clearLastLine(): void {
  process.stdout.write("\r\x1b[K");
}

function printChildMessages(): void {
  logMessages.forEach((message) =>
    logger.log({
      level: "trace",
      message: `${message}\n`,
    }),
  );
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
