import { isPreviewVersion } from "@azure-tools/typespec-azure-core";
import { SdkClientType, SdkHttpOperation } from "@azure-tools/typespec-client-generator-core";
import { Namespace, Program } from "@typespec/compiler";
import { findVersionedNamespace, getVersions, Version } from "@typespec/versioning";

/**
 * Gets the array of api-version on the TypeSpec service that contains this SDK client.
 * `undefined` if the service is not versioned.
 *
 * @param program the program
 * @param client the SDK client
 * @returns the array of api-version on the TypeSpec service that contains this SDK client
 */
export function getServiceApiVersions(
  program: Program,
  client: SdkClientType<SdkHttpOperation>,
): Version[] | undefined {
  // TODO: use client.apiVersions after TCGC supports multiple service
  // Also, this function lacks the logic of the handling of added/removed on the Namespace/Interface of the SDK client.
  let apiVersions: Version[] | undefined;
  const versionedNamespace: Namespace | undefined = findVersionedNamespace(
    program,
    client.__raw.service,
  );
  if (versionedNamespace) {
    apiVersions = getVersions(program, versionedNamespace)[1]?.getVersions();
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
    .filter((version) => !filterPreviewApiVersions || isStableApiVersion(version));
}

function isStableApiVersion(version: Version): boolean {
  return !isPreviewVersion(version.enumMember) && isStableApiVersionString(version.value);
}

export function isStableApiVersionString(version: string): boolean {
  return !version.toLowerCase().endsWith("-preview");
}
