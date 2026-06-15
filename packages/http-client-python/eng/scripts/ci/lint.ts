/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const monorepoRoot = join(root, "../../");
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
    emitter: { type: "boolean", short: "e" },
    generator: { type: "boolean", short: "g" },
    generated: { type: "boolean" },
    flavor: { type: "string", short: "f" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${pc.bold("Usage:")} tsx lint.ts [options]

${pc.bold("Description:")}
  Run linting checks on the codebase.

${pc.bold("Options:")}
  ${pc.cyan("-e, --emitter")}
      Run ESLint on TypeScript emitter code.

  ${pc.cyan("-g, --generator")}
      Run pylint on Python generator source code (pygen).

  ${pc.cyan("--generated")}
      Run pylint on generated SDK packages (via tox).
      Use with --flavor to specify azure or unbranded.

  ${pc.cyan("-f, --flavor <azure|unbranded>")}
      SDK flavor to lint (only applies to --generated).
      If not specified, lints both flavors.

  ${pc.cyan("-h, --help")}
      Show this help message.

${pc.bold("Examples:")}
  ${pc.dim("# Lint emitter + pygen source (default)")}
  tsx lint.ts

  ${pc.dim("# Lint only TypeScript emitter")}
  tsx lint.ts --emitter

  ${pc.dim("# Lint only pygen source code")}
  tsx lint.ts --generator

  ${pc.dim("# Lint generated SDK packages")}
  tsx lint.ts --generated

  ${pc.dim("# Lint generated SDK packages for azure only")}
  tsx lint.ts --generated --flavor=azure
`);
  process.exit(0);
}

function runCommand(
  command: string,
  args: string[],
  cwd?: string,
  displayName?: string,
): Promise<boolean> {
  const workingDir = cwd || root;
  const name = displayName || command;

  // Add node_modules/.bin directories to PATH so commands like eslint can be found
  // Also set NODE_PATH so that config files can resolve packages from monorepo's node_modules
  const pathSep = process.platform === "win32" ? ";" : ":";
  const binPaths = [
    join(workingDir, "node_modules", ".bin"),
    join(root, "node_modules", ".bin"),
    join(monorepoRoot, "node_modules", ".bin"),
  ].join(pathSep);
  const nodePaths = [
    join(workingDir, "node_modules"),
    join(root, "node_modules"),
    join(monorepoRoot, "node_modules"),
  ].join(pathSep);
  const env = {
    ...process.env,
    PATH: `${binPaths}${pathSep}${process.env.PATH}`,
    NODE_PATH: nodePaths,
  };

  return new Promise((resolve) => {
    // If displayName is provided, show it as-is; otherwise show command + args
    const logMessage = displayName ? displayName : `${command} ${args.join(" ")}`;
    console.log(`${pc.cyan("[RUN]")} ${logMessage}`);
    const proc = spawn(command, args, {
      cwd: workingDir,
      stdio: "inherit",
      shell: true,
      env,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`${pc.green("[PASS]")} ${name} completed successfully`);
        resolve(true);
      } else {
        console.log(`${pc.red("[FAIL]")} ${name} failed with code ${code}`);
        resolve(false);
      }
    });

    proc.on("error", (err) => {
      console.log(`${pc.red("[ERROR]")} ${name}: ${err.message}`);
      resolve(false);
    });
  });
}

async function lintEmitter(): Promise<boolean> {
  console.log(`\n${pc.bold("=== Linting TypeScript Emitter ===")}\n`);
  // Run eslint with local config to avoid dependency on monorepo's eslint.config.js
  // This ensures the package can be linted in CI without full monorepo dependencies
  return runCommand(
    "eslint",
    ["emitter/", "--config", "eng/scripts/ci/config/eslint-ci.config.mjs", "--max-warnings=0"],
    root,
    "eslint emitter/ --max-warnings=0",
  );
}

async function lintPygenSource(): Promise<boolean> {
  console.log(`\n${pc.bold("=== Linting Python Generator (pygen) ===")}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
    return false;
  }

  // Lint pygen source code directly with pylint
  return runCommand(pythonPath, [
    "-m",
    "pylint",
    "generator/pygen",
    "--rcfile=eng/scripts/ci/config/pylintrc",
    "--recursive=y",
    "--py-version=3.9",
  ]);
}

async function lintGeneratedPackages(flavor?: string): Promise<boolean> {
  const flavors = flavor ? [flavor] : ["azure", "unbranded"];
  console.log(`\n${pc.bold(`=== Linting Generated SDK Packages (${flavors.join(", ")}) ===`)}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
    return false;
  }

  let success = true;
  for (const f of flavors) {
    const toxEnv = `lint-${f}`;
    const result = await runCommand(
      pythonPath,
      ["-m", "tox", "-c", "tox.ini", "-e", toxEnv],
      testsDir,
    );
    if (!result) success = false;
  }
  return success;
}

async function main(): Promise<void> {
  const runEmitter = argv.values.emitter;
  const runGenerator = argv.values.generator;
  const runGenerated = argv.values.generated;

  // If --generated is specified, only lint generated packages
  if (runGenerated) {
    const result = await lintGeneratedPackages(argv.values.flavor);
    if (!result) process.exit(1);
    console.log(`\n${pc.green(pc.bold("Generated SDK linting complete!"))}\n`);
    return;
  }

  // Default: lint emitter + pygen source
  const runBoth = !runEmitter && !runGenerator;

  let success = true;

  if (runEmitter || runBoth) {
    const result = await lintEmitter();
    if (!result) success = false;
  }

  if (runGenerator || runBoth) {
    const result = await lintPygenSource();
    if (!result) success = false;
  }

  if (!success) {
    process.exit(1);
  }

  console.log(`\n${pc.green(pc.bold("All linting checks passed!"))}\n`);
}

main().catch((error) => {
  console.error(`${pc.red("Unexpected error:")}`, error);
  process.exit(1);
});
