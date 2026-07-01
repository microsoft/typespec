/**
 * Language-agnostic ref resolver.
 *
 * Classifies a user-provided ref string into npm / local / github and
 * materializes it into a local directory the adapter can consume. Building a
 * source checkout into a usable emitter is intentionally NOT done here — that
 * is language-specific and belongs to the adapter's `prepareEmitter`.
 */
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

import type { ClassifiedRef, Logger } from "./types.js";
import { ensureDir, run, runChecked } from "./util.js";

/**
 * Classify a ref string. Explicit prefixes (`npm:`, `local:`, `github:`,
 * `gh:`) are honored first, then a few heuristics:
 *  - an `https://github.com/...` url → github
 *  - an existing filesystem path → local
 *  - a bare `pkg@version` or semver-ish string → npm
 */
export function classifyRef(raw: string, repoRoot: string): ClassifiedRef {
  const trimmed = raw.trim();

  if (trimmed.startsWith("npm:")) {
    return { kind: "npm", raw, version: trimmed.slice(4) };
  }
  if (trimmed.startsWith("local:")) {
    const p = trimmed.slice(6);
    return { kind: "local", raw, path: isAbsolute(p) ? p : resolve(repoRoot, p) };
  }
  if (trimmed.startsWith("github:")) {
    return parseGithub(trimmed.slice(7), raw);
  }
  if (trimmed.startsWith("gh:")) {
    // gh:<ref> => current repo at <ref>
    return { kind: "github", raw, gitRef: trimmed.slice(3) };
  }
  if (/^https?:\/\/github\.com\//i.test(trimmed)) {
    return parseGithubUrl(trimmed, raw);
  }

  // Heuristic: existing path -> local.
  const asPath = isAbsolute(trimmed) ? trimmed : resolve(repoRoot, trimmed);
  if (existsSync(asPath)) {
    return { kind: "local", raw, path: asPath };
  }

  // Fallback: treat as an npm version/tag (or `@scope/pkg@version`).
  return { kind: "npm", raw, version: extractNpmVersion(trimmed) };
}

function extractNpmVersion(spec: string): string {
  // `@scope/pkg@1.2.3` -> `1.2.3`; `pkg@1.2.3` -> `1.2.3`; `1.2.3` -> `1.2.3`.
  const at = spec.lastIndexOf("@");
  if (at > 0) return spec.slice(at + 1);
  return spec;
}

function parseGithub(rest: string, raw: string): ClassifiedRef {
  // owner/repo@ref  OR  owner/repo
  const at = rest.lastIndexOf("@");
  if (at > 0) {
    return { kind: "github", raw, repo: rest.slice(0, at), gitRef: rest.slice(at + 1) };
  }
  return { kind: "github", raw, repo: rest };
}

function parseGithubUrl(url: string, raw: string): ClassifiedRef {
  // https://github.com/owner/repo/tree/<ref>[/...]  or  .../commit/<sha>
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|commit|blob)\/([^/]+))?/i);
  if (!m) return { kind: "github", raw };
  const repo = `${m[1]}/${m[2].replace(/\.git$/, "")}`;
  return { kind: "github", raw, repo, gitRef: m[3] };
}

export function describeRef(ref: ClassifiedRef, packageName: string): string {
  switch (ref.kind) {
    case "npm":
      return `npm ${packageName}@${ref.version}`;
    case "local":
      return `local ${ref.path}`;
    case "github":
      return `github ${ref.repo ?? "<this repo>"}@${ref.gitRef ?? "<default>"}`;
  }
}

const DEFAULT_REPO = "microsoft/typespec";

/**
 * Materialize a local-or-github ref into a source directory. npm refs are
 * handled by {@link installNpmPackage} (the package name is adapter-specific).
 */
