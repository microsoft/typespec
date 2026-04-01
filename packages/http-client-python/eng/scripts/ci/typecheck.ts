/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const testsDir = join(root, "tests");

// Get Python venv path
function getVenvPython(): string {
  const venvPath = join(root, "venv");
  if (fs.existsSync(join(venvPath, "bin"))) {
    return join(venvPath, "bin", "python");
  } else if (fs.existsSync(join(venvPath, "Scripts"))) {
    return join(venvPath, "Scripts", "python.exe");
  }
  throw new Error("Virtual environment not found. Run 'npm run install' first.");
}

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    generated: { type: "boolean" },
    flavor: { type: "string", short: "f" },
    mypy: { type: "boolean" },
    pyright: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${colors.bold}Usage:${colors.reset} tsx typecheck.ts [options]

${colors.bold}Description:${colors.reset}
  Run type checking (mypy + pyright) on Python code.

${colors.bold}Options:${colors.reset}
  ${colors.cyan}--generated${colors.reset}
      Run type checking on generated SDK packages (via tox).
      Use with --flavor to specify azure or unbranded.

  ${colors.cyan}-f, --flavor <azure|unbranded>${colors.reset}
      SDK flavor to check (only applies to --generated).
      If not specified, checks both flavors.

  ${colors.cyan}--mypy${colors.reset}
      Run only mypy (skip pyright).

  ${colors.cyan}--pyright${colors.reset}
      Run only pyright (skip mypy).

  ${colors.cyan}-h, --help${colors.reset}
      Show this help message.

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Type check pygen source (default - runs both mypy and pyright)${colors.reset}
  tsx typecheck.ts

  ${colors.cyan}# Run only mypy on pygen source${colors.reset}
  tsx typecheck.ts --mypy

  ${colors.cyan}# Run only pyright on pygen source${colors.reset}
  tsx typecheck.ts --pyright

  ${colors.cyan}# Type check generated SDK packages${colors.reset}
  tsx typecheck.ts --generated

  ${colors.cyan}# Type check generated SDK packages for azure only${colors.reset}
  tsx typecheck.ts --generated --flavor=azure
`);
  process.exit(0);
}

function runCommand(command: string, args: string[], cwd?: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}[RUN]${colors.reset} ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, {
      cwd: cwd || root,
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`${colors.green}[PASS]${colors.reset} ${command} completed successfully`);
        resolve(true);
      } else {
        console.log(`${colors.red}[FAIL]${colors.reset} ${command} failed with code ${code}`);
        resolve(false);
      }
    });

    proc.on("error", (err) => {
      console.log(`${colors.red}[ERROR]${colors.reset} ${command}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runMypyOnPygen(): Promise<boolean> {
  console.log(`\n${colors.bold}=== Running mypy on pygen ===${colors.reset}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
    return false;
  }

  return runCommand(pythonPath, [
    "-m",
    "mypy",
    "generator/pygen",
    "--config-file=eng/scripts/ci/config/mypy.ini",
    "--ignore-missing",
  ]);
}

async function runPyrightOnPygen(): Promise<boolean> {
  console.log(`\n${colors.bold}=== Running pyright on pygen ===${colors.reset}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
    return false;
  }

  return runCommand(pythonPath, [
    "-m",
    "pyright",
    "-p",
    "eng/scripts/ci/config/pyrightconfig.json",
    "generator/pygen",
  ]);
}

async function runTypecheckOnGenerated(
  flavor?: string,
  mypyOnly?: boolean,
  pyrightOnly?: boolean,
): Promise<boolean> {
  const flavors = flavor ? [flavor] : ["azure", "unbranded"];
  console.log(
    `\n${colors.bold}=== Type Checking Generated SDK Packages (${flavors.join(", ")}) ===${colors.reset}\n`,
  );

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
    return false;
  }

  let success = true;

  for (const f of flavors) {
    if (!pyrightOnly) {
      const mypyEnv = `mypy-${f}`;
      const result = await runCommand(
        pythonPath,
        ["-m", "tox", "-c", "tox.ini", "-e", mypyEnv],
        testsDir,
      );
      if (!result) success = false;
    }

    if (!mypyOnly) {
      const pyrightEnv = `pyright-${f}`;
      const result = await runCommand(
        pythonPath,
        ["-m", "tox", "-c", "tox.ini", "-e", pyrightEnv],
        testsDir,
      );
      if (!result) success = false;
    }
  }

  return success;
}

async function main(): Promise<void> {
  const runGenerated = argv.values.generated;
  const mypyOnly = argv.values.mypy && !argv.values.pyright;
  const pyrightOnly = argv.values.pyright && !argv.values.mypy;

  // If --generated is specified, type check generated packages
  if (runGenerated) {
    const result = await runTypecheckOnGenerated(argv.values.flavor, mypyOnly, pyrightOnly);
    if (!result) process.exit(1);
    console.log(
      `\n${colors.green}${colors.bold}Generated SDK type checking complete!${colors.reset}\n`,
    );
    return;
  }

  // Default: type check pygen source
  let success = true;

  if (!pyrightOnly) {
    const mypyResult = await runMypyOnPygen();
    if (!mypyResult) success = false;
  }

  if (!mypyOnly) {
    const pyrightResult = await runPyrightOnPygen();
    if (!pyrightResult) success = false;
  }

  if (!success) {
    process.exit(1);
  }

  console.log(`\n${colors.green}${colors.bold}All type checks passed!${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
