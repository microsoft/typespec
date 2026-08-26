import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { repoRoot } from "../../common/scripts/utils/common.js";

// Standalone packages that need special handling with npm instead of pnpm
const STANDALONE_PACKAGES = [
  "packages/http-client-csharp",
  // Java package is too large for pkg-pr-new at the moment
  // "packages/http-client-java",
  "packages/http-client-python",
];

// Packages to exclude from pkg-pr-new publishing
const EXCLUDED_PACKAGES = [
  "packages/http-client-java", // Too large for pkg-pr-new
];

export interface PackageInfo {
  name: string;
  path: string;
  isStandalone: boolean;
  isPrivate: boolean;
}

export async function getAllPackages(): Promise<PackageInfo[]> {
  const packagesDir = join(repoRoot, "packages");
  const packages = await readdir(packagesDir, { withFileTypes: true });

  const results: PackageInfo[] = [];
  for (const dirent of packages.filter((d) => d.isDirectory())) {
    const pkgPath = `packages/${dirent.name}`;
    const pkgJsonPath = join(repoRoot, pkgPath, "package.json");
    let pkgJson: { private?: boolean };
    try {
      pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
    } catch {
      // eslint-disable-next-line no-console
      console.warn(`Could not read package.json for ${pkgPath}, skipping.`);
      continue;
    }
    results.push({
      name: dirent.name,
      path: pkgPath,
      isStandalone: STANDALONE_PACKAGES.includes(pkgPath),
      isPrivate: pkgJson.private === true,
    });
  }
  return results;
}

export async function getPublishablePackages(): Promise<PackageInfo[]> {
  const allPackages = await getAllPackages();
  return allPackages.filter((pkg) => !pkg.isPrivate && !EXCLUDED_PACKAGES.includes(pkg.path));
}
