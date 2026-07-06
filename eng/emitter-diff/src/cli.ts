#!/usr/bin/env -S npx tsx
/**
 * emitter-diff — language-agnostic CLI.
 *
 * Generates code from the test specs with two emitter versions (baseline + head)
 * and diffs the output. All language specifics live behind the selected adapter;
 * this file contains zero language logic.
 */
import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  baselineCachePaths,
  computeBaselineProfileKey,
  detectBaselineIdentity,
  isSafeBaselineCachePath,
  readBaselineCacheIndex,
  writeBaselineCacheIndex,
  type BaselineCacheIndex,
} from "./baseline-cache.js";
import { diffDirs, printSummary, writeHtml } from "./diff.js";
import { getAdapter, listAdapters } from "./registry.js";
import {
  classifyRef,
  defaultWorkDir,
  installNpmPackage as installNpm,
  resolveSource as resolveSrc,
} from "./resolver.js";
import type { AdapterContext, ClassifiedRef } from "./types.js";
import { color, createLogger, ensureDir, run, runChecked } from "./util.js";

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
  emitter-diff --emitter <name> [options]

${color.bold("Required:")}
  --emitter <name>        Adapter to use. Available: ${listAdapters().join(", ")}

${color.bold("Refs")} (for --baseline / --head):
  npm:1.2.3 | 1.2.3                 a published package version
  local:/path | ./path             a local folder
  github:owner/repo@<sha|branch>   a GitHub source at a ref
  gh:<sha|branch>                  microsoft/typespec at a ref

${color.bold("Options:")}
  --baseline <ref>        Old emitter. Default: gh:upstream/main if present,
                          otherwise gh:origin/main.
  --head <ref>            New emitter. Default: current checkout.
  --generated-code-path <path>
                          Override adapter generated-code subpath under each
                          side output root.
  --name <pattern>        Filter which specs/packages are generated.
                          Baseline output is cached across local runs.
  --ci                    CI mode: disable local baseline cache.
  --html <file>           Write the rendered HTML diff to this path.
                          Default output: a clickable HTML report in the work dir.
  --fail-on-diff          Exit non-zero when output differs (CI gating). Exit
                          code 2 means "diff present"; 1 means a hard error.
  --opt key=value         Repeatable adapter-specific option (e.g. --opt flavor=azure).
  -- <args>               Everything after -- is forwarded to the adapter.
  -h, --help              Show this help.
