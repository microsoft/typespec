// Helpers to access the npm registry api https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#package-endpoints
import { execSync } from "child_process";
import { createHash } from "crypto";
import * as http from "http";
import * as https from "https";
import { Readable } from "stream";
import { extract as tarX } from "tar/extract";
import { Hash } from "../install/spec.js";

/** Manifest of a single package version. */
export interface NpmManifest {
  readonly name: string;
  readonly version: string;
  readonly dependencies: Record<string, string>;
  readonly optionalDependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
  readonly peerDependencies: Record<string, string>;
  readonly bundleDependencies: false | string[];
  readonly dist: NpmPackageDist;
  readonly bin: Record<string, string> | null;
  readonly _shrinkwrap: Record<string, unknown> | null;

  readonly engines?: Record<string, string> | undefined;
  readonly cpu?: string[] | undefined;
  readonly os?: string[] | undefined;
  readonly _id?: string | undefined;

  readonly [key: string]: unknown;
}

/** Document listing a package information and all its versions. */
export interface NpmPackument {
  readonly name: string;
  readonly "dist-tags": { latest: string } & Record<string, string>;
  readonly versions: Record<string, NpmPackageVersion>;

  readonly [key: string]: unknown;
}

export interface NpmPackageVersion {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string> | undefined;
  readonly optionalDependencies?: Record<string, string> | undefined;
  readonly devDependencies?: Record<string, string> | undefined;
  readonly peerDependencies?: Record<string, string> | undefined;
  readonly directories: {};
  readonly dist: NpmPackageDist;
  readonly _hasShrinkwrap: boolean;

  // Extra metadata which may be added by the registry:
  readonly description?: string | undefined;
  readonly main?: string | undefined;
  readonly scripts?: Record<string, string> | undefined;
  readonly repository?:
    | {
        type: string;
        url: string;
        directory?: string | undefined;
      }
    | undefined;
  readonly engines?: Record<string, string> | undefined;
  readonly keywords?: string[] | undefined;
  readonly author?: NpmHuman | undefined;
  readonly contributors?: NpmHuman[] | undefined;
  readonly maintainers?: NpmHuman[] | undefined;
  readonly license?: string | undefined;
  readonly homepage?: string | undefined;
  readonly bugs?: { url: string } | undefined;
  readonly _id?: string | undefined;
  readonly _nodeVersion?: string | undefined;
  readonly _npmVersion?: string | undefined;
  readonly _npmUser?: NpmHuman | undefined;
  readonly [key: string]: unknown;
}

export interface NpmPackageDist {
  readonly shasum: string;
  readonly tarball: string;
  readonly integrity?: string | undefined;
  readonly fileCount?: number | undefined;
  readonly unpackedSize?: number | undefined;
}

export interface NpmHuman {
  readonly name: string;
  readonly email?: string | undefined;
  readonly url?: string | undefined;
}

const defaultRegistry = `https://registry.npmjs.org`;

interface NpmFetchConfig {
  readonly registry: string;
  readonly strictSsl: boolean;
}

let cachedNpmConfig: NpmFetchConfig | undefined;

/**
 * Reads npm configuration for registry URL and strict-ssl setting.
 * Falls back to defaults if npm is not available or config cannot be read.
 */
function readNpmConfig(): NpmFetchConfig {
  if (cachedNpmConfig !== undefined) {
    return cachedNpmConfig;
  }

  try {
    const configJson = execSync("npm config list --json", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const config = JSON.parse(configJson);
    cachedNpmConfig = {
      registry: ((config.registry as string) ?? defaultRegistry).replace(/\/$/, ""),
      strictSsl: config["strict-ssl"] !== false,
    };
  } catch {
    cachedNpmConfig = {
      registry: defaultRegistry,
      strictSsl: true,
    };
  }

  return cachedNpmConfig;
}

/**
 * Makes an HTTP/HTTPS request and returns the response body as a Buffer.
 * Handles redirects and respects the rejectUnauthorized option.
 */
async function makeRequest(
  url: string,
  rejectUnauthorized: boolean,
  maxRedirects = 5,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const urlObj = new URL(url);
    const requestFn = urlObj.protocol === "https:" ? https.request : http.request;
    const req = requestFn(url, { rejectUnauthorized }, (res) => {
      // Handle redirects
      if (
        (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308) &&
        res.headers.location
      ) {
        if (maxRedirects <= 0) {
          reject(new Error(`Too many redirects for ${url}`));
          return;
        }
        // Consume the response body to free resources
        res.resume();
        makeRequest(res.headers.location, rejectUnauthorized, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

export async function fetchPackageManifest(
  packageName: string,
  version: string,
): Promise<NpmManifest> {
  const { registry, strictSsl } = readNpmConfig();
  const url = `${registry}/${packageName}/${version}`;
  if (strictSsl) {
    const res = await fetch(url);
    return await res.json();
  } else {
    const body = await makeRequest(url, false);
    return JSON.parse(body.toString("utf8"));
  }
}

export function fetchLatestPackageManifest(packageName: string): Promise<NpmManifest> {
  return fetchPackageManifest(packageName, "latest");
}

export async function downloadPackageVersion(
  packageName: string,
  version: string,
  dest: string,
): Promise<ExtractedTarballResult> {
  const manifest = await fetchPackageManifest(packageName, version);
  return downloadAndExtractTarball(manifest.dist.tarball, dest);
}

export async function downloadAndExtractPackage(
  manifest: NpmManifest,
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
  const { strictSsl } = readNpmConfig();
  let tarballStream: Readable;
  if (strictSsl) {
    const res = await fetch(url);
    tarballStream = Readable.fromWeb(res.body as any);
  } else {
    const buffer = await makeRequest(url, false);
    tarballStream = Readable.from(buffer);
  }
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
