/* eslint-disable no-console */
import { spawn } from "child_process";
import fs from "fs";
import { dirname, join } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const monorepoRoot = join(root, "../../");

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
    check: { type: "boolean", short: "c" },
    help: { type: "boolean", short: "h" },
  },
});

if (argv.values.help) {
  console.log(`
${pc.bold("Usage:")} tsx format.ts [options]

${pc.bold("Description:")}
  Format code using Prettier (TypeScript) and Black (Python).

${pc.bold("Options:")}
  ${pc.cyan("-e, --emitter")}
      Format TypeScript emitter code with Prettier.

  ${pc.cyan("-g, --generator")}
      Format Python generator source code (pygen) with Black.

  ${pc.cyan("--generated")}
      Format generated SDK packages with Black.

  ${pc.cyan("-c, --check")}
      Check formatting without making changes (exit with error if unformatted).

  ${pc.cyan("-h, --help")}
      Show this help message.

${pc.bold("Examples:")}
  ${pc.dim("# Format emitter + pygen source (default)")}
  tsx format.ts

  ${pc.dim("# Format only TypeScript emitter")}
  tsx format.ts --emitter

  ${pc.dim("# Format only pygen source code")}
  tsx format.ts --generator

  ${pc.dim("# Check formatting without making changes")}
  tsx format.ts --check

  ${pc.dim("# Format generated SDK packages")}
  tsx format.ts --generated
`);
  process.exit(0);
}

function runCommand(command: string, args: string[]): Promise<boolean> {
  // Add node_modules/.bin directories to PATH so commands like prettier can be found
  const pathSep = process.platform === "win32" ? ";" : ":";
  const binPaths = [
    join(root, "node_modules", ".bin"),
    join(monorepoRoot, "node_modules", ".bin"),
  ].join(pathSep);
  const env = {
    ...process.env,
    PATH: `${binPaths}${pathSep}${process.env.PATH}`,
  };

  return new Promise((resolve) => {
    console.log(`${pc.cyan("[RUN]")} ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env,
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

async function formatEmitter(check: boolean): Promise<boolean> {
  console.log(`\n${pc.bold("=== Formatting TypeScript Emitter ===")}\n`);
  // Use prettier directly - it's available via node_modules/.bin in PATH
  // Exclude CHANGELOG.md as it's managed by chronus changelog tool
  const args = check
    ? [
        "--check",
        "emitter/",
        "eng/scripts/",
        "*.json",
        "README.md",
        "CONTRIBUTING.md",
        "ARCHITECTURE.md",
      ]
    : [
        "--write",
        "emitter/",
        "eng/scripts/",
        "*.json",
        "README.md",
        "CONTRIBUTING.md",
        "ARCHITECTURE.md",
      ];
  return runCommand("prettier", args);
}

async function formatPygenSource(check: boolean): Promise<boolean> {
  console.log(`\n${pc.bold("=== Formatting Python Generator (pygen) ===")}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
    return false;
  }

  const args = [
    "-m",
    "black",
    "generator/pygen",
    "eng/scripts/",
    "--config",
    "./eng/scripts/ci/config/pyproject.toml",
  ];
  if (check) {
    args.push("--check");
  }
  return runCommand(pythonPath, args);
}

async function formatGeneratedPackages(check: boolean): Promise<boolean> {
  console.log(`\n${pc.bold("=== Formatting Generated SDK Packages ===")}\n`);

  let pythonPath: string;
  try {
    pythonPath = getVenvPython();
  } catch (error) {
    console.error(pc.red((error as Error).message));
    return false;
  }

  const args = [
    "-m",
    "black",
    "generator/test/azure/generated",
    "generator/test/unbranded/generated",
    "--config",
    "./eng/scripts/ci/config/pyproject.toml",
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
      `\n${pc.green(pc.bold(`Generated SDK formatting ${check ? "check " : ""}complete!`))}\n`,
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
    `\n${pc.green(pc.bold(`All formatting ${check ? "checks passed" : "complete"}!`))}\n`,
  );
}

main().catch((error) => {
  console.error(`${pc.red("Unexpected error:")}`, error);
  process.exit(1);
});
