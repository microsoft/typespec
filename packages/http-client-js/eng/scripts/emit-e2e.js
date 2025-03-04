#!/usr/bin/env node
/* eslint-disable no-console */
import chalk from "chalk";
import { execa } from "execa";
import pkg from "fs-extra";
import { copyFile, mkdir, rm } from "fs/promises";
import { globby } from "globby";
import inquirer from "inquirer";
import ora from "ora";
import pLimit from "p-limit";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

const { pathExists, stat, readFile, writeFile } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "../..");
const tspConfig = join(__dirname, "tspconfig.yaml");

const basePath = join(projectRoot, "node_modules", "@typespec", "http-specs", "specs");
const ignoreFilePath = join(projectRoot, ".testignore");
const logDirRoot = join(projectRoot, "temp", "emit-e2e-logs");
const reportFilePath = join(logDirRoot, "report.txt");

// Remove the log directory if it exists.
async function clearLogDirectory() {
  if (await pathExists(logDirRoot)) {
    await rm(logDirRoot, { recursive: true, force: true });
  }
}

// Parse command-line arguments.
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
  .positional("paths", {
    describe: "Optional list of specific file or directory paths to process (relative to basePath)",
    type: "string",
    array: true,
    default: [],
  })
  .option("build", {
    type: "boolean",
    describe: "Build the generated projects",
    default: false,
  })
  .help().argv;

// Read and parse the ignore file.
async function getIgnoreList() {
  try {
    const content = await readFile(ignoreFilePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.trim());
  } catch {
    console.warn(chalk.yellow("No ignore file found."));
    return [];
  }
}

// Recursively process paths (files or directories relative to basePath).
async function processPaths(paths, ignoreList, mainOnly) {
  const results = [];
  for (const relativePath of paths) {
    const fullPath = resolve(basePath, relativePath);

    if (!(await pathExists(fullPath))) {
      console.warn(chalk.yellow(`Path not found: ${relativePath}`));
      continue;
    }

    const stats = await stat(fullPath);
    if (stats.isFile() && (fullPath.endsWith("client.tsp") || fullPath.endsWith("main.tsp"))) {
      if (ignoreList.some((ignore) => relativePath.startsWith(ignore))) continue;
      results.push({ fullPath, relativePath });
    } else if (stats.isDirectory()) {
      const patterns = mainOnly ? ["**/main.tsp"] : ["**/client.tsp", "**/main.tsp"];
      const discoveredPaths = await globby(patterns, { cwd: fullPath });
      const validFiles = discoveredPaths
        .map((p) => ({
          fullPath: join(fullPath, p),
          relativePath: join(relativePath, p),
        }))
        .filter((file) => !ignoreList.some((ignore) => file.relativePath.startsWith(ignore)));
      results.push(...validFiles);
    } else {
      console.warn(chalk.yellow(`Skipping unsupported path: ${relativePath}`));
    }
  }

  // Deduplicate and prioritize client.tsp over main.tsp.
  const filesByDir = new Map();
  for (const file of results) {
    const dir = dirname(file.relativePath);
    const existing = filesByDir.get(dir);
    if (!existing || (!mainOnly && file.relativePath.endsWith("client.tsp"))) {
      filesByDir.set(dir, file);
    }
  }
  return Array.from(filesByDir.values());
}

// Run a shell command silently.
async function runCommand(command, args, options = {}) {
  // Remove clutter by not printing anything; capture output by setting stdio to 'pipe'.
  return await execa(command, args, {
    stdio: "pipe",
    env: { NODE_ENV: "test", TYPESPEC_JS_EMITTER_TESTING: "true", ...process.env },
    ...options,
  });
}

