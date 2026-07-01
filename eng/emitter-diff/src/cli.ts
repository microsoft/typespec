#!/usr/bin/env -S node
/**
 * emitter-diff — language-agnostic CLI.
 *
 * Generates code from the test specs with two emitter versions (baseline + head)
 * and diffs the output. All language specifics live behind the selected adapter;
 * this file contains zero language logic.
 */
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { diffDirs, printDiff, printSummary, writeHtml, writePatch } from "./diff.ts";
import { getAdapter, listAdapters } from "./registry.ts";
import {
  classifyRef,
  defaultWorkDir,
  installNpmPackage as installNpm,
  resolveSource as resolveSrc,
} from "./resolver.ts";
import type { AdapterContext, ClassifiedRef } from "./types.ts";
import { color, createLogger, ensureDir, runChecked } from "./util.ts";

const HELP = `${color.bold("emitter-diff")} — diff generated code across emitter versions

${color.bold("Usage:")}
  emitter-diff --emitter <name> --baseline <ref> [options]

${color.bold("Required:")}
  --emitter <name>        Adapter to use. Available: ${listAdapters().join(", ")}
  --baseline <ref>        Old emitter to compare against.

${color.bold("Refs")} (for --baseline / --head / --specs):
  npm:1.2.3 | 1.2.3                 a published package version
  local:/path | ./path             a local folder
  github:owner/repo@<sha|branch>   a GitHub source at a ref
  gh:<sha|branch>                  the current repo at a ref

${color.bold("Options:")}
  --head <ref>            New emitter. Default: current checkout.
  --specs <ref>           Spec inputs: all (default) | local | github.
  --name <pattern>        Filter which specs/packages are generated.
  --work-dir <dir>        Scratch dir (default: a temp dir).
  --html <file>           Write the rendered HTML diff to this path.
                          Default output: a clickable HTML report in the work dir.
  --terminal              Print the full colored patch to the terminal instead.
  --patch <file>          Write the raw unified diff to a file.
  --fail-on-diff          Exit non-zero when output differs (CI gating). Exit
                          code 2 means "diff present"; 1 means a hard error.
  --opt key=value         Repeatable adapter-specific option (e.g. --opt flavor=azure).
  --sequential            Generate baseline then head one at a time (default:
                          generate both in parallel with prefixed logs).
  -- <args>               Everything after -- is forwarded to the adapter.
  -h, --help              Show this help.
`;

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
      specs: { type: "string" },
      name: { type: "string" },
      "work-dir": { type: "string" },
      terminal: { type: "boolean" },
      patch: { type: "string" },
      html: { type: "string" },
      "fail-on-diff": { type: "boolean" },
      opt: { type: "string", multiple: true },
      sequential: { type: "boolean" },
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
  if (!values.baseline) {
    log.error("--baseline is required.");
    return 2;
  }

  if (!listAdapters().includes(values.emitter)) {
    log.error(`Unknown emitter '${values.emitter}'. Available: ${listAdapters().join(", ")}`);
    return 2;
  }
  const adapter = getAdapter(values.emitter);

  // Repo root = current git working tree.
  const repoRoot = (await runChecked("git", ["rev-parse", "--show-toplevel"])).stdout.trim();

  // Absolutize the work dir. Adapters may run emitter scripts with a different
  // cwd (python's regenerate.ts runs in packages/http-client-python), so every
  // path handed to them — the resolved emitter dir and the baseline/head output
  // dirs — must be absolute or outputs land in the wrong tree and the diff is
  // silently empty (a false "no differences").
  const workDir = ensureDir(values["work-dir"] ? resolve(values["work-dir"]) : defaultWorkDir());
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

  // Classify the specs ref up front (if any) so an invalid --specs fails fast,
  // before the expensive emitter builds. `all`/omitted => adapter default.
  let specsRef: ClassifiedRef | undefined;
  if (values.specs && values.specs.toLowerCase() !== "all") {
    specsRef = classifyRef(values.specs, repoRoot);
    if (specsRef.kind === "npm") {
      log.error("--specs as an npm version is not supported; use a local folder or github ref.");
      return 2;
    }
  }

  // Resolve emitters.
  const baselineRef = classifyRef(values.baseline, repoRoot);
  const headRef: ClassifiedRef | "current" = values.head
    ? classifyRef(values.head, repoRoot)
    : "current";

  log.step("Preparing baseline emitter");
  const baselineEmitter = await adapter.prepareEmitter(baselineRef, ctx);
  log.step("Preparing head emitter");
  const headEmitter = await adapter.prepareEmitter(headRef, ctx);

  // Materialize the specs source now that emitters are ready.
  let specsDir: string | undefined;
  if (specsRef) {
    specsDir = await resolveSrc(specsRef, workDir, log, repoRoot);
  }

  // Generate both sides. By default baseline and head generate concurrently
  // (their outputs, virtual envs, and temp YAML are isolated), roughly halving wall
  // time at the cost of doubled peak CPU/memory and interleaved logs — so each
  // side's output is tagged with a prefix. Use --sequential to generate one at
  // a time (quieter logs, lower peak resource use).
  const baselineOut = ensureDir(join(workDir, "baseline"));
  const headOut = ensureDir(join(workDir, "head"));

  const parallel = !values.sequential;
  const baselineReq = {
    emitter: baselineEmitter,
    specsDir,
    outputDir: baselineOut,
    nameFilter: values.name,
    options,
    passthrough,
    logPrefix: parallel ? color.dim("[baseline] ") : undefined,
  };
  const headReq = {
    emitter: headEmitter,
    specsDir,
    outputDir: headOut,
    nameFilter: values.name,
    options,
    passthrough,
    logPrefix: parallel ? color.cyan("[head] ") : undefined,
  };

  if (parallel) {
    log.step("Generating baseline + head in parallel");
    await Promise.all([adapter.generate(baselineReq, ctx), adapter.generate(headReq, ctx)]);
  } else {
    await adapter.generate(baselineReq, ctx);
    await adapter.generate(headReq, ctx);
  }

  // Diff.
  const diff = await diffDirs(baselineOut, headOut, log);

  // Decide how to present the diff. Explicit flags win; otherwise the default
  // is a clickable HTML report written to the work dir.
  const wantsTerminal = Boolean(values.terminal);
  const wantsPatch = Boolean(values.patch);
  const htmlTarget =
    values.html ?? (!wantsTerminal && !wantsPatch ? join(workDir, "emitter-diff.html") : undefined);

  if (!diff.hasChanges) {
    log.success("No differences between baseline and head output.");
  } else if (wantsTerminal) {
    printDiff(diff, log);
  } else {
    printSummary(diff, log);
  }

  if (wantsPatch) writePatch(diff, values.patch as string, log);
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
