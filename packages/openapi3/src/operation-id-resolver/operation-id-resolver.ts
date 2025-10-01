import { isGlobalNamespace, isService, type Operation, type Program } from "@typespec/compiler";
import { getOperationId } from "@typespec/openapi";
import { OperationIdStrategy } from "../lib.js";

export class OperationIdResolver {
  #program: Program;
  #strategy: OperationIdStrategy;
  #used = new Set<string>();

  constructor(program: Program, strategy: OperationIdStrategy) {
    this.#program = program;
    this.#strategy = strategy;
  }

  /**
   * Resolve the OpenAPI operation ID for the given operation using the following logic:
   * - If `@operationId` was specified use that value
   * - Otherwise follow the {@link OperationIdStrategy}
   *
   * This will deduplicate operation ids
   */
  resolve(operation: Operation): string | undefined {
    let name = this.#resolveInternal(operation);
    if (name === undefined) return undefined;

    if (this.#used.has(name)) {
      name = this.#findNextAvailableName(name);
    }
    this.#used.add(name);
    return name;
  }

  #findNextAvailableName(name: string) {
    let count = 1;
    while (true) {
      count++;
      const newName = `${name}_${count}`;
      if (!this.#used.has(newName)) {
        return newName;
      }
    }
  }

  #resolveInternal(operation: Operation): string | undefined {
    const explicitOperationId = getOperationId(this.#program, operation);
    if (explicitOperationId) {
      return explicitOperationId;
    }

    const operationPath = this.#getOperationPath(operation);

    switch (this.#strategy) {
      case "parent-underscore":
        return operationPath.slice(-2).join("_");
      case "fqn":
        return operationPath.join(".");
      case "none":
        return undefined;
    }
  }

  #getOperationPath(operation: Operation): string[] {
    const path = [operation.name];
    let current = operation.interface ?? operation.namespace;
    while (current) {
      if (
        current === undefined ||
        (current.kind === "Namespace" &&
          (isGlobalNamespace(this.#program, current) || isService(this.#program, current)))
      ) {
        break;
      }
      path.unshift(current.name);
      current = current.namespace;
    }
    return path;
  }
}
