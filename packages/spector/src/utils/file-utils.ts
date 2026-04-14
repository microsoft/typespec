import { glob, mkdir } from "fs/promises";
import { normalizePath } from "./path-utils.js";

export async function findFilesFromPattern(pattern: string | string[]): Promise<string[]> {
  const results: string[] = [];
  for await (const file of glob(pattern)) {
    results.push(normalizePath(file));
  }
  return results;
}

/**
 * Ensure the given dir exists.
 * @param path Path to the dir.
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
