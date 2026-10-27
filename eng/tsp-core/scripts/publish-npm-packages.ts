#!/usr/bin/env node
// cspell:ignore EPUBLISHCONFLICT endgroup logissue
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { parseArgs } from "node:util";

/**
 * Publishes every `*.tgz` in a folder to the configured npm registry (the authenticated `.npmrc`
 * is expected to already be present in the target folder).
 *
 * Azure DevOps Artifacts feeds are immutable, so re-publishing a version that already exists is
 * rejected. We treat those "already exists" responses as a no-op (matching the npm/ESRP behavior of
 * not republishing), while any other failure fails the process so genuine problems stay visible.
 *
 * Unlike the inline pwsh version, a non-zero `npm publish` exit is just `status` here — it never
 * throws before we can inspect it, so the skip logic always runs and the process exit code is fully
 * under our control (no leaked `$LASTEXITCODE`).
 *
 * The output is grouped per package (Azure DevOps `##[group]` / `##[endgroup]`) with a colored
 * status symbol in each group header so the log reads like a clean summary that can be expanded for
 * the verbose `npm publish` output.
 */

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

// --- Tiny ANSI color + Azure DevOps logging helpers (no external dependencies) ------------------

const useColor = !process.env.NO_COLOR;
function color(code: number, text: string): string {
  return useColor ? `\u001b[${code}m${text}\u001b[0m` : text;
}
const green = (t: string) => color(32, t);
const yellow = (t: string) => color(33, t);
const red = (t: string) => color(31, t);
const dim = (t: string) => color(90, t);
const bold = (t: string) => color(1, t);

/** Start a collapsible Azure DevOps log group (renders as a plain line elsewhere). */
function group(title: string): void {
  console.log(`##[group]${title}`);
}
function endGroup(): void {
  console.log(`##[endgroup]`);
}

type PublishStatus = "published" | "skipped" | "failed";

const SYMBOL: Record<PublishStatus, string> = {
  published: green("✓"),
  skipped: yellow("↷"),
  failed: red("✗"),
};

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
  /previously published version/i,
  /already contains file/i,
  /already contains .+ in package/i,
  /exists in at least one of the feed/i,
  /\b409\b/,
];

export function isAlreadyPublishedError(output: string): boolean {
  return ALREADY_PUBLISHED_PATTERNS.some((pattern) => pattern.test(output));
}

/** Read `name` and `version` out of a `.tgz` for a nicer display than the flattened filename. */
function readPackageId(folder: string, file: string): string {
  const result = spawnSync("tar", ["-xzOf", file, "package/package.json"], {
    cwd: folder,
    encoding: "utf8",
  });
  if (result.status === 0 && result.stdout) {
    try {
      const pkg = JSON.parse(result.stdout);
      if (pkg?.name && pkg?.version) {
        return `${pkg.name}@${pkg.version}`;
      }
    } catch {
      // fall through to filename
    }
  }
  return file;
}

interface PublishOptions {
  tag: string;
  access: string;
}

interface PublishResult {
  id: string;
  file: string;
  status: PublishStatus;
}

function publishPackage(folder: string, file: string, options: PublishOptions): PublishResult {
  const id = readPackageId(folder, file);
  const args = ["publish", file, "--access", options.access, "--tag", options.tag];

  const result = spawnSync(npmCommand, args, { cwd: folder, encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();

  let status: PublishStatus;
  if (result.status === 0) {
    status = "published";
  } else if (isAlreadyPublishedError(output)) {
    status = "skipped";
  } else {
    status = "failed";
  }

  if (status === "failed") {
    // Keep failures expanded (no collapsible group) so the error is immediately visible, and
    // surface it in the Azure DevOps summary/annotations panel.
    console.log(`${SYMBOL[status]} ${bold(id)} ${dim("—")} ${red("failed")}`);
    console.log(dim(`$ npm ${args.join(" ")}`));
    if (output) {
      console.log(output);
    }
    console.log(`##vso[task.logissue type=error]Failed to publish ${id}`);
  } else {
    const detail = status === "published" ? green("published") : yellow("already in feed, skipped");
    group(`${SYMBOL[status]} ${bold(id)} ${dim("—")} ${detail}`);
    console.log(dim(`$ npm ${args.join(" ")}`));
    if (output) {
      console.log(output);
    }
    endGroup();
  }

  return { id, file, status };
}

function printSummary(results: PublishResult[]): void {
  const published = results.filter((r) => r.status === "published");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "failed");

  console.log("");
  console.log(bold("Publish summary"));
  console.log(`  ${green("✓")} Published  ${published.length}`);
  console.log(`  ${yellow("↷")} Skipped    ${skipped.length} ${dim("(already in feed)")}`);
  console.log(`  ${red("✗")} Failed     ${failed.length}`);
  if (failed.length > 0) {
    console.log("");
    for (const r of failed) {
      console.log(`  ${red("✗")} ${r.id}`);
    }
  }
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

  if (positionals.length < 1) {
    console.error("Usage: publish-npm-packages <folder> [--tag <tag>] [--access <access>]");
    process.exit(1);
  }

  const folder = positionals[0];
  const files = readdirSync(folder)
    .filter((f) => f.endsWith(".tgz"))
    .sort();

  if (files.length === 0) {
    console.log(`No .tgz packages found in ${folder}, nothing to publish.`);
    return;
  }

  console.log(
    `Publishing ${bold(String(files.length))} package(s) with tag ${bold(values.tag as string)}`,
  );

  const results: PublishResult[] = [];
  for (const file of files) {
    results.push(
      publishPackage(folder, file, {
        tag: values.tag as string,
        access: values.access as string,
      }),
    );
  }

  printSummary(results);

  if (results.some((r) => r.status === "failed")) {
    process.exit(1);
  }
}

main();
