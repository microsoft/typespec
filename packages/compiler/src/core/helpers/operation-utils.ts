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
export function listOperationsIn(
  container: Namespace | Interface,
  options: ListOperationOptions = {},
): Operation[] {
  const operations: Operation[] = [];

  function addOperations(current: Namespace | Interface) {
    if (current.kind === "Interface" && isTemplateDeclaration(current)) {
      // Skip template interface operations
      return;
    }

    for (const op of current.operations.values()) {
      // Skip templated operations
      if (!isTemplateDeclarationOrInstance(op)) {
        operations.push(op);
      }
    }

    if (current.kind === "Namespace") {
      const recursive = options.recursive ?? true;

      const children = [
        ...(recursive ? current.namespaces.values() : []),
        ...current.interfaces.values(),
      ];

      for (const child of children) {
        addOperations(child);
      }
    }
  }

  addOperations(container);
  return operations;
}
