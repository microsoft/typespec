// Node.js-specific helpers for downloading and extracting npm packages.
// For browser-safe registry types and fetch functions, use ./npm-registry.js
import { createHash } from "crypto";
import { Readable } from "stream";
import { extract as tarX } from "tar/extract";
import type { Hash } from "../install/spec.js";
import { fetchPackageManifest, NpmRegistryError, type NpmPackageVersion } from "./npm-registry.js";

export async function downloadPackageVersion(
  packageName: string,
  version: string,
  dest: string,
): Promise<ExtractedTarballResult> {
  const manifest = await fetchPackageManifest(packageName, version);
  return downloadAndExtractTarball(manifest.dist.tarball, dest);
}

export async function downloadAndExtractPackage(
  manifest: NpmPackageVersion,
  dest: string,
  hashAlgorithm: string = "sha512",
): Promise<ExtractedTarballResult> {
  return downloadAndExtractTarball(manifest.dist.tarball, dest, hashAlgorithm);
}

export interface ExtractedTarballResult {
  readonly dest: string;
  readonly hash: Hash;
}
async function downloadAndExtractTarball(
  url: string,
  dest: string,
  hashAlgorithm: string = "sha512",
): Promise<ExtractedTarballResult> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? `: ${error.message}` : "";
    throw new NpmRegistryError(`Request to ${url} failed${message}`);
  }
  if (!res.ok) {
    throw new NpmRegistryError(`Request to ${url} failed with status ${res.status}.`);
  }
  if (res.body === null) {
    throw new NpmRegistryError(`Request to ${url} returned an empty response.`);
  }

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
  try {
    await p;
  } catch (error) {
    const message = error instanceof Error ? `: ${error.message}` : "";
    throw new NpmRegistryError(`Failed to extract package from ${url}${message}`);
  }

  return { dest, hash: { algorithm: hashAlgorithm, value: hash.digest("hex") } };
}
