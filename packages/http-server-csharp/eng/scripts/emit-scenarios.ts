/* eslint-disable no-console */
import { run } from "@typespec/internal-build-utils";
import { copy, pathExists } from "fs-extra";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { globby } from "globby";
import inquirer from "inquirer";
import ora from "ora";
import pLimit from "p-limit";
import { basename, dirname, join, resolve } from "pathe";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

interface CompileOptions {
  build: boolean;
  interactive: boolean;
}

interface CompileResult {
  status: "succeeded" | "failed";
  relativePath: string;
  portNumber?: number;
  errorDetails?: string;
}

interface FailedCompileResult {
  relativePath: string;
  errorDetails: string;
}

interface CommandLineArgs {
  values: {
    input: string;
    build: boolean;
    interactive: boolean;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tspConfig = join(__dirname, "tspconfig.yaml");

const basePath = join(__dirname, "../..");
const logDirRoot = join(basePath, "temp", "emit-scenarios-logs");
const reportFilePath = join(logDirRoot, "report.txt");
const testScenarioPath = join(basePath, "test", "scenarios");
const ignoreFilePath = join(testScenarioPath, ".testignore");

// Use `parseArgs` to parse command-line arguments
const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    input: { type: "string", default: join(basePath, "..", "http-specs", "specs") },
    build: { type: "boolean", default: true },
    interactive: { type: "boolean", default: false },
  },
  strict: false, // Allow unknown arguments
}) as CommandLineArgs;

const specDir = resolve(argv.values.input);

// Initialize the port number
let portNumber = 65000;

// Remove the log directory if it exists.
async function clearDirectory(dirRoot: string): Promise<void> {
  if (await pathExists(dirRoot)) {
    await rm(dirRoot, { recursive: true, force: true });
  }
}

async function copySelectiveFiles(
  extension: string,
  sourceDir: string,
  targetDir: string,
): Promise<void> {
  const files = await globby(extension, { cwd: sourceDir });
  for (const file of files) {
    const src = join(sourceDir, file);
    const dest = join(targetDir, file);
    await copy(src, dest);
  }
}

async function compileSpec(file: string, options: CompileOptions): Promise<CompileResult> {
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
    await run(
      "npx",
      [
        "tsp",
        "compile",
        fullPath,
        "--emit",
        resolve(import.meta.dirname as string, "../.."),
        "--config",
        tspConfig,
        "--output-dir",
        outputDir,
        "--arg",
        `service-port-http=${portNumber.toString()}`,
        "--arg",
        `service-port-https=${(portNumber + 500).toString()}`,
      ],
      {
        stdio: "ignore",
        silent: true,
      },
    );

    if (spinner) spinner.text = `Formatting with dotnet: ${relativePath}`;
    await run("dotnet", ["format"], { cwd: outputDir, stdio: "ignore", silent: true });

    if (build) {
      if (spinner) spinner.text = `Building project: ${relativePath}`;
      await run("dotnet", ["build"], {
        cwd: outputDir,
        stdio: "ignore",
        silent: true,
      });
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
  } catch (error: any) {
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

async function processFiles(files: string[], options: CompileOptions): Promise<void> {
  const { interactive } = options;
  const succeeded: string[] = [];
  const failed: FailedCompileResult[] = [];

  if (interactive) {
    // Sequential processing so each spinner is visible.
    for (const file of files) {
      try {
        const result = await compileSpec(file, options);
        if (result.status === "succeeded") {
          succeeded.push(result.relativePath);
        } else {
          failed.push({
            relativePath: result.relativePath,
            errorDetails: result.errorDetails || "",
          });
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
        failed.push({ relativePath: result.relativePath, errorDetails: result.errorDetails || "" });
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
async function getIgnoreList(): Promise<string[]> {
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

async function main(): Promise<void> {
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
      interactive: argv.values.interactive,
      build: argv.values.build,
    });
  } catch (error: any) {
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
