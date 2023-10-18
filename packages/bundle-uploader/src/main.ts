import { AzureCliCredential } from "@azure/identity";
import { createTypeSpecBundle } from "@typespec/bundler";
import { readFile } from "fs/promises";
import { join, resolve } from "path/posix";
import pc from "picocolors";
import { parse } from "semver";
import { pkgRoot } from "./constants.js";
import { TypeSpecBundledPackageUploader } from "./upload-browser-package.js";

async function main() {
  await bundleAndUploadPackages([
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/protobuf",
  ]);
}
await main();

function logInfo(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

function logSuccess(message: string) {
  logInfo(pc.green(`✔ ${message}`));
}

async function bundleAndUploadPackages(packages: string[]) {
  const currentVersion = await resolveCurrentVersion();
  logInfo("Current version:", currentVersion);

  const uploader = new TypeSpecBundledPackageUploader(new AzureCliCredential());
  await uploader.createIfNotExists();

  const importMap: Record<string, string> = {};
  for (const name of packages) {
    const bundle = await createTypeSpecBundle(resolve(pkgRoot, "node_modules", name));
    const manifest = bundle.manifest;
    const result = await uploader.upload(bundle);
    if (result.status === "uploaded") {
      logSuccess(`Bundle for package ${manifest.name}@${manifest.version} uploaded.`);
    } else {
      logInfo(`Bundle for package ${manifest.name} already exist for version ${manifest.version}.`);
    }
    for (const [key, value] of Object.entries(result.imports)) {
      importMap[join(name, key)] = value;
    }
  }
  logInfo(`Import map for ${currentVersion}:`, importMap);
  await uploader.uploadIndex({
    version: currentVersion,
    imports: importMap,
  });
  logSuccess(`Updated index for version ${currentVersion}.`);
}

/** Resolve the current major.minor.x version */
async function resolveCurrentVersion() {
  const content = await readFile(
    resolve(pkgRoot, "node_modules", "@typespec/compiler", "package.json")
  );
  const pkg = JSON.parse(content.toString());
  const version = parse(pkg.version);
  if (version === null) {
    throw new Error(`Couldn't resolve version from compiler: "${pkg.version}"`);
  }
  return `${version.major}.${version.minor}.x`;
}
