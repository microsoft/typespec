/* eslint-disable no-console */
import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import { cpus } from "os";
import { dirname, join } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const monorepoRoot = join(root, "../../");
const testsDir = join(root, "tests");

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    emitter: { type: "boolean", short: "e" },
    generator: { type: "boolean", short: "g" },
    flavor: { type: "string", short: "f", default: "all" },
    env: { type: "string" },
    jobs: { type: "string", short: "j" },
    name: { type: "string", short: "n" },
    quiet: { type: "boolean", short: "q", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (argv.values.help) {
  console.log(`
Usage: run-tests.ts [options]

Options:
  -e, --emitter                   Run TypeScript emitter tests (vitest)
  -g, --generator                 Run Python generator tests (tox)
  -f, --flavor <azure|unbranded>  SDK flavor to test (only applies to --generator)
                                  If not specified, tests both flavors
  --env <env1,env2,...>           Specific tox environments to run
                                  Available: test, lint, mypy, pyright, docs, ci, unittest
  -j, --jobs <n>                  Number of parallel jobs (default: CPU cores - 2)
  -n, --name <pattern>            Filter tests by name pattern
  -q, --quiet                     Suppress test output (only show pass/fail summary)
  -h, --help                      Show this help message

Environments (for --generator):
  test       Run pytest tests for generated packages
  lint       Run pylint on generated packages
  mypy       Run mypy type checking on generated packages
  pyright    Run pyright type checking on generated packages
  docs       Run documentation validation (apiview, sphinx)
  ci         Run all checks (test + lint + mypy + pyright)
  unittest   Run unit tests for pygen internals

Examples:
  run-tests.ts                                 # Run all tests (emitter + generator)
  run-tests.ts --emitter                       # Run only emitter tests
  run-tests.ts --generator                     # Run generator tests for all flavors
  run-tests.ts --generator --flavor=azure      # Run generator tests for azure only
  run-tests.ts -g -f azure --env=test          # Run pytest for azure only
  run-tests.ts -g --env=mypy                   # Run mypy for all flavors
  run-tests.ts -g -f unbranded --env=lint      # Run pylint for unbranded only
`);
  process.exit(0);
}

// Get Python venv path
function getVenvPython(): string {
  const venvPath = join(root, "venv");
  if (fs.existsSync(join(venvPath, "bin"))) {
    return join(venvPath, "bin", "python");
  } else if (fs.existsSync(join(venvPath, "Scripts"))) {
    return join(venvPath, "Scripts", "python.exe");
  }
  throw new Error("Virtual environment not found. Run 'npm run install' first.");
}

interface ToxResult {
  env: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runToxEnv(env: string, pythonPath: string, name?: string): Promise<ToxResult> {
  const startTime = Date.now();
  const toxIniPath = join(testsDir, "tox.ini");

  // Build command
  const args = ["-m", "tox", "-c", toxIniPath, "-e", env];
  if (name) {
    args.push("--", "-k", name);
  }

  console.log(`${pc.blue("[START]")} ${env}`);

  return new Promise((resolve) => {
    const proc: ChildProcess = spawn(pythonPath, args, {
      cwd: testsDir,
      stdio: !argv.values.quiet ? "inherit" : "pipe",
      env: { ...process.env, FOLDER: env.split("-")[1] || "azure" },
    });

    let stderr = "";
    if (argv.values.quiet && proc.stderr) {
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    proc.on("close", (code) => {
      const duration = (Date.now() - startTime) / 1000;
      const success = code === 0;

      if (success) {
        console.log(`${pc.green("[PASS]")} ${env} (${duration.toFixed(1)}s)`);
      } else {
        console.log(`${pc.red("[FAIL]")} ${env} (${duration.toFixed(1)}s)`);
      }

      resolve({
        env,
        success,
        duration,
        error: success ? undefined : stderr || `Exit code: ${code}`,
      });
    });

    proc.on("error", (err) => {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`${pc.red("[ERROR]")} ${env}: ${err.message}`);
      resolve({
        env,
        success: false,
        duration,
        error: err.message,
      });
    });
  });
}

async function runParallel(
  envs: string[],
  pythonPath: string,
  maxJobs: number,
  name?: string,
): Promise<ToxResult[]> {
  const results: ToxResult[] = [];
  const running: Map<string, Promise<ToxResult>> = new Map();

  for (const env of envs) {
    // Wait if we're at max capacity
    if (running.size >= maxJobs) {
      const completed = await Promise.race(running.values());
      results.push(completed);
      running.delete(completed.env);
    }

    // Start new task
    const task = runToxEnv(env, pythonPath, name);
    running.set(env, task);
  }

  // Wait for remaining tasks
  const remaining = await Promise.all(running.values());
  results.push(...remaining);

  return results;
}

async function _runSequential(
  envs: string[],
  pythonPath: string,
  name?: string,
): Promise<ToxResult[]> {
  const results: ToxResult[] = [];
  for (const env of envs) {
    const result = await runToxEnv(env, pythonPath, name);
    results.push(result);
  }
  return results;
}

function printSummary(results: ToxResult[]): void {
  console.log("\n" + pc.bold("═".repeat(60)));
  console.log(pc.bold(" Test Results Summary"));
  console.log(pc.bold("═".repeat(60)) + "\n");

  const passed = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  for (const result of results) {
    const status = result.success ? pc.green("PASS") : pc.red("FAIL");
    console.log(`  ${status}  ${result.env} (${result.duration.toFixed(1)}s)`);
  }

  console.log("\n" + "─".repeat(60));
  console.log(
    `  ${pc.green(`Passed: ${passed.length}`)}  ` +
      `${pc.red(`Failed: ${failed.length}`)}  ` +
      `Total: ${results.length}  ` +
      `Duration: ${totalDuration.toFixed(1)}s`,
  );
  console.log("─".repeat(60) + "\n");

  if (failed.length > 0) {
    console.log(pc.red("Failed environments:"));
    for (const result of failed) {
      console.log(`  - ${result.env}`);
      if (result.error && !argv.values.quiet) {
        console.log(`    ${result.error.split("\n").slice(0, 5).join("\n    ")}`);
      }
    }
    console.log();
  }
}

async function runEmitterTests(): Promise<ToxResult> {
  const startTime = Date.now();
  console.log(`${pc.blue("[START]")} emitter (vitest)`);

  // Add node_modules/.bin directories to PATH so vitest can be found
  const pathSep = process.platform === "win32" ? ";" : ":";
  const binPaths = [
    join(root, "node_modules", ".bin"),
    join(monorepoRoot, "node_modules", ".bin"),
  ].join(pathSep);
  const env = {
    ...process.env,
    PATH: `${binPaths}${pathSep}${process.env.PATH}`,
  };

  return new Promise((resolve) => {
    const proc: ChildProcess = spawn("vitest", ["run", "-c", "./emitter/vitest.config.ts"], {
      cwd: root,
      stdio: !argv.values.quiet ? "inherit" : "pipe",
      shell: true,
      env,
    });

    let stderr = "";
    if (argv.values.quiet && proc.stderr) {
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    proc.on("close", (code) => {
      const duration = (Date.now() - startTime) / 1000;
      const success = code === 0;

      if (success) {
        console.log(`${pc.green("[PASS]")} emitter (vitest) (${duration.toFixed(1)}s)`);
      } else {
        console.log(`${pc.red("[FAIL]")} emitter (vitest) (${duration.toFixed(1)}s)`);
      }

      resolve({
        env: "emitter (vitest)",
        success,
        duration,
        error: success ? undefined : stderr || `Exit code: ${code}`,
      });
    });

    proc.on("error", (err) => {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`${pc.red("[ERROR]")} emitter (vitest): ${err.message}`);
      resolve({
        env: "emitter (vitest)",
        success: false,
        duration,
        error: err.message,
      });
    });
  });
}

async function main(): Promise<void> {
  const startTime = Date.now();

  const runEmitter = argv.values.emitter;
  const runGenerator = argv.values.generator;
  const runBoth = !runEmitter && !runGenerator;

  const allResults: ToxResult[] = [];

  // Header
  console.log(pc.cyan("\n╔══════════════════════════════════════════════════════════╗"));
  console.log(
    pc.cyan("║") +
      pc.bold("           TypeSpec Python SDK Generator Tests            ") +
      pc.cyan("║"),
  );
  console.log(pc.cyan("╚══════════════════════════════════════════════════════════╝") + "\n");

  // Run emitter tests if requested
  if (runEmitter || runBoth) {
    console.log(`${pc.bold("=== Emitter Tests (TypeScript) ===")}\n`);
    const emitterResult = await runEmitterTests();
    allResults.push(emitterResult);
  }

  // Run generator tests if requested
  if (runGenerator || runBoth) {
    console.log(`\n${pc.bold("=== Generator Tests (Python) ===")}\n`);

    // Determine flavors
    const flavors = argv.values.flavor === "all" ? ["azure", "unbranded"] : [argv.values.flavor!];

    // Determine environments
    let baseEnvs: string[];
    if (argv.values.env) {
      baseEnvs = argv.values.env.split(",").map((e) => e.trim());
    } else {
      // Default: run test environments
      baseEnvs = ["test"];
    }

    // Expand 'ci' into its component environments for parallel execution
    const expandedEnvs: string[] = [];
    for (const env of baseEnvs) {
      if (env === "ci") {
        // Run test first (sequential), then lint/mypy/pyright/docs in parallel
        expandedEnvs.push("test", "lint", "mypy", "pyright", "docs");
      } else {
        expandedEnvs.push(env);
      }
    }

    // Build full environment list
    const envs: string[] = [];
    for (const env of expandedEnvs) {
      if (env === "unittest") {
        envs.push("unittest");
      } else {
        for (const flavor of flavors) {
          envs.push(`${env}-${flavor}`);
        }
      }
    }

    // Get Python path
    let pythonPath: string;
    try {
      pythonPath = getVenvPython();
    } catch (error) {
      console.error(pc.red((error as Error).message));
      process.exit(1);
    }

    // Separate test environments from other environments
    // Test environments must run sequentially (they share port 3000)
    // Other environments (lint, mypy, pyright, docs) can run in parallel
    const testEnvs = envs.filter((e) => e.startsWith("test-") || e === "unittest");
    const otherEnvs = envs.filter((e) => !e.startsWith("test-") && e !== "unittest");

    const maxJobs = argv.values.jobs
      ? parseInt(argv.values.jobs, 10)
      : Math.max(2, cpus().length - 2);

    console.log(`  Flavors:      ${flavors.join(", ")}`);
    console.log(`  Environments: ${envs.join(", ")}`);
    console.log(`  Jobs:         ${maxJobs} (test envs run sequentially, others in parallel)`);
    if (argv.values.name) {
      console.log(`  Filter:       ${argv.values.name}`);
    }
    console.log();

    // Run test environments first (sequentially)
    let results: ToxResult[] = [];
    if (testEnvs.length > 0) {
      console.log(pc.cyan("Running test environments (sequential)..."));
      results = await runParallel(testEnvs, pythonPath, 1, argv.values.name);
    }

    // Run other environments in parallel
    if (otherEnvs.length > 0) {
      console.log(pc.cyan("\nRunning lint/typecheck environments (parallel)..."));
      const otherResults = await runParallel(otherEnvs, pythonPath, maxJobs, argv.values.name);
      results = results.concat(otherResults);
    }

    allResults.push(...results);
  }

  // Print summary
  printSummary(allResults);

  const totalDuration = (Date.now() - startTime) / 1000;
  console.log(`Total execution time: ${totalDuration.toFixed(1)}s\n`);

  // Exit with appropriate code
  const failed = allResults.filter((r) => !r.success);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${pc.red("Unexpected error:")}`, error);
  process.exit(1);
});
