#!/usr/bin/env -S npx tsx
/**
 * emitter-diff — language-agnostic generated-code diff runner.
 *
 * It resolves a baseline and a head source tree, runs the emitter's own
 * regenerate command verbatim inside `<tree>/<emitter-path>` for each side, then
 * diffs `<emitter-path>/<generated-code-path>` between the two. The tool
 * contains zero language logic: an emitter integrates by naming its regenerate
 * command and two paths (directly, or via a built-in `--emitter` preset).
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  computeBaselineProfileKey,
  detectBaselineIdentity,
  saveBaselineOutput,
  tryReuseBaselineOutput,
} from "./baseline-cache.js";
import { diffDirs, printSummary, writeHtml } from "./diff.js";
import { getEmitterDefaults, listEmitters } from "./registry.js";
import {
  classifyRef,
  defaultWorkDir,
  describeRef,
  getRemoteRepo,
  materializeTree,
  resolveGithubIdentity,
} from "./resolver.js";
import type { ClassifiedRef, EmitterConfig, Logger } from "./types.js";
import { color, createLogger, ensureDir, git, gitChecked, runChecked } from "./util.js";

function shouldUseBaselineCache(ciMode: boolean): { enabled: boolean; reason?: string } {
  if (ciMode) {
    return { enabled: false, reason: "--ci" };
  }
  // Restrict caching to clearly local, interactive usage by default.
  if (!process.stdout.isTTY || !process.stderr.isTTY) {
    return { enabled: false, reason: "non-interactive terminal" };
  }
  return { enabled: true };
}

const HELP = `${color.bold("emitter-diff")} — diff generated code across emitter versions

${color.bold("Usage:")}
  emitter-diff [--emitter <name>] --command <cmd> --emitter-path <path> \\
               --generated-code-path <path> [options]

${color.bold("What it does:")}
  Runs <command> verbatim inside <tree>/<emitter-path> for a baseline tree and a
  head tree, then diffs <emitter-path>/<generated-code-path> between them.
  A tree the tool fetches fresh from GitHub is first prepared with --setup (a
  preset supplies install+build defaults); the current working tree and local:
  paths are assumed already built and are never touched.

${color.bold("Emitter config")} (a preset fills these; each is overridable):
  --emitter <name>        Built-in preset. Available: ${listEmitters().join(", ") || "(none)"}
  --command <cmd>         Regenerate command, e.g. "npm run regenerate".
  --emitter-path <path>   Package dir (rel to tree root) to run the command in.
  --generated-code-path <path>
                          Generated-code dir (rel to --emitter-path) to diff.
  --setup <cmd>           Prep command run in a freshly fetched GitHub tree before
                          <command> (repeatable, runs in order; a preset supplies
                          defaults like install+build). Overrides preset defaults.
  --no-setup              Skip setup even when a preset defines it.

${color.bold("Refs")} (for --baseline / --head):
  local:/path | ./path             a local source folder
  github:owner/repo@<sha|branch>   a GitHub source at a ref
  gh:<sha|branch>                  this repo (origin remote) at a ref

${color.bold("Options:")}
  --baseline <ref>        Old source tree. Default: gh:upstream/main if present,
                          otherwise gh:origin/main.
  --head <ref>            New source tree. Default: the current working tree.
  --work-dir <dir>        Scratch dir for snapshots. Default: a fresh temp dir.
  --sequential            Regenerate baseline then head one after another instead
                          of in parallel (avoids CPU oversubscription / races).
  --ci                    CI mode: disable local baseline cache.
  --html <file>           Write the rendered HTML diff (default: <work>/emitter-diff.html).
  --fail-on-diff          Exit non-zero when output differs (2 = diff, 1 = error).
  -- <args>               Everything after -- is appended to <command> verbatim
                          on both sides (e.g. a regenerate --name/--filter flag to
                          diff only a subset of tests).
  -h, --help              Show this help.
`;

async function resolveDefaultBaselineRef(repoRoot: string): Promise<string> {
  const originHead = await git(["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], {
    cwd: repoRoot,
  });
  const branch =
    (originHead.code === 0 && originHead.stdout.trim().replace(/^refs\/remotes\/origin\//, "")) ||
    "main";

  // Target the `upstream` remote (fork workflow), then `origin`.
  // A bare `gh:` ref would always resolve against
  // origin, so `gh:upstream/main` on a fork would wrongly fetch branch
  // "upstream/main" from origin.
  for (const remote of ["upstream", "origin"]) {
    const repo = await getRemoteRepo(repoRoot, remote);
    if (repo) return `github:${repo}@${branch}`;
  }

  return `gh:${branch}`;
}

/**
 * Split a command string into argv, honoring single/double quotes but WITHOUT
 * invoking a shell
 */
