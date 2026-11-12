/**
 * Small shared utilities for the tool. Subprocess execution is delegated to
 * `execa` and terminal colors to `picocolors` (both already used across the
 * repo), so this module only wires them to the shapes the rest of the tool
 * expects.
 */
import { mkdirSync } from "node:fs";

import { execa, type Options } from "execa";
import pc from "picocolors";

import type { Logger } from "./types.ts";

/** Terminal colors (picocolors auto-detects TTY / NO_COLOR / FORCE_COLOR). */
export const color = pc;

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

/** Options shared by {@link run}, {@link runChecked}, and the git wrappers. */
export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  inherit?: boolean;
  prefix?: string;
}

/**
 * Tee each complete line of a child stream to the parent process (tagged with
 * `prefix`) while leaving the captured output untouched — useful when several
 * children run concurrently and their logs would otherwise interleave
 * unintelligibly. execa splits the stream into lines for us.
 */
function teeLines(prefix: string, out: NodeJS.WriteStream) {
  return function* (line: unknown): Generator<unknown> {
    out.write(`${prefix}${String(line)}\n`);
    yield line;
  };
}

/**
 * Spawn a command and resolve with its captured output. Never rejects on a
 * non-zero exit; inspect {@link RunResult.code}. Set `inherit` to stream output
 * straight to the terminal (used for long generation/test runs). Set `prefix`
 * to stream each output line tagged with that prefix instead. `prefix` is
 * ignored when `inherit` is set.
 */
export async function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<RunResult> {
  const base: Options = { cwd: opts.cwd, env: opts.env, reject: false };
  const options: Options = opts.inherit
    ? { ...base, stdio: "inherit" }
    : opts.prefix !== undefined
      ? {
          ...base,
          stdout: teeLines(opts.prefix, process.stdout),
          stderr: teeLines(opts.prefix, process.stderr),
        }
      : base;

  const result = await execa(cmd, args, options);
  return {
    code: result.exitCode ?? (result.failed ? 1 : 0),
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

/** Run a command and throw if it exits non-zero. */
export async function runChecked(
  cmd: string,
  args: string[],
  opts: RunOptions = {},
): Promise<RunResult> {
  const result = await run(cmd, args, opts);
  if (result.code !== 0) {
    const detail = opts.inherit ? "" : `\n${result.stderr || result.stdout}`;
    throw new Error(`Command failed (${result.code}): ${cmd} ${args.join(" ")}${detail}`);
  }
  return result;
}

/** Run `git` with the given args, capturing output (never throws on non-zero). */
export function git(args: string[], opts: RunOptions = {}): Promise<RunResult> {
  return run("git", args, opts);
}

/** Run `git` and throw if it exits non-zero. */
export function gitChecked(args: string[], opts: RunOptions = {}): Promise<RunResult> {
  return runChecked("git", args, opts);
}
