import { AzureCliCredential } from "@azure/identity";
import { createTypeSpecBundle } from "@typespec/bundler";
import { readFile } from "fs/promises";
import JSON5 from "json5";
import { join, resolve } from "path/posix";
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
}

export async function bundleAndUploadPackages({
  repoRoot,
  packages,
}: BundleAndUploadPackagesOptions) {
  const rushJson = await loadRushJson(repoRoot);
  const projects = rushJson.projects.filter((x) => packages.includes(x.packageName));
  const currentVersion = await resolveCurrentVersion(repoRoot);
  logInfo("Current version:", currentVersion);

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
      importMap[join(project.packageName, key)] = value;
    }
  }
  logInfo(`Import map for ${currentVersion}:`, importMap);
  await uploader.uploadIndex({
    version: currentVersion,
    imports: importMap,
  });
  logSuccess(`Updated index for version ${currentVersion}.`);
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

/** Resolve the current major.minor.x version */
async function resolveCurrentVersion(repoRoot: string) {
  const content = await readFile(resolve(repoRoot, "packages", "compiler", "package.json"));
  const pkg = JSON.parse(content.toString());
  const version = parse(pkg.version);
  if (version === null) {
    throw new Error(`Couldn't resolve version from compiler: "${pkg.version}"`);
  }
  return `${version.major}.${version.minor}.x`;
}
