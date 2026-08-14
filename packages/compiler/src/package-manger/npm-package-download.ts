// Node.js-specific helpers for downloading and extracting npm packages.
// For browser-safe registry types and fetch functions, use ./npm-registry.js
import { createHash } from "crypto";
import { Readable } from "stream";
import { extract as tarX } from "tar/extract";
import type { Hash } from "../install/spec.js";
import {
  fetchPackageManifest,
  type NpmManifest,
  type NpmRegistryRequestOptions,
} from "./npm-registry.js";

export async function downloadPackageVersion(
  packageName: string,
  version: string,
  dest: string,
  options?: NpmRegistryRequestOptions,
): Promise<ExtractedTarballResult> {
  const manifest = await fetchPackageManifest(packageName, version, options);
  return downloadAndExtractTarball(manifest.dist.tarball, dest, undefined, options?.headers);
}

export async function downloadAndExtractPackage(
  manifest: NpmManifest,
  dest: string,
  hashAlgorithm: string = "sha512",
  headers?: Record<string, string>,
): Promise<ExtractedTarballResult> {
  return downloadAndExtractTarball(manifest.dist.tarball, dest, hashAlgorithm, headers);
}

export interface ExtractedTarballResult {
  readonly dest: string;
  readonly hash: Hash;
}
async function downloadAndExtractTarball(
  url: string,
  dest: string,
  hashAlgorithm: string = "sha512",
  headers?: Record<string, string>,
): Promise<ExtractedTarballResult> {
  const res = await fetch(url, { headers });
  if (!res.ok || res.body === null) {
    throw new Error(
      `Failed to download package tarball from ${url}: ${res.status} ${res.statusText}`,
    );
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
  await p;

  return { dest, hash: { algorithm: hashAlgorithm, value: hash.digest("hex") } };
}
