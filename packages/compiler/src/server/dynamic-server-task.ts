import { StatusIcons } from "../core/logger/dynamic-task.js";
import { TaskStatus, TrackActionTask } from "../core/types.js";
import { ServerLog } from "./types.js";

export class DynamicServerTask implements TrackActionTask {
  #log: (log: ServerLog) => void;
  #message: string;
  #interval: NodeJS.Timeout | undefined;
  #running: boolean;
  #finalMessage: string;

  constructor(message: string, finalMessage: string, log: (log: ServerLog) => void) {
    this.#message = message;
    this.#finalMessage = finalMessage;
    this.#log = log;
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
  }

  start() {
    this.#log({
      level: "info",
      message: this.#message,
    });
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
    this.#log({
      level: status !== "failure" ? "info" : "error",
      message: `${StatusIcons[status]} ${this.#message}\n`,
    });
  }
}
