import { SdkClientType, SdkHttpOperation } from "@azure-tools/typespec-client-generator-core";
import { Namespace, Program } from "@typespec/compiler";
import { findVersionedNamespace, getVersions } from "@typespec/versioning";

/**
 * Gets the array of api-version on the TypeSpec service that contains this SDK client.
 * `undefined` if the service is not versioned.
 * 
 * @param program the program
 * @param client the SDK client
 * @returns the array of api-version on the TypeSpec service that contains this SDK client
 */
export function getServiceApiVersions(program: Program, client: SdkClientType<SdkHttpOperation>): string[] | undefined {
  // TODO: use client.apiVersions after TCGC supports multiple service
  let apiVersions: string[] | undefined;
  const verVersionedNamespace: Namespace | undefined = findVersionedNamespace(program, client.__raw.service);
  if (verVersionedNamespace) {
    apiVersions = getVersions(program, verVersionedNamespace)[1]?.getVersions().map((version) => version.value);
  }
  return apiVersions;
}

/**
 * Filter api-versions for "ServiceVersion".
 * TODO(xiaofei) pending TCGC design: https://github.com/Azure/typespec-azure/issues/965
 *
 * @param pinnedApiVersion the api-version to use as filter base
 * @param versions api-versions to filter
 * @returns filtered api-versions
 */
export function getFilteredApiVersions(
  pinnedApiVersion: string | undefined,
  versions: string[],
  excludePreview: boolean = false,
): string[] {
  if (!pinnedApiVersion) {
    return versions;
  }
  return versions
    .slice(0, versions.indexOf(pinnedApiVersion) + 1)
    .filter(
      (version) =>
        !excludePreview || !isStableApiVersion(pinnedApiVersion) || isStableApiVersion(version),
    );
}

function isStableApiVersion(version: string): boolean {
  return !version.toLowerCase().includes("preview");
}
