/* eslint-disable no-console */
/**
 * Regenerates Python SDK code from TypeSpec definitions.
 *
 * Two-phase pipeline:
 *   1. TypeSpec compile (in-process, parallel) -> emits per-spec YAML only.
 *   2. Single batched Python subprocess reads all YAMLs and writes the
 *      final `.py` files. Amortizes Python-startup cost across many specs.
 *
 * Shared helpers/data live in `regenerate-common.ts` (kept identical with the
 * `@azure-tools/typespec-python` wrapper copy).
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { access, readdir } from "fs/promises";
import { platform } from "os";
import { dirname, join, resolve } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

import {
  buildTaskGroups,
  getSubdirectories,
  prepareBaselineOfGeneratedCode,
  preprocess,
  RegenerateContext,
  RegenerateFlags,
  runParallel,
} from "./regenerate-common.js";

// Parse arguments
const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    flavor: { type: "string", short: "f" },
    name: { type: "string", short: "n" },
    debug: { type: "boolean", short: "d" },
    pluginDir: { type: "string" },
    emitterName: { type: "string" },
    generatedFolder: { type: "string" },
    jobs: { type: "string", short: "j" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${pc.bold("Usage:")} tsx regenerate.ts [options]

${pc.bold("Description:")}
  Regenerates Python SDK code from TypeSpec definitions using in-process compilation.
  This avoids spawning a new Node.js process for each spec, making it significantly faster.

${pc.bold("Options:")}
  ${pc.cyan("-f, --flavor <azure|unbranded>")}
      SDK flavor to regenerate. If not specified, regenerates both flavors.

  ${pc.cyan("-n, --name <pattern>")}
      Filter packages by name pattern (case-insensitive substring match).
      Examples:
        --name xml              Regenerate packages containing "xml"
        --name authentication   Regenerate authentication packages
        --name type/array       Regenerate the type/array package

  ${pc.cyan("-d, --debug")}
      Enable debug output during regeneration.

  ${pc.cyan("-j, --jobs <n>")}
      Number of parallel compilation tasks (default: 30 on Linux/Mac, 10 on Windows).

  ${pc.cyan("-h, --help")}
      Show this help message.

${pc.bold("Examples:")}
  ${pc.dim("# Regenerate all packages for both flavors")}
  tsx regenerate.ts

  ${pc.dim("# Regenerate only Azure packages")}
  tsx regenerate.ts --flavor azure

  ${pc.dim("# Regenerate a specific package by name")}
  tsx regenerate.ts --flavor azure --name authentication-api-key

  ${pc.dim("# Regenerate with more parallelism")}
  tsx regenerate.ts --jobs 50
`);
  process.exit(0);
}

// Get paths
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = argv.values.pluginDir
  ? resolve(argv.values.pluginDir)
  : resolve(SCRIPT_DIR, "../../../");

function resolveSpecsDir(packageName: string, envOverride?: string): string {
  const fromEnv = envOverride?.trim();
  if (fromEnv) {
    const candidate = resolve(fromEnv);
    if (existsSync(candidate)) return candidate;
  }

  // Prefer specs from the selected plugin dir (baseline/head emitter), then
  // fall back to the current checkout package and repo-root installs.
  const candidates = [
    resolve(PLUGIN_DIR, `node_modules/${packageName}/specs`),
    resolve(SCRIPT_DIR, `../../../node_modules/${packageName}/specs`),
    resolve(SCRIPT_DIR, `../../../../node_modules/${packageName}/specs`),
    resolve(SCRIPT_DIR, `../../../../../node_modules/${packageName}/specs`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Keep the preferred plugin-dir location for diagnostics.
  return candidates[0];
}

const AZURE_HTTP_SPECS = resolveSpecsDir(
  "@azure-tools/azure-http-specs",
  process.env.AZURE_HTTP_SPECS_DIR,
);
const HTTP_SPECS = resolveSpecsDir("@typespec/http-specs", process.env.HTTP_SPECS_DIR);
const GENERATED_FOLDER = argv.values.generatedFolder
  ? resolve(argv.values.generatedFolder)
  : resolve(PLUGIN_DIR, "generator");
const EMITTER_NAME = argv.values.emitterName || "@typespec/http-client-python";

const ctx: RegenerateContext = {
  pluginDir: PLUGIN_DIR,
  azureHttpSpecs: AZURE_HTTP_SPECS,
  httpSpecs: HTTP_SPECS,
  generatedFolder: GENERATED_FOLDER,
  emitterName: EMITTER_NAME,
};

async function collectConfigFiles(generatedDir: string, flavor: string): Promise<string[]> {
  const flavorDir = join(generatedDir, "..", "tests", "generated", flavor);
  try {
    await access(flavorDir);
  } catch {
    return [];
  }

  const configFiles: string[] = [];
  for (const pkg of await readdir(flavorDir, { withFileTypes: true })) {
    if (pkg.isDirectory()) {
      const pkgDir = join(flavorDir, pkg.name);
      for (const file of await readdir(pkgDir)) {
        if (file.startsWith(".tsp-codegen-") && file.endsWith(".json")) {
          configFiles.push(join(pkgDir, file));
        }
      }
    }
  }
  return configFiles;
}

function runBatchPythonProcessing(
  flavor: string,
  generatedFolder: string,
  configCount: number,
  jobs: number,
): boolean {
  if (configCount === 0) return true;

  console.log(pc.cyan(`\nRunning batch Python processing on ${configCount} specs...`));

  // Find Python venv
  let venvPath = join(PLUGIN_DIR, "venv");
  if (existsSync(join(venvPath, "bin"))) {
    venvPath = join(venvPath, "bin", "python");
  } else if (existsSync(join(venvPath, "Scripts"))) {
    venvPath = join(venvPath, "Scripts", "python.exe");
  } else {
    console.error(pc.red("Python venv not found"));
    return false;
  }

  const batchScript = join(PLUGIN_DIR, "eng", "scripts", "setup", "run_batch.py");

  try {
    const generatedRoot = resolve(generatedFolder, "..");
    // Pass directory and flavor instead of individual config files to avoid command line length limits on Windows
    execSync(
      `"${venvPath}" "${batchScript}" --generated-dir "${generatedRoot}" --flavor ${flavor} --jobs ${jobs}`,
      {
        stdio: "inherit",
        cwd: PLUGIN_DIR,
      },
    );
    return true;
  } catch {
    return false;
  }
}

async function regenerateFlavor(
  flavor: string,
  name: string | undefined,
  debug: boolean,
  jobs: number,
): Promise<boolean> {
  console.log(pc.cyan(`\n${"=".repeat(60)}`));
  console.log(pc.cyan(`Regenerating ${flavor} flavor`));
  console.log(pc.cyan(`${"=".repeat(60)}\n`));

  const flags: RegenerateFlags = { flavor, debug, name };

  // Preprocess
  await preprocess(flavor, GENERATED_FOLDER);

  // Collect specs
  const azureSpecs =
    flavor === "azure" && existsSync(AZURE_HTTP_SPECS)
      ? await getSubdirectories(AZURE_HTTP_SPECS, flags)
      : [];
  if (flavor === "azure" && !existsSync(AZURE_HTTP_SPECS)) {
    console.warn(pc.yellow(`Azure specs not found at: ${AZURE_HTTP_SPECS}`));
  }

  const standardSpecs = existsSync(HTTP_SPECS) ? await getSubdirectories(HTTP_SPECS, flags) : [];
  if (!existsSync(HTTP_SPECS)) {
    console.warn(pc.yellow(`HTTP specs not found at: ${HTTP_SPECS}`));
  }
  const allSpecs = [...azureSpecs, ...standardSpecs];

  // Build task groups (tasks for same spec run sequentially to avoid state pollution).
  // emitYamlOnly: true -> phase 1 emits YAML only; phase 2 (runBatchPythonProcessing) writes .py files.
  const groups = buildTaskGroups(allSpecs, flags, ctx, { emitYamlOnly: true });
  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);

  console.log(pc.cyan(`Found ${allSpecs.length} specs (${totalTasks} total tasks) to compile`));
  console.log(pc.cyan(`Using ${jobs} parallel jobs\n`));

  // Run compilation (emits YAML only)
  const startTime = performance.now();
  const results = await runParallel(groups, jobs, ctx);
  const compileTime = (performance.now() - startTime) / 1000;

  // Summary for TypeSpec compilation
  const succeeded = Array.from(results.values()).filter((v) => v).length;
  const compileFailed = results.size - succeeded;

  console.log(
    pc.cyan(
      `\nTypeSpec compilation: ${succeeded} succeeded, ${compileFailed} failed (${compileTime.toFixed(1)}s)`,
    ),
  );

  if (compileFailed > 0) {
    console.log(pc.red(`Skipping Python processing due to compilation failures`));
    return false;
  }

  // Batch process all specs with Python
  const pyStartTime = performance.now();
  const configCount = (await collectConfigFiles(GENERATED_FOLDER, flavor)).length;
  // Use fewer Python jobs since Python processing is heavier
  const pyJobs = Math.max(4, jobs);
  const pySuccess = runBatchPythonProcessing(flavor, GENERATED_FOLDER, configCount, pyJobs);
  const pyTime = (performance.now() - pyStartTime) / 1000;

  const totalTime = (performance.now() - startTime) / 1000;

  console.log(pc.cyan(`\n${"=".repeat(60)}`));
  console.log(pc.cyan(`Results: ${succeeded} specs processed`));
  console.log(
    pc.cyan(
      `  TypeSpec: ${compileTime.toFixed(1)}s | Python: ${pyTime.toFixed(1)}s | Total: ${totalTime.toFixed(1)}s`,
    ),
  );
  console.log(pc.cyan(`${"=".repeat(60)}\n`));

  return pySuccess;
}

async function main() {
  const isWindows = platform() === "win32";
  const flavor = argv.values.flavor;
  const name = argv.values.name;
  const debug = argv.values.debug ?? false;
  // Windows has slower file system operations and process spawning,
  // so use fewer parallel jobs to avoid I/O contention and memory pressure
  const defaultJobs = isWindows ? 10 : 30;
  const jobs = argv.values.jobs ? parseInt(argv.values.jobs, 10) : defaultJobs;

  console.log(pc.cyan(`\nRegeneration config:`));
  console.log(pc.cyan(`  Platform: ${isWindows ? "Windows" : "Unix"}`));
  console.log(pc.cyan(`  Mode:     in-process compilation`));
  console.log(pc.cyan(`  Jobs:     ${jobs}`));
  if (name) {
    console.log(pc.cyan(`  Filter:   ${name}`));
  }
  console.log();

  const startTime = performance.now();
  let success: boolean;

  await prepareBaselineOfGeneratedCode(GENERATED_FOLDER);

  if (flavor) {
    success = await regenerateFlavor(flavor, name, debug, jobs);
  } else {
    // Both flavors
    const azureSuccess = await regenerateFlavor("azure", name, debug, jobs);
    const unbrandedSuccess = await regenerateFlavor("unbranded", name, debug, jobs);
    success = azureSuccess && unbrandedSuccess;
  }

  const totalDuration = (performance.now() - startTime) / 1000;
  console.log(
    success
      ? pc.green(`\nRegeneration completed successfully in ${totalDuration.toFixed(1)}s`)
      : pc.red(`\nRegeneration failed after ${totalDuration.toFixed(1)}s`),
  );

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error(pc.red(`Fatal error: ${err}`));
  process.exit(1);
});
