/**
 * typespec-python adapter.
 *
 * This is the only python-aware code in the tool. It satisfies the generic
 * {@link EmitterAdapter} contract by wrapping the python package's own
 * generation script `eng/scripts/ci/regenerate.ts` (driven with `--pluginDir`
 * (emitter build) + `--generatedFolder` (output root) overrides so any emitter
 * build can target any output dir).
 *
 * The regenerate *driver* always comes from the current checkout; only the
 * `--pluginDir` it points at changes between baseline and head. Each emitter
 * build resolves its own specs from its `node_modules`; spec versions rarely
 * change, so any spec drift between baseline/head is treated as acceptable
 * noise rather than pinned.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describeRef } from "../resolver.ts";
import type {
  AdapterContext,
  ClassifiedRef,
  EmitterAdapter,
  GenerateRequest,
  ResolvedEmitter,
} from "../types.ts";
import { run, runChecked } from "../util.ts";

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
 * npm-managed and commits its own package-lock.json to the repo, so a source
 * checkout already has the lockfile that `npm ci` needs.
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
  // Source checkouts may not have dependencies installed yet.
  await ensureDeps(dir, ctx);
  ctx.log.warn(`Emitter at ${dir} is not built; attempting build...`);
  const res = await run("npm", ["run", "build"], { cwd: dir, inherit: true });
  if (res.code !== 0 || !(await isBuilt(dir))) {
    throw new Error(
      `Could not build emitter at ${dir}. Build it manually (npm ci && npm run build) and retry.`,
    );
  }
}

/** Ensure the emitter has a local Python venv for generation. */
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
      // npm emitters are prebuilt but still need a venv.
      const dir = await ctx.installNpmPackage(PACKAGE_NAME, ref.version ?? "latest");
      await ensureVenv(dir, ctx);
      return { dir, label: describeRef(ref, PACKAGE_NAME) };
    }

    // local/github refs may require a build and venv.
    const sourceRoot = await ctx.resolveSource(ref, PACKAGE_NAME);
    // Full-repo sources contain the package under packages/http-client-python.
    const candidate = existsSync(join(sourceRoot, PKG_REL))
      ? join(sourceRoot, PKG_REL)
      : sourceRoot;
    await ensureBuilt(candidate, ctx);
    await ensureVenv(candidate, ctx);
    return { dir: candidate, label: describeRef(ref, PACKAGE_NAME) };
  },

  async generate(request: GenerateRequest, ctx: AdapterContext): Promise<void> {
    // Regenerate writes under <generatedFolder>/../tests/generated/... .
    // Anchor generatedFolder at <output>/<subpath>/generator so final output lands under
    // <output>/<subpath>/tests/generated when a subpath override is provided.
    const generatedSubpath = request.generatedCodePath ?? "";
    const generatedFolder = join(request.outputDir, generatedSubpath, "generator");
    const args = ["--pluginDir", request.emitter.dir, "--generatedFolder", generatedFolder];

    const flavor = request.options.flavor;
    if (flavor) args.push("--flavor", flavor);
    if (request.nameFilter) args.push("--name", request.nameFilter);

    args.push(...request.passthrough);

    ctx.log.step(`Generating with ${request.emitter.label} → ${request.outputDir}`);
    await runScript(ctx, "eng/scripts/ci/regenerate.ts", args, { prefix: request.logPrefix });
  },
};
