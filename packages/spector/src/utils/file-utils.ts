import { mkdir } from "fs/promises";
import { globby } from "globby";

export async function findFilesFromPattern(pattern: string | string[]): Promise<string[]> {
  return await globby(pattern);
}

/**
 * Ensure the given dir exists.
 * @param path Path to the dir.
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