`;

async function resolveDefaultBaselineRef(repoRoot: string): Promise<string> {
  // Prefer upstream/main for fork workflows.
  const upstreamMain = await run(
    "git",
    ["show-ref", "--verify", "--quiet", "refs/remotes/upstream/main"],
    { cwd: repoRoot },
  );
  if (upstreamMain.code === 0) return "gh:upstream/main";

  const originMain = await run(
    "git",
    ["show-ref", "--verify", "--quiet", "refs/remotes/origin/main"],
    { cwd: repoRoot },
  );
  if (originMain.code === 0) return "gh:origin/main";

  // Fall back to origin/HEAD (for example, origin/master).
  const originHead = await run("git", ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], {
    cwd: repoRoot,
  });
  if (originHead.code === 0) {
    const ref = originHead.stdout.trim().replace(/^refs\/remotes\//, "");
    if (ref) return `gh:${ref}`;
  }

  // Final fallback for unusual clones.
  return "gh:origin/main";
}

async function main(): Promise<number> {
  const rawArgs = process.argv.slice(2);

  // Split off adapter passthrough after a standalone `--`.
  const sepIndex = rawArgs.indexOf("--");
  const ownArgs = sepIndex === -1 ? rawArgs : rawArgs.slice(0, sepIndex);
  const passthrough = sepIndex === -1 ? [] : rawArgs.slice(sepIndex + 1);

  const { values } = parseArgs({
    args: ownArgs,
    options: {
      emitter: { type: "string" },
      baseline: { type: "string" },
      head: { type: "string" },
      "generated-code-path": { type: "string" },
      name: { type: "string" },
      ci: { type: "boolean" },
      html: { type: "string" },
      "fail-on-diff": { type: "boolean" },
      opt: { type: "string", multiple: true },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  const log = createLogger();

  if (values.help || ownArgs.length === 0) {
    process.stdout.write(HELP);
    return 0;
  }
  if (!values.emitter) {
    log.error("--emitter is required (no default). " + `Available: ${listAdapters().join(", ")}`);
    return 2;
  }
  if (!listAdapters().includes(values.emitter)) {
    log.error(`Unknown emitter '${values.emitter}'. Available: ${listAdapters().join(", ")}`);
    return 2;
  }
  const adapter = getAdapter(values.emitter);

  // Repo root = current git working tree.
  const repoRoot = (await runChecked("git", ["rev-parse", "--show-toplevel"])).stdout.trim();

  // Use an absolute work dir because adapters may run from a different cwd.
  const workDir = ensureDir(defaultWorkDir());
  log.info(`${color.dim("work dir:")} ${workDir}`);

  const ctx: AdapterContext = {
    repoRoot,
    workDir,
    log,
    resolveSource: (ref, _packageName) => resolveSrc(ref, workDir, log, repoRoot),
    installNpmPackage: (packageName, version) => installNpm(packageName, version, workDir, log),
  };

  // Parse adapter options (--opt key=value).
  const options: Record<string, string> = {};
  for (const entry of values.opt ?? []) {
    const eq = entry.indexOf("=");
    if (eq === -1) {
      log.error(`Invalid --opt '${entry}'. Expected key=value.`);
      return 2;
    }
    options[entry.slice(0, eq)] = entry.slice(eq + 1);
  }

  // Resolve emitters.
  const baselineRefValue = values.baseline ?? (await resolveDefaultBaselineRef(repoRoot));
  if (!values.baseline) {
    log.info(`${color.dim("baseline default:")} ${baselineRefValue}`);
  }
  const baselineRef = classifyRef(baselineRefValue, repoRoot);
  const headRef: ClassifiedRef | "current" = values.head
    ? classifyRef(values.head, repoRoot)
    : "current";

  log.step("Preparing baseline emitter");
  const baselineEmitter = await adapter.prepareEmitter(baselineRef, ctx);
  log.step("Preparing head emitter");
  const headEmitter = await adapter.prepareEmitter(headRef, ctx);

  // Baseline/head generate in parallel by default.
  const baselineOut = ensureDir(join(workDir, "baseline"));
  const headOut = ensureDir(join(workDir, "head"));

  const parallel = true;
  const cacheDecision = shouldUseBaselineCache(Boolean(values.ci));
  const useBaselineCache = cacheDecision.enabled;
  if (!useBaselineCache) {
    log.info(
      color.dim(
        `baseline cache disabled${cacheDecision.reason ? ` (${cacheDecision.reason})` : ""}`,
      ),
    );
  }
  const baselineIdentity = await detectBaselineIdentity(baselineEmitter.dir);
  const baselineProfileKey = computeBaselineProfileKey({
    emitter: values.emitter,
    baselineRef: baselineRefValue,
    generatedCodePath: values["generated-code-path"],
    nameFilter: values.name,
    options,
    passthrough,
  });
  const baselineCache = baselineCachePaths(baselineProfileKey);

  const persistBaselineIndex = (index: BaselineCacheIndex): void => {
    try {
      writeBaselineCacheIndex(index);
    } catch {
      // Best effort cache cleanup.
    }
  };

  let baselineReused = false;
  if (useBaselineCache) {
    try {
      const index = readBaselineCacheIndex();
      const entry = index[baselineProfileKey];
      if (entry && entry.baselineIdentity === baselineIdentity) {
        if (
          !isSafeBaselineCachePath(baselineCache.dir) ||
          !isSafeBaselineCachePath(baselineCache.marker)
        ) {
          log.warn("Ignoring unsafe baseline cache path; regenerating baseline.");
          delete index[baselineProfileKey];
          persistBaselineIndex(index);
        } else if (existsSync(baselineCache.marker) && existsSync(baselineCache.dir)) {
          log.step("Reusing cached baseline output");
          rmSync(baselineOut, { recursive: true, force: true });
          cpSync(baselineCache.dir, baselineOut, { recursive: true, force: true });
          baselineReused = true;
        } else {
          log.info(color.dim("Baseline cache not found; regenerating baseline."));
          delete index[baselineProfileKey];
          persistBaselineIndex(index);
        }
      }
    } catch (err) {
      log.warn(`Could not read baseline cache index; regenerating baseline. ${String(err)}`);
    }
  }

  const baselineReq = {
    emitter: baselineEmitter,
    outputDir: baselineOut,
    generatedCodePath: values["generated-code-path"],
    nameFilter: values.name,
    options,
    passthrough,
    logPrefix: parallel ? color.dim("[baseline] ") : undefined,
  };
  const headReq = {
    emitter: headEmitter,
    outputDir: headOut,
    generatedCodePath: values["generated-code-path"],
    nameFilter: values.name,
    options,
    passthrough,
    logPrefix: parallel ? color.cyan("[head] ") : undefined,
  };

  if (baselineReused) {
    log.step("Generating head (baseline reused)");
    await adapter.generate(headReq, ctx);
  } else {
    log.step("Generating baseline + head in parallel");
    await Promise.all([adapter.generate(baselineReq, ctx), adapter.generate(headReq, ctx)]);
  }

  if (useBaselineCache && !baselineReused) {
    try {
      if (
        !isSafeBaselineCachePath(baselineCache.dir) ||
        !isSafeBaselineCachePath(baselineCache.marker)
      ) {
        throw new Error("unsafe cache path");
      }

      rmSync(baselineCache.dir, { recursive: true, force: true });
      cpSync(baselineOut, baselineCache.dir, { recursive: true, force: true });
      writeFileSync(
        baselineCache.marker,
        `${new Date().toISOString()} ${baselineIdentity}\n`,
        "utf8",
      );
      const index = readBaselineCacheIndex();
      index[baselineProfileKey] = {
        baselineIdentity,
        updatedAt: new Date().toISOString(),
      };
      writeBaselineCacheIndex(index);
    } catch (err) {
      log.warn(`Could not update baseline cache. ${String(err)}`);
    }
  }

  // Log output roots used by the diff.
  log.info(
    `${color.dim("baseline output:")} ${baselineOut} ${color.dim(`(${baselineEmitter.label})`)}`,
  );
  log.info(`${color.cyan("head output:")} ${headOut} ${color.dim(`(${headEmitter.label})`)}`);

  // Diff.
  const diff = await diffDirs(baselineOut, headOut, log);

  // Default to a clickable HTML report in the work dir unless --html is set.
  const htmlTarget = values.html ?? join(workDir, "emitter-diff.html");

  if (!diff.hasChanges) {
    log.success("No differences between baseline and head output.");
  } else {
    printSummary(diff, log);
  }

  if (htmlTarget) writeHtml(diff, htmlTarget, log);

  if (values["fail-on-diff"] && diff.hasChanges) {
    log.error("Differences detected and --fail-on-diff is set.");
    // Exit code 2 is reserved for "diff present" so CI can distinguish an
    // expected-but-unapproved diff from a hard failure (exit 1).
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
