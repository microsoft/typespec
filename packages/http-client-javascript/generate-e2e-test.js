#!/usr/bin/env node

import chalk from "chalk";
import { execa } from "execa";
import pkg from "fs-extra";
import { globby } from "globby";
import inquirer from "inquirer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
const { readFile, writeFile } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = join(__dirname, "node_modules", "@azure-tools", "cadl-ranch-specs");
const ignoreFilePath = join(__dirname, ".testignore");
const reportFilePath = join(__dirname, ".test-gen-report.txt");

// Parse command-line arguments using yargs
const argv = yargs(hideBin(process.argv))
  .option("main-only", {
    type: "boolean",
    describe: "Use only main.tsp, even if client.tsp is found",
    default: false,
  })
  .option("interactive", {
    type: "boolean",
    describe: "Enable interactive mode",
    default: false,
  })
  .option("report", {
    type: "boolean",
    describe: "Generate a report after processing",
    default: false,
  })
  .help().argv;

// Read and parse the ignore file
async function getIgnoreList() {
  try {
    const content = await readFile(ignoreFilePath, "utf8");
    const lines = content.split(/\r?\n/);
    const ignoreEntries = lines
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => line.trim());
    return ignoreEntries;
  } catch (err) {
    console.warn(chalk.yellow(`Ignore file not found or unreadable: ${ignoreFilePath}`));
    return [];
  }
}

// Find .tsp files, prioritizing client.tsp over main.tsp
async function findTspFiles(ignoreList, mainOnly = false) {
  const patterns = mainOnly ? ["**/main.tsp"] : ["**/client.tsp", "**/main.tsp"];
  const paths = await globby(patterns, { cwd: basePath });

  // Map to full paths and relative paths
  const files = paths.map((path) => ({
    fullPath: join(basePath, path),
    relativePath: path,
  }));

  // Filter out ignored files
  const nonIgnoredFiles = files.filter(
    (file) => !ignoreList.some((ignore) => file.relativePath.startsWith(ignore)),
  );

  // Prioritize client.tsp over main.tsp if both exist in the same directory
  const filesByDir = new Map();
  for (const file of nonIgnoredFiles) {
    const dir = dirname(file.relativePath);
    const existing = filesByDir.get(dir);
    if (!existing || (!mainOnly && file.relativePath.endsWith("client.tsp"))) {
      filesByDir.set(dir, file);
    }
  }

  const prioritizedFiles = Array.from(filesByDir.values());
  return prioritizedFiles;
}

// Run a shell command using execa
async function runCommand(command, args, options = {}) {
  try {
    console.log(chalk.cyan(`Executing: ${command} ${args.join(" ")}`));
    await execa(command, args, { stdio: "inherit", ...options });
    console.log(chalk.green(`Success: ${command} ${args.join(" ")}`));
  } catch (error) {
    console.error(chalk.red(`Error running command: ${command} ${args.join(" ")}`));
    throw error;
  }
}

// Process files with tsp, babel, and prettier
async function processFiles(files, options) {
  const { interactive, generateReport } = options;
  let successCount = 0;
  let failCount = 0;
  const succeededSpecs = [];
  const failedSpecs = [];

  for (const { fullPath, relativePath } of files) {
    console.log(chalk.blue(`Processing: ${relativePath}`));
    const outputDir = join("test", "e2e", "snapshot", dirname(relativePath));

    try {
      await runCommand("npx", [
        "tsp",
        "compile",
        fullPath,
        "--emit",
        "http-client-javascript",
        "--output-dir",
        outputDir,
      ]);
      await runCommand("npx", [
        "babel",
        outputDir,
        "-d",
        `dist/${outputDir}`,
        "--extensions",
        ".ts,.tsx",
      ]);
      await runCommand("npx", ["prettier", outputDir, "--write"]);
      console.log(chalk.green(`Finished processing: ${relativePath}`));
      succeededSpecs.push(relativePath);
      successCount++;
    } catch (error) {
      console.error(chalk.red(`Failed to process: ${relativePath}`));
      failedSpecs.push(relativePath);
      failCount++;

      if (interactive) {
        const response = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            message: `Processing failed for ${relativePath}. What do you want to do?`,
            choices: [
              { name: "Retry", value: "retry" },
              { name: "Skip to next file", value: "next" },
              { name: "Abort", value: "abort" },
            ],
          },
        ]);

        if (response.action === "retry") {
          // Retry the same file
          console.log(chalk.blue("Retrying..."));
          continue;
        } else if (response.action === "next") {
          // Move to the next file
          console.log(chalk.blue("Skipping to next file..."));
          continue;
        } else if (response.action === "abort") {
          console.log(chalk.yellow("Aborting processing."));
          break;
        }
      } else {
        console.error(chalk.red("Non-interactive mode: exiting due to failure."));
        break;
      }
    }
  }

  console.log(chalk.bold.green("\nSummary:"));
  console.log(chalk.green(`  Succeeded: ${successCount}`));
  console.log(chalk.bold.yellow(`  Ignored: ${options.ignoreCount}`));
  console.log(chalk.red(`  Failed: ${failCount}`));
  console.log(chalk.bold.white(`  Total: ${successCount + failCount}`));

  if (generateReport) {
    const reportContent = [
      "Succeeded Specs:",
      ...succeededSpecs.map((spec) => `  - ${spec}`),
      "",
      "Failed Specs:",
      ...failedSpecs.map((spec) => `  - ${spec}`),
    ].join("\n");

    await writeFile(reportFilePath, reportContent, "utf8");
    console.log(chalk.bold.blue(`\nReport generated at: ${reportFilePath}`));
  }
}

// Main script logic
(async () => {
  const ignoreList = await getIgnoreList();
  const files = await findTspFiles(ignoreList, argv["main-only"]);

  if (files.length === 0) {
    console.log(chalk.yellow("No files to process."));
    return;
  }

  const options = {
    interactive: argv.interactive,
    generateReport: argv.report,
    ignoreCount: ignoreList.length,
  };

  await processFiles(files, options);
})();
