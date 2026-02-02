/* eslint-disable no-console */
import { execSync } from "child_process";
import { readdir } from "fs/promises";
import { join } from "path";
import { parseArgs } from "util";
import { repoRoot } from "../common/scripts/utils/common.js";
import { listChangedFilesSince } from "../common/scripts/utils/git.js";

// Standalone packages that need special handling with npm instead of pnpm
const STANDALONE_PACKAGES = [
  "packages/http-client-csharp",
  "packages/http-client-java",
  "packages/http-client-python",
];

interface PackageInfo {
  name: string;
  path: string;
  isStandalone: boolean;
}

async function getAllPackages(): Promise<PackageInfo[]> {
  const packagesDir = join(repoRoot, "packages");
  const packages = await readdir(packagesDir, { withFileTypes: true });

  return packages
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      const pkgPath = `packages/${dirent.name}`;
      return {
        name: dirent.name,
        path: pkgPath,
        isStandalone: STANDALONE_PACKAGES.includes(pkgPath),
      };
    });
}

async function getModifiedPackages(since: string): Promise<PackageInfo[]> {
  const files = await listChangedFilesSince(since, { repositoryPath: repoRoot });
  console.log("Modified files:", files);

  const allPackages = await getAllPackages();
  const modifiedPackages = allPackages.filter((pkg) =>
    files.some((f) => f.startsWith(pkg.path + "/")),
  );

  console.log(
    "Modified packages:",
    modifiedPackages.map((p) => p.name),
  );
  return modifiedPackages;
}

function runCommand(command: string, cwd: string): void {
  console.log(`\n[${cwd}] Running: ${command}`);
  try {
    execSync(command, {
      stdio: "inherit",
      encoding: "utf-8",
      cwd,
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error(`Failed to run command in ${cwd}: ${error.message}`);
    throw e;
  }
}

function installPackages(packages: PackageInfo[]): void {
  const standalonePackages = packages.filter((p) => p.isStandalone);

  console.log("\n=== Installing pnpm packages ===");
  runCommand("pnpm install", repoRoot);

  // Install standalone packages individually with npm
  for (const pkg of standalonePackages) {
    console.log(`\n=== Installing standalone package: ${pkg.name} ===`);
    runCommand("npm ci", join(repoRoot, pkg.path));
  }
}

function buildPackages(packages: PackageInfo[]): void {
  const pnpmPackages = packages.filter((p) => !p.isStandalone);
  const standalonePackages = packages.filter((p) => p.isStandalone);

  // Build pnpm packages using pnpm filter
  if (pnpmPackages.length > 0) {
    console.log("\n=== Building pnpm packages ===");
    const filters = pnpmPackages.map((p) => `--filter "./${p.path}..."`).join(" ");
    runCommand(`pnpm ${filters} run build`, repoRoot);
  }

  // Build standalone packages individually with npm
  for (const pkg of standalonePackages) {
    console.log(`\n=== Building standalone package: ${pkg.name} ===`);
    runCommand("npm run build", join(repoRoot, pkg.path));
  }
}

function packPackages(packages: PackageInfo[]): void {
  const pnpmPackages = packages.filter((p) => !p.isStandalone);
  const standalonePackages = packages.filter((p) => p.isStandalone);

  // Pack pnpm packages using pnpm pack
  if (pnpmPackages.length > 0) {
    console.log("\n=== Packing pnpm packages ===");
    for (const pkg of pnpmPackages) {
      runCommand("pnpm pack", join(repoRoot, pkg.path));
    }
  }

  // Pack standalone packages with npm
  for (const pkg of standalonePackages) {
    console.log(`\n=== Packing standalone package: ${pkg.name} ===`);
    runCommand("npm pack", join(repoRoot, pkg.path));
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      since: {
        type: "string",
        description: "Git ref to compare against for detecting changes (e.g., origin/main)",
      },
      help: {
        type: "boolean",
        short: "h",
        description: "Show help",
      },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
Usage: tpm <command> [options]

Commands:
  install    Install dependencies for modified packages
  build      Build modified packages
  pack       Pack modified packages

Options:
  --since <ref>   Git ref to compare against for detecting changes (e.g., origin/main)
  -h, --help      Show help

Examples:
  tpm install --since origin/main
  tpm build --since HEAD~5
  tpm pack --since origin/main
`);
    process.exit(values.help ? 0 : 1);
  }

  if (!["install", "build", "pack"].includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error("Valid commands are: install, build, pack");
    process.exit(1);
  }

  let packages: PackageInfo[];

  if (values.since) {
    packages = await getModifiedPackages(values.since);
    if (packages.length === 0) {
      console.log("No modified packages found.");
      return;
    }
  } else {
    // If no --since flag, operate on all packages
    packages = await getAllPackages();
    console.log("Operating on all packages:", packages.map((p) => p.name).join(", "));
  }

  console.log("\n========================================");
  console.log(`Running command: ${command}`);
  console.log(`Packages: ${packages.map((p) => p.name).join(", ")}`);
  console.log(
    `Standalone packages: ${
      packages
        .filter((p) => p.isStandalone)
        .map((p) => p.name)
        .join(", ") || "none"
    }`,
  );
  console.log("========================================\n");

  switch (command) {
    case "install":
      installPackages(packages);
      break;
    case "build":
      buildPackages(packages);
      break;
    case "pack":
      packPackages(packages);
      break;
  }

  console.log(`\n✅ ${command} completed successfully!`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
