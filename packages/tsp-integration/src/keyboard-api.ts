import pc from "picocolors";
import readline from "readline";
import type { Writable } from "stream";
import type { TspRunner } from "./validate.js";

const keys = [
  [["a", "return"], "rerun all tests"],
  ["f", "rerun only failed tests"],
  ["q", "quit"],
];
const cancelKeys = ["space", "c", ...keys.map((key) => key[0]).flat()];

export function registerConsoleShortcuts(
  ctx: TspRunner,
  stdin: NodeJS.ReadStream | undefined = process.stdin,
  stdout: NodeJS.WriteStream | Writable = process.stdout,
): () => void {
  let rl: readline.Interface | undefined;

  async function keypressHandler(str: string, key: readline.Key) {
    // Cancel run and exit when ctrl-c or esc is pressed.
    // If cancelling takes long and key is pressed multiple times, exit forcefully.
    if (str === "\x03" || str === "\x1B" || (key && key.ctrl && key.name === "c")) {
      if (!ctx.isCancelling) {
        stdout.write(pc.red("Cancelling test run. Press CTRL+c again to exit forcefully.\n"));
        process.exitCode = 130;

        await ctx.cancelCurrentRun();
      }
      return ctx.exit();
    }

    const name = key?.name;

    if (ctx.runningPromise) {
      if (name && cancelKeys.includes(name)) {
        stdout.write(pc.yellow("Cancelling current test run...\n"));
        await ctx.cancelCurrentRun();
      }
      return;
    }

    // quit
    if (name === "q") {
      return ctx.exit();
    }
    // rerun all tests
    if (name === "a" || name === "return") {
      return ctx.rerunAll();
    }
    // rerun only failed tests
    if (name === "f") {
      return ctx.rerunFailed();
    }
  }

  function on() {
    off();
    rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
    readline.emitKeypressEvents(stdin, rl);
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.on("keypress", keypressHandler);
  }

  function off() {
    rl?.close();
    rl = undefined;
    stdin.removeListener("keypress", keypressHandler);
    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }
  }

  on();
  return function cleanup(): void {
    off();
  };
}
