import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Compute a SHA-384 subresource integrity (SRI) hash for the given file,
 * relative to the website `public/` directory.
 */
export function computeSriHash(publicRelativePath: string): string {
  const absPath = resolve(process.cwd(), "public", publicRelativePath);
  const content = readFileSync(absPath);
  return `sha384-${createHash("sha384").update(content).digest("base64")}`;
}
