import { readFileSync } from "fs";
import { join } from "path";
import { repoRoot } from "./utils/common.ts";

/**
 * Validates that `pnpm-lock.yaml` does not contain explicit `tarball:` URLs in its
 * resolution entries. Some registry proxies (e.g. packagefeedproxy.microsoft.io) inject
 * load-balanced tarball URLs (ms-feed-N.pkgs.visualstudio.com) into the lockfile which are
 * environment-specific and break CI. The lockfile should stay integrity-only.
 */

const lockfilePath = join(repoRoot, "pnpm-lock.yaml");
const content = readFileSync(lockfilePath, "utf8");

const offenders: string[] = [];
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tarball:")) {
    offenders.push(`  pnpm-lock.yaml:${i + 1}: ${lines[i].trim()}`);
  }
}

if (offenders.length > 0) {
  console.log(`\n✘ Found ${offenders.length} tarball URL(s) in pnpm-lock.yaml:`);
  const preview = offenders.slice(0, 20);
  for (const o of preview) {
    console.log(o);
  }
  if (offenders.length > preview.length) {
    console.log(`  ...and ${offenders.length - preview.length} more.`);
  }
  console.log(
    "\nThe lockfile must stay integrity-only (no explicit `tarball:` URLs). These are usually" +
      "\ninjected by a registry proxy and are not portable across environments. Regenerate the" +
      "\nlockfile against the pinned registry, or strip the `, tarball: ...` suffix from each" +
      "\n`resolution:` entry.",
  );
  process.exit(1);
}

console.log("✔ pnpm-lock.yaml is integrity-only (no tarball URLs).");
