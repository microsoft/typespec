/* eslint-disable no-console */
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../");
const testsDir = join(root, "tests");

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
      Run pylint on Python generator code (via tox).

  ${colors.cyan}-f, --flavor <azure|unbranded>${colors.reset}
      SDK flavor to lint (only applies to --generator).
      If not specified, lints both flavors.

  ${colors.cyan}-h, --help${colors.reset}
      Show this help message.

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Lint everything (emitter + generator)${colors.reset}
  tsx lint.ts

  ${colors.cyan}# Lint only TypeScript emitter${colors.reset}
  tsx lint.ts --emitter
  tsx lint.ts -e

  ${colors.cyan}# Lint only Python generator (all flavors)${colors.reset}
  tsx lint.ts --generator
  tsx lint.ts -g

  ${colors.cyan}# Lint Python generator for azure flavor only${colors.reset}
  tsx lint.ts --generator --flavor=azure
  tsx lint.ts -g -f azure
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
  return runCommand("npx", ["eslint", "emitter/", "--max-warnings=0"]);
}

async function lintGenerator(flavor?: string): Promise<boolean> {
  const flavors = flavor ? [flavor] : ["azure", "unbranded"];
  console.log(
    `\n${colors.bold}=== Linting Python Generator (${flavors.join(", ")}) ===${colors.reset}\n`,
  );

  let success = true;
  for (const f of flavors) {
    const toxEnv = `lint-${f}`;
    const result = await runCommand(
      "python",
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
  const runBoth = !runEmitter && !runGenerator;

  let success = true;

  if (runEmitter || runBoth) {
    const result = await lintEmitter();
    if (!result) success = false;
  }

  if (runGenerator || runBoth) {
    const result = await lintGenerator(argv.values.flavor);
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
