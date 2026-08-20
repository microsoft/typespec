// Node.js-specific helpers for downloading and extracting npm packages.
// For browser-safe registry types and fetch functions, use ./npm-registry.js
import { createHash } from "crypto";
import { Readable } from "stream";
import { extract as tarX } from "tar/extract";
import type { Hash } from "../install/spec.js";
import { loadNpmRegistryConfig } from "./npm-registry-config.js";
import {
  fetchPackageManifest,
  getNpmRequestHeaders,
  type NpmManifest,
  type NpmRegistryConfig,
} from "./npm-registry.js";

export async function downloadPackageVersion(
  packageName: string,
  version: string,
  dest: string,
): Promise<ExtractedTarballResult> {
  const config = await loadNpmRegistryConfig();
  const manifest = await fetchPackageManifest(packageName, version, config);
  return downloadAndExtractTarball(manifest.dist.tarball, dest, "sha512", config);
}

export async function downloadAndExtractPackage(
  manifest: NpmManifest,
  dest: string,
  hashAlgorithm: string = "sha512",
  config?: NpmRegistryConfig,
): Promise<ExtractedTarballResult> {
  return downloadAndExtractTarball(
    manifest.dist.tarball,
    dest,
    hashAlgorithm,
    config ?? (await loadNpmRegistryConfig()),
  );
}

export interface ExtractedTarballResult {
  readonly dest: string;
  readonly hash: Hash;
}
async function downloadAndExtractTarball(
  url: string,
  dest: string,
  hashAlgorithm: string = "sha512",
  config: NpmRegistryConfig = {},
): Promise<ExtractedTarballResult> {
  const res = await fetch(url, { headers: getNpmRequestHeaders(url, config) });
  const tarballStream = Readable.fromWeb(res.body as any);
  const hash = tarballStream.pipe(createHash(hashAlgorithm));
  const extractor = tarX({
    strip: 1,
    cwd: dest,
  });

  const p = new Promise<void>((resolve, reject) => {
    extractor.on("end", () => {
      resolve();
    });

    extractor.on("error", (er) => {
      reject(er);
    });

    tarballStream.on("error", (er) => reject(er));
  });

  tarballStream.pipe(extractor);
  await p;

  return { dest, hash: { algorithm: hashAlgorithm, value: hash.digest("hex") } };
}
