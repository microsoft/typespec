/* eslint-disable no-console */
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runCommand, executeCommand } from "./utils.js";

interface Arguments {
    folderName: string;
    command?: "pylint" | "mypy" | "pyright" | "eslint";
    skipWarning?: boolean;
    skipEslint?: boolean;
}

const validCommands = ["pylint", "mypy", "pyright", "eslint"];

// PARSE INPUT ARGUMENTS
const argv = yargs(hideBin(process.argv))
    .option("folderName", {
        type: "string",
        choices: ["generator", "autorest"],
        description: "Specify the flavor",
        default: "generator",
    })
    .option("command", {
        alias: "c",
        type: "string",
        choices: validCommands,
        description: "Specify the command to run",
    })
    .option("skipWarning", {
        alias: "s",
        type: "boolean",
        description: "Skip to check warnings",
    })
    .option("skipEslint", {
        alias: "e",
        type: "boolean",
        description: "Skip to check eslint",
    }).argv as Arguments;

export function pylint() {
    runCommand(`pylint ${argv.folderName}/ --rcfile ./scripts/eng/pylintrc`, "pylint");
}

export function mypy() {
    runCommand(`mypy ${argv.folderName}/ --config-file ./scripts/eng/mypy.ini`, "mypy");
}

export function pyright() {
    runCommand(`pyright ${argv.folderName}/ -p ./scripts/eng/pyrightconfig.json`, "pyright");
}

export function eslint() {
    // const checkWarning = argv.skipWarning ? "" : "--max-warnings=0";
    const checkWarning = "";
    executeCommand(`npx eslint . --ext .ts ${checkWarning} `, "eslint");
}

if (argv.command === "pylint") {
    pylint();
} else if (argv.command === "mypy") {
    mypy();
} else if (argv.command === "pyright") {
    pyright();
} else if (argv.command === "eslint") {
    if (!argv.skipEslint) {
        eslint();
    }
} else {
    pylint();
    mypy();
    pyright();
    if (!argv.skipEslint) {
        eslint();
    }
}