function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(command)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  return tokens;
}

/**
 * Build the full argv (command args + passthrough) for a regenerate command.
 *
 * `npm`/`pnpm run <script>` swallow subsequent flags as their own config
 * unless a `--` separator forwards them to the script (e.g. `npm run regenerate
 * -- --name foo`). When the command is such a package-manager `run` invocation
 * and the user supplied passthrough args, insert that `--` automatically so
 * `-- --name foo` reaches the underlying script instead of the package manager.
 */
function buildRegenerateArgs(commandArgv: string[], passthrough: string[]): string[] {
  const base = commandArgv.slice(1);
  if (passthrough.length === 0) return base;

  const bin = (commandArgv[0] ?? "").toLowerCase().replace(/\.(cmd|exe|ps1)$/, "");
  const isPm = bin === "npm" || bin === "pnpm";
  // Locate the actual run subcommand (npm also spells it `run-script`).
  const runIndex = isPm ? base.findIndex((a) => a === "run" || a === "run-script") : -1;
  // A `--` only separates script args when it comes after that subcommand.
  const separatorIndex = base.indexOf("--");
  const hasScriptSeparator = separatorIndex > runIndex;
  const needsSeparator = runIndex !== -1 && !hasScriptSeparator;

  return needsSeparator ? [...base, "--", ...passthrough] : [...base, ...passthrough];
}

/** Merge a `--emitter` preset (if any) with explicit flag overrides. */
function resolveConfig(
  values: {
    emitter?: string;
    command?: string;
    "emitter-path"?: string;
    "generated-code-path"?: string;
    setup?: string[];
    "no-setup"?: boolean;
  },
  log: Logger,
): EmitterConfig | undefined {
  let preset: Partial<EmitterConfig> = {};
  if (values.emitter) {
    const defaults = getEmitterDefaults(values.emitter);
    if (!defaults) {
      log.error(
        `Unknown --emitter '${values.emitter}'. Available: ${listEmitters().join(", ") || "(none)"}. ` +
          `Pass --command / --emitter-path / --generated-code-path directly instead.`,
      );
      return undefined;
    }
    preset = defaults;
  }

  const command = values.command ?? preset.command;
  const emitterPath = values["emitter-path"] ?? preset.emitterPath;
  const generatedCodePath = values["generated-code-path"] ?? preset.generatedCodePath;

  const missing: string[] = [];
  if (!command) missing.push("--command");
  if (!emitterPath) missing.push("--emitter-path");
  if (!generatedCodePath) missing.push("--generated-code-path");
  if (missing.length > 0) {
    log.error(
      `Missing required emitter config: ${missing.join(", ")}. ` +
        `Provide them as flags or select a preset with --emitter (available: ${
          listEmitters().join(", ") || "(none)"
        }).`,
    );
    return undefined;
  }

  // Setup: explicit --setup wins, --no-setup forces none, else the preset's.
  let setup: string[];
  if (values["no-setup"]) {
    setup = [];
  } else if (values.setup && values.setup.length > 0) {
    setup = values.setup;
  } else {
    setup = preset.setup ?? [];
  }

  return {
    command: command!,
    emitterPath: emitterPath!,
    generatedCodePath: generatedCodePath!,
    setup,
  };
}

