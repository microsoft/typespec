/* eslint-disable no-console */
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { fileURLToPath } from "url";

interface Arguments {
    validFolders: string[];
    flavor?: string;
    command?: string;
    name?: string;
}

const validCommands = ["ci", "lint", "mypy", "pyright", "apiview"];

// Parse command-line arguments using yargs
const argv = yargs(hideBin(process.argv))
    .option("validFolders", {
        alias: "vf",
        describe: "Specify the valid folders",
        type: "array",
        default: ["azure", "unbranded"],
    })
    .option("flavor", {
        alias: "f",
        describe: "Specify the flavor to use",
        type: "string",
    })
    .option("command", {
        alias: "c",
        describe: "Specify the command to run",
        choices: validCommands,
        type: "string",
    })
    .option("name", {
        alias: "n",
        describe: "Specify the name of the test",
        type: "string",
    }).argv as Arguments;

const foldersToProcess = argv.flavor ? [argv.flavor] : argv.validFolders;

const commandToRun = argv.command || "all";

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
                myExecSync(key, flavor, argv.name);
            }
        } else if (getCommand(commandToRun, flavor, argv.name)) {
            console.log(`Running ${commandToRun} for flavor ${flavor}...`);
            myExecSync(commandToRun, flavor, argv.name);
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
