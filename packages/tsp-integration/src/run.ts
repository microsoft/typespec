import pc from "picocolors";
import type { IntegrationTestSuite } from "./config/types.js";
import { findPackages, printPackages } from "./find-packages.js";
import { ensureRepoState, validateGitClean } from "./git.js";
import { detectPackageManager, getInstallCommand } from "./package-manager.js";
import {
  discardDependencyPatch,
  patchDependencies,
  restoreDependencies,
} from "./patch-dependencies.js";
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
    await discardDependencyPatch(wd);
  });

  await runner.stage("patch", async () => {
    const packages = await action("Resolving local package versions", async () => {
      const packages = await findPackages(
        options.tgzDir ? { tgzDir: options.tgzDir } : { wsDir: repoRoot },
      );
      printPackages(packages);
      return packages;
    });

    await action("Patching dependency configuration", async () => {
      const manager = await detectPackageManager(wd);
      log(`Using ${manager} in ${wd}`);
      await patchDependencies(wd, packages, manager);
    });
  });

  await runner.stage("install", async () => {
    await action("Installing dependencies", async (spinner) => {
      const { command, args } = getInstallCommand(await detectPackageManager(wd));
      log(`Using ${command} in ${wd}`);
      await execWithSpinner(spinner, command, args, {
        cwd: wd,
      });
      await restoreDependencies(wd);
    });
  });

  await runner.stage("validate", async () => {
    await validateSpecs(runner, wd, config, { interactive: options.interactive });
  });

  await runner.stage("validate:clean", async () => {
    await validateGitClean(wd);
  });
}
