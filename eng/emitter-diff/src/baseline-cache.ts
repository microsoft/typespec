import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

import type { Logger } from "./types.js";
import { ensureDir, git } from "./util.js";

export interface BaselineCacheProfileInput {
  emitter?: string;
  baselineRef: string;
  command: string;
  emitterPath: string;
  generatedCodePath: string;
  setup: string[];
  passthrough: string[];
}

interface BaselineCacheIndexEntry {
  baselineIdentity: string;
  updatedAt: string;
}

type BaselineCacheIndex = Record<string, BaselineCacheIndexEntry>;

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
  const gitHead = await git(["rev-parse", "--verify", "HEAD"], { cwd: dir });
  const sha = gitHead.code === 0 ? gitHead.stdout.trim() : "";
  if (sha) return `git:${sha}`;

  // Non-git local dir: best-effort path identity (can't detect in-place edits).
  return `path:${resolve(dir)}`;
}

function baselineCachePaths(cacheKey: string): { dir: string; marker: string } {
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

function isSafeBaselineCachePath(path: string): boolean {
  return isWithinDir(baselineCacheRoot(), path);
}

function readBaselineCacheIndex(log?: Logger): BaselineCacheIndex {
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

function writeBaselineCacheIndex(index: BaselineCacheIndex): void {
  const targetPath = baselineCacheIndexPath();
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  renameSync(tmpPath, targetPath);
}

function persistBaselineIndex(index: BaselineCacheIndex, log: Logger): void {
  try {
    writeBaselineCacheIndex(index);
  } catch (err) {
    log.warn(`Could not persist baseline cache index (ignored). ${String(err)}`);
  }
}

/**
 * Reuse a previously cached baseline output for `profileKey` into `destSnap`,
 * but only when the cache entry's identity matches `baselineIdentity` (so a
 * moved branch or edited source invalidates it) and the cache paths are safe.
 * Returns whether the cached output was reused; a miss or any error returns
 * false so the caller regenerates.
 */
export function tryReuseBaselineOutput(
  profileKey: string,
  baselineIdentity: string,
  destSnap: string,
  log: Logger,
): boolean {
  try {
    const index = readBaselineCacheIndex(log);
    const entry = index[profileKey];
    if (!entry || entry.baselineIdentity !== baselineIdentity) return false;

    const cache = baselineCachePaths(profileKey);
    if (!isSafeBaselineCachePath(cache.dir) || !isSafeBaselineCachePath(cache.marker)) {
      log.warn("Ignoring unsafe baseline cache path; regenerating baseline.");
      delete index[profileKey];
      persistBaselineIndex(index, log);
      return false;
    }
    if (existsSync(cache.marker) && existsSync(cache.dir)) {
      log.step("Baseline output regeneration (reusing cached output)");
      rmSync(destSnap, { recursive: true, force: true });
      cpSync(cache.dir, destSnap, { recursive: true, force: true });
      return true;
    }
    // Index entry without materialized output: drop the stale entry.
    delete index[profileKey];
    persistBaselineIndex(index, log);
    return false;
  } catch (err) {
    log.warn(`Could not read baseline cache index; regenerating baseline. ${String(err)}`);
    return false;
  }
}

/**
 * Persist the freshly regenerated baseline output at `sourceSnap` under
 * `profileKey`, tagged with `baselineIdentity`. Best effort: a cache-write
 * failure is logged and swallowed so it never fails an otherwise-good diff.
 */
export function saveBaselineOutput(
  profileKey: string,
  baselineIdentity: string,
  sourceSnap: string,
  log: Logger,
): void {
  try {
    const cache = baselineCachePaths(profileKey);
    if (!isSafeBaselineCachePath(cache.dir) || !isSafeBaselineCachePath(cache.marker)) {
      throw new Error("unsafe cache path");
    }
    rmSync(cache.dir, { recursive: true, force: true });
    cpSync(sourceSnap, cache.dir, { recursive: true, force: true });
    writeFileSync(cache.marker, `${new Date().toISOString()} ${baselineIdentity}\n`, "utf8");

    const index = readBaselineCacheIndex(log);
    index[profileKey] = { baselineIdentity, updatedAt: new Date().toISOString() };
    writeBaselineCacheIndex(index);
  } catch (err) {
    log.warn(`Could not update baseline cache. ${String(err)}`);
  }
}
