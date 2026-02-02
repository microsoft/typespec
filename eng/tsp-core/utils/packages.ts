import { readdir } from "fs/promises";
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
}

export async function getAllPackages(): Promise<PackageInfo[]> {
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

export async function getPublishablePackages(): Promise<PackageInfo[]> {
  const allPackages = await getAllPackages();
  return allPackages.filter((pkg) => !EXCLUDED_PACKAGES.includes(pkg.path));
}
