import {
  createDiagnosticCollector,
  Diagnostic,
  getNamespaceFullName,
  ignoreDiagnostics,
} from "@typespec/compiler";

import { prepareClientAndOperationCache } from "./cache.js";
import { createSdkClientType } from "./clients.js";
import { listClients } from "./decorators.js";
import {
  SdkClientType,
  SdkEnumType,
  SdkModelType,
  SdkNamespace,
  SdkNullableType,
  SdkPackage,
  SdkServiceOperation,
  SdkType,
  SdkUnionType,
  TCGCContext,
} from "./interfaces.js";
import {
  filterApiVersionsWithDecorators,
  getActualClientType,
  getTypeDecorators,
} from "./internal-utils.js";
import { getLicenseInfo } from "./license.js";
import { getCrossLanguagePackageId, getNamespaceFromType } from "./public-utils.js";
import { getAllReferencedTypes, handleAllTypes } from "./types.js";

export async function createSdkPackage<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
): Promise<[SdkPackage<TServiceOperation>, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  populateApiVersionInformation(context);
  diagnostics.pipe(handleAllTypes(context));
  const crossLanguagePackageId = diagnostics.pipe(getCrossLanguagePackageId(context));
  const allReferencedTypes = getAllReferencedTypes(context);
  const versions = context.getPackageVersions();

  // Create apiVersions map for multiple services
  const apiVersionsMap = new Map<string, string>();
  for (const [namespace, versionList] of versions.entries()) {
    const fullName = getNamespaceFullName(namespace);
    const latestVersion = versionList.at(-1);
    if (latestVersion) {
      // When apiVersion config is "all" for single service, store "all" in the map as well
      const versionValue =
        context.apiVersion === "all" && versions.size === 1 ? "all" : latestVersion;
      apiVersionsMap.set(fullName, versionValue);
    }
  }

  const sdkPackage: SdkPackage<TServiceOperation> = {
    clients: listClients(context).map((c) => diagnostics.pipe(createSdkClientType(context, c))),
    models: allReferencedTypes.filter((x): x is SdkModelType => x.kind === "model"),
    enums: allReferencedTypes.filter((x): x is SdkEnumType => x.kind === "enum"),
    unions: allReferencedTypes.filter(
      (x): x is SdkUnionType | SdkNullableType => x.kind === "union" || x.kind === "nullable",
    ),
    crossLanguagePackageId,
    crossLanguageVersion: "", // Placeholder, computed after package is fully built
    namespaces: [],
    licenseInfo: getLicenseInfo(context),
    metadata: {
      apiVersion:
        context.apiVersion === "all" && versions.size === 1
          ? "all"
          : versions.size === 1
            ? [...versions.values()][0].at(-1)
            : undefined,
      apiVersions: apiVersionsMap,
    },
  };
  organizeNamespaces(context, sdkPackage);

  // Compute cross-language version hash from source files
  sdkPackage.crossLanguageVersion = await computeCrossLanguageVersion(context);

  return diagnostics.wrap(sdkPackage);
}

function organizeNamespaces<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  sdkPackage: SdkPackage<TServiceOperation>,
) {
  const clients = [...sdkPackage.clients];
  let clientIdx = 0;
  while (clientIdx < clients.length) {
    const client = clients[clientIdx++];
    getSdkNamespace(context, sdkPackage, client).clients.push(client);
    if (client.children && client.children.length > 0) {
      clients.push(...client.children);
    }
  }
  for (const model of sdkPackage.models) {
    getSdkNamespace(context, sdkPackage, model).models.push(model);
  }
  for (const enumType of sdkPackage.enums) {
    getSdkNamespace(context, sdkPackage, enumType).enums.push(enumType);
  }
  for (const unionType of sdkPackage.unions) {
    getSdkNamespace(context, sdkPackage, unionType).unions.push(unionType);
  }
}

function getSdkNamespace<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  sdkPackage: SdkPackage<TServiceOperation>,
  type: SdkType | SdkClientType<TServiceOperation>,
) {
  if (!("namespace" in type)) {
    return sdkPackage;
  }

  const namespace = type.namespace;
  const segments = namespace.split(".");
  let current: SdkPackage<TServiceOperation> | SdkNamespace<TServiceOperation> = sdkPackage;
  let fullName = "";
  for (const segment of segments) {
    fullName = fullName === "" ? segment : `${fullName}.${segment}`;
    const ns: SdkNamespace<TServiceOperation> | undefined = current.namespaces.find(
      (ns) => ns.name === segment,
    );
    if (ns === undefined) {
      const rawNamespace = getNamespaceFromType(type.__raw);
      const newNs = {
        __raw: rawNamespace,
        name: segment,
        fullName,
        clients: [],
        models: [],
        enums: [],
        unions: [],
        namespaces: [],
        decorators: rawNamespace ? ignoreDiagnostics(getTypeDecorators(context, rawNamespace)) : [],
      };
      current.namespaces.push(newNs);
      current = newNs;
    } else {
      current = ns;
    }
  }
  return current;
}

function populateApiVersionInformation(context: TCGCContext): void {
  if (context.__rawClientsCache === undefined) {
    prepareClientAndOperationCache(context);
  }

  // Get the package versions map once (this handles both single and multi-service scenarios)
  const packageVersions = context.getPackageVersions();

  for (const client of context.__rawClientsCache!.values()) {
    const clientType = getActualClientType(client);

    // Multiple service case. Set empty result.
    if (client.services.length > 1) {
      context.setApiVersionsForType(clientType, []);
      context.__clientApiVersionDefaultValueCache.set(client, undefined);
    } else {
      const versions = filterApiVersionsWithDecorators(
        context,
        clientType,
        packageVersions.get(client.services[0]) || [],
      );
      context.setApiVersionsForType(clientType, versions);

      context.__clientApiVersionDefaultValueCache.set(client, versions[versions.length - 1]);
    }
  }
}

/**
 * Computes a cross-language version hash from all API-affecting elements in the package.
 * The hash is a SHA256 digest truncated to 12 hex characters.
 *
 * Creates a normalized API snapshot capturing:
 * - Clients, methods, and parameters (with optionality and types)
 * - Models and properties (with optionality and types)
 * - Enums and their values
 * - Unions
 * - HTTP operation details (verb, path, parameter locations)
 */
async function computeCrossLanguageVersion(context: TCGCContext): Promise<string> {
  // Concatenate all source file contents
  const content = [...context.program.sourceFiles.values()]
    .filter((script) => {
      const locationContext = context.program.getSourceFileLocationContext(script.file);
      return locationContext.type === "project";
    })
    .map((script) => script.file.text)
    .join("");

  // Hash the combined content using Web Crypto API (browser-compatible)
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.substring(0, 12);
}
