import {
  Interface,
  isStdNamespace,
  isTemplateDeclaration,
  type Operation,
  type Namespace as TspNamespace,
} from "@typespec/compiler";
import type { useTsp } from "@typespec/emitter-framework";
import { getCSharpIdentifier, NameCasingType } from "./utils/naming.js";

/**
 * Collects all interfaces from the service namespace(s).
 * Also creates synthetic interfaces for namespace-level operations
 * (following the old emitter pattern: `${namespaceName}Operations`).
 */
export function getServiceInterfaces(
  program: ReturnType<typeof useTsp>["$"]["program"],
): Interface[] {
  const interfaces: Interface[] = [];
  const globalNs = program.getGlobalNamespaceType();

  function collectFromNamespace(ns: TspNamespace): void {
    // Collect explicit TypeSpec interfaces
    for (const iface of ns.interfaces?.values() ?? []) {
      if (iface.name && !interfaces.includes(iface) && !isTemplateDeclaration(iface)) {
        interfaces.push(iface);
      }
    }

    // Create synthetic interface for namespace-level operations
    if (ns.operations.size > 0) {
      const nsOps: [string, Operation][] = [];
      for (const [name, op] of ns.operations) {
        if (!isTemplateDeclaration(op)) {
          nsOps.push([name, op]);
        }
      }
      if (nsOps.length > 0) {
        const syntheticIface = program.checker.createAndFinishType({
          sourceInterfaces: [],
          decorators: [],
          operations: new Map(nsOps) as any,
          kind: "Interface",
          name: `${ns.name}Operations`,
          namespace: ns,
          entityKind: "Type",
          isFinished: true,
        }) as Interface;

        // Temporarily associate ops with the synthetic interface
        for (const [_, op] of nsOps) {
          op.interface = syntheticIface;
        }
        interfaces.push(syntheticIface);
      }
    }

    for (const childNs of ns.namespaces?.values() ?? []) {
      if (isStdNamespace(childNs)) continue;
      collectFromNamespace(childNs);
    }
  }

  for (const ns of globalNs.namespaces.values()) {
    if (isStdNamespace(ns)) continue;
    collectFromNamespace(ns);
  }
  return interfaces;
}

/**
 * Gets the full service namespace name from the program (e.g., "Microsoft.Contoso").
 */
export function getServiceNamespaceName(
  program: ReturnType<typeof useTsp>["$"]["program"],
): string | undefined {
  const globalNs = program.getGlobalNamespaceType();

  function getFullName(ns: TspNamespace): string {
    const parts: string[] = [];
    let current: TspNamespace | undefined = ns;
    while (current && current !== globalNs) {
      parts.unshift(current.name);
      current = current.namespace;
    }
    return parts.join(".");
  }

  // Find the service namespace (deepest non-std namespace in the first branch)
  function findServiceNs(ns: TspNamespace): TspNamespace | undefined {
    for (const child of ns.namespaces.values()) {
      if (isStdNamespace(child)) continue;
      // If this namespace has content (models, interfaces, operations, enums), use it
      // Otherwise, recurse deeper
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

  const serviceNs = findServiceNs(globalNs);
  if (!serviceNs) return undefined;
  const fullName = getFullName(serviceNs);
  return getCSharpIdentifier(fullName, NameCasingType.Namespace);
}
