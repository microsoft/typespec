import { isStdNamespace, type Namespace as TspNamespace } from "@typespec/compiler";

/**
 * Gets the sub-namespace path of a type's namespace relative to the service namespace.
 * For example, if the service namespace is "Microsoft.Contoso" and the type is in
 * "Microsoft.Contoso.Colors", returns ["Colors"].
 * Returns an empty array if the type is in the service namespace itself.
 */
export function getSubNamespaceParts(
  typeNs: TspNamespace | undefined,
  serviceNs: TspNamespace | undefined,
): string[] {
  if (!typeNs || !serviceNs) return [];

  // Build full namespace chain for the type
  const typeParts: TspNamespace[] = [];
  let current: TspNamespace | undefined = typeNs;
  while (current && current.name) {
    typeParts.unshift(current);
    current = current.namespace;
  }

  // Build full namespace chain for the service
  const serviceParts: TspNamespace[] = [];
  current = serviceNs;
  while (current && current.name) {
    serviceParts.unshift(current);
    current = current.namespace;
  }

  // Find the sub-namespace parts after the service namespace
  if (typeParts.length <= serviceParts.length) return [];

  // Verify the service namespace is a prefix
  for (let i = 0; i < serviceParts.length; i++) {
    if (typeParts[i] !== serviceParts[i]) return [];
  }

  return typeParts.slice(serviceParts.length).map((ns) => ns.name);
}

/**
 * Finds the service namespace (the first namespace with content).
 */
export function findServiceNamespace(globalNs: TspNamespace): TspNamespace | undefined {
  function findServiceNs(ns: TspNamespace): TspNamespace | undefined {
    for (const child of ns.namespaces.values()) {
      if (isStdNamespace(child)) continue;
      const hasContent =
        child.models.size > 0 ||
        child.interfaces.size > 0 ||
        child.operations.size > 0 ||
        child.enums.size > 0;
      if (hasContent) return child;
      const deeper = findServiceNs(child);
      if (deeper) return deeper;
      return child;
    }
    return undefined;
  }
  return findServiceNs(globalNs);
}
