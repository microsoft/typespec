import { findWorkspacePackagesNoCheck } from "@pnpm/workspace.find-packages";
import { readdir } from "node:fs/promises";
import { relative, resolve } from "pathe";
import pc from "picocolors";
import * as tar from "tar";
import { log } from "./utils.js";

/**
 * Collection of packages indexed by package name.
 */
export interface Packages {
  [key: string]: {
    /** The package name (e.g., "@typespec/compiler") */
    name: string;
    /** Absolute path to the package directory or .tgz file */
    path: string;
  };
}

/**
 * Options for {@link findPackages}
 */
export interface FindPackageOptions {
  /** Directory containing PNPM workspace to scan for packages */
  wsDir?: string;
  /** Directory containing .tgz artifact files */
  tgzDir?: string;
}

/**
 * Finds packages from either a workspace directory or tgz artifact directory.
 *
 * @param options - Configuration specifying the source to find packages from
 * @returns Promise resolving to a collection of discovered packages
 * @throws Error if neither wsDir nor tgzDir is provided
 */
export function findPackages(options: FindPackageOptions): Promise<Packages> {
  if (options.tgzDir) {
    return findPackagesFromTgzArtifactDir(options.tgzDir);
  }
  if (options.wsDir) {
    return findPackagesFromWorkspace(options.wsDir);
  } else {
    throw new Error("Either wsDir or tgzDir must be provided to findPackages");
  }
}

/**
 * Prints a formatted list of discovered packages to the console.
 *
 * @param packages - Collection of packages to display
 */
export function printPackages(packages: Packages): void {
  log("Found packages:");
  for (const [name, pkg] of Object.entries(packages)) {
    log(`  ${pc.green(name)}: ${pc.cyan(relative(process.cwd(), pkg.path))}`);
  }
}

/**
 * Discovers packages from a directory containing .tgz artifact files.
 *
 * This function scans a directory for .tgz files and extracts package information
 * by reading the package.json from within each tar file.
 *
 * @param tgzDir - Directory containing .tgz artifact files
 * @returns Promise resolving to discovered packages with paths pointing to .tgz files
 */
export async function findPackagesFromTgzArtifactDir(tgzDir: string): Promise<Packages> {
  const packages: Packages = {};

  const items = await readdir(tgzDir, { withFileTypes: true });
  const tgzFiles = items
    .filter((item) => item.isFile() && item.name.endsWith(".tgz"))
    .map((item) => item.name);

  // Process tar files in parallel
  await Promise.all(
    tgzFiles.map(async (tgzFile) => {
      const fullPath = resolve(tgzDir, tgzFile);
      const packageName = await extractPackageNameFromTgzFile(fullPath);

      if (packageName) {
        packages[packageName] = {
          name: packageName,
          path: fullPath,
        };
      }
    }),
  );

  return packages;
}

/**
 * Extracts the package name by reading package.json from a .tgz file.
 *
 * This function reads the package.json file from the root of the tar archive
 * to get the accurate package name, which is more reliable than parsing filenames.
 *
 * @param tgzFilePath - Path to the .tgz file
 * @returns Promise resolving to the package name, or null if not found
 */
async function extractPackageNameFromTgzFile(tgzFilePath: string): Promise<string | null> {
  try {
    let packageJsonContent: string | null = null;

    await tar.t({
      file: tgzFilePath,
      // cspell:ignore onentry
      onentry: (entry) => {
        if (entry.path === "package/package.json") {
          entry.on("data", (chunk) => {
            if (packageJsonContent === null) {
              packageJsonContent = "";
            }
            packageJsonContent += chunk.toString();
          });
        }
      },
    });

    if (packageJsonContent) {
      const packageJson = JSON.parse(packageJsonContent);
      return packageJson.name || null;
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to read package.json from ${tgzFilePath}: ${error}`);
  }
}

/**
 * Discovers packages from a PNPM workspace configuration.
 *
 * This function uses PNPM's workspace discovery to find all packages in a monorepo.
 * It filters out private packages and packages without names.
 *
 * @param root - Root directory of the PNPM workspace
 * @returns Promise resolving to discovered packages with paths pointing to package directories
 */
export async function findPackagesFromWorkspace(root: string): Promise<Packages> {
  const pnpmPackages = await findWorkspacePackagesNoCheck(root);
  const packages: Packages = {};

  for (const pkg of pnpmPackages) {
    if (!pkg.manifest.name || pkg.manifest.private) continue;

    packages[pkg.manifest.name] = {
      name: pkg.manifest.name,
      path: pkg.rootDirRealPath,
    };
  }

  return packages;
}
