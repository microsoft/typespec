import { execFile, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export class ProcessFailedError extends Error {
  readonly exitCode: number;

  constructor(args: readonly string[], exitCode: number) {
    super(`node ${args.join(" ")} exited with code ${exitCode}`);
    this.exitCode = exitCode;
  }
}

export function resolveNodeBin(packageName: string, name: string, cwd = process.cwd()): string {
  const directory = resolve(cwd, "node_modules", packageName);
  const { bin } = JSON.parse(readFileSync(resolve(directory, "package.json"), "utf8"));
  const entry = typeof bin === "string" ? bin : bin?.[name];
  if (typeof entry !== "string") {
    throw new Error(`Package ${packageName} does not provide the ${name} executable`);
  }
  return resolve(directory, entry);
}

export async function runNode(args: readonly string[], signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    // A separate process group lets cancellation also stop compiler and test workers.
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      detached: process.platform !== "win32",
    });
    let timeout: NodeJS.Timeout | undefined;

    function killTree(signal: NodeJS.Signals) {
      if (child.pid === undefined) return;
      if (process.platform === "win32") {
        execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], (error) => {
          if (error && child.exitCode === null && child.signalCode === null) reject(error);
        });
      } else {
        try {
          process.kill(-child.pid, signal);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") reject(error);
        }
      }
    }

    function abort() {
      killTree("SIGTERM");
      timeout = setTimeout(() => killTree("SIGKILL"), 5_000);
    }

    signal?.addEventListener("abort", abort, { once: true });
    child.once("error", reject);
    child.once("close", (code, exitSignal) => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      if (process.platform !== "win32") killTree("SIGKILL");
      if (signal?.aborted) {
        reject(signal.reason);
      } else if (exitSignal) {
        reject(new Error(`node ${args.join(" ")} exited with signal ${exitSignal}`));
      } else if (code !== 0) {
        reject(new ProcessFailedError(args, code ?? 1));
      } else {
        resolve();
      }
    });
  });
}

export async function runParallel(
  commands: readonly (readonly string[])[],
  signal?: AbortSignal,
  stopOnExit = false,
): Promise<void> {
  const controller = new AbortController();
  const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const tasks = commands.map((args) => runNode(args, combined));
  try {
    await (stopOnExit ? Promise.race(tasks) : Promise.all(tasks));
  } finally {
    controller.abort();
    await Promise.allSettled(tasks);
  }
}

export async function runMain(action: (signal: AbortSignal) => Promise<void>): Promise<void> {
  const controller = new AbortController();
  const interrupt = () => {
    process.exitCode = 130;
    controller.abort(new Error("Interrupted"));
  };
  const terminate = () => {
    process.exitCode = 143;
    controller.abort(new Error("Terminated"));
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", terminate);
  try {
    await action(controller.signal);
  } catch (error) {
    const cancelled =
      controller.signal.aborted &&
      (error === controller.signal.reason ||
        (error instanceof Error && error.name === "AbortError"));
    if (!cancelled) {
      process.stderr.write(`${error}\n`);
      if (!controller.signal.aborted) {
        process.exitCode = error instanceof ProcessFailedError ? error.exitCode : 1;
      }
    }
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", terminate);
  }
}
