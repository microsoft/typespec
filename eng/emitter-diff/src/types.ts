/**
 * Core, language-agnostic types for the emitter-diff tool.
 *
 * The orchestrator, ref resolver and diff engine depend only on the generic
 * {@link EmitterAdapter} contract defined here. Nothing in this file (or in the
 * core) knows anything about a specific language's tooling — all language
 * details live behind an adapter.
 */

/** The three kinds of source a ref can point at. */
export type RefKind = "npm" | "local" | "github";

/**
 * A classified reference to either an emitter version or a specs source.
 *
 * Accepted user syntaxes (see {@link classifyRef}):
 *  - npm:     `npm:1.2.3`, `1.2.3`, `@scope/pkg@1.2.3`
 *  - local:   `local:/abs/or/rel/path`, or any existing filesystem path
 *  - github:  `github:owner/repo@<ref>`, `gh:<ref>` (this repo), or an `https://github.com/...` url
 */
export interface ClassifiedRef {
  kind: RefKind;
  /** The original, unparsed ref string. */
  raw: string;
  /** npm: the version/tag (e.g. `1.2.3`, `latest`). */
  version?: string;
  /** local: the absolute path on disk. */
  path?: string;
  /** github: `owner/repo` (defaults to the current repo when omitted). */
  repo?: string;
  /** github: branch, tag or sha. */
  gitRef?: string;
}

/** A built/usable emitter, ready to be pointed at by the adapter's generate step. */
export interface ResolvedEmitter {
  /** Directory containing the usable emitter build. */
  dir: string;
  /** Human-readable label for logs (e.g. `npm @typespec/http-client-python@0.34.0`). */
  label: string;
}

/** Shared context handed to every adapter call. */
export interface AdapterContext {
  /** Repo root (the git working tree the tool was invoked from). */
  repoRoot: string;
  /** Scratch directory the adapter may use for builds/installs. */
  workDir: string;
  /** Structured logger. */
  log: Logger;
  /**
   * Core helper that materializes a {@link ClassifiedRef} into a local source
   * directory (handles `local` passthrough and `github` fetch). For `npm`, the
   * adapter typically resolves the package itself via {@link installNpmPackage}.
   */
  resolveSource(ref: ClassifiedRef, packageName: string): Promise<string>;
  /** Core helper that installs an npm package version and returns its dir. */
  installNpmPackage(packageName: string, version: string): Promise<string>;
}

export interface GenerateRequest {
  /** Resolved emitter build to generate with. */
  emitter: ResolvedEmitter;
  /** Resolved specs directory, or undefined to use the adapter's repo default. */
  specsDir?: string;
  /** Directory the generated code must be written to. */
  outputDir: string;
  /** Optional name/pattern filter limiting which specs/packages are generated. */
  nameFilter?: string;
  /** Adapter-specific options collected from repeatable `--opt key=value`. */
  options: Record<string, string>;
  /** Everything after a `--` on the command line, forwarded verbatim. */
  passthrough: string[];
}

export interface RunTestsRequest {
  /** The generated output tree to run suites against. */
  outputDir: string;
  /** Adapter-defined suite/environment names (e.g. `test`, `lint`, `mypy`). */
  envs?: string[];
  nameFilter?: string;
  options: Record<string, string>;
  passthrough: string[];
}

/**
 * Per-language plugin. A thin wrapper over an emitter's own generate and test
 * commands. The core never reaches around this contract.
 */
export interface EmitterAdapter {
  /** Stable id used by `--emitter` (e.g. `python`). */
  readonly name: string;
  /** npm package name, used when a ref is an npm version. */
  readonly packageName: string;

  /**
   * Turn a classified ref (or the special `current` checkout) into a usable,
   * built emitter. `npm` versions ship prebuilt; `local`/`github`/`current`
   * may need a build, which is the adapter's responsibility.
   */
  prepareEmitter(ref: ClassifiedRef | "current", ctx: AdapterContext): Promise<ResolvedEmitter>;

  /** Generate code into `request.outputDir` using `request.emitter`. */
  generate(request: GenerateRequest, ctx: AdapterContext): Promise<void>;

  /** Optional: run the emitter's test suites against an output tree. */
  runTests?(request: RunTestsRequest, ctx: AdapterContext): Promise<void>;
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  step(msg: string): void;
  success(msg: string): void;
}