async function main(): Promise<number> {
  const rawArgs = process.argv.slice(2);

  // Split off command passthrough after a standalone `--`.
  const sepIndex = rawArgs.indexOf("--");
  const ownArgs = sepIndex === -1 ? rawArgs : rawArgs.slice(0, sepIndex);
  const passthrough = sepIndex === -1 ? [] : rawArgs.slice(sepIndex + 1);

  const { values } = parseArgs({
    args: ownArgs,
    options: {
      emitter: { type: "string" },
      command: { type: "string" },
      "emitter-path": { type: "string" },
      "generated-code-path": { type: "string" },
      setup: { type: "string", multiple: true },
      "no-setup": { type: "boolean" },
      baseline: { type: "string" },
      head: { type: "string" },
      "work-dir": { type: "string" },
      sequential: { type: "boolean" },
      ci: { type: "boolean" },
      html: { type: "string" },
      "fail-on-diff": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  const log = createLogger();

  if (values.help || ownArgs.length === 0) {
    process.stdout.write(HELP);
    return 0;
  }

  const config = resolveConfig(values, log);
  if (!config) return 2;

  const repoRoot = (await gitChecked(["rev-parse", "--show-toplevel"])).stdout.trim();

  const workDir = ensureDir(values["work-dir"] ?? defaultWorkDir());
  log.info(`${color.dim("work dir:")} ${workDir}`);

  const commandArgv = tokenizeCommand(config.command);
  if (commandArgv.length === 0) {
    log.error(`--command is empty.`);
    return 2;
  }

  // Resolve refs.
  const baselineRefValue = values.baseline ?? (await resolveDefaultBaselineRef(repoRoot));
  if (!values.baseline) {
    log.info(`${color.dim("baseline default:")} ${baselineRefValue}`);
  }
  const baselineRef = classifyRef(baselineRefValue, repoRoot);
  const headRef: ClassifiedRef | "current" = values.head
    ? classifyRef(values.head, repoRoot)
    : "current";

  let baselineTree: string | undefined;
  // For github refs this is repinned to the exact resolved SHA below, so the
  // checkout matches the identity we cache under even if the branch moves.
  let baselineMaterializeRef = baselineRef;
  const baselineLabel = describeRef(baselineRef);
  const ensureBaselineTree = async (): Promise<string> => {
    if (baselineTree === undefined) {
      log.step("Resolving baseline source tree");
      baselineTree = await materializeTree(baselineMaterializeRef, workDir, log, repoRoot);
    }
    return baselineTree;
  };

  log.step("Resolving head source tree");
  const headTree =
    headRef === "current" ? repoRoot : await materializeTree(headRef, workDir, log, repoRoot);
  const headLabel = headRef === "current" ? "current working tree" : describeRef(headRef);

  const baselineSnap = ensureDir(join(workDir, "baseline"));
  const headSnap = ensureDir(join(workDir, "head"));

  // Run <command> inside <tree>/<emitter-path>, then snapshot the generated dir.
  const runSide = async (
    sideName: string,
    tree: string,
    snapDir: string,
    label: string,
    logPrefix: string | undefined,
    runSetup: boolean,
  ): Promise<void> => {
    const runDir = join(tree, config.emitterPath);
    if (!existsSync(runDir)) {
      throw new Error(
        `Emitter path not found for ${label}: ${runDir} (--emitter-path ${config.emitterPath}).`,
      );
    }
    const generatedDir = join(runDir, config.generatedCodePath);
    const inherit = logPrefix === undefined;
    if (runSetup && config.setup && config.setup.length > 0) {
      const setupKey = createHash("sha256").update(JSON.stringify(config.setup)).digest("hex");
      const sentinel = join(tree, ".emitter-diff-setup-done");
      const alreadyPrepared =
        existsSync(sentinel) && readFileSync(sentinel, "utf8").trim() === setupKey;
      if (alreadyPrepared) {
        log.info(color.dim(`${sideName} setup skipped (already prepared): ${label}`));
      } else {
        for (const step of config.setup) {
          const setupArgv = tokenizeCommand(step);
          if (setupArgv.length === 0) continue;
          log.step(`${sideName} setup: ${setupArgv.join(" ")} (in ${runDir})`);
          await runChecked(setupArgv[0], setupArgv.slice(1), {
            cwd: runDir,
            inherit,
            prefix: logPrefix,
          });
        }
        writeFileSync(sentinel, setupKey);
      }
    }
    const regenerateArgs = buildRegenerateArgs(commandArgv, passthrough);
    log.step(
      `${sideName} output regeneration ${color.dim(`(${label}): ${[commandArgv[0], ...regenerateArgs].join(" ")}`)}`,
    );
    await runChecked(commandArgv[0], regenerateArgs, {
      cwd: runDir,
      inherit,
      prefix: logPrefix,
    });
    if (!existsSync(generatedDir)) {
      throw new Error(
        `Generated code not found after regenerating ${label}: ${generatedDir} ` +
          `(--generated-code-path ${config.generatedCodePath}). ` +
          `Did the command write there?`,
      );
    }
    rmSync(snapDir, { recursive: true, force: true });
    cpSync(generatedDir, snapDir, { recursive: true, force: true });
  };

  // ---- Baseline output cache (local, interactive only) ----
  const cacheDecision = shouldUseBaselineCache(Boolean(values.ci));
  const useBaselineCache = cacheDecision.enabled;
  if (!useBaselineCache) {
    log.info(
      color.dim(
        `baseline cache disabled${cacheDecision.reason ? ` (${cacheDecision.reason})` : ""}`,
      ),
    );
  }
  const baselineIdentity =
    baselineRef.kind === "github"
      ? await resolveGithubIdentity(baselineRef, repoRoot, log)
      : await detectBaselineIdentity(await ensureBaselineTree());
  // Pin a github baseline to the exact commit we just resolved, so a later
  // checkout can't drift to a newer commit if the branch moves mid-run.
  if (baselineRef.kind === "github" && baselineIdentity.startsWith("git:")) {
    baselineMaterializeRef = { ...baselineRef, gitRef: baselineIdentity.slice("git:".length) };
  }
  const baselineProfileKey = computeBaselineProfileKey({
    emitter: values.emitter,
    baselineRef: baselineRefValue,
    command: config.command,
    emitterPath: config.emitterPath,
    generatedCodePath: config.generatedCodePath,
    setup: config.setup ?? [],
    passthrough,
  });

  let baselineReused = false;
  if (useBaselineCache) {
    baselineReused = tryReuseBaselineOutput(
      baselineProfileKey,
      baselineIdentity,
      baselineSnap,
      log,
    );
  }

  // Setup runs only in a tree the tool freshly materialized from GitHub — never
  // the current working tree or a user-provided local: path (assumed built).
  const baselineSetup = baselineRef.kind === "github";
  const headSetup = headRef !== "current" && headRef.kind === "github";

  if (baselineReused) {
    await runSide("Head", headTree, headSnap, headLabel, undefined, headSetup);
  } else if (values.sequential) {
    const baselineTreePath = await ensureBaselineTree();
    await runSide(
      "Baseline",
      baselineTreePath,
      baselineSnap,
      baselineLabel,
      undefined,
      baselineSetup,
    );
    await runSide("Head", headTree, headSnap, headLabel, undefined, headSetup);
  } else {
    const baselineTreePath = await ensureBaselineTree();
    await Promise.all([
      runSide(
        "Baseline",
        baselineTreePath,
        baselineSnap,
        baselineLabel,
        color.dim("[baseline] "),
        baselineSetup,
      ),
      runSide("Head", headTree, headSnap, headLabel, color.cyan("[head] "), headSetup),
    ]);
  }

  if (useBaselineCache && !baselineReused) {
    saveBaselineOutput(baselineProfileKey, baselineIdentity, baselineSnap, log);
  }

  // Diff.
  log.info(`${color.dim("Baseline Generated Output:")} ${baselineSnap}`);
  log.info(`${color.dim("Head Generated Output:")} ${headSnap}`);
  const diff = await diffDirs(baselineSnap, headSnap, log);

  const htmlTarget = values.html ?? join(workDir, "emitter-diff.html");

  if (!diff.hasChanges) {
    log.success("No differences between baseline and head output.");
  } else {
    printSummary(diff, log);
  }

  if (htmlTarget) writeHtml(diff, htmlTarget, log);

  if (values["fail-on-diff"] && diff.hasChanges) {
    log.error("Differences detected and --fail-on-diff is set.");
    // Exit 2 = "diff present" so CI can distinguish it from a hard failure (1).
    return 2;
  }
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    createLogger().error(err?.stack ?? String(err));
    process.exit(1);
  });
