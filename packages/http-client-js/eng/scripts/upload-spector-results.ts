import { spawn } from "child_process";
import fs from "fs";
import ora from "ora";
import path from "path";
import pc from "picocolors";

/* eslint-disable no-console */

type CoverageUploadOptions = {
  force?: boolean;
};

/** Uploads Spector coverage when CI environment conditions allow it. */
export async function runCoverageUpload({
  force = false,
}: CoverageUploadOptions = {}): Promise<void> {
  console.log(pc.blue("\n🔍 Checking conditions before uploading coverage..."));

  // Retrieve environment variables
  const buildReason = process.env.BUILD_REASON;
  const teamProject = process.env.SYSTEM_TEAMPROJECT;

  // Condition checks
  if (!force) {
    if (buildReason === "PullRequest") {
      console.log(pc.yellow("⚠️  Skipping upload: Running on a Pull Request."));
      return;
    }
    if (teamProject !== "internal") {
      console.log(pc.yellow("⚠️  Skipping upload: Not an internal team project."));
      return;
    }
  } else {
    console.log(pc.magenta("🚀 Force mode enabled: Skipping condition checks."));
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
    console.error(pc.red(`❌ Coverage file missing: ${coverageFilePath}`));
    process.exit(1);
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.error(pc.red(`❌ Missing package.json file in ${projectRoot}`));
    process.exit(1);
  }

  // Extract generator details
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    name?: string;
    version?: string;
  };
  const generatorName = packageJson.name;
  const generatorVersion = packageJson.version;

  if (!generatorName) {
    console.error(pc.red("❌ Generator name not found in package.json"));
    process.exit(1);
  }

  if (!generatorVersion) {
    console.error(pc.red("❌ Generator version not found in package.json"));
    process.exit(1);
  }

  console.log(pc.green("✅ All conditions met. Proceeding with coverage upload...\n"));

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
    await new Promise<void>((resolve, reject) => {
      const uploadProcess = spawn("npx", args, { stdio: "pipe", shell: true });

      // Capture output and errors
      uploadProcess.stdout.on("data", (data) =>
        console.log(pc.gray(`📄 ${data.toString().trim()}`)),
      );
      uploadProcess.stderr.on("data", (data) =>
        console.error(pc.red(`❌ ${data.toString().trim()}`)),
      );

      // Handle process completion
      uploadProcess.on("close", (code) => {
        if (code === 0) {
          spinner.succeed(pc.green("🎉 Coverage upload successful!"));
          resolve();
        } else {
          spinner.fail(pc.red(`❌ Coverage upload failed with exit code ${code}`));
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      // Handle unexpected errors
      uploadProcess.on("error", (error) => {
        spinner.fail(pc.red("❌ An error occurred while uploading coverage."));
        console.error(pc.red(error.message));
        reject(error);
      });
    });
  } catch (error) {
    console.error(pc.red(`❌ Error: ${getErrorMessage(error)}`));
    process.exit(1);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
