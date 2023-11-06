import { AzureCliCredential } from "@azure/identity";
import { createTypeSpecBundle } from "@typespec/bundler";
import { readFile } from "fs/promises";
import JSON5 from "json5";
import { resolve } from "path";
import { join as joinUnix } from "path/posix";
import pc from "picocolors";
import { parse } from "semver";
import { TypeSpecBundledPackageUploader } from "./upload-browser-package.js";

function logInfo(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

function logSuccess(message: string) {
  logInfo(pc.green(`✔ ${message}`));
}

export interface BundleAndUploadPackagesOptions {
  repoRoot: string;
  /**
   * List of packages to bundle and upload.
   */
  packages: string[];

  /**
   * Name of the index for those packages.
   */
  indexName: string;

  /**
   * Version for the index
   */
  indexVersion: string;
}

/** Return the version of the package in major.minor.x format */
export async function getPackageVersion(repoRoot: string, pkgName: string) {
  const rushJson = await loadRushJson(repoRoot);
  const project = rushJson.projects.find((x) => x.packageName === pkgName);
  if (project === undefined) {
    throw new Error(`Cannot get version for package: "${pkgName}", it is not found in rush.json`);
  }
  const content = await readFile(resolve(repoRoot, project.projectFolder, "package.json"));
  const pkg = JSON.parse(content.toString());
  const version = parse(pkg.version);
  if (version === null) {
    throw new Error(`Couldn't resolve version from "${pkgName}": "${pkg.version}"`);
  }
  return `${version.major}.${version.minor}.x`;
}

export async function bundleAndUploadPackages({
  repoRoot,
  packages,
  indexName,
  indexVersion,
}: BundleAndUploadPackagesOptions) {
  const rushJson = await loadRushJson(repoRoot);
  const projects = rushJson.projects.filter((x) => packages.includes(x.packageName));
  logInfo("Current index version:", indexVersion);

  const uploader = new TypeSpecBundledPackageUploader(new AzureCliCredential());
  await uploader.createIfNotExists();

  const importMap: Record<string, string> = {};
  for (const project of projects) {
    const bundle = await createTypeSpecBundle(resolve(repoRoot, project.projectFolder));
    const manifest = bundle.manifest;
    const result = await uploader.upload(bundle);
    if (result.status === "uploaded") {
      logSuccess(`Bundle for package ${manifest.name}@${manifest.version} uploaded.`);
    } else {
      logInfo(`Bundle for package ${manifest.name} already exist for version ${manifest.version}.`);
    }
    for (const [key, value] of Object.entries(result.imports)) {
      importMap[joinUnix(project.packageName, key)] = value;
    }
  }
  logInfo(`Import map for ${indexVersion}:`, importMap);
  await uploader.uploadIndex(indexName, {
    version: indexVersion,
    imports: importMap,
  });
  logSuccess(`Updated index for version ${indexVersion}.`);
}

interface RushJson {
  projects: RushProject[];
}

interface RushProject {
  packageName: string;
  projectFolder: string;
  versionPolicyName?: string;
  shouldPublish?: boolean;
}
async function loadRushJson(repoRoot: string): Promise<RushJson> {
  const content = await readFile(resolve(repoRoot, "rush.json"));
  return JSON5.parse(content.toString());
}
