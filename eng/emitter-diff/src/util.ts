/**
 * Small shared utilities with zero external dependencies so the tool can run
 * via `node`/`tsx` without a workspace install.
 */
import { spawn, type SpawnOptions } from "node:child_process";
import { mkdirSync } from "node:fs";

import type { Logger } from "./types.js";

// ---- Minimal ANSI colors (no picocolors dependency) ----

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;
function wrap(open: number, close: number): (s: string) => string {
  return (s) => (useColor ? `\x1b[${open}m${s}\x1b[${close}m` : s);
}
export const color = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

export function createLogger(): Logger {
  /* eslint-disable no-console */
  return {
    info: (m) => console.log(m),
    warn: (m) => console.warn(`${color.yellow("warn")}  ${m}`),
    error: (m) => console.error(`${color.red("error")} ${m}`),
    step: (m) => console.log(`${color.cyan("›")} ${color.bold(m)}`),
    success: (m) => console.log(`${color.green("ok")} ${m}`),
  };
  /* eslint-enable no-console */
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Spawn a command and resolve with its captured output. Never rejects on a
 * non-zero exit; inspect {@link RunResult.code}. Set `inherit` to stream
 * output straight to the terminal (used for long generation/test runs). Set
 * `prefix` to stream each output line tagged with that prefix instead — useful
 * when several children run concurrently and their logs would otherwise
 * interleave unintelligibly. `prefix` is ignored when `inherit` is set.
 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; inherit?: boolean; prefix?: string } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    // Only route through a shell for Windows .cmd shims (npm/pnpm/npx/code/yarn).
    // Native binaries like git/node are spawned directly to avoid the shell
    // argument-escaping deprecation and quoting pitfalls.
    const needsShell = process.platform === "win32" && /^(npm|pnpm|npx|yarn|code)$/.test(cmd);
    const spawnOpts: SpawnOptions = {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      stdio: opts.inherit ? "inherit" : "pipe",
      shell: needsShell,
    };
    // With `shell: true`, passing an args array triggers a Node deprecation
    // (DEP0190). Build a single quoted command line instead; spawn directly
    // with the args array when no shell is involved.
    const child = needsShell
      ? spawn([cmd, ...args.map(quoteForShell)].join(" "), spawnOpts)
      : spawn(cmd, args, spawnOpts);
    let stdout = "";
    let stderr = "";

    // When a prefix is requested, tee complete lines to our own stdout/stderr
    // tagged with the prefix while still capturing the raw output for the
    // returned RunResult. A small line buffer holds partial trailing lines
    // until the next chunk (or close) completes them.
    const tee = !opts.inherit && opts.prefix !== undefined ? makeLineTee(opts.prefix) : undefined;

    child.stdout?.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      tee?.stdout(s);
    });
    child.stderr?.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      tee?.stderr(s);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      tee?.flush();
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

/**
 * Build a pair of line-buffering writers that emit `${prefix}${line}` to the
 * parent process's stdout/stderr as complete lines arrive, plus a `flush` to
 * drain any partial trailing line when the child closes.
 */
function makeLineTee(prefix: string): {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  flush: () => void;
} {
  function writer(out: NodeJS.WriteStream): { write: (s: string) => void; rest: () => string } {
    let buf = "";
    return {
      write(s: string) {
        buf += s;
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          out.write(`${prefix}${buf.slice(0, nl)}\n`);
          buf = buf.slice(nl + 1);
        }
      },
      rest() {
        const r = buf;
        buf = "";
        return r;
      },
    };
  }
  const o = writer(process.stdout);
  const e = writer(process.stderr);
  return {
    stdout: o.write,
    stderr: e.write,
    flush() {
      const ro = o.rest();
      if (ro) process.stdout.write(`${prefix}${ro}\n`);
      const re = e.rest();
      if (re) process.stderr.write(`${prefix}${re}\n`);
    },
  };
}

/** Quote an argument for cmd.exe when running through a shell. */
function quoteForShell(s: string): string {
  if (s.length > 0 && /^[A-Za-z0-9_.:\\/=@^-]+$/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Run a command and throw if it exits non-zero. */
export async function runChecked(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; inherit?: boolean; prefix?: string } = {},
): Promise<RunResult> {
  const result = await run(cmd, args, opts);
  if (result.code !== 0) {
    const detail = opts.inherit ? "" : `\n${result.stderr || result.stdout}`;
    throw new Error(`Command failed (${result.code}): ${cmd} ${args.join(" ")}${detail}`);
  }
  return result;
}
