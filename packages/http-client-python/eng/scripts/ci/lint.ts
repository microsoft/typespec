/* eslint-disable no-console */
import { parseArgs } from "util";
import { runCommand } from "./utils.js";

// PARSE INPUT ARGUMENTS

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    folderName: { type: "string" },
    command: { type: "string" },
  },
});

export function pylint() {
  runCommand(`pylint ./generator`, "pylint");
}

export function mypy() {
  runCommand(`mypy ./generator`, "mypy");
}

export function pyright() {
  runCommand(`pyright ./generator`, "pyright");
}

if (argv.values.command === "pylint") {
  pylint();
} else if (argv.values.command === "mypy") {
  mypy();
} else if (argv.values.command === "pyright") {
  pyright();
} else {
  pylint();
  mypy();
  pyright();
}
