/**
 * Diff engine. One canonical unified patch (`git diff --no-index`) is the
 * source of truth; it is then rendered for whichever environment is in use:
 *  - terminal: colored patch + summary
 *  - local `--open`: VS Code folder diff
 *  - CI `--html`: rendered via diff2html (optional dependency, lazily loaded)
 */
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Logger } from "./types.js";
import { color, run, runChecked } from "./util.js";

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

/**
 * Render the patch to a self-contained HTML file via diff2html. diff2html is an
 * optional dependency loaded lazily so the core runs without it installed.
 */
export async function writeHtml(diff: DiffResult, outFile: string, log: Logger): Promise<void> {
  let html: (typeof import("diff2html"))["html"];
  try {
    ({ html } = await import("diff2html"));
  } catch {
    throw new Error(
      "Rendering --html requires the 'diff2html' package. Install it in eng/emitter-diff " +
        "(it is declared as a dependency) or run with `pnpm` so it is available.",
    );
  }
  const body = html(diff.patch, {
    drawFileList: true,
    matching: "lines",
    outputFormat: "side-by-side",
  });
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Emitter diff</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
<style>body{margin:0;font-family:system-ui,sans-serif}.summary{padding:12px 16px;background:#f6f8fa;border-bottom:1px solid #d0d7de}</style>
</head>
<body>
<div class="summary"><strong>Emitter diff</strong> — ${diff.filesChanged} file(s), +${diff.insertions} / -${diff.deletions}</div>
${body}
</body>
</html>`;
  writeFileSync(outFile, doc, "utf8");
  const abs = resolve(outFile);
  log.success(`Wrote HTML diff to ${abs}`);
  log.info(`${color.bold("Open it:")} ${pathToFileURL(abs).href}`);
}

/**
 * Open a native side-by-side diff of the two generated trees in VS Code.
 *
 * VS Code has no CLI to diff two folders (`code --diff` only compares two
 * files), so we materialize the comparison as a throwaway git working-tree
 * change: commit the baseline tree, then overlay the head tree on top and leave
 * it unstaged. Opening that folder surfaces every changed generated file in the
 * Source Control view with red/green side-by-side diffs.
 */
export async function openInVsCode(
  baselineDir: string,
  headDir: string,
  workDir: string,
  log: Logger,
): Promise<void> {
  log.step("Preparing VS Code diff");
  const repo = join(workDir, "vscode-diff");
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(repo, { recursive: true });

  const git = (args: string[]) =>
    runChecked("git", [
      "-C",
      repo,
      "-c",
      "user.email=emitter-diff@local",
      "-c",
      "user.name=emitter-diff",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.autocrlf=false",
      ...args,
    ]);

  await git(["init", "-q"]);
  // Commit the baseline tree as the starting point.
  cpSync(baselineDir, repo, { recursive: true });
  await git(["add", "-A"]);
  await git(["commit", "-q", "-m", "baseline", "--allow-empty"]);

  // Overlay the head tree (keeping .git), then stage so VS Code shows the diff.
  for (const entry of readdirSync(repo)) {
    if (entry === ".git") continue;
    rmSync(join(repo, entry), { recursive: true, force: true });
  }
  cpSync(headDir, repo, { recursive: true });
  // Drop all index entries first, then re-add. A plain `git add -A` decides a
  // file is unchanged from (size, mtime) and skips re-hashing it; because the
  // baseline commit and the head overlay are written within the same second,
  // a same-size content edit would be treated as clean and never staged (so it
  // would silently not appear in VS Code). Clearing the index forces git to
  // re-hash every file's content, surfacing every real modification.
  await git(["rm", "-r", "--cached", "-q", "--", "."]);
  await git(["add", "-A"]);

  const result = await run("code", [repo]);
  if (result.code !== 0) {
    log.warn(
      "Could not launch VS Code (`code` not on PATH?). Open the folder manually " +
        `and use the Source Control view to browse the diff: ${repo}`,
    );
    return;
  }
  log.success(
    `Opened ${repo} in VS Code — use the Source Control panel to browse the diff ` +
      "(baseline = last commit, head = working tree).",
  );
}
