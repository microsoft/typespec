import { parseArgs } from "util";
import { runCommand, executeCommand } from "./utils.js";

// PARSE INPUT ARGUMENTS

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    folderName: { type: "string" },
    command: { type: "string" },
    skipWarning: { type: "boolean" },
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
    "pyright",
  );
}

export function eslint() {
  const checkWarning = argv.values.skipWarning ? "" : "--max-warnings=0";
  executeCommand(`npx eslint . ${checkWarning} `, "eslint");
}

if (argv.values.command === "pylint") {
  pylint();
} else if (argv.values.command === "mypy") {
  mypy();
} else if (argv.values.command === "pyright") {
  pyright();
} else if (argv.values.command === "eslint") {
  eslint();
} else {
  pylint();
  mypy();
  pyright();
  eslint();
}
