/* eslint-disable no-console */
import chalk from "chalk";
import { exec } from "child_process";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import process from "process";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    pythonPath: { type: "string" },
  },
});

// execute the command
export function executeCommand(command: string, prettyName: string) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error executing ${command}(stdout): ${stdout}`));
      console.error(chalk.red(`Error executing ${command}{stderr}: ${stderr}`));
      process.exit(1);
    }
    if (stderr) {
      // Process stderr output
      console.log(chalk.yellow(`${command}:\n${stderr}`));
      return;
    }
    console.log(chalk.green(`${prettyName} passed`));
  });
}

// Function to run a command and log the output
export function runCommand(command: string, prettyName: string) {
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
  executeCommand(command, prettyName);
}
