/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../");

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
    check: { type: "boolean", short: "c" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${colors.bold}Usage:${colors.reset} tsx format.ts [options]

${colors.bold}Description:${colors.reset}
  Format code using Prettier (TypeScript) and Black (Python).

${colors.bold}Options:${colors.reset}
  ${colors.cyan}-e, --emitter${colors.reset}
      Format TypeScript emitter code with Prettier.

  ${colors.cyan}-g, --generator${colors.reset}
      Format Python generator source code (pygen) with Black.

  ${colors.cyan}--generated${colors.reset}
      Format generated SDK packages with Black.

  ${colors.cyan}-c, --check${colors.reset}
      Check formatting without making changes (exit with error if unformatted).

  ${colors.cyan}-h, --help${colors.reset}
      Show this help message.

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Format emitter + pygen source (default)${colors.reset}
  tsx format.ts

  ${colors.cyan}# Format only TypeScript emitter${colors.reset}
  tsx format.ts --emitter

  ${colors.cyan}# Format only pygen source code${colors.reset}
  tsx format.ts --generator

  ${colors.cyan}# Check formatting without making changes${colors.reset}
  tsx format.ts --check

  ${colors.cyan}# Format generated SDK packages${colors.reset}
  tsx format.ts --generated
`);
  process.exit(0);
}

function runCommand(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}[RUN]${colors.reset} ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, {
      cwd: root,
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

async function formatEmitter(check: boolean): Promise<boolean> {
  console.log(`\n${colors.bold}=== Formatting TypeScript Emitter ===${colors.reset}\n`);
  // Use prettier directly for check mode, otherwise use pnpm format:dir
  // Exclude CHANGELOG.md as it's managed by chronus changelog tool
  if (check) {
    return runCommand("npx", [
      "prettier",
      "--check",
      "emitter/",
      "scripts/",
      "*.json",
      "README.md",
      "CONTRIBUTING.md",
      "ARCHITECTURE.md",
    ]);
  } else {
    return runCommand("pnpm", ["-w", "format:dir", "packages/http-client-python"]);
  }
}

async function formatPygenSource(check: boolean): Promise<boolean> {
  console.log(`\n${colors.bold}=== Formatting Python Generator (pygen) ===${colors.reset}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
    return false;
  }

  const args = [
    "-m",
    "black",
    "generator/pygen",
    "scripts/",
    "--config",
    "./scripts/ci/config/pyproject.toml",
  ];
  if (check) {
    args.push("--check");
  }
  return runCommand(pythonPath, args);
}

async function formatGeneratedPackages(check: boolean): Promise<boolean> {
  console.log(`\n${colors.bold}=== Formatting Generated SDK Packages ===${colors.reset}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(colors.red + (error as Error).message + colors.reset);
    return false;
  }

  const args = [
    "-m",
    "black",
    "generator/test/azure/generated",
    "generator/test/unbranded/generated",
    "--config",
    "./scripts/ci/config/pyproject.toml",
  ];
  if (check) {
    args.push("--check");
  }
  return runCommand(pythonPath, args);
}

async function main(): Promise<void> {
  const runEmitter = argv.values.emitter;
  const runGenerator = argv.values.generator;
  const runGenerated = argv.values.generated;
  const check = argv.values.check || false;

  // If --generated is specified, only format generated packages
  if (runGenerated) {
    const result = await formatGeneratedPackages(check);
    if (!result) process.exit(1);
    console.log(
      `\n${colors.green}${colors.bold}Generated SDK formatting ${check ? "check " : ""}complete!${colors.reset}\n`,
    );
    return;
  }

  // Default: format emitter + pygen source
  const runBoth = !runEmitter && !runGenerator;

  let success = true;

  if (runEmitter || runBoth) {
    const result = await formatEmitter(check);
    if (!result) success = false;
  }

  if (runGenerator || runBoth) {
    const result = await formatPygenSource(check);
    if (!result) success = false;
  }

  if (!success) {
    process.exit(1);
  }

  console.log(
    `\n${colors.green}${colors.bold}All formatting ${check ? "checks passed" : "complete"}!${colors.reset}\n`,
  );
}

main().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
