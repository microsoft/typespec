/**
 * Core language-agnostic types for emitter-diff.
 *
 * The tool is a generic command runner: it resolves a baseline and a head
 * source tree, runs the emitter's own regenerate command verbatim inside each
 * tree, then diffs the generated output. There is no per-language plugin code —
 * an emitter integrates by describing three things (see {@link EmitterConfig}).
 */

/** The kinds of source a ref can point at. */
export type RefKind = "local" | "github";

/**
 * A classified reference to an emitter source tree.
 *
 * Accepted user syntaxes (see {@link classifyRef}):
 *  - local:   `local:/abs/or/rel/path`, or any existing filesystem path
 *  - github:  `github:owner/repo@<ref>`, `gh:<ref>` (this repo's origin), or an `https://github.com/...` url
 */
export interface ClassifiedRef {
  kind: RefKind;
  /** The original, unparsed ref string. */
  raw: string;
  /** local: the absolute path on disk. */
  path?: string;
  /** github: `owner/repo` (defaults to this repo's origin remote when omitted). */
  repo?: string;
  /** github: branch, tag or sha. */
  gitRef?: string;
}

/**
 * Everything the runner needs to diff one emitter. An emitter either passes
 * these as flags or selects a named preset (see `EMITTER_DEFAULTS`) that fills
 * them in; every field remains individually overridable.
 */
export interface EmitterConfig {
  /**
   * The regenerate command, run verbatim (tokenized to argv, no shell) inside
   * `<tree>/<emitterPath>` for each side. Example: `npm run regenerate`.
   */
  command: string;
  /**
   * Path (relative to a source tree root) to the emitter package the command is
   * run in. Example: `packages/http-client-python`. Use `.` for a repo-root
   * emitter.
   */
  emitterPath: string;
  /**
   * Path(s) (relative to `emitterPath`) to the generated code the command
   * writes. Each subtree is snapshotted and diffed. A single path snapshots its
   * contents at the diff root (`tests/generated`); multiple paths are each
   * namespaced under their own relative path so outputs from different roots
   * never collide (e.g. Go's `["test/http-specs", "test/azure-http-specs"]`).
   */
  generatedCodePath: string | string[];
  /**
   * Optional prep commands run in order in `<tree>/<emitterPath>` before the
   * regenerate command — but ONLY for a tree the tool freshly materialized from
   * GitHub (a `gh:`/`github:` ref). The current working tree and user-provided
   * `local:` paths are assumed already built and are never touched. Each entry
   * is tokenized to argv and run without a shell. Example:
   * `["pnpm install", "npm run setup"]`.
   */
  setup?: string[];
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  step(msg: string): void;
  success(msg: string): void;
}
