#!/usr/bin/env node
import { exec } from "child_process";
import { existsSync } from "fs";
import { copyFile, mkdir, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PackageInfo {
  name: string;
  version: string;
  filename: string;
  published: boolean;
}

/**
 * Extract package name and version from a .tgz filename
 * Format: @scope-name-version.tgz or name-version.tgz
 */
function parsePackageFilename(filename: string): { name: string; version: string } | null {
  if (!filename.endsWith(".tgz")) {
    return null;
  }

  const nameWithoutTgz = filename.slice(0, -4);

  // Handle scoped packages: @scope-name-version.tgz becomes @scope/name
  if (filename.startsWith("@")) {
    // Find the last dash that separates version from name
    const lastDashIndex = nameWithoutTgz.lastIndexOf("-");
    if (lastDashIndex === -1) {
      return null;
    }

    const version = nameWithoutTgz.slice(lastDashIndex + 1);
    const nameWithScope = nameWithoutTgz.slice(0, lastDashIndex);

    // Convert @scope-name to @scope/name
    const firstDashIndex = nameWithScope.indexOf("-");
    if (firstDashIndex === -1) {
      return null;
    }

    const name =
      nameWithScope.slice(0, firstDashIndex) + "/" + nameWithScope.slice(firstDashIndex + 1);

    return { name, version };
  } else {
    // Handle non-scoped packages: name-version.tgz
    const lastDashIndex = nameWithoutTgz.lastIndexOf("-");
    if (lastDashIndex === -1) {
      return null;
    }

    const name = nameWithoutTgz.slice(0, lastDashIndex);
    const version = nameWithoutTgz.slice(lastDashIndex + 1);

    return { name, version };
  }
}

/**
 * Check if a package version is published on npm
 */
async function isPackagePublished(name: string, version: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`npm view ${name}@${version} version`, {
      encoding: "utf8",
    });
    return stdout.trim() === version;
  } catch (error: any) {
    // If npm view returns an error, the package version doesn't exist
    if (error.code === 1 || error.message.includes("E404")) {
      return false;
    }
    // For other errors, log and assume not published
    console.warn(`Warning: Error checking ${name}@${version}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: filter-unpublished-packages <source-folder> <destination-folder> [--manifest <manifest-file>]",
    );
    console.error("");
    console.error("Options:");
    console.error(
      "  --manifest <file>  Path to the manifest file (default: <destination>/manifest.json)",
    );
    process.exit(1);
  }

  const sourceFolder = args[0];
  const destFolder = args[1];

  // Parse optional manifest path
  let manifestPath = join(destFolder, "manifest.json");
  const manifestIndex = args.indexOf("--manifest");
  if (manifestIndex !== -1 && args[manifestIndex + 1]) {
    manifestPath = args[manifestIndex + 1];
  }

  // Validate source folder exists
  if (!existsSync(sourceFolder)) {
    console.error(`Error: Source folder '${sourceFolder}' does not exist`);
    process.exit(1);
  }

  // Create destination folder if it doesn't exist
  if (!existsSync(destFolder)) {
    await mkdir(destFolder, { recursive: true });
    console.log(`Created destination folder: ${destFolder}`);
  }

  // Read all .tgz files from source folder
  const files = await readdir(sourceFolder);
  const tgzFiles = files.filter((f) => f.endsWith(".tgz"));

  console.log(`Found ${tgzFiles.length} .tgz files in ${sourceFolder}`);

  const packageInfos: PackageInfo[] = [];

  // Parse package information from filenames
  for (const filename of tgzFiles) {
    const parsed = parsePackageFilename(filename);
    if (!parsed) {
      console.warn(`Warning: Could not parse filename: ${filename}`);
      continue;
    }

    packageInfos.push({
      name: parsed.name,
      version: parsed.version,
      filename,
      published: false, // Will be checked next
    });
  }

  console.log(`Checking publication status for ${packageInfos.length} packages...`);

  // Check which packages are published
  for (const pkg of packageInfos) {
    const published = await isPackagePublished(pkg.name, pkg.version);
    pkg.published = published;

    if (published) {
      console.log(`✓ ${pkg.name}@${pkg.version} is already published`);
    } else {
      console.log(`✗ ${pkg.name}@${pkg.version} is NOT published`);
    }
  }

  // Filter unpublished packages
  const unpublishedPackages = packageInfos.filter((pkg) => !pkg.published);

  console.log("");
  console.log(
    `Found ${unpublishedPackages.length} unpublished packages out of ${packageInfos.length} total`,
  );

  if (unpublishedPackages.length === 0) {
    console.log("No unpublished packages to move.");
    process.exit(0);
  }

  // Copy unpublished packages to destination
  console.log("");
  console.log(`Copying unpublished packages to ${destFolder}...`);

  const manifestEntries: string[] = [];

  for (const pkg of unpublishedPackages) {
    const sourcePath = join(sourceFolder, pkg.filename);
    const destPath = join(destFolder, pkg.filename);

    await copyFile(sourcePath, destPath);
    console.log(`Copied: ${pkg.filename}`);

    manifestEntries.push(pkg.filename);
  }

  // Create manifest file
  await writeFile(manifestPath, JSON.stringify(manifestEntries, null, 2), "utf8");
  console.log("");
  console.log(`Manifest created: ${manifestPath}`);
  console.log("");
  console.log("Summary:");
  console.log(`  Total packages scanned: ${packageInfos.length}`);
  console.log(`  Already published: ${packageInfos.length - unpublishedPackages.length}`);
  console.log(`  Unpublished (copied): ${unpublishedPackages.length}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
