import * as esbuild from "esbuild";
import { execa } from "execa";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import ora from "ora";
import { dirname, join } from "path";
import { resolveCompilerRoot, writeCompilerAssets } from "./compiler-assets.js";
import { writeSeaConfig } from "./sea-config.js";

const [major, minor] = process.versions.node.split(".").map(Number);
// The executable is produced with `node --build-sea`, which was added in Node.js 25.5.0. This
// package only targets the latest Node.js, so building on anything older is unsupported.
if (major < 25 || (major === 25 && minor < 5)) {
  console.error("Cannot build standalone cli on node under 25.5 (`node --build-sea` is required)");
  process.exit(0);
}

const projectRoot = dirname(import.meta.dirname);
const distDir = join(projectRoot, "dist");
const tempDir = join(projectRoot, "temp");
const seaConfigPath = join(tempDir, "sea-config.json");
const compilerBundlePath = join(tempDir, "compiler.mjs");
const compilerAssetsPath = join(tempDir, "compiler-assets.json");

const exeName = process.platform === "win32" ? "tsp.exe" : "tsp";
const exePath = join(distDir, exeName);

// The bundle runs inside the single-executable, whose embedded Node.js is the latest release we
// build with (`node --build-sea`, Node.js 26.x), so there is no need to downlevel further.
const nodeTarget = "node26";

await buildCurrent();

async function buildCurrent() {
  await bundle();
  console.log("");
  await buildWithNodeSea();
}

async function bundle() {
  await mkdir(tempDir, { recursive: true });
  await bundleCli();
  await bundleCompiler();
  await collectAssets();
}

async function bundleCli() {
  await action(`Bundling CLI entry`, async () => {
    await esbuild.build({
      entryPoints: ["src/cli.ts"],
      bundle: true,
      outfile: "temp/bundle.cjs",
      platform: "node",
      target: nodeTarget,
      format: "cjs",
    });
  });
}

async function bundleCompiler() {
  await action(`Bundling compiler`, async () => {
    // LONG TERM: the compiler uses top-level `await`, which a CommonJS single-executable main
    // cannot, so it is bundled separately as ESM and loaded from memory at runtime (see
    // `runBundledCompiler` in `src/cli.ts`). The CJS main loads it via a bridge — a TEMPORARY
    // workaround for nodejs/node#62726 documented in `src/import-workaround.ts`.
    await esbuild.build({
      entryPoints: ["src/compiler-entry.ts"],
      bundle: true,
      outfile: "temp/compiler.mjs",
      platform: "node",
      target: nodeTarget,
      format: "esm",
      // Re-provide `require` for the bundled dependencies' built-in requires. The module is loaded
      // from memory under a synthetic `file://` URL, so `import.meta.url` is a valid file URL.
      banner: {
        js: "import { createRequire as __tspCreateRequire } from 'node:module'; const require = __tspCreateRequire(process.execPath);",
      },
    });
  });
}

async function collectAssets() {
  await action(`Collecting compiler assets`, async () => {
    const compilerRoot = resolveCompilerRoot();
    const count = await writeCompilerAssets(compilerRoot, compilerAssetsPath);
    return count;
  });
}

async function buildWithNodeSea() {
  await mkdir(distDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });

  // `node --build-sea` injects the blob into a copy of node.exe. On windows that copy inherits
  // node.exe's Authenticode signature, which the injection invalidates, breaking ESRP signing.
  // Strip the signature from a pristine copy first and build from it so the output is cleanly
  // unsigned.
  const baseExecutable = await prepareBaseExecutable();
  await createSeaConfig(baseExecutable);

  await action(`Building single executable ${exePath}`, async () => {
    // `node --build-sea` produces the executable, embedding the Node.js runtime, the SEA blob and
    // the assets in one step.
    await execa`node --build-sea ${seaConfigPath}`;
  });

  // On osx the freshly built executable is unsigned, so it needs an (ad-hoc) signature to run.
  // Official signing is handled separately (ESRP).
  if (process.platform === "darwin") {
    await action(`Sign executable ${exePath}`, async () => {
      const entitlementsPath = join(projectRoot, "scripts", "osx-entitlements.plist");
      await execa`codesign --deep -s - -f --options runtime --entitlements ${entitlementsPath} ${exePath}`;
    });
  }
}

async function prepareBaseExecutable(): Promise<string | undefined> {
  if (process.platform !== "win32") {
    return undefined;
  }
  const baseExePath = join(tempDir, "node-base.exe");
  await action(`Removing signature from base executable`, async () => {
    await copyFile(process.execPath, baseExePath);
    const signToolPath = await findSigntool();
    if (signToolPath) {
      execFileSync(signToolPath, [`remove`, `/s`, baseExePath]);
    } else {
      console.log("Ignore signtool removal on windows, missing.");
      if (process.env.CI) {
        throw new Error("Cannot find signtool.exe in CI");
      }
    }
  });
  return baseExePath;
}

async function createSeaConfig(executable?: string) {
  await action(`Creating sea config ${seaConfigPath}`, async () => {
    await writeSeaConfig(seaConfigPath, {
      main: join(projectRoot, "temp/bundle.cjs"),
      output: exePath,
      executable,
      disableExperimentalSEAWarning: true,
      useCodeCache: false,
      assets: {
        "compiler.mjs": compilerBundlePath,
        "compiler-assets.json": compilerAssetsPath,
      },
    });
  });
}
async function action(message: string, callback: () => Promise<any>) {
  const spinner = ora(message).start();
  try {
    const result = await callback();
    spinner.succeed();
    return result;
  } catch (e) {
    spinner.fail();
    throw e;
  }
}

async function findSigntool() {
  try {
    const base = "C:/Program Files (x86)/Windows Kits/10/bin/";
    const files = await readdir(base);
    const latest = files
      .filter((f) => f.startsWith("1"))
      .sort()
      .reverse()[0];
    return join(base, latest, "x64/signtool.exe");
  } catch {
    return undefined;
  }
}
