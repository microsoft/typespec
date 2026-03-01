// Helpers to access the npm registry api https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#package-endpoints
import { execSync } from "child_process";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { Readable } from "stream";
import { extract as tarX } from "tar/extract";
import { Agent, type Dispatcher, ProxyAgent, fetch } from "undici";
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

export interface NpmFetchConfig {
  readonly registry: string;
  /** Whether to reject unauthorized SSL certificates. Corresponds to npm `strict-ssl`. */
  readonly strictSsl: boolean;
  /** HTTP proxy URL. Corresponds to npm `proxy`. */
  readonly proxy?: string | undefined;
  /** HTTPS proxy URL. Corresponds to npm `https-proxy`. Falls back to `proxy` if not set. */
  readonly httpsProxy?: string | undefined;
  /** Comma-separated list of hosts to bypass the proxy. Corresponds to npm `noproxy`. */
  readonly noProxy?: string | undefined;
  /** CA certificate(s) in PEM format. Corresponds to npm `ca` / `cafile`. */
  readonly ca?: string | string[] | undefined;
  /** Client certificate in PEM format. Corresponds to npm `cert`. */
  readonly cert?: string | undefined;
  /** Private key for the client certificate in PEM format. Corresponds to npm `key`. */
  readonly key?: string | undefined;
}

let cachedNpmConfig: NpmFetchConfig | undefined;

/**
 * Resets the cached npm configuration. Intended for testing only.
 * @internal
 */
export function resetNpmConfigCache(): void {
  cachedNpmConfig = undefined;
}

/**
 * Parses npm configuration from a raw config object into an `NpmFetchConfig`.
 * Handles `ca`/`cafile` merging and the `https-proxy` fallback to `proxy`.
 * @internal Exported for testing.
 */
export function parseNpmConfig(
  rawConfig: Record<string, unknown>,
  readFileFn: (path: string) => string = (p) => readFileSync(p, "utf8"),
): NpmFetchConfig {
  // Read CA cert: explicit `ca` takes priority; fall back to reading `cafile`
  let ca: string | string[] | undefined = rawConfig.ca as string | string[] | undefined;
  const cafilePath = rawConfig.cafile as string | undefined;
  if (!ca && cafilePath) {
    try {
      ca = readFileFn(cafilePath);
    } catch {
      // Ignore file read errors
    }
  }

  const proxy = rawConfig.proxy as string | undefined;
  return {
    registry: ((rawConfig.registry as string) ?? defaultRegistry).replace(/\/$/, ""),
    strictSsl: rawConfig["strict-ssl"] !== false,
    proxy,
    httpsProxy: (rawConfig["https-proxy"] ?? proxy) as string | undefined,
    noProxy: (rawConfig.noproxy ?? rawConfig["no-proxy"]) as string | undefined,
    ca,
    cert: rawConfig.cert as string | undefined,
    key: rawConfig.key as string | undefined,
  };
}

export function readNpmConfig(): NpmFetchConfig {
  if (cachedNpmConfig !== undefined) {
    return cachedNpmConfig;
  }

  try {
    const configJson = execSync("npm config list --json", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    cachedNpmConfig = parseNpmConfig(JSON.parse(configJson));
  } catch {
    cachedNpmConfig = {
      registry: defaultRegistry,
      strictSsl: true,
    };
  }

  return cachedNpmConfig;
}

/**
 * Returns true if the given hostname is covered by the no-proxy list.
 */
function isHostInNoProxy(hostname: string, noProxy?: string): boolean {
  if (!noProxy) return false;
  const host = hostname.toLowerCase();
  for (const entry of noProxy.split(",").map((s) => s.trim().toLowerCase())) {
    if (entry === "*" || host === entry || host.endsWith(`.${entry}`)) return true;
  }
  return false;
}

/**
 * Builds an undici dispatcher (Agent or ProxyAgent) that applies all npm HTTP config
 * settings: TLS verification, custom CA/cert/key, and proxy routing with noproxy bypass.
 * Pass the returned dispatcher as `{ dispatcher }` in fetch calls.
 * @internal
 */
export function buildFetchDispatcher(url: string, config: NpmFetchConfig): Dispatcher {
  const connect = {
    rejectUnauthorized: config.strictSsl,
    ...(config.ca !== undefined && { ca: config.ca }),
    ...(config.cert !== undefined && { cert: config.cert }),
    ...(config.key !== undefined && { key: config.key }),
  };

  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === "https:";
  const proxyStr = isHttps ? (config.httpsProxy ?? config.proxy) : config.proxy;

  if (proxyStr && !isHostInNoProxy(urlObj.hostname, config.noProxy)) {
    return new ProxyAgent({ uri: proxyStr, connect });
  }

  return new Agent({ connect });
}

export async function fetchPackageManifest(
  packageName: string,
  version: string,
): Promise<NpmManifest> {
  const config = readNpmConfig();
  const url = `${config.registry}/${packageName}/${version}`;
  const response = await fetch(url, { dispatcher: buildFetchDispatcher(url, config) });
  return response.json() as Promise<NpmManifest>;
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
  const config = readNpmConfig();
  const response = await fetch(url, { dispatcher: buildFetchDispatcher(url, config) });
  const buffer = Buffer.from(await response.arrayBuffer());
  const tarballStream = Readable.from(buffer);
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
