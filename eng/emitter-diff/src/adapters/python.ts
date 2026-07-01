/**
 * typespec-python adapter.
 *
 * This is the only python-aware code in the tool. It satisfies the generic
 * {@link EmitterAdapter} contract by wrapping the python package's own scripts:
 *  - generation → `eng/scripts/ci/regenerate.ts` (driven with `--pluginDir`
 *    (emitter build) + `--generatedFolder` (output root) overrides so any
 *    emitter build can target any output dir).
 *  - test suites → `eng/scripts/ci/run-tests.ts` (pytest/lint/mypy/pyright...).
 *
 * The regenerate *driver* always comes from the current checkout; only the
 * `--pluginDir` it points at changes between baseline and head. Specs are also
 * pinned to the current checkout so the diff isolates emitter behavior rather
 * than driver/spec differences.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { describeRef } from "../resolver.js";
import type {
  AdapterContext,
  ClassifiedRef,
  EmitterAdapter,
  GenerateRequest,
  ResolvedEmitter,
  RunTestsRequest,
} from "../types.js";
import { run, runChecked } from "../util.js";

const PACKAGE_NAME = "@typespec/http-client-python";
const PKG_REL = "packages/http-client-python";

function pkgDir(ctx: AdapterContext): string {
  return join(ctx.repoRoot, PKG_REL);
}

/** Resolve `tsx` from the python package and run a script in its directory. */
async function runScript(
  ctx: AdapterContext,
  scriptRelPath: string,
  args: string[],
  opts: { inherit?: boolean; prefix?: string } = {},
): Promise<void> {
  const cwd = pkgDir(ctx);
  const inherit = opts.inherit ?? opts.prefix === undefined;
  await runChecked("npx", ["tsx", join(cwd, scriptRelPath), ...args], {
    cwd,
    inherit,
    prefix: opts.prefix,
  });
}

async function isBuilt(dir: string): Promise<boolean> {
  return existsSync(join(dir, "dist", "emitter", "index.js"));
}

/**
 * Ensure the package's npm dependencies are installed. A fresh source checkout
 * (a github clone or a bare local path) has no `node_modules`, so `npm run
 * build` would fail to resolve its types/deps. http-client-python is
 * npm-managed (it ships its own package-lock.json), so `npm ci` here is safe.
 */
async function ensureDeps(dir: string, ctx: AdapterContext): Promise<void> {
  if (existsSync(join(dir, "node_modules"))) return;
  ctx.log.warn(`No node_modules at ${dir}; installing dependencies (npm ci)...`);
  const res = await run("npm", ["ci"], { cwd: dir, inherit: true });
  if (res.code !== 0 || !existsSync(join(dir, "node_modules"))) {
    throw new Error(
      `Could not install dependencies at ${dir} (npm ci). Run \`npm ci\` there manually and retry.`,
    );
  }
}

async function ensureBuilt(dir: string, ctx: AdapterContext): Promise<void> {
  if (await isBuilt(dir)) return;
  // A source checkout may not have its deps installed yet; install them first
  // so the build can resolve modules/types.
  await ensureDeps(dir, ctx);
  ctx.log.warn(`Emitter at ${dir} is not built; attempting build...`);
  const res = await run("npm", ["run", "build"], { cwd: dir, inherit: true });
  if (res.code !== 0 || !(await isBuilt(dir))) {
    throw new Error(
      `Could not build emitter at ${dir}. Build it manually (npm ci && npm run build) and retry.`,
    );
  }
}

/**
 * Core's regenerate pipeline is two-phase: the TypeSpec compile emits YAML, then
 * a batched Python subprocess (`run_batch.py`) writes the `.py` files using a
 * venv co-located with the emitter at `<dir>/venv`. Each emitter version needs
 * its own venv (built from that version's generator), so ensure one exists.
 */
async function ensureVenv(dir: string, ctx: AdapterContext): Promise<void> {
  if (existsSync(join(dir, "venv"))) return;
  ctx.log.warn(`No Python venv at ${dir}; creating one (npm run install)...`);
  const res = await run("npm", ["run", "install"], { cwd: dir, inherit: true });
  if (res.code !== 0 || !existsSync(join(dir, "venv"))) {
    throw new Error(
      `Could not create a Python venv at ${dir}. Run \`npm run install\` there manually and retry. ` +
        `(The native two-phase pipeline needs a venv per emitter version.)`,
    );
  }
}

