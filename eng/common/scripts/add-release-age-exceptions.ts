import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { repoRoot } from "./utils/common.ts";

/**
 * Adds exact-version `minimumReleaseAgeExclude` entries to `pnpm-workspace.yaml` for every
 * package in the current lockfile that is younger than `minimumReleaseAge`.
 *
 * Use this only for reviewed updates (e.g. security fixes) that cannot wait for the release-age
 * quarantine. The printed list is also what must be granted an exception on the
 * `azure-sdk-for-js` feed: ADO pipelines still install through that feed, so the exclusion here
 * only removes pnpm's check, not the feed's.
 *
 * Entries are pruned automatically by pnpm (`minimumReleaseAgeExcludePrune`) once the lockfile
 * no longer resolves them.
 */

const workspaceFile = join(repoRoot, "pnpm-workspace.yaml");
const excludeKey = "minimumReleaseAgeExclude:";
const maxRounds = 10;

function findViolations(): string[] {
  const result = spawnSync(
    "pnpm",
    ["install", "--frozen-lockfile", "--lockfile-only", "--ignore-scripts", "--reporter=ndjson"],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.status === 0) {
    return [];
  }
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line.includes("ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION")) continue;
    const message: string = JSON.parse(line).err?.message ?? "";
    // pnpm truncates the list ("...and N more"), so callers must iterate until it is empty.
    return [...message.matchAll(/^\s+(\S+@\S+) was published at/gm)].map((m) => m[1]);
  }
  throw new Error(`pnpm install failed for a reason other than release age:\n${result.stderr}`);
}

function addExcludes(specs: string[]) {
  const lines = readFileSync(workspaceFile, "utf8").split("\n");
  let index = lines.findIndex((l) => l.startsWith(excludeKey));
  if (index === -1) {
    const ageIndex = lines.findIndex((l) => l.startsWith("minimumReleaseAge:"));
    if (ageIndex === -1) throw new Error("`minimumReleaseAge` not found in pnpm-workspace.yaml");
    // Insert after the release-age block (settings and their comments) to keep comments attached.
    index = ageIndex + 1;
    while (index < lines.length && /^(#|minimumReleaseAge)/.test(lines[index])) index++;
    lines.splice(index, 0, excludeKey);
  }
  let end = index + 1;
  while (end < lines.length && /^\s+(-|#)/.test(lines[end])) end++;
  lines.splice(end, 0, ...specs.map((s) => `  - "${s}"`));
  writeFileSync(workspaceFile, lines.join("\n"));
}

const added: string[] = [];
for (let round = 0; round < maxRounds; round++) {
  const violations = findViolations().filter((v) => !added.includes(v));
  if (violations.length === 0) break;
  addExcludes(violations);
  added.push(...violations);
}

if (added.length === 0) {
  console.log("No release-age violations found.");
} else {
  console.log(`Added ${added.length} release-age exception(s) to pnpm-workspace.yaml.`);
  console.log("Request an exception on the azure-sdk-for-js feed for:");
  for (const spec of added.sort()) console.log(`  ${spec}`);
}
