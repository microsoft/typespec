import pc from "picocolors";
import type { IntegrationTestSuite } from "./config/types.js";
import { findPackages, printPackages } from "./find-packages.js";
import { ensureRepoState, validateGitClean } from "./git.js";
import { patchPackageJson } from "./patch-package-json.js";
import { TaskRunner } from "./runner.js";
import { action, execWithSpinner, log, repoRoot } from "./utils.js";
import { validateSpecs } from "./validate.js";

export interface RunIntegrationTestSuiteOptions {
  /** Only run specific stages. */
  stages?: Stage[];
  /** Clean the temp directory. By default tries to reuse the repo by reseting and pulling latest changes. */
  clean?: boolean;
  /** Directory for .tgz files. If not provided it will get the packages from the repo. */
  tgzDir?: string;
  /** Enable interactive mode for validation. */
  interactive?: boolean;
}

export const Stages = ["checkout", "patch", "install", "validate", "validate:clean"] as const;
export type Stage = (typeof Stages)[number];

export async function runIntegrationTestSuite(
  wd: string,
  suiteName: string,
  config: IntegrationTestSuite,
  options: RunIntegrationTestSuiteOptions = {},
): Promise<void> {
  const runner = new TaskRunner<Stage>({ verbose: options.clean, stages: options.stages });
  log(
    `Running ${options.stages ? options.stages.map(pc.yellow).join(", ") : "all"} stage${options.stages?.length !== 1 ? "s" : ""}`,
    pc.cyan(suiteName),
    config,
  );

  await runner.stage("checkout", async () => {
    await ensureRepoState(config, wd, {
      clean: options.clean,
    });
  });

  await runner.stage("patch", async () => {
    const packages = await action("Resolving local package versions", async () => {
      const packages = await findPackages(
        options.tgzDir ? { tgzDir: options.tgzDir } : { wsDir: repoRoot },
      );
      printPackages(packages);
      return packages;
    });

    await action("Patching package.json", async () => {
      await patchPackageJson(wd, packages);
    });
  });

  await runner.stage("install", async () => {
    await action("Installing dependencies", async (spinner) => {
      await execWithSpinner(spinner, "npm", ["install", "--no-package-lock"], {
        cwd: wd,
      });
      await execWithSpinner(spinner, "git", ["checkout", "--", "package.json"], {
        cwd: wd,
      });
    });
  });

  await runner.stage("validate", async () => {
    await validateSpecs(runner, wd, config, { interactive: options.interactive });
  });

  await runner.stage("validate:clean", async () => {
    await validateGitClean(wd);
  });
}
