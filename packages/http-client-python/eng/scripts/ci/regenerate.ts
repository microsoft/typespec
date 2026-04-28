/* eslint-disable no-console */
/**
 * Regenerates Python SDK code from TypeSpec definitions.
 *
 * Uses in-process TypeSpec compilation to avoid subprocess spawning overhead.
 * This is significantly faster than spawning `tsp compile` for each spec.
 */

import { compile, NodeHost } from "@typespec/compiler";
import { execSync } from "child_process";
import { existsSync, readdirSync, rmSync } from "fs";
import { platform } from "os";
import { dirname, join, relative, resolve } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import {
  BASE_AZURE_EMITTER_OPTIONS,
  BASE_EMITTER_OPTIONS,
  getSubdirectories,
  preprocess,
  SpecialFlags,
  toPosix,
  type RegenerateFlags,
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
const AZURE_HTTP_SPECS = resolve(PLUGIN_DIR, "node_modules/@azure-tools/azure-http-specs/specs");
const HTTP_SPECS = resolve(PLUGIN_DIR, "node_modules/@typespec/http-specs/specs");
const GENERATED_FOLDER = argv.values.generatedFolder
  ? resolve(argv.values.generatedFolder)
  : resolve(PLUGIN_DIR, "generator");
const EMITTER_NAME = argv.values.emitterName || "@typespec/http-client-python";

// Emitter options
const AZURE_EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  ...BASE_AZURE_EMITTER_OPTIONS,
  "client/structure/client-operation-group": {
    "package-name": "client-structure-clientoperationgroup",
    namespace: "client.structure.clientoperationgroup",
  },
};

const EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  ...BASE_EMITTER_OPTIONS,
  "type/array": {
    "package-name": "typetest-array",
    namespace: "typetest.array",
  },
};

interface CompileTask {
  spec: string;
  outputDir: string;
  options: Record<string, unknown>;
}

// Group of tasks for the same spec that must run sequentially
interface TaskGroup {
  spec: string;
  tasks: CompileTask[];
}

function defaultPackageName(spec: string): string {
  const specDir = spec.includes("azure") ? AZURE_HTTP_SPECS : HTTP_SPECS;
  return toPosix(relative(specDir, dirname(spec)))
    .replace(/\//g, "-")
    .toLowerCase();
}

function getEmitterOptions(spec: string, flavor: string): Record<string, string>[] {
  const specDir = spec.includes("azure") ? AZURE_HTTP_SPECS : HTTP_SPECS;
  const relativeSpec = toPosix(relative(specDir, spec));
  const key = relativeSpec.includes("resiliency/srv-driven/old.tsp")
    ? relativeSpec
    : dirname(relativeSpec);
  const emitterOpts = EMITTER_OPTIONS[key] ||
    (flavor === "azure" ? AZURE_EMITTER_OPTIONS[key] : [{}]) || [{}];
  return Array.isArray(emitterOpts) ? emitterOpts : [emitterOpts];
}

function buildTaskGroups(specs: string[], flags: RegenerateFlags): TaskGroup[] {
  const groups: TaskGroup[] = [];

  for (const spec of specs) {
    const tasks: CompileTask[] = [];

    for (const emitterConfig of getEmitterOptions(spec, flags.flavor)) {
      // Apply flavor defaults first, then per-spec options so they can override (e.g., "generate-test": "false")
      const options: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(SpecialFlags[flags.flavor] ?? {})) {
        options[k] = v;
      }
      Object.assign(options, emitterConfig);

      // Add flavor
      options["flavor"] = flags.flavor;

      // Set output directory - use tests/generated/<flavor>/<package> structure
      const packageName = (options["package-name"] as string) || defaultPackageName(spec);
      const outputDir =
        (options["emitter-output-dir"] as string) ||
        toPosix(`${GENERATED_FOLDER}/../tests/generated/${flags.flavor}/${packageName}`);
      options["emitter-output-dir"] = outputDir;

      // Debug mode
      if (flags.debug) {
        options["debug"] = true;
      }

      // Examples directory
      options["examples-dir"] = toPosix(join(dirname(spec), "examples"));

      // Emit YAML only - Python processing is batched after all specs compile
      options["emit-yaml-only"] = true;

      tasks.push({ spec, outputDir, options });
    }

    groups.push({ spec, tasks });
  }

  return groups;
}

async function compileSpec(task: CompileTask): Promise<{ success: boolean; error?: string }> {
  const { spec, outputDir, options } = task;

  try {
    // Build compiler options
    const compilerOptions = {
      emit: [PLUGIN_DIR],
      options: {
        [EMITTER_NAME]: options,
      },
    };

    // Compile using TypeSpec compiler directly (no subprocess)
    const program = await compile(NodeHost, spec, compilerOptions);

    if (program.hasError()) {
      const errors = program.diagnostics
        .filter((d) => d.severity === "error")
        .map((d) => d.message)
        .join("\n");
      return { success: false, error: errors };
    }

    return { success: true };
  } catch (err) {
    // Clean up on error
    rmSync(outputDir, { recursive: true, force: true });
    return { success: false, error: String(err) };
  }
}

