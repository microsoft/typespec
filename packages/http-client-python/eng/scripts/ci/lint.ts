/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
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
    emitter: { type: "boolean", short: "e" },
    generator: { type: "boolean", short: "g" },
    generated: { type: "boolean" },
    flavor: { type: "string", short: "f" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${colors.bold}Usage:${colors.reset} tsx lint.ts [options]

${colors.bold}Description:${colors.reset}
  Run linting checks on the codebase.

${colors.bold}Options:${colors.reset}
  ${colors.cyan}-e, --emitter${colors.reset}
      Run ESLint on TypeScript emitter code.

  ${colors.cyan}-g, --generator${colors.reset}
      Run pylint on Python generator source code (pygen).

  ${colors.cyan}--generated${colors.reset}
      Run pylint on generated SDK packages (via tox).
      Use with --flavor to specify azure or unbranded.

  ${colors.cyan}-f, --flavor <azure|unbranded>${colors.reset}
      SDK flavor to lint (only applies to --generated).
      If not specified, lints both flavors.

  ${colors.cyan}-h, --help${colors.reset}
      Show this help message.

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Lint emitter + pygen source (default)${colors.reset}
  tsx lint.ts

  ${colors.cyan}# Lint only TypeScript emitter${colors.reset}
  tsx lint.ts --emitter

  ${colors.cyan}# Lint only pygen source code${colors.reset}
  tsx lint.ts --generator

  ${colors.cyan}# Lint generated SDK packages${colors.reset}
  tsx lint.ts --generated

  ${colors.cyan}# Lint generated SDK packages for azure only${colors.reset}
  tsx lint.ts --generated --flavor=azure
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

async function lintEmitter(): Promise<boolean> {
  console.log(`\n${colors.bold}=== Linting TypeScript Emitter ===${colors.reset}\n`);
  // Run eslint from monorepo root to use the shared eslint config
  return runCommand(
    "npx",
    ["eslint", "packages/http-client-python/emitter/", "--max-warnings=0"],
    monorepoRoot,
  );
}

async function lintPygenSource(): Promise<boolean> {
  console.log(`\n${colors.bold}=== Linting Python Generator (pygen) ===${colors.reset}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
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
  console.log(
    `\n${colors.bold}=== Linting Generated SDK Packages (${flavors.join(", ")}) ===${colors.reset}\n`,
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
    console.log(`\n${colors.green}${colors.bold}Generated SDK linting complete!${colors.reset}\n`);
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

  console.log(`\n${colors.green}${colors.bold}All linting checks passed!${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
