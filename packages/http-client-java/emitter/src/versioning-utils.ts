import { isPreviewVersion } from "@azure-tools/typespec-azure-core";
import { SdkClientType, SdkHttpOperation } from "@azure-tools/typespec-client-generator-core";
import { Namespace, Program } from "@typespec/compiler";
import { findVersionedNamespace, getVersions, Version } from "@typespec/versioning";

/**
 * Sentinel values that describe a client that not have consistent api-versions.
 * Reason is either the service is not versioned, or the client aggregates multiple services of different api-versions.
 */
export enum InconsistentVersions {
  /**
   * The client is not versioned.
   */
  NotVersioned,
  /**
   * The client contains service from different set of api-versions.
   */
  MixedVersions,
}

/**
 * Gets the array of api-version on the TypeSpec service that contains this SDK client.
 * Returns {@link InconsistentVersions.NotVersioned} when the service is not versioned and
 * {@link InconsistentVersions.MixedVersions} when the client aggregates multiple services
 * that disagree on api-version.
 *
 * @param program the program
 * @param client the SDK client
 * @returns the array of api-version when there is only one service in the SDK client or an {@link InconsistentVersions} indicator when the SDK client is not versioned or has multiple versions.
 */
export function getServiceApiVersions(
  program: Program,
  client: SdkClientType<SdkHttpOperation>,
): Version[] | InconsistentVersions {
  // TODO: use client.apiVersions

  let apiVersions: Version[] | InconsistentVersions;
  // TCGC 0.63+ supports multiple api-version in a single client
  if (Array.isArray(client.__raw.service)) {
    // here, we treat a versioned client with multiple service as client of mixed versions
    apiVersions = isSdkClientVersioned(client)
      ? InconsistentVersions.MixedVersions
      : InconsistentVersions.NotVersioned;
  } else {
    const serviceNamespace = client.__raw.service;
    const versionedNamespace: Namespace | undefined = findVersionedNamespace(
      program,
      serviceNamespace,
    );
    if (versionedNamespace) {
      apiVersions =
        getVersions(program, versionedNamespace)[1]?.getVersions() ??
        InconsistentVersions.NotVersioned;
    } else {
      apiVersions = InconsistentVersions.NotVersioned;
    }
  }
  return apiVersions;
}

/**
 * Filter api-versions for "ServiceVersion".
 * TODO(xiaofei) pending TCGC design: https://github.com/Azure/typespec-azure/issues/965
 * We still cannot move to TCGC, due to it only recognizes api-versions from 1 service.
 *
 * @param pinnedApiVersion the api-version to use as filter base
 * @param versions api-versions to filter
 * @param excludePreview whether to exclude preview api-versions when pinnedApiVersion is stable, default is `true`
 * @returns filtered api-versions
 */
export function getFilteredApiVersions(
  program: Program,
  pinnedApiVersion: string | undefined,
  versions: Version[],
  excludePreview: boolean = true,
): Version[] {
  if (!pinnedApiVersion) {
    return versions;
  }
  const filterPreviewApiVersions = excludePreview && isStableApiVersionString(pinnedApiVersion);
  return versions
    .slice(0, versions.findIndex((it) => it.value === pinnedApiVersion) + 1)
    .filter((version) => !filterPreviewApiVersions || isStableApiVersion(program, version));
}

function isStableApiVersion(program: Program, version: Version): boolean {
  return !isPreviewVersion(program, version.enumMember) && isStableApiVersionString(version.value);
}

export function isStableApiVersionString(version: string): boolean {
  return !version.toLowerCase().endsWith("-preview");
}

/**
 * Checks whether a version follows the YYYY-MM-DD(-preview) format.
 * The "-preview" suffix is optional.
 *
 * @param version the version string to validate
 * @returns true if the version follows the YYYY-MM-DD(-preview) format, false otherwise
 */
export function isVersionedByDate(version: string): boolean {
  if (!version) {
    return false;
  }

  // Regular expression to match YYYY-MM-DD(-preview) format
  // YYYY: 4 digits for year
  // MM: 2 digits for month (01-12)
  // DD: 2 digits for day (01-31)
  // (-preview): optional preview suffix
  const dateVersionRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(-preview)?$/;

  return dateVersionRegex.test(version);
}

/**
 * Compares two date-based versions to determine if the first version is earlier than the second.
 * Assumes both versions have already passed isVersionedByDate validation.
 *
 * Comparison logic:
 * 1. Compare by date (YYYY-MM-DD) first
 * 2. If dates are equal, stable version is considered later than preview version
 *
 * @param version the version to check
 * @param compareTo the version to compare against
 * @returns true if version is earlier than compareTo, false otherwise
 */
export function isVersionEarlierThan(version: string, compareTo: string): boolean {
  if (!version || !compareTo) {
    return false;
  }

  // Extract date parts and preview status
  const parseVersion = (ver: string) => {
    const isPreview = ver.endsWith("-preview");
    const datePart = isPreview ? ver.slice(0, -8) : ver; // Remove "-preview" if present
    const [year, month, day] = datePart.split("-").map(Number);
    return { year, month, day, isPreview };
  };

  const versionParts = parseVersion(version);
  const compareToParts = parseVersion(compareTo);

  // Compare by year first
  if (versionParts.year !== compareToParts.year) {
    return versionParts.year < compareToParts.year;
  }

  // Compare by month if years are equal
  if (versionParts.month !== compareToParts.month) {
    return versionParts.month < compareToParts.month;
  }

  // Compare by day if years and months are equal
  if (versionParts.day !== compareToParts.day) {
    return versionParts.day < compareToParts.day;
  }

  // If dates are identical, compare preview status
  // Preview version is considered earlier than stable version
  if (versionParts.isPreview !== compareToParts.isPreview) {
    return versionParts.isPreview && !compareToParts.isPreview;
  }

  // Versions are identical
  return false;
}

function isSdkClientVersioned(client: SdkClientType<SdkHttpOperation>): boolean {
  // on TCGC, the difference of versioned client and not versioned client is on the existence of "apiVersion" parameter in clientInitialization
  return client.clientInitialization.parameters.some((p) => p.name === "apiVersion");
}
