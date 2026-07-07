import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

import type { Logger } from "./types.js";
import { ensureDir, run } from "./util.js";

export interface BaselineCacheProfileInput {
  emitter?: string;
  baselineRef: string;
  command: string;
  emitterPath: string;
  generatedCodePath: string;
  setup: string[];
  passthrough: string[];
}

export interface BaselineCacheIndexEntry {
  baselineIdentity: string;
  updatedAt: string;
}

export type BaselineCacheIndex = Record<string, BaselineCacheIndexEntry>;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
}

export function computeBaselineProfileKey(input: BaselineCacheProfileInput): string {
  const raw = stableJson(input);
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export async function detectBaselineIdentity(dir: string): Promise<string> {
  const gitHead = await run("git", ["rev-parse", "--verify", "HEAD"], { cwd: dir });
  const sha = gitHead.code === 0 ? gitHead.stdout.trim() : "";
  if (sha) return `git:${sha}`;

  // Non-git local dir: best-effort path identity (can't detect in-place edits).
  return `path:${resolve(dir)}`;
}

export function baselineCachePaths(cacheKey: string): { dir: string; marker: string } {
  const root = baselineCacheRoot();
  return {
    dir: join(root, cacheKey),
    marker: join(root, `${cacheKey}.done`),
  };
}

function baselineCacheRoot(): string {
  return ensureDir(join(tmpdir(), "emitter-diff-cache", "baseline-output"));
}

function baselineCacheIndexPath(): string {
  return join(baselineCacheRoot(), "index.json");
}

function isWithinDir(root: string, target: string): boolean {
  const normalizedRoot = resolve(root);
  const normalizedTarget = resolve(target);
  return (
    normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${sep}`)
  );
}

export function isSafeBaselineCachePath(path: string): boolean {
  return isWithinDir(baselineCacheRoot(), path);
}

export function readBaselineCacheIndex(log?: Logger): BaselineCacheIndex {
  const path = baselineCacheIndexPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BaselineCacheIndex;
  } catch (err) {
    log?.warn(
      `Ignoring unreadable baseline cache index at ${path}; treating as empty. ${String(err)}`,
    );
    return {};
  }
}

export function writeBaselineCacheIndex(index: BaselineCacheIndex): void {
  const targetPath = baselineCacheIndexPath();
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  renameSync(tmpPath, targetPath);
}
