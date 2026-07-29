import { execSync } from "child_process";
import { join } from "path";
import { repoRoot } from "../common/scripts/utils/common.ts";
import { listChangedFilesSince } from "../common/scripts/utils/git.ts";
import { CRITICAL_PACKAGES, getPublishablePackages, type PackageInfo } from "./tpm/packages.ts";

const files = await listChangedFilesSince(`origin/main`, { repositoryPath: repoRoot });

// eslint-disable-next-line no-console
console.log("modified files:", files);

const packages = await getPublishablePackages();
const paths = packages.map((pkg) => pkg.path);

const modifiedPackages = packages.filter((pkg) => files.some((f) => f.startsWith(pkg.path + "/")));
const modifiedPaths = modifiedPackages.map((pkg) => pkg.path);
// eslint-disable-next-line no-console
console.log("Packages", { all: paths, modified: modifiedPaths });
if (modifiedPaths.length === 0) {
  // eslint-disable-next-line no-console
  console.log("No modified packages found.");
  process.exit(0);
}

function runCommand(command: string, cwd: string): void {
  execSync(command, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd,
  });
}

function buildPnpmFilterArgs(packages: PackageInfo[]): string {
  const criticalFilters = CRITICAL_PACKAGES.map((name) => `--filter "${name}..."`);
  const criticalDirNames = new Set(CRITICAL_PACKAGES.map((name) => name.replace(/^@typespec\//, "")));
  const restFilters = packages
    .filter((p) => !criticalDirNames.has(p.name))
    .map((p) => `--filter "./${p.name}..."`);
  return [...criticalFilters, ...restFilters].join(" ");
}

try {
  const pnpmPackages = modifiedPackages.filter((p) => !p.isStandalone);
  const standalonePackages = modifiedPackages.filter((p) => p.isStandalone);

  if (pnpmPackages.length > 0) {
    const filters = buildPnpmFilterArgs(pnpmPackages);
    // eslint-disable-next-line no-console
    console.log(`Building pnpm packages with filters: ${filters}`);
    runCommand(`pnpm ${filters} run build`, repoRoot);
  }

  for (const pkg of standalonePackages) {
    // eslint-disable-next-line no-console
    console.log(`Building standalone package: ${pkg.path}`);
    runCommand("npm run build", join(repoRoot, pkg.path));
  }
} catch (e: any) {
  // eslint-disable-next-line no-console
  console.error("Failed to build modified packages before pkg-pr-new publish");
  process.exit(1);
}

try {
  runCommand(`pnpx pkg-pr-new publish ${modifiedPaths.map((x) => `'${x}'`).join(" ")} --pnpm`, repoRoot);
} catch (e: any) {
  // eslint-disable-next-line no-console
  console.error("Failed to run pkg-pr-new publish");
  process.exit(1);
}
