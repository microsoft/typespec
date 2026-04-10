import { glob, mkdir } from "fs/promises";

export async function findFilesFromPattern(pattern: string | string[]): Promise<string[]> {
  const results: string[] = [];
  for await (const file of glob(pattern)) {
    results.push(file);
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
