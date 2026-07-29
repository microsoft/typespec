// Browser-safe helpers to access the npm registry api
// https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#package-endpoints

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
  version: string,
): Promise<NpmManifest> {
  const url = `${getNpmRegistry()}/${packageName}/${version}`;
  const res = await fetch(url);
  return await res.json();
}

export function fetchLatestPackageManifest(packageName: string): Promise<NpmManifest> {
  return fetchPackageManifest(packageName, "latest");
}
