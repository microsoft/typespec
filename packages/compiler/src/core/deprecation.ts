import type { Program } from "./program.js";
import { BaseNode, Node, SyntaxKind, Type } from "./types.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

const deprecatedKey = createStateSymbol("deprecated");

/**
 * Provides details on the deprecation of a given type.
 */
export interface DeprecationDetails {
  /**
   * The deprecation message to display when the type is used.
   */
  message: string;
}

/**
 * Check if the given type is deprecated
 * @param program Program
 * @param type Type
 */
export function isDeprecated(program: Program, type: Type): boolean {
  return program.stateMap(deprecatedKey).has(type);
}

/**
 * Returns complete deprecation details for the given type or node
 * @param program Program
 * @param typeOrNode A Type or Node to check for deprecation
 */
export function getDeprecationDetails(
  program: Program,
  typeOrNode: Type | Node,
): DeprecationDetails | undefined {
  function isType(maybeType: Type | Node): maybeType is Type {
    return typeof maybeType.kind === "string";
  }

  // If we're looking at a type, pull the deprecation details from the state map
  if (isType(typeOrNode)) {
    return program.stateMap(deprecatedKey).get(typeOrNode);
  } else {
    // Look at the node for a deprecation directive
    const deprecatedDirective = ((typeOrNode as BaseNode).directives ?? []).find(
      (directive) => directive.target.sv === "deprecated",
    );

    if (deprecatedDirective?.arguments[0].kind === SyntaxKind.StringLiteral) {
      return {
        message: deprecatedDirective.arguments[0].value,
      };
    }
  }

  return undefined;
}

/**
 * Mark the given type as deprecated with the provided details.
 * @param program Program
 * @param type Type
 * @param details Details of the deprecation
 */
export function markDeprecated(program: Program, type: Type, details: DeprecationDetails): void {
  program.stateMap(deprecatedKey).set(type, details);
}
