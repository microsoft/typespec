import { isTemplateDeclaration, isTemplateDeclarationOrInstance } from "../type-utils.js";
import { Interface, Namespace, Operation } from "../types.js";

export interface ListOperationOptions {
  /**
   * If the container is a namespace look for operation in sub namespaces.
   * @default true
   */
  recursive?: boolean;
}

/**
 * List operations in the given container. Will list operation recursively by default(Check subnamespaces.)
 * @param container Container.
 * @param options Options.
 */
export function listOperations(
  container: Namespace | Interface,
  options: ListOperationOptions = {}
): Operation[] {
  if (container.kind === "Interface" && isTemplateDeclaration(container)) {
    // Skip template interface operations
    return [];
  }

  // TODO: Allow overriding the existing resource operation of the same kind

  const operations: Operation[] = [];

  function addOperations(current: Namespace | Interface) {
    for (const op of current.operations.values()) {
      // Skip templated operations
      if (isTemplateDeclarationOrInstance(op)) {
        continue;
      }
      operations.push(op);
    }

    if (container.kind === "Namespace") {
      const recursive = options.recursive ?? true;

      const children = [
        ...(recursive ? [] : container.namespaces.values()),
        ...container.interfaces.values(),
      ];

      for (const child of children) {
        addOperations(child);
      }
    }
  }

  addOperations(container);
  return operations;
}
