/* eslint-disable no-console */
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../");

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
      Format Python generator code with Black.

  ${colors.cyan}-c, --check${colors.reset}
      Check formatting without making changes (exit with error if unformatted).

  ${colors.cyan}-h, --help${colors.reset}
      Show this help message.

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Format everything (emitter + generator)${colors.reset}
  tsx format.ts

  ${colors.cyan}# Format only TypeScript emitter${colors.reset}
  tsx format.ts --emitter
  tsx format.ts -e

  ${colors.cyan}# Format only Python generator${colors.reset}
  tsx format.ts --generator
  tsx format.ts -g

  ${colors.cyan}# Check formatting without making changes${colors.reset}
  tsx format.ts --check
  tsx format.ts -c
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
  const args = check
    ? ["-w", "format:dir", "packages/http-client-python", "--", "--check"]
    : ["-w", "format:dir", "packages/http-client-python"];
  return runCommand("pnpm", args);
}

async function formatGenerator(check: boolean): Promise<boolean> {
  console.log(`\n${colors.bold}=== Formatting Python Generator ===${colors.reset}\n`);
  const args = ["generator/", "scripts/", "--config", "./scripts/ci/config/pyproject.toml"];
  if (check) {
    args.push("--check");
  }
  return runCommand("black", args);
}

async function main(): Promise<void> {
  const runEmitter = argv.values.emitter;
  const runGenerator = argv.values.generator;
  const runBoth = !runEmitter && !runGenerator;
  const check = argv.values.check || false;

  let success = true;

  if (runEmitter || runBoth) {
    const result = await formatEmitter(check);
    if (!result) success = false;
  }

  if (runGenerator || runBoth) {
    const result = await formatGenerator(check);
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
