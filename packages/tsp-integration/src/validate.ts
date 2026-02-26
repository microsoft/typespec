import { execa } from "execa";
import { readdir } from "fs/promises";
import { globby } from "globby";
import { cpus } from "os";
import { dirname, join, relative } from "pathe";
import pc from "picocolors";
import type { Entrypoint, IntegrationTestSuite } from "./config/types.js";
import { registerConsoleShortcuts } from "./keyboard-api.js";
import type { TaskRunner } from "./runner.js";
import { log, runWithConcurrency, ValidationFailedError } from "./utils.js";

// Number of parallel TypeSpec compilations to run
const COMPILATION_CONCURRENCY = cpus().length;

export interface ValidateSpecsOptions {
  interactive?: boolean;
}

export async function validateSpecs(
  runner: TaskRunner,
  dir: string,
  suite: IntegrationTestSuite,
  options: ValidateSpecsOptions = {},
): Promise<void> {
  const tspConfigDirs = await findTspProjects(dir, suite.pattern ?? "**/tspconfig.yaml");

  if (tspConfigDirs.length === 0) {
    log("No tspconfig.yaml files found in specification directory");
    return;
  }

  runner.group(
    `Found ${pc.yellow(tspConfigDirs.length)} TypeSpec projects`,
    tspConfigDirs.map((projectDir) => pc.bold(relative(dir, projectDir))).join("\n"),
  );

  const tspRunner = new TspRunner(runner, dir, suite, tspConfigDirs, options);
  await tspRunner.run();
}

/** Run  */
export class TspRunner {
  /** If the runner is currently cancelling */
  isCancelling = false;
  runningPromise: Promise<BatchRunResult> | null = null;

  /** Workspace directory */
  dir: string;

  /** Test suit used for this runner */
  suite: IntegrationTestSuite;

  /** Last set of failing projects */
  #failedProjects: string[] = [];

  #runner: TaskRunner;
  #projectDirs: string[];
  #options: ValidateSpecsOptions;

  constructor(
    runner: TaskRunner,
    dir: string,
    suite: IntegrationTestSuite,
    tspConfigDirs: string[],
    options: ValidateSpecsOptions = {},
  ) {
    this.#runner = runner;
    this.dir = dir;
    this.suite = suite;
    this.#options = options;
    this.#projectDirs = tspConfigDirs;
  }

  async run(): Promise<void> {
    if (!this.#options.interactive) {
      const result = await this.#exec(this.#projectDirs);
      if (result.failureCount > 0) {
        throw new ValidationFailedError();
      }
      return;
    }
    registerConsoleShortcuts(this);
    await this.rerunAll();
  }

  async #exec(projectsToRun: string[]): Promise<BatchRunResult> {
    this.runningPromise = this.#execWorker(projectsToRun);
    return await this.runningPromise;
  }
  async #execWorker(projectsToRun: string[]): Promise<BatchRunResult> {
    this.isCancelling = false;
    const result = await runValidation(this.#runner, this, projectsToRun);
    if (this.#options.interactive) {
      log(
        `\nPress ${pc.yellow("a")} to rerun all tests, ${pc.yellow("f")} to rerun failed tests, or ${pc.yellow("q")} to quit.`,
      );
    }
    this.#failedProjects = result.failedProjects;
    this.runningPromise = null;
    return result;
  }

  async cancelCurrentRun(): Promise<void> {
    if (this.runningPromise) {
      this.isCancelling = true;
      await this.runningPromise;
      this.isCancelling = false;
    }
  }

  async rerunFailed(): Promise<void> {
    process.stdin.write("\x1Bc"); // Clear console
    if (this.#failedProjects.length === 0) {
      log(pc.green("No failed projects to rerun."));
      return;
    }
    log(pc.green(`Rerunning ${pc.yellow(this.#failedProjects.length)} failed project(s)...`));
    await this.#exec(this.#failedProjects);
  }

  async rerunAll(): Promise<void> {
    process.stdin.write("\x1Bc"); // Clear console
    log(pc.green(`Running all ${this.#projectDirs.length} projects...`));
    await this.#exec(this.#projectDirs);
  }

  exit(): void {
    process.exit(this.#failedProjects.length > 0 ? 1 : 0);
  }
}

