/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
import pc from "picocolors";
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
${pc.bold("Usage:")} tsx typecheck.ts [options]

${pc.bold("Description:")}
  Run type checking (mypy + pyright) on Python code.

${pc.bold("Options:")}
  ${pc.cyan("--generated")}
      Run type checking on generated SDK packages (via tox).
      Use with --flavor to specify azure or unbranded.

  ${pc.cyan("-f, --flavor <azure|unbranded>")}
      SDK flavor to check (only applies to --generated).
      If not specified, checks both flavors.

  ${pc.cyan("--mypy")}
      Run only mypy (skip pyright).

  ${pc.cyan("--pyright")}
      Run only pyright (skip mypy).

  ${pc.cyan("-h, --help")}
      Show this help message.

${pc.bold("Examples:")}
  ${pc.dim("# Type check pygen source (default - runs both mypy and pyright)")}
  tsx typecheck.ts

  ${pc.dim("# Run only mypy on pygen source")}
  tsx typecheck.ts --mypy

  ${pc.dim("# Run only pyright on pygen source")}
  tsx typecheck.ts --pyright

  ${pc.dim("# Type check generated SDK packages")}
  tsx typecheck.ts --generated

  ${pc.dim("# Type check generated SDK packages for azure only")}
  tsx typecheck.ts --generated --flavor=azure
`);
  process.exit(0);
}

function runCommand(command: string, args: string[], cwd?: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`${pc.cyan("[RUN]")} ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, {
      cwd: cwd || root,
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`${pc.green("[PASS]")} ${command} completed successfully`);
        resolve(true);
      } else {
        console.log(`${pc.red("[FAIL]")} ${command} failed with code ${code}`);
        resolve(false);
      }
    });

    proc.on("error", (err) => {
      console.log(`${pc.red("[ERROR]")} ${command}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runMypyOnPygen(): Promise<boolean> {
  console.log(`\n${pc.bold("=== Running mypy on pygen ===")}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
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
  console.log(`\n${pc.bold("=== Running pyright on pygen ===")}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
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
    `\n${pc.bold(`=== Type Checking Generated SDK Packages (${flavors.join(", ")}) ===`)}\n`,
  );

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
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
    console.log(`\n${pc.green(pc.bold("Generated SDK type checking complete!"))}\n`);
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

  console.log(`\n${pc.green(pc.bold("All type checks passed!"))}\n`);
}

main().catch((error) => {
  console.error(`${pc.red("Unexpected error:")}`, error);
  process.exit(1);
});
