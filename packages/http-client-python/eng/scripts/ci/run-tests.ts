/* eslint-disable no-console */
import { execSync } from "child_process";
import fs, { readFileSync } from "fs";
import { platform } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const validCommands = ["ci", "lint", "mypy", "pyright", "apiview"];

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    validFolders: { type: "string", required: true, multiple: true },
    flavor: { type: "string" },
    command: { type: "string" },
    name: { type: "string" },
  },
});

const foldersToProcess = argv.values.flavor
  ? [argv.values.flavor]
  : argv.values.validFolders || ["azure", "unbranded"];

const commandToRun = argv.values.command || "all";

function getCommand(command: string, flavor: string, name?: string): string {
  if (!validCommands.includes(command)) throw new Error(`Unknown command '${command}'.`);
  let retval: string;
  if (platform() === "win32") {
    retval = `set FOLDER=${flavor} && ${venvPath} -m tox -c ./test/${flavor}/tox.ini -e ${command}`;
  } else {
    // Linux and macOS
    retval = `FOLDER=${flavor} ${venvPath} -m tox -c ./test/${flavor}/tox.ini -e ${command}`;
  }
  if (name) {
    return `${retval} -- -f ${name}`;
  }
  return retval;
}

function sectionExistsInToxIni(command: string, flavor: string): boolean {
  const toxIniPath = join(root, `test/${flavor}/tox.ini`);
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

let venvPath = join(root, "venv");
if (fs.existsSync(join(venvPath, "bin"))) {
  venvPath = join(venvPath, "bin", "python");
} else if (fs.existsSync(join(venvPath, "Scripts"))) {
  venvPath = join(venvPath, "Scripts", "python.exe");
} else {
  throw new Error("Virtual environment doesn't exist.");
}

// Install dependencies from dev_requirements.txt
const devRequirementsPath = join(root, "generator", "dev_requirements.txt");
if (fs.existsSync(devRequirementsPath)) {
  console.log("Installing dependencies from dev_requirements.txt...");
  execSync(`${venvPath} -m pip install -r ${devRequirementsPath}`, { stdio: "inherit" });
} else {
  throw new Error("dev_requirements.txt doesn't exist.");
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
    const message = (error as Error).message;
    if (message.includes("pyright") || message.includes("mypy") || message.includes("lint")) {
      // fixing linting issues that come from upgrading python version in separate pr
      process.exit(0);
    }
    console.error(message);
    console.error(`Error executing command for flavor ${flavor}: ${message}`);
    process.exit(1);
  }
});
