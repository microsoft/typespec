/**
 * Language-agnostic ref resolver.
 *
 * Classifies a user-provided ref string into npm / local / github and
 * materializes it into a local directory the adapter can consume. Building a
 * source checkout into a usable emitter is intentionally NOT done here — that
 * is language-specific and belongs to the adapter's `prepareEmitter`.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

import type { ClassifiedRef, Logger } from "./types.js";
import { ensureDir, runChecked } from "./util.js";

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
    // gh:<ref> => microsoft/typespec at <ref>
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
 * Reject refs/repos that could be misread by git as options or that carry shell
 * metacharacters. Args are already passed as arrays (no shell), so this guards
 * against argument injection (a leading `-` becoming a git flag) and malformed
 * input rather than shell injection.
 */
function assertSafeGitRef(gitRef: string): void {
  if (!gitRef || gitRef.startsWith("-") || /[\0\r\n]/.test(gitRef)) {
    throw new Error(`Invalid git ref: ${JSON.stringify(gitRef)}`);
  }
}

function assertSafeRepo(repo: string): void {
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo)) {
    throw new Error(`Invalid repo (expected owner/repo): ${JSON.stringify(repo)}`);
  }
}

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
  _repoRoot?: string,
): Promise<string> {
  // `gh:<ref>` (and any github ref without an explicit repo) maps to
  // microsoft/typespec explicitly.
  const repo = ref.repo ?? DEFAULT_REPO;
  const gitRef = ref.gitRef ?? "main";
  assertSafeRepo(repo);
  assertSafeGitRef(gitRef);

  // Prefer cached detached worktrees; fall back to a clone on failure.
  try {
    return await checkoutCachedWorktree(repo, gitRef, log);
  } catch (err) {
    log.warn(
      `Could not use cached worktree for ${repo}@${gitRef}; falling back to a clone. ` +
        String(err),
    );
  }

  const dest = ensureDir(join(workDir, `github-${repo.replace(/[/]/g, "_")}-${sanitize(gitRef)}`));
  const cloneUrl = `https://github.com/${repo}.git`;

  log.step(`Fetching ${repo}@${gitRef}`);
  // Shallow-init and fetch the requested ref.
  await runChecked("git", ["init", "-q"], { cwd: dest });
  await runChecked("git", ["remote", "add", "origin", cloneUrl], { cwd: dest }).catch(() => {});
  const fetched = await runChecked("git", ["fetch", "--depth", "1", "origin", gitRef], {
    cwd: dest,
  }).catch(() => undefined);
  if (fetched) {
    // Targeted fetch resolves to FETCH_HEAD.
    await runChecked("git", ["checkout", "-q", "FETCH_HEAD"], { cwd: dest });
  } else {
    // Some servers reject bare SHA fetches; full-fetch and checkout by ref name.
    // `--end-of-options` prevents treating the ref as a flag.
    await runChecked("git", ["fetch", "origin"], { cwd: dest });
    await runChecked("git", ["checkout", "-q", "--end-of-options", gitRef], { cwd: dest });
  }
  return dest;
}

async function checkoutCachedWorktree(repo: string, gitRef: string, log: Logger): Promise<string> {
  // Keep worktree cache isolated from the caller's git metadata.
  const cacheRepo = await ensureCacheRepo(repo, log);
  const sha = await fetchAndResolveCommit(cacheRepo, gitRef);

  const cacheRoot = ensureDir(join(tmpdir(), "emitter-diff-cache", "worktrees", repoPathKey(repo)));
  const dest = join(cacheRoot, sha);

  if (existsSync(join(dest, ".git"))) {
    log.info(`Reusing cached worktree ${repo}@${sha}`);
    return dest;
  }

  ensureDir(cacheRoot);
  log.step(`Creating cached worktree ${repo}@${sha}`);
  await runChecked("git", ["worktree", "add", "--detach", dest, sha], { cwd: cacheRepo });
  return dest;
}

async function ensureCacheRepo(repo: string, _log: Logger): Promise<string> {
  const repoRoot = ensureDir(join(tmpdir(), "emitter-diff-cache", "repos", repoPathKey(repo)));
  const gitDir = join(repoRoot, ".git");
  const cloneUrl = `https://github.com/${repo}.git`;

  if (!existsSync(gitDir)) {
    await runChecked("git", ["init", "-q"], { cwd: repoRoot });
  }

  // Ensure remote points at the expected repo, without failing if it already exists.
  await runChecked("git", ["remote", "add", "origin", cloneUrl], { cwd: repoRoot }).catch(() => {});
  await runChecked("git", ["remote", "set-url", "origin", cloneUrl], { cwd: repoRoot });
  return repoRoot;
}

async function fetchAndResolveCommit(cacheRepo: string, gitRef: string): Promise<string> {
  // Resolve an immutable commit SHA from FETCH_HEAD.
  await runChecked("git", ["fetch", "--depth", "1", "origin", gitRef], { cwd: cacheRepo });
  const sha = (
    await runChecked("git", ["rev-parse", "--verify", "FETCH_HEAD"], { cwd: cacheRepo })
  ).stdout.trim();
  if (!sha) {
    throw new Error(`Could not resolve git ref '${gitRef}' from FETCH_HEAD.`);
  }
  return sha;
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
  const pkgDir = join(dir, "node_modules", packageName);
  if (existsSync(pkgDir)) {
    assertInstalledPackageMetadata(pkgDir, packageName, version);
    log.info(`Reusing installed ${packageName}@${version}`);
    return pkgDir;
  }

  log.step(`Installing ${packageName}@${version}`);
  // Create a deterministic throwaway package root and install just one
  // dependency there.
  const manifest = join(dir, "package.json");
  if (!existsSync(manifest)) {
    writeFileSync(
      manifest,
      `${JSON.stringify({ name: "emitter-diff-cache", private: true, version: "0.0.0" }, null, 2)}\n`,
      "utf8",
    );
  }

  // Install only the requested package and skip lifecycle scripts.
  await runChecked(
    "npm",
    [
      "install",
      `${packageName}@${version}`,
      "--no-audit",
      "--no-fund",
      "--no-save",
      "--ignore-scripts",
    ],
    { cwd: dir },
  );
  assertInstalledPackageMetadata(pkgDir, packageName, version);
  return pkgDir;
}

function assertInstalledPackageMetadata(
  pkgDir: string,
  expectedName: string,
  expectedVersion: string,
): void {
  const manifest = join(pkgDir, "package.json");
  if (!existsSync(manifest)) {
    throw new Error(`Installed package manifest not found: ${manifest}`);
  }

  let parsed: { name?: string; version?: string };
  try {
    parsed = JSON.parse(readFileSync(manifest, "utf8")) as { name?: string; version?: string };
  } catch (err) {
    throw new Error(`Could not parse installed package manifest at ${manifest}: ${String(err)}`, {
      cause: err,
    });
  }

  if (parsed.name !== expectedName || parsed.version !== expectedVersion) {
    throw new Error(
      `Installed package metadata mismatch at ${manifest}. ` +
        `Expected ${expectedName}@${expectedVersion}, got ${parsed.name ?? "<missing>"}@${parsed.version ?? "<missing>"}.`,
    );
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9._-]/gi, "-").slice(0, 40);
}

function repoPathKey(repo: string): string {
  return repo.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

/** Create a fresh scratch dir under the OS temp dir for each run. */
export function defaultWorkDir(): string {
  return mkdtempSync(join(tmpdir(), "emitter-diff-"));
}
