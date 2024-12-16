import chalk from "chalk";
import { exec } from "child_process";
import { readdir, readFile, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = join(__dirname, "node_modules/@azure-tools/cadl-ranch-specs");
const ignoreFilePath = join(__dirname, ".testignore");
const reportFilePath = join(__dirname, ".test-gen-report.txt");

async function getIgnoreListWithComments() {
  try {
    const content = await readFile(ignoreFilePath, "utf-8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    const ignoreEntriesWithComments = lines.reduce((acc, line) => {
      if (line.startsWith("#")) {
        if (acc.length > 0 && acc[acc.length - 1].path) {
          acc[acc.length - 1].comment = line.trim();
        }
      } else {
        acc.push({ path: line.trim(), comment: null });
      }
      return acc;
    }, []);
    return ignoreEntriesWithComments;
  } catch (err) {
    console.error(chalk.red(`Could not read ignore file at ${ignoreFilePath}: ${err.message}`));
    return [];
  }
}

async function findTspFiles(directory, ignoreList, mainOnly) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  const ignoredFiles = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    const relativePath = relative(basePath, fullPath);

    const ignoreMatch = ignoreList.find((ignore) => relativePath.startsWith(ignore.path));
    if (ignoreMatch) {
      console.log(
        chalk.yellow(
          `Ignoring: ${relativePath} ${ignoreMatch.comment ? `(${ignoreMatch.comment})` : ""}`,
        ),
      );
      ignoredFiles.push({ path: relativePath, comment: ignoreMatch.comment });
      continue;
    }

    if (entry.isDirectory()) {
      const { files: dirFiles, ignored: dirIgnored } = await findTspFiles(
        fullPath,
        ignoreList,
        mainOnly,
      );
      files.push(...dirFiles);
      ignoredFiles.push(...dirIgnored);
    } else if (entry.isFile()) {
      // Main logic: prioritize client.tsp unless --main-only is passed
      if (mainOnly && entry.name === "main.tsp") {
        files.push(fullPath);
      } else if (!mainOnly) {
        if (entry.name === "client.tsp") {
          files.push(fullPath); // Prioritize client.tsp
        } else if (entry.name === "main.tsp" && !files.some((f) => f.endsWith("client.tsp"))) {
          files.push(fullPath); // Fallback to main.tsp
        }
      }
    }
  }

  return { files, ignored: ignoredFiles };
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyan(`Executing: ${command}`));
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Command failed: ${command}`));
        console.error(chalk.red(`Error: ${error.message}`));
        console.error(chalk.red(`stderr: ${stderr}`));
        reject(error);
      } else {
        console.log(chalk.green(`Command succeeded: ${command}`));
        console.log(chalk.white(`stdout: ${stdout}`));
        resolve(stdout);
      }
    });
  });
}

async function processFiles(selectedFiles, interactive, generateReport, mainOnly) {
  let successCount = 0;
  let failCount = 0;
  let ignoredCount = 0;
  const succeededSpecs = [];
  const ignoredSpecs = [];

  while (true) {
    const ignoreList = selectedFiles.length === 0 ? await getIgnoreListWithComments() : [];
    const { files: tspFiles, ignored } =
      selectedFiles.length === 0
        ? await findTspFiles(basePath, ignoreList, mainOnly)
        : { files: selectedFiles.map((file) => join(basePath, file)), ignored: [] };

    if (selectedFiles.length === 0) {
      ignoredSpecs.push(...ignored);
      ignoredCount += ignored.length;
    }

    const filesToProcess = tspFiles;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];

      try {
        const relativePath = relative(basePath, file);
        const outputDir = join("test/e2e/snapshot", dirname(relativePath));
        const compileCommand = `npx tsp compile ${file} --emit http-client-javascript --output-dir ${outputDir}`;
        const babelCommand = `npx babel ${outputDir} -d dist/${outputDir} --extensions '.ts,.tsx'`;
        const prettierCommand = `npx prettier ${outputDir} --write`;

        console.log(chalk.blue(`Processing: ${file}`));

        await runCommand(compileCommand);
        await runCommand(babelCommand);
        await runCommand(prettierCommand);

        console.log(chalk.green(`Finished processing: ${file}`));
        succeededSpecs.push(relativePath);
        successCount++;
      } catch (error) {
        console.error(chalk.red(`Processing failed for: ${file}`));
        console.error(chalk.red(`Error: ${error.message}`));
        failCount++;

        if (interactive) {
          const action = await askUser(
            "Do you want to (r)esume from where it failed, (n)ext file, or (s)tart again (taking updated ignore list and files into account)? ",
          );

          if (action === "s") {
            console.log(chalk.blue("Restarting with updated lists..."));
            i = -1; // Restart the loop
            break;
          } else if (action === "r") {
            console.log(chalk.blue("Resuming from the failed file..."));
            continue; // Resume from the current file
          } else if (action === "n") {
            console.log(chalk.blue("Skipping to the next file..."));
            continue; // Move to the next file
          } else {
            console.log(chalk.red("Invalid input, exiting."));
            return; // Exit the loop
          }
        } else {
          console.error(chalk.red("Non-interactive mode: exiting due to failure."));
          return;
        }
      }
    }
    break; // Exit while loop after successful processing
  }

  console.log(chalk.bold.green("\nSummary:"));
  console.log(chalk.green(`  Succeeded: ${successCount}`));
  console.log(chalk.red(`  Failed: ${failCount}`));
  console.log(chalk.yellow(`  Ignored: ${ignoredCount}`));
  console.log(chalk.bold.white(`  Total: ${successCount + failCount + ignoredCount}`));

  if (generateReport) {
    const reportContent = [
      "Succeeded Specs:",
      ...succeededSpecs.map((spec) => `  - ${spec}`),
      "",
      "Ignored Specs:",
      ...ignoredSpecs.map((spec) => `  - ${spec.path} ${spec.comment ? `(${spec.comment})` : ""}`),
    ].join("\n");

    await writeFile(reportFilePath, reportContent, "utf-8");
    console.log(chalk.bold.blue(`\nReport generated at: ${reportFilePath}`));
  }
}

function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

const args = process.argv.slice(2);
const interactive = args.includes("--interactive");
const generateReport = args.includes("--report");
const mainOnly = args.includes("--main-only");

(async () => {
  await processFiles(
    args.filter((arg) => !["--interactive", "--report", "--main-only"].includes(arg)),
    interactive,
    generateReport,
    mainOnly,
  );
})();