function renderProgressBar(
  completed: number,
  failed: number,
  total: number,
  width: number = 40,
): string {
  const successCount = completed - failed;
  const successWidth = Math.round((successCount / total) * width);
  const failWidth = Math.round((failed / total) * width);
  const emptyWidth = width - successWidth - failWidth;

  const successBar = pc.bgGreen(" ".repeat(successWidth));
  const failBar = failed > 0 ? pc.bgRed(" ".repeat(failWidth)) : "";
  const emptyBar = pc.dim("░".repeat(Math.max(0, emptyWidth)));

  const percent = Math.round((completed / total) * 100);
  return `${successBar}${failBar}${emptyBar} ${pc.cyan(`${percent}%`)} (${completed}/${total})`;
}

async function runParallel(groups: TaskGroup[], maxJobs: number): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const executing: Set<Promise<void>> = new Set();

  // Count total tasks for progress
  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  let completed = 0;
  let failed = 0;
  const failedSpecs: string[] = [];

  // Check if we're in a TTY for progress bar updates
  const isTTY = process.stdout.isTTY;

  const updateProgress = () => {
    if (isTTY) {
      process.stdout.write(`\r${renderProgressBar(completed, failed, totalTasks)}`);
    }
  };

  // Initial progress bar
  updateProgress();

  for (const group of groups) {
    // Each group runs as a unit - tasks within a group run sequentially
    // But different groups can run in parallel
    const runGroup = async () => {
      const specDir = group.spec.includes("azure") ? AZURE_HTTP_SPECS : HTTP_SPECS;
      const shortName = toPosix(relative(specDir, dirname(group.spec)));

      // Run all tasks in this group sequentially to avoid state pollution
      let groupSuccess = true;
      for (const task of group.tasks) {
        const packageName = (task.options["package-name"] as string) || shortName;

        const result = await compileSpec(task);
        completed++;

        if (!result.success) {
          failed++;
          failedSpecs.push(`${packageName}: ${result.error}`);
          groupSuccess = false;
        }

        updateProgress();
      }

      results.set(group.spec, groupSuccess);
    };

    const p = runGroup().finally(() => executing.delete(p));
    executing.add(p);

    if (executing.size >= maxJobs) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  // Clear progress bar line and print final status
  if (isTTY) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  // Print failures at the end
  if (failedSpecs.length > 0) {
    console.log(pc.red(`\nFailed specs:`));
    for (const spec of failedSpecs) {
      console.log(pc.red(`  • ${spec}`));
    }
  }

  return results;
}

function collectConfigFiles(generatedDir: string, flavor: string): string[] {
  const flavorDir = join(generatedDir, "..", "tests", "generated", flavor);
  if (!existsSync(flavorDir)) return [];

  const configFiles: string[] = [];
  for (const pkg of readdirSync(flavorDir, { withFileTypes: true })) {
    if (pkg.isDirectory()) {
      const pkgDir = join(flavorDir, pkg.name);
      // Find all .tsp-codegen-*.json files (supports multiple configs per output dir)
      for (const file of readdirSync(pkgDir)) {
        if (file.startsWith(".tsp-codegen-") && file.endsWith(".json")) {
          configFiles.push(join(pkgDir, file));
        }
      }
    }
  }
  return configFiles;
}

function runBatchPythonProcessing(flavor: string, configCount: number, jobs: number): boolean {
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
    // Pass directory and flavor instead of individual config files to avoid command line length limits on Windows
    execSync(
      `"${venvPath}" "${batchScript}" --generated-dir "${PLUGIN_DIR}" --flavor ${flavor} --jobs ${jobs}`,
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
  const azureSpecs = flavor === "azure" ? await getSubdirectories(AZURE_HTTP_SPECS, flags) : [];
  const standardSpecs = await getSubdirectories(HTTP_SPECS, flags);
  const allSpecs = [...azureSpecs, ...standardSpecs];

  // Build task groups (tasks for same spec run sequentially to avoid state pollution)
  const groups = buildTaskGroups(allSpecs, flags);
  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);

  console.log(pc.cyan(`Found ${allSpecs.length} specs (${totalTasks} total tasks) to compile`));
  console.log(pc.cyan(`Using ${jobs} parallel jobs\n`));

  // Run compilation (emits YAML only)
  const startTime = performance.now();
  const results = await runParallel(groups, jobs);
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
  const configCount = collectConfigFiles(GENERATED_FOLDER, flavor).length;
  // Use fewer Python jobs since Python processing is heavier
  const pyJobs = Math.max(4, jobs);
  const pySuccess = runBatchPythonProcessing(flavor, configCount, pyJobs);
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
