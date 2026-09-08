// Browser-safe helpers to access the npm registry api
// https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#package-endpoints
import semverMaxSatisfying from "semver/ranges/max-satisfying.js";

export interface NpmPackageVersion {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string> | undefined;
  readonly optionalDependencies?: Record<string, string> | undefined;
  readonly devDependencies?: Record<string, string> | undefined;
  readonly peerDependencies?: Record<string, string> | undefined;
  readonly bundleDependencies?: false | string[] | undefined;
  readonly dist: NpmPackageDist;
  readonly bin?: Record<string, string> | null | undefined;
  readonly _shrinkwrap?: Record<string, unknown> | null | undefined;
  readonly directories?: {} | undefined;
  readonly _hasShrinkwrap?: boolean | undefined;

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
  readonly cpu?: string[] | undefined;
  readonly os?: string[] | undefined;
  readonly _id?: string | undefined;
  readonly _nodeVersion?: string | undefined;
  readonly _npmVersion?: string | undefined;
  readonly _npmUser?: NpmHuman | undefined;
  readonly [key: string]: unknown;
}

/** Manifest of a single package version. */
export interface NpmManifest extends NpmPackageVersion {
  readonly dependencies: Record<string, string>;
  readonly optionalDependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
  readonly peerDependencies: Record<string, string>;
  readonly bundleDependencies: false | string[];
  readonly bin: Record<string, string> | null;
  readonly _shrinkwrap: Record<string, unknown> | null;
}

/** Document listing a package information and all its versions. */
export interface NpmPackument {
  readonly name: string;
  readonly "dist-tags": { latest: string } & Record<string, string>;
  readonly versions: Record<string, NpmPackageVersion>;

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

export class NpmRegistryError extends Error {}

const defaultRegistry = `https://registry.npmjs.org`;

/**
 * Returns the npm registry URL to use for fetching packages.
 * Uses the `TYPESPEC_NPM_REGISTRY` environment variable if set,
 * otherwise falls back to the default npm registry.
 */
export function getNpmRegistry(): string {
  return (process.env["TYPESPEC_NPM_REGISTRY"] ?? defaultRegistry).replace(/\/$/, "");
}

export async function fetchPackageManifest(
  packageName: string,
  versionOrRange: string,
): Promise<NpmPackageVersion> {
  const encodedPackageName = packageName.startsWith("@")
    ? packageName.replace("/", "%2F")
    : packageName;
  const url = `${getNpmRegistry()}/${encodedPackageName}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    });
  } catch (error) {
    const message = error instanceof Error ? `: ${error.message}` : "";
    throw new NpmRegistryError(`Request to ${url} failed${message}`);
  }
  if (!res.ok) {
    throw new NpmRegistryError(`Request to ${url} failed with status ${res.status}.`);
  }

  let response: unknown;
  try {
    response = await res.json();
  } catch {
    throw new NpmRegistryError(`Request to ${url} returned invalid JSON.`);
  }
  const packument = parsePackument(url, response);
  const version =
    packument["dist-tags"][versionOrRange] ??
    semverMaxSatisfying(Object.keys(packument.versions), versionOrRange);
  const manifest = version === null ? undefined : packument.versions[version];
  if (manifest === undefined || !isNpmPackageVersion(manifest)) {
    throw new NpmRegistryError(
      `Package "${packageName}" does not have a version or tag matching "${versionOrRange}".`,
    );
  }
  return manifest;
}

export function fetchLatestPackageManifest(packageName: string): Promise<NpmPackageVersion> {
  return fetchPackageManifest(packageName, "latest");
}

function parsePackument(url: string, value: unknown): NpmPackument {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    !isStringRecord(value["dist-tags"]) ||
    !isRecord(value.versions)
  ) {
    throw new NpmRegistryError(`Request to ${url} returned an invalid package document.`);
  }
  return value as NpmPackument;
}

function isNpmPackageVersion(value: unknown): value is NpmPackageVersion {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.version === "string" &&
    isRecord(value.dist) &&
    typeof value.dist.tarball === "string"
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
