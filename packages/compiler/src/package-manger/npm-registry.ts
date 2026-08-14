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

export interface NpmRegistryConfig {
  readonly registry?: string;
  readonly authentication?: readonly NpmRegistryAuthentication[];
}

export interface NpmRegistryAuthentication {
  readonly scope: string;
  readonly authorization: string;
}

/**
 * Returns the npm registry URL to use for fetching packages.
 * Uses the `TYPESPEC_NPM_REGISTRY` environment variable if set,
 * otherwise falls back to the default npm registry.
 */
export function getNpmRegistry(config: NpmRegistryConfig = {}): string {
  return (process.env["TYPESPEC_NPM_REGISTRY"] ?? config.registry ?? defaultRegistry).replace(
    /\/$/,
    "",
  );
}

export async function fetchPackageManifest(
  packageName: string,
  version: string,
  config: NpmRegistryConfig = {},
): Promise<NpmManifest> {
  const url = `${getNpmRegistry(config)}/${packageName}/${version}`;
  const res = await fetch(url, { headers: getNpmRequestHeaders(url, config) });
  return await res.json();
}

export function fetchLatestPackageManifest(
  packageName: string,
  config: NpmRegistryConfig = {},
): Promise<NpmManifest> {
  return fetchPackageManifest(packageName, "latest", config);
}

export function getNpmRequestHeaders(
  url: string,
  config: NpmRegistryConfig,
): HeadersInit | undefined {
  const requestUrl = new URL(url);
  const requestScope = `//${requestUrl.host}${requestUrl.pathname}`;
  const authentication = config.authentication
    ?.filter(({ scope }) => requestScope.startsWith(scope))
    .sort((left, right) => right.scope.length - left.scope.length)[0];
  return authentication === undefined ? undefined : { Authorization: authentication.authorization };
}
