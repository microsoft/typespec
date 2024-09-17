/* eslint-disable no-console */
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const validCommands = ["ci", "lint", "mypy", "pyright", "apiview"];

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    validFolders: { type: "string", required: true, multiple: true },
    flavor: { type: "string" },
    command: { type: "string" },
    name: { type: "string" },
  },
});

const foldersToProcess = argv.values.flavor ? [argv.values.flavor] : argv.values.validFolders || ["azure", "unbranded"];

const commandToRun = argv.values.command || "all";

function getCommand(command: string, flavor: string, name?: string): string {
  if (!validCommands.includes(command)) throw new Error(`Unknown command '${command}'.`);
  const retval = `FOLDER=${flavor} tox -c ./test/${flavor}/tox.ini -e ${command}`;
  if (name) {
    return `${retval} -- -f ${name}`;
  }
  return retval;
}

function sectionExistsInToxIni(command: string, flavor: string): boolean {
  const toxIniPath = join(fileURLToPath(import.meta.url), `../../../../test/${flavor}/tox.ini`);
  const toxIniContent = readFileSync(toxIniPath, "utf-8");
  const sectionHeader = `[testenv:${command}]`;
  return toxIniContent.includes(sectionHeader);
}

function myExecSync(command: string, flavor: string, name?: string): void {
  if (!sectionExistsInToxIni(command, flavor)) {
    console.log(`No section for ${command} in tox.ini for flavor ${flavor}. Skipping...`);
    return;
  }
  execSync(getCommand(command, flavor, name), { stdio: "inherit" });
}

foldersToProcess.forEach((flavor) => {
  try {
    if (commandToRun === "all") {
      for (const key of validCommands) {
        console.log(`Running ${key} for flavor ${flavor}...`);
        myExecSync(key, flavor, argv.values.name);
      }
    } else if (getCommand(commandToRun, flavor, argv.values.name)) {
      console.log(`Running ${commandToRun} for flavor ${flavor}...`);
      myExecSync(commandToRun, flavor, argv.values.name);
    } else {
      console.error(`Error: Unknown command '${commandToRun}'.`);
      process.exit(1);
    }
  } catch (error) {
    console.error((error as Error).message);
    console.error(`Error executing command for flavor ${flavor}: ${(error as Error).message}`);
    process.exit(1);
  }
});