export const pythonAdapter: EmitterAdapter = {
  name: "python",
  packageName: PACKAGE_NAME,

  async prepareEmitter(
    ref: ClassifiedRef | "current",
    ctx: AdapterContext,
  ): Promise<ResolvedEmitter> {
    if (ref === "current") {
      const dir = pkgDir(ctx);
      await ensureBuilt(dir, ctx);
      await ensureVenv(dir, ctx);
      return { dir, label: "current checkout" };
    }

    if (ref.kind === "npm") {
      // npm versions ship a prebuilt dist + python generator. The native
      // pipeline still needs a venv built from that generator, so create one.
      const dir = await ctx.installNpmPackage(PACKAGE_NAME, ref.version ?? "latest");
      await ensureVenv(dir, ctx);
      return { dir, label: describeRef(ref, PACKAGE_NAME) };
    }

    // local / github: resolve to a source dir, then ensure it is built + has a venv.
    const sourceRoot = await ctx.resolveSource(ref, PACKAGE_NAME);
    // For a full-repo source (github clone or repo root), the emitter lives in
    // packages/http-client-python; otherwise the resolved dir is the package itself.
    const candidate = existsSync(join(sourceRoot, PKG_REL))
      ? join(sourceRoot, PKG_REL)
      : sourceRoot;
    await ensureBuilt(candidate, ctx);
    await ensureVenv(candidate, ctx);
    return { dir: candidate, label: describeRef(ref, PACKAGE_NAME) };
  },

  async generate(request: GenerateRequest, ctx: AdapterContext): Promise<void> {
    // The new in-process regenerate driver anchors generated output at
    // `<generatedFolder>/../tests/generated/...`. Point generatedFolder at a
    // `generator` subdir of the requested output dir so files land directly
    // under request.outputDir/tests/generated, which the diff engine compares.
    const args = [
      "--pluginDir",
      request.emitter.dir,
      "--generatedFolder",
      join(request.outputDir, "generator"),
      // Emit only fresh codegen — skip the azure-sdk-for-python baseline clone.
      "--no-baseline",
    ];

    const flavor = request.options.flavor;
    if (flavor) args.push("--flavor", flavor);
    if (request.nameFilter) args.push("--name", request.nameFilter);

    // Specs are pinned to the current checkout so only the emitter differs
    // between baseline and head. External specs (--specs) override that.
    const httpSpecs = resolveHttpSpecs(request, ctx);
    const azureSpecs = resolveAzureSpecs(request, ctx);
    if (httpSpecs) args.push("--httpSpecsDir", httpSpecs);
    if (azureSpecs) args.push("--azureSpecsDir", azureSpecs);

    // When the user explicitly pinned specs, warn (rather than silently falling
    // back to the current checkout's specs) if the expected layout wasn't found.
    if (request.specsDir) {
      if (!httpSpecs) {
        ctx.log.warn(
          `--specs was given (${request.specsDir}) but no http-specs dir was found under it ` +
            `(looked for http-specs/specs, packages/http-specs/specs, specs/). Falling back to defaults.`,
        );
      }
      if ((flavor === undefined || flavor === "azure") && !azureSpecs) {
        ctx.log.warn(
          `--specs was given (${request.specsDir}) but no azure-http-specs dir was found under it ` +
            `(looked for azure-http-specs/specs, packages/azure-http-specs/specs, azure/specs). ` +
            `Azure specs will use the current checkout's dependency.`,
        );
      }
    }

    args.push(...request.passthrough);

    ctx.log.step(`Generating with ${request.emitter.label} → ${request.outputDir}`);
    await runScript(ctx, "eng/scripts/ci/regenerate.ts", args, { prefix: request.logPrefix });
  },

  async runTests(request: RunTestsRequest, ctx: AdapterContext): Promise<void> {
    // The python test harness is wired to <package>/tests/generated. The diff
    // tool's output dir holds the generated tree under `tests/generated`
    // (see generate()), so sync that subtree there, then run the runner.
    const generatedRoot = join(pkgDir(ctx), "tests", "generated");
    const source = firstExisting([
      join(request.outputDir, "tests", "generated"),
      request.outputDir,
    ])!;
    ctx.log.step(`Syncing ${source} into ${generatedRoot} for test run`);
    rmSync(generatedRoot, { recursive: true, force: true });
    cpSync(source, generatedRoot, { recursive: true });

    // `--generator` runs the suites against the generated packages (as opposed
    // to the emitter's own unit tests).
    const args: string[] = ["--generator"];
    if (request.envs && request.envs.length > 0) {
      args.push("--env", request.envs.join(","));
    }
    const flavor = request.options.flavor;
    if (flavor) args.push("--flavor", flavor);
    if (request.nameFilter) args.push("--name", request.nameFilter);
    args.push(...request.passthrough);

    ctx.log.step("Running python test suites");
    await runScript(ctx, "eng/scripts/ci/run-tests.ts", args);
  },
};

function firstExisting(paths: string[]): string | undefined {
  return paths.find((p) => existsSync(p));
}

/** Default http-specs dir inside the current checkout's python package. */
function defaultHttpSpecs(ctx: AdapterContext): string {
  return join(pkgDir(ctx), "node_modules", "@typespec", "http-specs", "specs");
}

/** Default azure-http-specs dir inside the current checkout's python package. */
function defaultAzureSpecs(ctx: AdapterContext): string {
  return join(pkgDir(ctx), "node_modules", "@azure-tools", "azure-http-specs", "specs");
}

function resolveHttpSpecs(request: GenerateRequest, ctx: AdapterContext): string | undefined {
  if (request.specsDir) {
    return firstExisting([
      join(request.specsDir, "http-specs", "specs"),
      join(request.specsDir, "packages", "http-specs", "specs"),
      join(request.specsDir, "specs"),
      request.specsDir,
    ]);
  }
  return firstExisting([defaultHttpSpecs(ctx)]);
}

function resolveAzureSpecs(request: GenerateRequest, ctx: AdapterContext): string | undefined {
  if (request.specsDir) {
    return firstExisting([
      join(request.specsDir, "azure-http-specs", "specs"),
      join(request.specsDir, "packages", "azure-http-specs", "specs"),
      join(request.specsDir, "azure", "specs"),
    ]);
  }
  return firstExisting([defaultAzureSpecs(ctx)]);
}
