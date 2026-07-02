/**
 * Diff engine. One canonical unified patch (`git diff --no-index`) is the
 * source of truth; it is then rendered for whichever environment is in use:
 *  - terminal: colored patch + summary
 *  - CI `--html`: a self-contained, GitHub-style HTML report (inline CSS, no deps)
 */
import { writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Logger } from "./types.ts";
import { color, run } from "./util.ts";

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

// Self-contained report styling. Kept inline so the HTML renders fully offline
// (CI artifacts are downloaded and opened from disk) with zero dependencies.
const REPORT_CSS = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; color: #1f2328; background: #fff; }
.summary { padding: 12px 16px; background: #f6f8fa; border-bottom: 1px solid #d0d7de; position: sticky; top: 0; }
.file { border: 1px solid #d0d7de; border-radius: 6px; margin: 16px; overflow: hidden; }
.file-header { padding: 8px 12px; background: #f6f8fa; border-bottom: 1px solid #d0d7de; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; font-weight: 600; display: flex; justify-content: space-between; gap: 12px; }
.file-header .stat .add { color: #1a7f37; }
.file-header .stat .del { color: #cf222e; }
pre.hunks { margin: 0; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.5; tab-size: 2; }
pre.hunks span { display: block; padding: 0 12px; white-space: pre; }
.add { background: #e6ffec; }
.del { background: #ffebe9; }
.hunk { background: #ddf4ff; color: #57606a; }
.meta { color: #8c959f; }
@media (prefers-color-scheme: dark) {
  body { color: #e6edf3; background: #0d1117; }
  .summary, .file-header { background: #161b22; border-color: #30363d; }
  .file { border-color: #30363d; }
  .add { background: #12261e; } .del { background: #25171c; } .hunk { background: #121d2f; color: #7d8590; }
}`;

/** HTML-escape text embedded in the report. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A single file's slice of a unified patch. */
interface FileDiff {
  name: string;
  insertions: number;
  deletions: number;
  lines: string[];
}

/** Split a unified patch into per-file groups, capturing the display name and per-file stats. */
function splitFiles(patch: string): FileDiff[] {
  const files: FileDiff[] = [];
  let cur: FileDiff | undefined;
  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git") || line.startsWith("diff --no-index")) {
      cur = { name: "", insertions: 0, deletions: 0, lines: [] };
      files.push(cur);
      continue;
    }
    if (!cur) continue;
    // Prefer the post-image path (`+++ b/<name>`) for the display name.
    if (line.startsWith("+++ ")) {
      cur.name = line.slice(4).replace(/^b\//, "").replace(/^"|"$/g, "");
      continue;
    }
    if (line.startsWith("--- ")) {
      if (!cur.name) cur.name = line.slice(4).replace(/^a\//, "");
      continue;
    }
    cur.lines.push(line);
    if (line.startsWith("+") && !line.startsWith("+++")) cur.insertions++;
    else if (line.startsWith("-") && !line.startsWith("---")) cur.deletions++;
  }
  return files.filter((f) => f.lines.some((l) => l.startsWith("@@")));
}

/** Render one file's diff lines as colored, escaped `<span>` rows. */
function renderFileBody(lines: string[]): string {
  const rows: string[] = [];
  for (const line of lines) {
    if (line.startsWith("@@")) rows.push(`<span class="hunk">${esc(line)}</span>`);
    else if (line.startsWith("+")) rows.push(`<span class="add">${esc(line)}</span>`);
    else if (line.startsWith("-")) rows.push(`<span class="del">${esc(line)}</span>`);
    else if (line.startsWith("index ") || line.startsWith("new file") || line.startsWith("deleted"))
      rows.push(`<span class="meta">${esc(line)}</span>`);
    else rows.push(`<span>${esc(line)}</span>`);
  }
  return rows.join("");
}

/** Assemble the full self-contained HTML document. */
function htmlDoc(summaryHtml: string, bodyHtml = ""): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Emitter diff</title><style>${REPORT_CSS}</style></head>
<body><div class="summary"><strong>Emitter diff</strong> &mdash; ${summaryHtml}</div>${bodyHtml}</body>
</html>`;
}

/**
 * Render the unified patch to a self-contained HTML file. The patch produced by
 * {@link diffDirs} is the source of truth; this parses it into a GitHub-style
 * colored diff with inline CSS, so the report has zero runtime dependencies and
 * opens offline.
 */
export function writeHtml(diff: DiffResult, outFile: string, log: Logger): void {
  // No differences: still write a report so `--html <file>` always produces a
  // file (callers and CI artifact upload can rely on its presence).
  if (!diff.hasChanges) {
    writeFileSync(outFile, htmlDoc("No differences between baseline and head output."), "utf8");
    log.success(`No differences; wrote empty HTML report to ${resolve(outFile)}`);
    return;
  }

  const body = splitFiles(diff.patch)
    .map((f) => {
      const stat = `<span class="add">+${f.insertions}</span> <span class="del">-${f.deletions}</span>`;
      return `<section class="file"><div class="file-header"><span>${esc(f.name)}</span><span class="stat">${stat}</span></div><pre class="hunks">${renderFileBody(f.lines)}</pre></section>`;
    })
    .join("\n");

  const summary = `${diff.filesChanged} file(s), +${diff.insertions} / -${diff.deletions}`;
  writeFileSync(outFile, htmlDoc(summary, body), "utf8");
  const abs = resolve(outFile);
  log.success(`Wrote HTML diff to ${abs}`);
  log.info(`${color.bold("Open it:")} ${pathToFileURL(abs).href}`);
}
