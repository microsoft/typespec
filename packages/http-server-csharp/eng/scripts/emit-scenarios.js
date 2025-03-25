/* eslint-disable no-console */
import { execa } from "execa";
import { copy, pathExists } from "fs-extra";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { globby } from "globby";
import inquirer from "inquirer";
import ora from "ora";
import pLimit from "p-limit";
import { basename, dirname, join, resolve } from "pathe";
import pc from "picocolors";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tspConfig = join(__dirname, "tspconfig.yaml");

const basePath = join(__dirname, "../..");
const logDirRoot = join(basePath, "temp", "emit-scenarios-logs");
const reportFilePath = join(logDirRoot, "report.txt");
const testScenarioPath = join(basePath, "test", "scenarios");
const ignoreFilePath = join(testScenarioPath, ".testignore");

const argv = yargs(hideBin(process.argv))
  .option("input", {
    alias: "i",
    type: "string",
    description: "Input spec folder",
    default: join(basePath, "..", "http-specs", "specs"),
  })
  .option("build", {
    type: "boolean",
    describe: "Build the generated projects",
    default: true,
  })
  .option("interactive", {
    type: "boolean",
    describe: "Enable interactive mode",
    default: false,
  })
  .help().argv;

const specDir = resolve(argv.input);

// Initialize the port number
let portNumber = 65000;

// Remove the log directory if it exists.
async function clearDirectory(dirRoot) {
  if (await pathExists(dirRoot)) {
    await rm(dirRoot, { recursive: true, force: true });
  }
}

async function copySelectiveFiles(extension, sourceDir, targetDir) {
  const files = await globby(extension, { cwd: sourceDir });
  for (const file of files) {
    const src = join(sourceDir, file);
    const dest = join(targetDir, file);
    await copy(src, dest);
  }
}

async function compileSpec(file, options) {
  const relativePath = file;
  const fullPath = resolve(specDir, relativePath);
  const { build, interactive } = options;
  const patchFileDir = join(testScenarioPath, dirname(relativePath));
  const outputDir = join(testScenarioPath, "generated", dirname(relativePath));
  const logDir = join(logDirRoot, dirname(relativePath));

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

    // Increment the port number for each folder
    portNumber++;

    // Compile the spec and generate server code
    if (spinner) spinner.text = `Generating csharp server code: ${relativePath}`;
    await execa("npx", [
      "tsp",
      "compile",
      fullPath,
      "--emit",
      resolve(import.meta.dirname, "../.."),
      "--config",
      tspConfig,
      "--output-dir",
      join(outputDir, "generated"),
      "--arg",
      `service-port-http=${portNumber.toString()}`,
      "--arg",
      `service-port-https=${(portNumber + 500).toString()}`,
    ]);

    if (spinner) spinner.text = `Formatting with dotnet: ${relativePath}`;
    await execa("dotnet", ["format"], { cwd: outputDir });

    if (build) {
      if (spinner) spinner.text = `Building project: ${relativePath}`;
      await execa("dotnet", ["build"], { cwd: outputDir });
    }

    if (await pathExists(patchFileDir)) {
      const mockDir = join(outputDir, "mocks");
      if (spinner) spinner.text = `Copying mock patch files to: ${mockDir}`;
      await copySelectiveFiles("*.cs", patchFileDir, mockDir);
    }

    if (spinner) {
      spinner.succeed(`Finished processing: ${relativePath}`);
    }
    return { status: "succeeded", relativePath, portNumber };
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
        return await compileSpec(file, options);
      } else if (action === "next") {
        console.log(pc.yellow(`Skipping: ${relativePath}`));
      } else if (action === "abort") {
        console.log(pc.red("Aborting processing."));
        throw new Error("Processing aborted by user");
      }
    }
    return { status: "failed", relativePath, errorDetails };
  }
}

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
        compileSpec(file, options).then((result) => {
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

  console.log(pc.bold(pc.green("\nProcessing Complete:")));
  console.log(pc.green(`Succeeded: ${succeeded.length}`));
  console.log(pc.red(`Failed: ${failed.length}`));

  if (failed.length > 0) {
    console.log(pc.red("\nFailed Specs:"));
    failed.forEach((f) => {
      console.log(pc.red(`  - ${f.relativePath}`));
    });
    console.log(pc.blue(`\nLogs available at: ${logDirRoot}`));
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
  console.log(pc.blue(`Report written to: ${reportFilePath}`));
}

// Read and parse the ignore file.
async function getIgnoreList() {
  try {
    const content = await readFile(ignoreFilePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.trim());
  } catch {
    console.warn(pc.yellow("No ignore file found."));
    return [];
  }
}

async function main() {
  const startTime = process.hrtime.bigint();
  let exitCode = 0;
  try {
    await clearDirectory(logDirRoot); // ✅ Clear logs at the start
    await clearDirectory(join(testScenarioPath, "generated")); // ✅ Clear output folders at the start

    const ignoreList = await getIgnoreList();

    const patterns = ["**/main.tsp"];
    const specsList = await globby(patterns, { cwd: specDir });

    const paths = specsList.filter((item) => !ignoreList.includes(item));

    await processFiles(paths, {
      interactive: argv.interactive,
      build: argv.build,
    });
  } catch (error) {
    console.error(pc.red(`❌ Fatal Error: ${error.message}`));
    exitCode = 1; // ✅ Ensure graceful failure handling
  } finally {
    // ✅ Always log execution time before exit
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e9; // Convert nanoseconds to seconds
    console.log(pc.blue(`⏱️ Total execution time: ${duration.toFixed(2)} seconds`));

    process.exit(exitCode); // ✅ Ensures proper exit handling
  }
}

main();
