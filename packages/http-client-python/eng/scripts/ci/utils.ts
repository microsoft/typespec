/* eslint-disable no-console */
import chalk from "chalk";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import process from "process";
import { fileURLToPath } from "url";
import { parseArgs, promisify } from "util";

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    pythonPath: { type: "string" },
    folderName: { type: "string" },
    command: { type: "string" },
  },
});

// execute the command
export async function executeCommand(command: string, args: string[]) {
  const execFileAsync = promisify(execFile);
  try {
    await execFileAsync(command, args);
    console.log(chalk.green(`${command} passed`));
  } catch (err) {
    console.error(chalk.red(`Error executing ${command}: ${err}`));
    process.exit(1);
  }
}

// Function to run a command and log the output
export function runCommand(command: string, args: string[]) {
  let pythonPath = argv.values.pythonPath
    ? resolve(argv.values.pythonPath)
    : join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "venv/");
  if (existsSync(join(pythonPath, "bin"))) {
    pythonPath = join(pythonPath, "bin", "python");
  } else if (existsSync(join(pythonPath, "Scripts"))) {
    pythonPath = join(pythonPath, "Scripts", "python");
  } else {
    throw new Error(pythonPath);
  }
  command = `${pythonPath} -m ${command}`;
  executeCommand(command, args);
}