// Process a single file.
async function processFile(file, options) {
  const { fullPath, relativePath } = file;
  const { build, interactive } = options;
  const outputDir = join("test", "e2e", "generated", dirname(relativePath));
  const specCopyPath = join(outputDir, "spec.tsp");
  const logDir = join(projectRoot, "temp", "emit-e2e-logs", dirname(relativePath));

  let spinner;
  if (interactive) {
    spinner = ora({ text: `Processing: ${relativePath}`, color: "cyan" }).start();
  }

  try {
    if (await pathExists(outputDir)) {
      if (spinner) spinner.text = `Clearing directory: ${outputDir}`;
      await rm(outputDir, { recursive: true, force: true });
    }
    if (spinner) spinner.text = `Creating directory: ${outputDir}`;
    await mkdir(outputDir, { recursive: true });

    if (spinner) spinner.text = `Copying spec to: ${specCopyPath}`;
    await copyFile(fullPath, specCopyPath);

    if (spinner) spinner.text = `Compiling: ${relativePath}`;
    await runCommand("npx", [
      "tsp",
      "compile",
      fullPath,
      "--emit",
      "@typespec/http-client-js",
      "--config",
      tspConfig,
      "--output-dir",
      outputDir,
    ]);

    if (spinner) spinner.text = `Transpiling with Babel: ${relativePath}`;
    await runCommand("npx", [
      "babel",
      outputDir,
      "-d",
      `dist/${outputDir}`,
      "--extensions",
      ".ts,.tsx",
    ]);

    if (spinner) spinner.text = `Formatting with Prettier: ${relativePath}`;
    await runCommand("npx", ["prettier", outputDir, "--write"]);

    if (build) {
      if (spinner) spinner.text = `Building project: ${relativePath}`;
      await runCommand("npm", ["run", "build"], { cwd: outputDir });
    }

    if (spinner) {
      spinner.succeed(`Finished processing: ${relativePath}`);
    }
    return { status: "succeeded", relativePath };
  } catch (error) {
    if (spinner) {
      spinner.fail(`Failed processing: ${relativePath}`);
    }
    const errorDetails = error.stdout || error.stderr || error.message;

    // Write error details to a log file.
    await mkdir(logDir, { recursive: true });
    const logFilePath = join(logDir, `${basename(relativePath, ".tsp")}-error.log`);
    await writeFile(logFilePath, errorDetails, "utf8");

    if (interactive) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: `Processing failed for ${relativePath}. What would you like to do?`,
          choices: [
            { name: "Retry", value: "retry" },
            { name: "Skip to next file", value: "next" },
            { name: "Abort processing", value: "abort" },
          ],
        },
      ]);

      if (action === "retry") {
        if (spinner) spinner.start(`Retrying: ${relativePath}`);
        return await processFile(file, options);
      } else if (action === "next") {
        console.log(chalk.yellow(`Skipping: ${relativePath}`));
      } else if (action === "abort") {
        console.log(chalk.red("Aborting processing."));
        throw new Error("Processing aborted by user");
      }
    }
    return { status: "failed", relativePath, errorDetails };
  }
}

// Process all files.
async function processFiles(files, options) {
  const { interactive } = options;
  const succeeded = [];
  const failed = [];

  if (interactive) {
    // Sequential processing so each spinner is visible.
    for (const file of files) {
      try {
        const result = await processFile(file, options);
        if (result.status === "succeeded") {
          succeeded.push(result.relativePath);
        } else {
          failed.push({ relativePath: result.relativePath, errorDetails: result.errorDetails });
        }
      } catch (err) {
        break;
      }
    }
  } else {
    // Global progress spinner.
    const total = files.length;
    let completed = 0;
    const globalSpinner = ora({ text: `Processing 0/${total} files...`, color: "cyan" }).start();
    const limit = pLimit(4);
    const tasks = files.map((file) =>
      limit(() =>
        processFile(file, options).then((result) => {
          completed++;
          globalSpinner.text = `Processing ${completed}/${total} files...`;
          return result;
        }),
      ),
    );
    const results = await Promise.all(tasks);
    globalSpinner.succeed(`Processed ${total} files`);
    for (const result of results) {
      if (result.status === "succeeded") {
        succeeded.push(result.relativePath);
      } else {
        failed.push({ relativePath: result.relativePath, errorDetails: result.errorDetails });
      }
    }
  }

  console.log(chalk.bold.green("\nProcessing Complete:"));
  console.log(chalk.green(`Succeeded: ${succeeded.length}`));
  console.log(chalk.red(`Failed: ${failed.length}`));

  if (failed.length > 0) {
    console.log(chalk.red("\nFailed Specs:"));
    failed.forEach((f) => {
      console.log(chalk.red(`  - ${f.relativePath}`));
    });
    console.log(chalk.blue(`\nLogs available at: ${logDirRoot}`));
  }

  // Ensure the log directory exists before writing the report.
  await mkdir(logDirRoot, { recursive: true });
  const report = [
    "Succeeded Files:",
    ...succeeded.map((f) => `  - ${f}`),
    "Failed Files:",
    ...failed.map((f) => `  - ${f.relativePath}\n    Error: ${f.errorDetails}`),
  ].join("\n");
  await writeFile(reportFilePath, report, "utf8");
  console.log(chalk.blue(`Report written to: ${reportFilePath}`));
}
// Main execution function
async function main() {
  const startTime = process.hrtime.bigint(); // ✅ High precision time tracking
  let exitCode = 0; // ✅ Track success/failure

  try {
    await clearLogDirectory(); // ✅ Clear logs at the start

    const ignoreList = await getIgnoreList();
    const paths = argv._.length
      ? await processPaths(argv._, ignoreList, argv["main-only"])
      : await processPaths(["."], ignoreList, argv["main-only"]);

    if (paths.length === 0) {
      console.log(chalk.yellow("⚠️ No files to process."));
      return;
    }

    await processFiles(paths, {
      interactive: argv.interactive,
      build: argv.build,
    });
  } catch (error) {
    console.error(chalk.red(`❌ Fatal Error: ${error.message}`));
    exitCode = 1; // ✅ Ensure graceful failure handling
  } finally {
    // ✅ Always log execution time before exit
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e9; // Convert nanoseconds to seconds
    console.log(chalk.blue(`⏱️ Total execution time: ${duration.toFixed(2)} seconds`));

    process.exit(exitCode); // ✅ Ensures proper exit handling
  }
}

await main();
