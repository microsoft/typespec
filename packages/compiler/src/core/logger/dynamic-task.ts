import isUnicodeSupported from "is-unicode-supported";
import pc from "picocolors";
import { TaskStatus, TrackActionTask } from "../types.js";

const StatusIcons = {
  success: pc.green("✔"),
  failure: pc.red("×"),
  warn: pc.yellow("⚠"),
  skipped: pc.gray("•"),
};

export class DynamicTask implements TrackActionTask {
  #stream: NodeJS.WriteStream;
  #message: string;
  #spinner: () => string;
  #interval: NodeJS.Timeout | undefined;
  #isTTY: boolean;
  #running: boolean;
  #finalMessage: string;

  constructor(message: string, finalMessage: string, stream: NodeJS.WriteStream) {
    this.#message = message;
    this.#finalMessage = finalMessage;
    this.#stream = stream;
    this.#spinner = createSpinner();
    this.#isTTY = stream.isTTY && !process.env.CI;
    this.#running = true;
  }

  get message() {
    return this.#message;
  }

  get isStopped() {
    return !this.#running;
  }

  set message(newMessage: string) {
    this.#message = newMessage;
    this.#printProgress();
  }

  start() {
    if (this.#isTTY) {
      this.#interval = setInterval(() => {
        this.#printProgress();
      }, 100);
    } else {
      this.#stream.write(`- ${this.#message}\n`);
    }
  }

  succeed(message?: string) {
    this.stop("success", message);
  }
  fail(message?: string) {
    this.stop("failure", message);
  }
  warn(message?: string) {
    this.stop("warn", message);
  }
  skip(message?: string) {
    this.stop("skipped", message);
  }

  stop(status: TaskStatus, message?: string) {
    this.#running = false;
    this.#message = message ?? this.#finalMessage;
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = undefined;
    }
    this.#clear();
    this.#stream.write(`${StatusIcons[status]} ${this.#message}\n`);
  }

  #printProgress() {
    if (!this.#isTTY) {
      return;
    }
    this.#clear();
    this.#clear();
    this.#stream.write(`${pc.yellow(this.#spinner())} ${this.#message}`);
  }

  #clear() {
    if (!this.#isTTY) {
      return;
    }

    this.#stream.cursorTo(0);
    this.#stream.clearLine(0);
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
