/* eslint-disable no-console */
import { execa } from "execa";
import { globby } from "globby";
import { mkdir, rm, copyFile, readFile, writeFile } from "fs/promises";
import { basename, join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { pathExists, copy } from "fs-extra";
import pc from "picocolors";
import pLimit from "p-limit";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import inquirer from "inquirer";

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
  .help()
  .argv;

const specDir = resolve(argv.input);

// Remove the log directory if it exists.
async function clearLogDirectory() {
  if (await pathExists(logDirRoot)) {
    await rm(logDirRoot, { recursive: true, force: true });
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
  const specCopyPath = join(outputDir, "spec.tsp");
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

    if (spinner) spinner.text = `Copying spec to: ${specCopyPath}`;
    await copyFile(fullPath, specCopyPath);

    // Compile the spec and generate server code
    if (spinner) spinner.text = `Compiling: ${relativePath}`;
    await execa("npx", [
      "tsp",
      "compile",
      fullPath,
      "--emit",
      resolve(import.meta.dirname, "../.."),
      "--config",
      tspConfig,
      "--output-dir",
      outputDir,
    ]);

    // Running scaffold command `npx hscs scaffold ./tsp-output/server/ . --use-swaggerui`
    if (spinner) spinner.text = `Creating Project Scaffolding: ${relativePath}`;
    await execa("npx", [
      "hscs",
      "scaffold",
      outputDir,
      ".",
      "--use-swaggerui",
    ]);

    if (spinner) spinner.text = `Formatting with Prettier: ${relativePath}`;
    await execa("npx", ["prettier", outputDir, "--write"]);

    // if (build) {
    //   if (spinner) spinner.text = `Building project: ${relativePath}`;
    //   await execa("npm", ["run", "build"], { cwd: outputDir });
    // }

    if (await pathExists(patchFileDir)) {
      if (spinner) spinner.text = `Copying mock patch files to: ${outputDir}`;
      await copySelectiveFiles("*.cs", patchFileDir, outputDir);
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
    await clearLogDirectory(); // ✅ Clear logs at the start

    const ignoreList = await getIgnoreList();

    const patterns = ["**/main.tsp"];
    const specsList = await globby(patterns, { cwd: specDir });

    const paths = specsList.filter(item => !ignoreList.includes(item));

    await processFiles(paths, {
      interactive: argv.interactive,
      build: argv.build,
    });

    // for (const relativePath of paths) {
    //   const fullPath = resolve(specDir, relativePath);
    //   await compileSpec({ fullPath, relativePath }, {
    //     interactive: argv.interactive,
    //     build: argv.build,
    //   });
    // }

    console.log(pc.green("All specs processed."));
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
