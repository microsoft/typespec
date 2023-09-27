/* eslint-disable no-console */
import { lstat, readdir, readFile, stat, writeFile } from "fs/promises";
import { join } from "path";
import { parse } from "semver";
import stripJsonComments from "strip-json-comments";

interface RushChangeFile {
  packageName: string;
  changes: RushChange[];
}

interface RushChange {
  packageName: string;
  comment: string;
  type: "major" | "minor" | "patch" | "none";
}

interface RushWorkspace {
  projects: any[];
}

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

async function getAllChanges(workspaceRoot: string): Promise<RushChangeFile[]> {
  const changeDir = join(workspaceRoot, "common", "changes");
  const files = await findAllFiles(changeDir);
  return await Promise.all(files.map((x) => readJsonFile<RushChangeFile>(x)));
}

/**
 * @returns map of package to number of changes.
 */
async function getChangeCountPerPackage(workspaceRoot: string) {
  const changes = await getAllChanges(workspaceRoot);
  console.log("Changes", changes);
  const changeCounts: Record<string, number> = {};

  for (const change of changes) {
    if (!(change.packageName in changeCounts)) {
      // Count all changes that are not "none"
      changeCounts[change.packageName] = 0;
    }
    changeCounts[change.packageName] += change.changes.length;
  }

  return changeCounts;
}

async function getPackages(
  workspaceRoot: string
): Promise<Record<string, { path: string; version: string }>> {
  const rushJson = await readJsonFile<RushWorkspace>(join(workspaceRoot, "rush.json"));

  const paths: Record<string, { path: string; version: string }> = {};
  for (const project of rushJson.projects) {
    const packagePath = join(workspaceRoot, project.projectFolder);
    const pkg = await readJsonFile<PackageJson>(join(packagePath, "package.json"));
    paths[project.packageName] = {
      path: packagePath,
      version: pkg.version,
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
  updatedPackages: Record<string, BumpManifest>
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
          dependencies[name] = getDevVersionRange(updatedPackage);
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

function getDevVersionRange(manifest: BumpManifest) {
  return `~${manifest.oldVersion} || >=${manifest.nextVersion}-dev <${manifest.nextVersion}`;
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
  packages: Record<string, { path: string; version: string }>
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

  // Bumping with rush publish so rush computes from the changes what will be the next non prerelease version.
  console.log("Adding prerelease number");
  await addPrereleaseNumber(changeCounts, packages);
}

async function findAllFiles(dir: string): Promise<string[]> {
  const files = [];
  if (!(await isDirectory(dir))) {
    return [];
  }

  for (const file of await readdir(dir)) {
    const path = join(dir, file);
    const stat = await lstat(path);
    if (stat.isDirectory()) {
      files.push(...(await findAllFiles(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function readJsonFile<T>(filename: string): Promise<T> {
  const content = await readFile(filename);
  return JSON.parse(stripJsonComments(content.toString()));
}

async function isDirectory(path: string) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}

export async function bumpVersionsForPR(
  workspaceRoot: string,
  prNumber: number,
  buildNumber: string
) {
  const packages = await getPackages(workspaceRoot);
  console.log("Packages", packages);

  // Bumping with rush publish so rush computes from the changes what will be the next non prerelease version.

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
    await writeFile(packageJsonPath, JSON.stringify(manifest, null, 2));
  }
}

function getPrVersion(version: string, prNumber: number, buildNumber: string) {
  const nextVersion = getNextVersion(version);
  const devVersion = `${nextVersion}-pr-${prNumber}.${buildNumber}`;
  console.log(`Bumping version ${version} to ${devVersion}`);
  return devVersion;
}
