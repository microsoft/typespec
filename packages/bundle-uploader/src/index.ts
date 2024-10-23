import { AzureCliCredential } from "@azure/identity";
import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { createTypeSpecBundle } from "@typespec/bundler";
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
  const projects = await findWorkspacePackagesNoCheck(repoRoot);

  const project = projects.find((x) => x.manifest.name === pkgName);
  if (project === undefined) {
    throw new Error(
      `Cannot get version for package: "${pkgName}", pnpm couldn't find a package with that name in the workspace`,
    );
  }
  const version = parse(project.manifest.version);
  if (version === null) {
    throw new Error(`Couldn't resolve version from "${pkgName}": "${project.manifest.version}"`);
  }
  return `${version.major}.${version.minor}.x`;
}

export async function bundleAndUploadPackages({
  repoRoot,
  packages,
  indexName,
  indexVersion,
}: BundleAndUploadPackagesOptions) {
  const allProjects = await findWorkspacePackagesNoCheck(repoRoot);
  const projects = allProjects.filter((x) => packages.includes(x.manifest.name!));
  logInfo("Current index version:", indexVersion);

  const uploader = new TypeSpecBundledPackageUploader(new AzureCliCredential());
  await uploader.createIfNotExists();

  const existingIndex = await uploader.getIndex(indexName, indexVersion);
  const importMap: Record<string, string> = { ...existingIndex?.imports };
  for (const project of projects) {
    const bundle = await createTypeSpecBundle(resolve(repoRoot, project.dir));
    const manifest = bundle.manifest;
    const result = await uploader.upload(bundle);
    if (result.status === "uploaded") {
      logSuccess(`Bundle for package ${manifest.name}@${manifest.version} uploaded.`);
    } else {
      logInfo(`Bundle for package ${manifest.name} already exist for version ${manifest.version}.`);
    }
    // If there is no index always register everything
    if (existingIndex === undefined || result.status === "uploaded") {
      for (const [key, value] of Object.entries(result.imports)) {
        importMap[joinUnix(project.manifest.name!, key)] = value;
      }
    }
  }
  logInfo(`Import map for ${indexVersion}:`, importMap);
  await uploader.updateIndex(indexName, {
    version: indexVersion,
    imports: importMap,
  });
  logSuccess(`Updated index for version ${indexVersion}.`);
}
