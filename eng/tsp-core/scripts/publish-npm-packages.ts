#!/usr/bin/env node
// cspell:ignore EPUBLISHCONFLICT
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/**
 * Publishes every `*.tgz` in a folder to the configured npm registry (the authenticated `.npmrc`
 * is expected to already be present in the target folder).
 *
 * Azure DevOps Artifacts feeds are immutable, so re-publishing a version that already exists is
 * rejected. We treat those "already exists" responses as a no-op (matching npm/ESRP behavior of not
 * republishing), while any other failure fails the process so genuine problems stay visible.
 *
 * Unlike the inline pwsh version, a non-zero `npm publish` exit is just `status` here — it never
 * throws before we can inspect it, so the skip logic always runs.
 */

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

/**
 * Messages that mean "this exact version is already available", which we treat as a skippable no-op.
 * Matched against the combined stdout/stderr of `npm publish`.
 *
 * - `EPUBLISHCONFLICT` / `409` / "previously published version": standard npm re-publish conflict.
 * - "already contains file": ADO feed immutability (HTTP 403) when the version was published before.
 * - "exists in at least one of the feed('s upstream sources)": the version already exists upstream
 *   (npmjs), so the feed refuses the copy (HTTP 403). Matched up to `feed` to avoid a literal
 *   apostrophe.
 */
const ALREADY_PUBLISHED_PATTERNS: RegExp[] = [
  /EPUBLISHCONFLICT/,
  /cannot publish over the previously published versions/i,
  /You cannot publish over the previously published versions/i,
  /previously published version/i,
  /already contains file/i,
  /already contains .+ in package/i,
  /exists in at least one of the feed/i,
  /\b409\b/,
];

export function isAlreadyPublishedError(output: string): boolean {
  return ALREADY_PUBLISHED_PATTERNS.some((pattern) => pattern.test(output));
}

interface PublishOptions {
  tag: string;
  access: string;
}

type PublishResult = "published" | "skipped" | "failed";

function publishPackage(folder: string, file: string, options: PublishOptions): PublishResult {
  const args = ["publish", file, "--verbose", "--access", options.access, "--tag", options.tag];
  console.log(`npm ${args.join(" ")}`);

  const result = spawnSync(npmCommand, args, { cwd: folder, encoding: "utf8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (output.trim()) {
    console.log(output);
  }

  if (result.status === 0) {
    return "published";
  }

  if (isAlreadyPublishedError(output)) {
    console.warn(`::warning::Version for ${file} already exists in the feed, skipping.`);
    return "skipped";
  }

  console.error(`::error::Failed to publish ${file} to the DevOps feed.`);
  return "failed";
}

function main(): void {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      tag: { type: "string", default: "latest" },
      access: { type: "string", default: "public" },
    },
    allowPositionals: true,
  });

  const folder = positionals[0];
  if (!folder) {
    console.error("Usage: publish-npm-packages <folder> [--tag <tag>] [--access <access>]");
    process.exit(1);
  }
  if (!existsSync(folder)) {
    console.error(`Error: folder '${folder}' does not exist`);
    process.exit(1);
  }

  const options: PublishOptions = { tag: values.tag!, access: values.access! };
  const files = readdirSync(folder).filter((f) => f.endsWith(".tgz"));
  console.log(`Found ${files.length} package(s) to publish in ${folder} with tag '${options.tag}'`);

  const summary: Record<PublishResult, number> = { published: 0, skipped: 0, failed: 0 };
  for (const file of files) {
    summary[publishPackage(folder, join(".", file), options)]++;
  }

  console.log("");
  console.log(
    `Summary: ${summary.published} published, ${summary.skipped} skipped, ${summary.failed} failed`,
  );

  if (summary.failed > 0) {
    process.exit(1);
  }
}

// Only run when invoked directly, so the helpers above can be imported and unit-tested.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
