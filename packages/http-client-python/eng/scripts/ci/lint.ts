/* eslint-disable no-console */
import { parseArgs } from "util";
import { executeCommand, runCommand } from "./utils.js";

// PARSE INPUT ARGUMENTS

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    folderName: { type: "string" },
    command: { type: "string" },
    skipWarning: { type: "boolean" },
    skipEslint: { type: "boolean" },
  },
});

export function pylint() {
  runCommand(`pylint ${argv.values.folderName}/ --rcfile ./eng/scripts/ci/pylintrc`, "pylint");
}

export function mypy() {
  runCommand(`mypy ${argv.values.folderName}/ --config-file ./eng/scripts/ci/mypy.ini`, "mypy");
}

export function pyright() {
  runCommand(
    `pyright ${argv.values.folderName}/ -p ./eng/scripts/ci/pyrightconfig.json`,
    "pyright"
  );
}

export function eslint() {
  const checkWarning = "";
  executeCommand(`npx eslint . --ext .ts ${checkWarning} `, "eslint");
}

if (argv.values.command === "pylint") {
  pylint();
} else if (argv.values.command === "mypy") {
  mypy();
} else if (argv.values.command === "pyright") {
  pyright();
} else if (argv.values.command === "eslint") {
  if (!argv.values.skipEslint) {
    eslint();
  }
} else {
  pylint();
  mypy();
  pyright();
  if (!argv.values.skipEslint) {
    eslint();
  }
}
