import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { relative } from "pathe";
import pc from "picocolors";
import type { Packages } from "./find-packages.js";
import { log } from "./utils.js";

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  [key: string]: any;
}

export async function patchPackageJson(dir: string, packages: Packages) {
  const packageJsonPath = join(dir, "package.json");

  // Read existing package.json
  const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  // Ensure dependency objects exist
  packageJson.dependencies = packageJson.dependencies ?? {};
  packageJson.devDependencies = packageJson.devDependencies ?? {};
  packageJson.peerDependencies = packageJson.peerDependencies ?? {};
  packageJson.overrides = packageJson.overrides ?? {};

  // Update dependencies to point to tgz files
  for (const pkg of Object.values(packages)) {
    const packageName = pkg.name;
    const relativePath = relative(dir, pkg.path);
    const filePath = `file:${relativePath}`;

    for (const depType of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (packageJson[depType]?.[packageName]) {
        packageJson[depType][packageName] = filePath;
        log(`Updated ${pc.magenta(depType)}: ${pc.green(packageName)} -> ${pc.cyan(filePath)}`);
      }
    }

    // Also set in overrides to ensure all nested dependencies use our version
    packageJson.overrides[packageName] = filePath;
  }

  // Write updated package.json
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
