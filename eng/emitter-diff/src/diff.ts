/**
 * Diff engine. One canonical unified patch (`git diff --no-index`) is the
 * source of truth; it is then rendered for whichever environment is in use:
 *  - terminal: colored patch + summary
 *  - CI `--html`: rendered via diff2html (optional dependency, lazily loaded)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Logger } from "./types.js";
import { color, run } from "./util.js";

export interface DiffResult {
  /** The unified patch text (empty when there are no differences). */
  patch: string;
  /** True when the two trees differ. */
  hasChanges: boolean;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Produce a unified patch between two directories using git's directory diff,
 * which works outside a repo and ignores index state.
 */
export async function diffDirs(
  baselineDir: string,
  headDir: string,
  log: Logger,
): Promise<DiffResult> {
  log.step("Diffing generated output");

  // When both dirs share a parent, diff with relative names from that parent so
  // the patch carries clean, comparable paths instead of absolute Windows ones.
  const parent = dirname(baselineDir);
  const sharesParent = dirname(headDir) === parent;
  const baseName = basename(baselineDir);
  const headName = basename(headDir);
  const args = sharesParent
    ? ["diff", "--no-index", "--no-color", "--", baseName, headName]
    : ["diff", "--no-index", "--no-color", "--", baselineDir, headDir];

  // `git diff --no-index` exits 1 when there are differences — that is not an error.
  const result = await run("git", args, { cwd: sharesParent ? parent : undefined });
  if (result.code > 1) {
    throw new Error(`git diff failed (${result.code}): ${result.stderr}`);
  }

  // Strip the baseline/head root segments so each file shows as a single
  // modification (a/pkg/x vs b/pkg/x) rather than a rename across roots.
  const patch = sharesParent
    ? result.stdout.replace(
        new RegExp(`([ab])/(?:${escapeRe(baseName)}|${escapeRe(headName)})/`, "g"),
        "$1/",
      )
    : result.stdout;

  const stats = summarize(patch);
  return { patch, hasChanges: patch.trim().length > 0, ...stats };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function summarize(patch: string): {
  filesChanged: number;
  insertions: number;
  deletions: number;
} {
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git") || line.startsWith("diff --no-index")) filesChanged++;
    else if (line.startsWith("+") && !line.startsWith("+++")) insertions++;
    else if (line.startsWith("-") && !line.startsWith("---")) deletions++;
  }
  return { filesChanged, insertions, deletions };
}

/** Print a colorized patch and a one-line summary to the terminal. */
export function printDiff(diff: DiffResult, log: Logger): void {
  if (!diff.hasChanges) {
    log.success("No differences between baseline and head output.");
    return;
  }
  for (const line of diff.patch.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++"))
      process.stdout.write(color.green(line) + "\n");
    else if (line.startsWith("-") && !line.startsWith("---"))
      process.stdout.write(color.red(line) + "\n");
    else if (line.startsWith("@@")) process.stdout.write(color.cyan(line) + "\n");
    else if (line.startsWith("diff ") || line.startsWith("index "))
      process.stdout.write(color.bold(line) + "\n");
    else process.stdout.write(line + "\n");
  }
  printSummary(diff, log);
}

export function printSummary(diff: DiffResult, log: Logger): void {
  log.info(
    `${color.bold("Diff summary:")} ${diff.filesChanged} file(s), ` +
      `${color.green("+" + diff.insertions)} / ${color.red("-" + diff.deletions)}`,
  );
}

/** Write the raw unified patch to a file instead of dumping it to the terminal. */
export function writePatch(diff: DiffResult, outFile: string, log: Logger): void {
  writeFileSync(outFile, diff.patch, "utf8");
  if (!diff.hasChanges) {
    log.success(
      `No differences between baseline and head output (wrote empty patch to ${outFile}).`,
    );
    return;
  }
  log.success(`Wrote unified diff to ${outFile}`);
}

const BASE_STYLE = `<style>body{margin:0;font-family:system-ui,sans-serif}.summary{padding:12px 16px;background:#f6f8fa;border-bottom:1px solid #d0d7de}</style>`;

/** Assemble a self-contained HTML report from a summary line and optional body. */
function htmlDoc(summaryHtml: string, bodyHtml = "", headExtra = ""): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Emitter diff</title>${headExtra}${BASE_STYLE}</head>
<body><div class="summary"><strong>Emitter diff</strong> &mdash; ${summaryHtml}</div>${bodyHtml}</body>
</html>`;
}

/**
 * Render the patch to a self-contained HTML file via diff2html. diff2html is an
 * optional dependency loaded lazily so the core runs without it installed.
 */
export async function writeHtml(diff: DiffResult, outFile: string, log: Logger): Promise<void> {
  // No differences: write a small standalone report so `--html <file>` always
  // produces a file (callers and CI artifact upload can rely on its presence).
  if (!diff.hasChanges) {
    writeFileSync(outFile, htmlDoc("No differences between baseline and head output."), "utf8");
    log.success(`No differences; wrote empty HTML report to ${resolve(outFile)}`);
    return;
  }

  // diff2html is an optional dependency, loaded lazily. Use a non-literal
  // specifier and a local type so an aggregate typecheck that doesn't install
  // this package's deps (e.g. the parent repo's `check:eng`, which includes
  // `core/eng`) doesn't fail to resolve it — we validate availability at runtime.
  type Diff2Html = { html(patch: string, options: Record<string, unknown>): string };
  const specifier: string = "diff2html";
  let mod: Diff2Html;
  try {
    mod = (await import(specifier)) as unknown as Diff2Html;
  } catch {
    throw new Error(
      "Rendering --html requires the 'diff2html' package. Install it in eng/emitter-diff " +
        "(it is declared as a dependency) or run with `pnpm` so it is available.",
    );
  }
  const body = mod.html(diff.patch, {
    drawFileList: true,
    matching: "lines",
    outputFormat: "side-by-side",
  });
  // Inline the diff2html stylesheet so the report renders fully offline (CI
  // artifacts are downloaded and opened from disk). Never fall back to a remote
  // CDN — the report must not fetch anything when opened locally.
  let styleTag = "";
  try {
    const require = createRequire(import.meta.url);
    const cssPath = require.resolve("diff2html/bundles/css/diff2html.min.css");
    styleTag = `<style>${readFileSync(cssPath, "utf8")}</style>`;
  } catch {
    log.warn("diff2html CSS not found; the HTML report will be unstyled.");
  }
  const summary = `${diff.filesChanged} file(s), +${diff.insertions} / -${diff.deletions}`;
  writeFileSync(outFile, htmlDoc(summary, body, styleTag), "utf8");
  const abs = resolve(outFile);
  log.success(`Wrote HTML diff to ${abs}`);
  log.info(`${color.bold("Open it:")} ${pathToFileURL(abs).href}`);
}
