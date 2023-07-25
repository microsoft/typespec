import { Program } from "./program.js";
import { Type } from "./types.js";

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
 * Returns complete deprecation details for the given type
 * @param program Program
 * @param type Type
 */
export function getDeprecationDetails(
  program: Program,
  type: Type
): DeprecationDetails | undefined {
  return program.stateMap(deprecatedKey).get(type);
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
