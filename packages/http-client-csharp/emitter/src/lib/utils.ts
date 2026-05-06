import {
  listAllServiceNamespaces,
  SdkClientType,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkMethodParameter,
  SdkModelPropertyType,
  isReadOnly as tcgcIsReadOnly,
} from "@azure-tools/typespec-client-generator-core";
import { getNamespaceFullName, Namespace } from "@typespec/compiler";
import { Visibility } from "@typespec/http";
import { CSharpEmitterContext } from "../sdk-context.js";

export function getClientNamespaceString(context: CSharpEmitterContext): string | undefined {
  const packageName = context.emitContext.options["package-name"];
  const serviceNamespaces = listAllServiceNamespaces(context);
  const firstNamespace = serviceNamespaces.length > 0 ? serviceNamespaces[0] : undefined;
  // namespace is not a public emitter option, but it is supported by TCGC
  const namespaceOverride = (context.emitContext.options as any).namespace;

  if (packageName) {
    return getClientNamespaceStringHelper(namespaceOverride, packageName, firstNamespace);
  }

  if (containsMultiServiceClient(context.sdkPackage.clients)) {
    return getClientNamespaceStringHelper(
      namespaceOverride,
      context.sdkPackage.clients[0].namespace,
    );
  }

  if (serviceNamespaces.length > 1) {
    return getClientNamespaceStringHelper(namespaceOverride, undefined, firstNamespace?.namespace);
  }

  return getClientNamespaceStringHelper(namespaceOverride, undefined, firstNamespace);
}

export function getClientNamespaceStringHelper(
  namespaceOverride?: string,
  packageName?: string,
  namespace?: Namespace,
): string | undefined {
  if (namespaceOverride) {
    return namespaceOverride;
  }
  if (packageName) {
    packageName = packageName
      .replace(/-/g, ".")
      .replace(/\.([a-z])?/g, (match: string) => match.toUpperCase());
    return packageName.charAt(0).toUpperCase() + packageName.slice(1);
  }
  if (namespace) {
    return getNamespaceFullName(namespace);
  }
  return undefined;
}

export function firstLetterToUpperCase(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if the property or parameter is read-only.
 * @param prop - The property to check.
 * @beta
 */
export function isReadOnly(
  p: SdkModelPropertyType | SdkMethodParameter | SdkHttpParameter,
): boolean {
  if (p.kind === "property") {
    return tcgcIsReadOnly(p);
  }

  if (p.visibility?.includes(Visibility.Read) && p.visibility.length === 1) {
    return true;
  } else {
    return false;
  }
}

/**
 * Determines if the library contains a multiservice client.
 * Returns true if any of the given root clients is itself a multiservice client
 * (i.e. {@link isMultiServiceClient} returns true).
 *
 * @param rootClients - Array of root clients from the SDK package
 * @returns True if any root client is a multiservice client, false otherwise
 * @beta
 */
export function containsMultiServiceClient(
  rootClients: SdkClientType<SdkHttpOperation>[],
): boolean {
  return rootClients.some(isMultiServiceClient);
}

/**
 * Determines if a client is a multiservice client.
 * A multiservice client is one where the underlying service is an array of services
 * with more than one element.
 *
 * @param client - The SDK client to check
 * @returns True if this is a multiservice client, false otherwise
 * @beta
 */
export function isMultiServiceClient(client: SdkClientType<SdkHttpOperation>): boolean {
  return client.__raw.services.length > 1;
}
