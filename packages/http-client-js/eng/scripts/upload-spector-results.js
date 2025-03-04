import chalk from "chalk";
import { spawn } from "child_process";
import fs from "fs";
import ora from "ora";
import path from "path";

/* eslint-disable no-console */
export async function runCoverageUpload({ force = false } = {}) {
  console.log(chalk.blue("\n🔍 Checking conditions before uploading coverage..."));

  // Retrieve environment variables
  const buildReason = process.env.BUILD_REASON;
  const teamProject = process.env.SYSTEM_TEAMPROJECT;

  // Condition checks
  if (!force) {
    if (buildReason === "PullRequest") {
      console.log(chalk.yellow("⚠️  Skipping upload: Running on a Pull Request."));
      return;
    }
    if (teamProject !== "internal") {
      console.log(chalk.yellow("⚠️  Skipping upload: Not an internal team project."));
      return;
    }
  } else {
    console.log(chalk.magenta("🚀 Force mode enabled: Skipping condition checks."));
  }

  // File and package details
  const projectRoot = process.cwd();
  const coverageFilePath = path.join(
    projectRoot,
    "temp",
    "tsp-spector-coverage-javascript-standard.json",
  );
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(coverageFilePath)) {
    console.error(chalk.red(`❌ Coverage file missing: ${coverageFilePath}`));
    process.exit(1);
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red(`❌ Missing package.json file in ${projectRoot}`));
    process.exit(1);
  }

  // Extract generator details
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const generatorName = packageJson.name;
  const generatorVersion = packageJson.version;

  if (!generatorName) {
    console.error(chalk.red("❌ Generator name not found in package.json"));
    process.exit(1);
  }

  if (!generatorVersion) {
    console.error(chalk.red("❌ Generator version not found in package.json"));
    process.exit(1);
  }

  console.log(chalk.green("✅ All conditions met. Proceeding with coverage upload...\n"));

  // Construct command and arguments
  const args = [
    "tsp-spector",
    "upload-coverage",
    "--coverageFile",
    coverageFilePath,
    "--generatorName",
    generatorName,
    "--storageAccountName",
    "typespec",
    "--containerName",
    "coverages",
    "--generatorVersion",
    generatorVersion,
    "--generatorMode",
    "standard",
  ];

  // Create a spinner for user feedback
  const spinner = ora({
    text: "Uploading coverage data...",
    color: "cyan",
    spinner: "dots",
  }).start();

  try {
    await new Promise((resolve, reject) => {
      const process = spawn("npx", args, { stdio: "pipe", shell: true });

      // Capture output and errors
      process.stdout.on("data", (data) => console.log(chalk.gray(`📄 ${data.toString().trim()}`)));
      process.stderr.on("data", (data) => console.error(chalk.red(`❌ ${data.toString().trim()}`)));

      // Handle process completion
      process.on("close", (code) => {
        if (code === 0) {
          spinner.succeed(chalk.green("🎉 Coverage upload successful!"));
          resolve();
        } else {
          spinner.fail(chalk.red(`❌ Coverage upload failed with exit code ${code}`));
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      // Handle unexpected errors
      process.on("error", (error) => {
        spinner.fail(chalk.red("❌ An error occurred while uploading coverage."));
        console.error(chalk.red(error.message));
        reject(error);
      });
    });
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}
