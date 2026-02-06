#!/usr/bin/env node
import { exec } from "child_process";
import { existsSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export type PublishSummaryStatus = "success" | "partial" | "failed";

export interface PublishedPackageSuccess {
  published: true;
  name: string;
  version: string;
}

export interface PublishedPackageFailure {
  published: false;
  name: string;
  error: string;
}

export type PublishPackageResult = PublishedPackageSuccess | PublishedPackageFailure;

export interface PublishSummary {
  status: PublishSummaryStatus;
  packages: Record<string, PublishPackageResult>;
}

interface PackageInfo {
  name: string;
  version: string;
  filename: string;
  published: boolean;
}

/**
 * Extract package name and version from a .tgz file by reading its package.json
 */
async function parsePackageFromTarball(
  filePath: string,
): Promise<{ name: string; version: string } | null> {
  try {
    // Extract package.json from the tarball
    // npm pack creates tarballs with structure: package/package.json
    const { stdout } = await execAsync(`tar -xzOf "${filePath}" package/package.json`, {
      encoding: "utf8",
    });

    const packageJson = JSON.parse(stdout);
    if (!packageJson.name || !packageJson.version) {
      return null;
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
    };
  } catch (error: any) {
    console.warn(`Warning: Could not extract package.json from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Check if a package version is published on npm using the registry API
 */
async function isPackagePublished(name: string, version: string): Promise<boolean> {
  try {
    // Encode package name for URL (handles scoped packages like @typespec/compiler)
    const encodedName = encodeURIComponent(name).replace(/%2F/g, "/");
    const registryUrl = `https://registry.npmjs.org/${encodedName}`;

    const response = await fetch(registryUrl);

    if (response.status === 404) {
      // Package doesn't exist at all
      return false;
    }

    if (!response.ok) {
      console.warn(`Warning: Error checking ${name}@${version}: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();

    // Check if the specific version exists in the versions object
    return data.versions && version in data.versions;
  } catch (error: any) {
    console.warn(`Warning: Error checking ${name}@${version}: ${error.message}`);
    return false;
  }
}

/**
 * Convert package name to environment variable name format
 * Example: @typespec/compiler -> TYPESPEC_COMPILER
 */
function packageNameToEnvVar(packageName: string): string {
  return packageName
    .replace(/@/g, "") // Remove @
    .replace(/\//g, "_") // Replace / with _
    .replace(/-/g, "_") // Replace - with _
    .toUpperCase(); // Convert to uppercase
}

/**
 * Main function
 */
async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      manifest: {
        type: "string",
      },
    },
    allowPositionals: true,
  });

  if (positionals.length < 1) {
    console.error(
      "Usage: filter-unpublished-packages <source-folder> [--manifest <manifest-file>]",
    );
    console.error("");
    console.error("Options:");
    console.error("  --manifest <file>  Path to the manifest file (default: manifest.json)");
    process.exit(1);
  }

  const sourceFolder = positionals[0];

  // Parse optional manifest path
  const manifestPath = values.manifest ? resolve(values.manifest) : "manifest.json";

  // Validate source folder exists
  if (!existsSync(sourceFolder)) {
    console.error(`Error: Source folder '${sourceFolder}' does not exist`);
    process.exit(1);
  }

  // Read all .tgz files from source folder
  const files = await readdir(sourceFolder);
  const tgzFiles = files.filter((f) => f.endsWith(".tgz"));

  console.log(`Found ${tgzFiles.length} .tgz files in ${sourceFolder}`);

  const packageInfos: PackageInfo[] = [];

  // Parse package information from filenames
  for (const filename of tgzFiles) {
    const filePath = join(sourceFolder, filename);
    const parsed = await parsePackageFromTarball(filePath);
    if (!parsed) {
      console.warn(`Warning: Could not parse package from: ${filename}`);
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
  const packages: Record<string, PublishPackageResult> = {};

  if (unpublishedPackages.length === 0) {
    console.log("No unpublished packages found.");
  } else {
    // Set environment variables for unpublished packages
    console.log("");
    console.log("Setting environment variables for unpublished packages...");

    // Set PUBLISH_PKG_ANY to indicate there's at least one package to publish
    console.log("Set PUBLISH_PKG_ANY=true");
    console.log("##vso[task.setvariable variable=PUBLISH_PKG_ANY;isOutput=true]true");
    console.log("");

    for (const pkg of unpublishedPackages) {
      const envVarName = `PUBLISH_PKG_${packageNameToEnvVar(pkg.name)}`;
      console.log(`Set ${envVarName}=true for ${pkg.name}@${pkg.version}`);
      console.log(`##vso[task.setvariable variable=${envVarName};isOutput=true]true`);

      packages[pkg.name] = {
        name: pkg.name,
        published: true,
        version: pkg.version,
      };
    }
  }

  // Create publish summary manifest
  const publishSummary: PublishSummary = {
    status: Object.keys(packages).length > 0 ? "success" : "failed",
    packages,
  };

  await writeFile(manifestPath, JSON.stringify(publishSummary, null, 2), "utf8");
  console.log("");
  console.log(`Publish summary created: ${manifestPath}`);
  console.log(`Status: ${publishSummary.status}`);
  console.log("");
  console.log("Summary:");
  console.log(`  Total packages scanned: ${packageInfos.length}`);
  console.log(`  Already published: ${packageInfos.length - unpublishedPackages.length}`);
  console.log(`  Need publishing (env vars set): ${unpublishedPackages.length}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
