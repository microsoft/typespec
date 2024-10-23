/* eslint-disable no-console */
import { NodeChronusHost, loadChronusWorkspace } from "@chronus/chronus";
import { readChangeDescriptions } from "@chronus/chronus/change";
import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { parse } from "semver";
import stripJsonComments from "strip-json-comments";

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface BumpManifest {
  packageJsonPath: string;
  /**
   * Old version
   */
  oldVersion: string;
  /**
   * Next stable version
   */
  nextVersion: string;

  /**
   * Current dev version
   */
  newVersion: string;
  manifest: PackageJson;
}

/**
 * @returns map of package to number of changes.
 */
async function getChangeCountPerPackage(workspaceRoot: string) {
  const ws = await loadChronusWorkspace(NodeChronusHost, workspaceRoot);
  const changesets = await readChangeDescriptions(NodeChronusHost, ws);
  const changeCounts: Record<string, number> = {};

  for (const changeset of changesets) {
    for (const pkgName of changeset.packages) {
      if (!(pkgName in changeCounts)) {
        // Count all changes that are not "none"
        changeCounts[pkgName] = 0;
      }
      changeCounts[pkgName] += 1;
    }
  }

  return changeCounts;
}

async function getPackages(
  workspaceRoot: string,
): Promise<Record<string, { path: string; version: string }>> {
  const paths: Record<string, { path: string; version: string }> = {};
  for (const project of await findWorkspacePackagesNoCheck(workspaceRoot)) {
    if (project.manifest.private) {
      continue;
    }
    const packagePath = join(workspaceRoot, project.dir);
    paths[project.manifest.name!] = {
      path: packagePath,
      version: project.manifest.version!,
    };
  }
  return paths;
}

/**
 * Update the package dependencies to match the newly updated version.
 * @param {*} packageManifest
 * @param {*} updatedPackages
 */
function updateDependencyVersions(
  packageManifest: PackageJson,
  updatedPackages: Record<string, BumpManifest>,
  prereleaseTag: string = "dev",
) {
  const clone: PackageJson = {
    ...packageManifest,
  };
  for (const depType of ["dependencies", "devDependencies", "peerDependencies"] as const) {
    const dependencies: Record<string, string> = {};
    const currentDeps = packageManifest[depType];
    if (currentDeps) {
      for (const [name, currentVersion] of Object.entries(currentDeps)) {
        const updatedPackage = updatedPackages[name];
        if (updatedPackage) {
          // Loose dependency accept anything above the last release. This make sure that preview release of only one package need to be bumped without needing all the other as well.
          dependencies[name] = getPrereleaseVersionRange(updatedPackage, prereleaseTag);
          // change to this line to have strict dependency for preview versions
          // dependencies[name] = `~${updatedPackage.newVersion}`;
        } else {
          dependencies[name] = currentVersion;
        }
      }
    }
    clone[depType] = dependencies;
  }

  return clone;
}

function getPrereleaseVersionRange(manifest: BumpManifest, prereleaseTag: string) {
  return `~${manifest.oldVersion} || >=${manifest.nextVersion}-${prereleaseTag} <${manifest.nextVersion}`;
}

function getDevVersion(version: string, changeCount: number) {
  const [_, _1, patch] = version.split(".").map((x) => parseInt(x, 10));
  const nextVersion = getNextVersion(version);
  const devVersion = `${nextVersion}-dev.${changeCount + patch}`;
  console.log(`Bumping version ${version} to ${devVersion}`);
  return devVersion;
}

function getNextVersion(version: string) {
  const parsed = parse(version);
  if (parsed === null) {
    throw new Error(`Invalid semver version ${version}`);
  }
  if (parsed.prerelease.length > 0) {
    const [preName, preVersion] = parsed.prerelease;
    if (typeof preVersion !== "number") {
      throw new Error(`Invalid expected prerelease version ${preVersion} to be a number.`);
    }
    return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preName}.${preVersion + 1}`;
  } else {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }
}

async function addPrereleaseNumber(
  changeCounts: Record<string, number>,
  packages: Record<string, { path: string; version: string }>,
) {
  const updatedManifests: Record<string, BumpManifest> = {};
  for (const [packageName, packageInfo] of Object.entries(packages)) {
    const changeCount = changeCounts[packageName] ?? 0;
    const packageJsonPath = join(packageInfo.path, "package.json");
    const packageJsonContent = await readJsonFile<PackageJson>(packageJsonPath);
    const newVersion = getDevVersion(packageInfo.version, changeCount);

    console.log(`Setting version for ${packageName} to '${newVersion}'`);
    updatedManifests[packageName] = {
      packageJsonPath,
      oldVersion: packageJsonContent.version,
      nextVersion: getNextVersion(packageInfo.version),
      newVersion,
      manifest: {
        ...packageJsonContent,
        version: newVersion,
      },
    };
  }

  for (const { packageJsonPath, manifest } of Object.values(updatedManifests)) {
    const newManifest = updateDependencyVersions(manifest, updatedManifests);
    await writeFile(packageJsonPath, JSON.stringify(newManifest, null, 2));
  }
}

export async function bumpVersionsForPrerelease(workspaceRoots: string[]) {
  let changeCounts = {};
  let packages: Record<string, { path: string; version: string }> = {};
  for (const workspaceRoot of workspaceRoots) {
    changeCounts = { ...changeCounts, ...(await getChangeCountPerPackage(workspaceRoot)) };

    packages = { ...packages, ...(await getPackages(workspaceRoot)) };
  }
  console.log("Change counts: ", changeCounts);
  console.log("Packages", packages);

  console.log("Adding prerelease number");
  await addPrereleaseNumber(changeCounts, packages);
}

async function readJsonFile<T>(filename: string): Promise<T> {
  const content = await readFile(filename);
  return JSON.parse(stripJsonComments(content.toString()));
}

export async function bumpVersionsForPR(
  workspaceRoot: string,
  prNumber: number,
  buildNumber: string,
) {
  const packages = await getPackages(workspaceRoot);
  console.log("Packages", packages);

  const updatedManifests: Record<string, BumpManifest> = {};
  for (const [packageName, packageInfo] of Object.entries(packages)) {
    const packageJsonPath = join(packageInfo.path, "package.json");
    const packageJsonContent = await readJsonFile<PackageJson>(packageJsonPath);
    const newVersion = getPrVersion(packageInfo.version, prNumber, buildNumber);

    console.log(`Setting version for ${packageName} to '${newVersion}'`);
    updatedManifests[packageName] = {
      packageJsonPath,
      oldVersion: packageJsonContent.version,
      nextVersion: getNextVersion(packageInfo.version),
      newVersion,
      manifest: {
        ...packageJsonContent,
        version: newVersion,
      },
    };
  }

  for (const { packageJsonPath, manifest } of Object.values(updatedManifests)) {
    const newManifest = updateDependencyVersions(manifest, updatedManifests, "0");
    await writeFile(packageJsonPath, JSON.stringify(newManifest, null, 2));
  }
}

function getPrVersion(version: string, prNumber: number, buildNumber: string) {
  const nextVersion = getNextVersion(version);
  const devVersion = `${nextVersion}-pr-${prNumber}.${buildNumber}`;
  console.log(`Bumping version ${version} to ${devVersion}`);
  return devVersion;
}
