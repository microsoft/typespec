import { TaskStatus, TrackActionTask } from "../core/types.js";
import { ServerLog } from "./types.js";

export class ServerTrackActionTask implements TrackActionTask {
  #log: (log: ServerLog) => void;
  #message: string;
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
    this.#log({
      level: status !== "failure" ? "info" : "error",
      message: `[${TaskStatusText[status]}] ${this.#message}\n`,
    });
  }
}

const TaskStatusText = {
  success: "succeed",
  failure: "failed",
  warn: "succeeded with warnings",
  skipped: "skipped",
};

/** internal */
export async function trackActionFunc<T>(
  log: (log: ServerLog) => void,
  message: string,
  finalMessage: string,
  asyncAction: (task: TrackActionTask) => Promise<T>,
): Promise<T> {
  const task = new ServerTrackActionTask(message, finalMessage, log);
  task.start();

  try {
    const result = await asyncAction(task);
    if (!task.isStopped) {
      task.succeed();
    }

    return result;
  } catch (error) {
    task.fail(message);
    throw error;
  }
}