export interface BatchRunResult {
  readonly successCount: number;
  readonly failureCount: number;
  readonly skippedCount: number;
  readonly failedProjects: string[];
}
async function runValidation(
  runner: TaskRunner,
  tspRunner: TspRunner,
  projectsToRun: string[],
): Promise<BatchRunResult> {
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  const failedProjects: string[] = [];

  // Create a processor function that handles the compilation and logging
  const processProject = async (projectDir: string) => {
    if (tspRunner.isCancelling) {
      runner.reportTaskWithDetails("skip", relative(tspRunner.dir, projectDir), "Cancelled");
      return { dir: projectDir, result: { status: "skip", output: "Cancelled" } };
    }
    const result = await verifyProject(runner, tspRunner.dir, projectDir, tspRunner.suite);
    runner.reportTaskWithDetails(result.status, relative(tspRunner.dir, projectDir), result.output);
    return { dir: projectDir, result };
  };

  // Run compilations in parallel with limited concurrency
  const results = await runWithConcurrency(projectsToRun, COMPILATION_CONCURRENCY, processProject);

  // Count successes and failures
  for (const { dir, result } of results) {
    switch (result.status) {
      case "skip":
        skippedCount++;
        break;
      case "pass":
        successCount++;
        break;
      case "fail":
        failureCount++;
        failedProjects.push(dir);
        break;
    }
  }

  log(`\n=== Summary ===`);
  const passed = pc.bold(pc.green(`${successCount} passed`));
  const failed = failureCount > 0 ? pc.bold(pc.red(`${failureCount} failed`)) : undefined;
  const skipped = skippedCount > 0 ? pc.bold(pc.gray(`${skippedCount} skipped`)) : undefined;
  log(
    [passed, failed, skipped].filter(Boolean).join(pc.gray(" | ")),
    pc.gray(`(${projectsToRun.length})`),
  );

  if (failureCount > 0) {
    log("\nFailed folders:");
    failedProjects.forEach((x) => log(`  - ${relative(tspRunner.dir, x)}`));
  }

  return { successCount, failureCount, skippedCount, failedProjects };
}

async function findTspProjects(wd: string, pattern: string): Promise<string[]> {
  const result = await globby(pattern, {
    cwd: wd,
    absolute: true,
  });
  return result.map((x) => dirname(x));
}

/** Find which entrypoints are available */
async function findTspEntrypoints(
  directory: string,
  suite: IntegrationTestSuite,
): Promise<Entrypoint[]> {
  try {
    const entries = await readdir(directory);
    return (suite.entrypoints ?? [{ name: "main.tsp" }]).filter((entrypoint) =>
      entries.includes(entrypoint.name),
    );
  } catch (error) {
    return [];
  }
}

interface ProjectTestResult {
  status: "pass" | "fail" | "skip";
  output: string;
}
async function verifyProject(
  runner: TaskRunner,
  workspaceDir: string,
  dir: string,
  suite: IntegrationTestSuite,
): Promise<ProjectTestResult> {
  const entrypoints = await findTspEntrypoints(dir, suite);

  if (entrypoints.length === 0) {
    const result: ProjectTestResult = {
      status: "fail",
      output: `Project '${dir}' has no valid entrypoints to compile. Checked for: ${suite.entrypoints?.map((e) => e.name).join(", ") ?? "main.tsp"}`,
    };
    runner.reportTaskWithDetails("fail", dir, result.output);
    return result;
  }

  let output = "";
  for (const entrypoint of entrypoints) {
    const result = await execTspCompile(
      workspaceDir,
      join(dir, entrypoint.name),
      entrypoint.options,
    );
    if (!result.success) {
      return { status: "fail", output: result.output };
    } else {
      output += result.output;
      output += `Entrypoint '${entrypoint.name}' compiled successfully.\n`;
    }
  }
  return { status: "pass", output };
}

async function execTspCompile(
  directory: string,
  file: string,
  args: string[] = [],
): Promise<{ success: boolean; output: string }> {
  const { failed, all } = await execa(
    "npm",
    ["exec", "--no", "--", "tsp", "compile", file, "--warn-as-error", ...args],
    {
      cwd: directory,
      stdio: "pipe",
      all: true,
      reject: false,
      env: { FORCE_COLOR: pc.isColorSupported ? "1" : undefined }, // Force color output
    },
  );
  return {
    success: !failed,
    output: all,
  };
}
