import { Interface, Namespace, Type } from "../types.js";
import { isTemplateDeclaration } from "../type-utils.js";

/**
 * List types under the given container. Will list types recursively.
 * @param container Container.
 * @param filter Function to filter types.
 */
export function listTypesUnder<T extends Type = Type>(
  container: Namespace | Interface,
  filter: (type: Type) => type is T,
): T[];

/**
 * List types under the given container. Will list types recursively.
 * @param container Container.
 * @param filter Function to filter types.
 */
export function listTypesUnder(
  container: Namespace | Interface,
  filter: (type: Type) => boolean,
): Type[];

export function listTypesUnder(
  container: Namespace | Interface,
  filter: (type: Type) => boolean,
): Type[] {
  const types: Type[] = [];

  function addTypes(current: Namespace | Interface) {
    if (isTemplateDeclaration(current)) {
      // Skip template types
      return;
    }

    // For interfaces, we only have operations
    if (current.kind === "Interface") {
      for (const op of current.operations.values()) {
        if (filter(op)) {
          types.push(op);
        }
      }
      return;
    }

    // For namespaces, check all contained type collections
    const namespace = current;

    // Check models
    for (const model of namespace.models.values()) {
      if (filter(model)) {
        types.push(model);
      }
    }

    // Check operations
    for (const op of namespace.operations.values()) {
      if (filter(op)) {
        types.push(op);
      }
    }

    // Check scalars
    for (const scalar of namespace.scalars.values()) {
      if (filter(scalar)) {
        types.push(scalar);
      }
    }

    // Check enums
    for (const enumType of namespace.enums.values()) {
      if (filter(enumType)) {
        types.push(enumType);
      }
    }

    // Check unions
    for (const union of namespace.unions.values()) {
      if (filter(union)) {
        types.push(union);
      }
    }

    // Check interfaces
    for (const iface of namespace.interfaces.values()) {
      if (filter(iface)) {
        types.push(iface);
      }
    }

    // Recursively check sub-namespaces
    for (const subNamespace of namespace.namespaces.values()) {
      if (
        !(
          subNamespace.name === "Prototypes" &&
          subNamespace.namespace?.name === "TypeSpec" &&
          subNamespace.namespace.namespace?.name === ""
        )
      ) {
        if (filter(subNamespace)) {
          types.push(subNamespace);
        }
        addTypes(subNamespace);
      }
    }

    // Recursively check operations in interfaces
    for (const iface of namespace.interfaces.values()) {
      addTypes(iface);
    }
  }

  addTypes(container);
  return types;
}