export async function resolveSource(
  ref: ClassifiedRef,
  workDir: string,
  log: Logger,
  repoRoot?: string,
): Promise<string> {
  if (ref.kind === "local") {
    if (!ref.path || !existsSync(ref.path)) {
      throw new Error(`Local ref path does not exist: ${ref.path}`);
    }
    return ref.path;
  }
  if (ref.kind === "github") {
    return cloneGithub(ref, workDir, log, repoRoot);
  }
  throw new Error(`resolveSource cannot handle npm refs directly (ref: ${ref.raw})`);
}

async function cloneGithub(
  ref: ClassifiedRef,
  workDir: string,
  log: Logger,
  repoRoot?: string,
): Promise<string> {
  // `gh:<ref>` (and any github ref without an explicit repo) means "this repo".
  // Detect the current repo from its origin remote so forks/renames resolve
  // correctly, falling back to the well-known repo only if detection fails.
  const repo =
    ref.repo ?? (repoRoot ? await detectOriginRepo(repoRoot) : undefined) ?? DEFAULT_REPO;
  const gitRef = ref.gitRef ?? "main";
  const dest = ensureDir(join(workDir, `github-${repo.replace(/[/]/g, "_")}-${sanitize(gitRef)}`));
  const cloneUrl = `https://github.com/${repo}.git`;

  log.step(`Fetching ${repo}@${gitRef}`);
  // Shallow-clone then fetch the exact ref so both branches and SHAs work.
  await runChecked("git", ["init", "-q"], { cwd: dest });
  await runChecked("git", ["remote", "add", "origin", cloneUrl], { cwd: dest }).catch(() => {});
  const fetched = await runChecked("git", ["fetch", "--depth", "1", "origin", gitRef], {
    cwd: dest,
  }).catch(() => undefined);
  if (fetched) {
    // The targeted fetch put the requested ref at FETCH_HEAD.
    await runChecked("git", ["checkout", "-q", "FETCH_HEAD"], { cwd: dest });
  } else {
    // Some servers won't fetch a bare SHA directly; do a full fetch and then
    // check the ref out by name (NOT FETCH_HEAD, which after a full fetch with
    // no refspec may point at a branch head rather than the requested commit).
    await runChecked("git", ["fetch", "origin"], { cwd: dest });
    await runChecked("git", ["checkout", "-q", gitRef], { cwd: dest });
  }
  return dest;
}

/** Parse `owner/repo` from the current checkout's origin remote, if it is a GitHub remote. */
async function detectOriginRepo(repoRoot: string): Promise<string | undefined> {
  const res = await run("git", ["-C", repoRoot, "remote", "get-url", "origin"]);
  if (res.code !== 0) return undefined;
  const m = res.stdout.trim().match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/i);
  return m ? `${m[1]}/${m[2]}` : undefined;
}

/**
 * Install a published npm package version into an isolated dir and return the
 * path to the installed package (which ships a prebuilt `dist`).
 */
export async function installNpmPackage(
  packageName: string,
  version: string,
  workDir: string,
  log: Logger,
): Promise<string> {
  const dir = ensureDir(
    join(workDir, `npm-${packageName.replace(/[@/]/g, "_")}-${sanitize(version)}`),
  );
  log.step(`Installing ${packageName}@${version}`);
  // Create a throwaway package root and install just the one package there.
  await runChecked("npm", ["init", "-y"], { cwd: dir });
  await runChecked(
    "npm",
    ["install", `${packageName}@${version}`, "--no-audit", "--no-fund", "--no-save"],
    { cwd: dir },
  );
  const pkgDir = join(dir, "node_modules", packageName);
  if (!existsSync(pkgDir)) {
    throw new Error(`Installed ${packageName}@${version} but ${pkgDir} not found`);
  }
  return pkgDir;
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9._-]/gi, "-").slice(0, 40);
}

/** Create a fresh scratch dir under the OS temp dir when `--work-dir` is omitted. */
export function defaultWorkDir(): string {
  return mkdtempSync(join(tmpdir(), "emitter-diff-"));
}
