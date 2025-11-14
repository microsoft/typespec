import type { Typekit } from "@typespec/compiler/typekit";

/**
 * Check if a type is a literal type (string, numeric, boolean, or union variant).
 * This is useful for determining if a type can be used in a Python Literal[] type.
 *
 * @param $ - The Typekit instance
 * @param type - The type to check
 * @returns true if the type is a literal type
 */
export function isLiteral($: Typekit, type: any): boolean {
  if (!type) return false;

  return (
    $.literal.isString(type) ||
    $.literal.isNumeric(type) ||
    $.literal.isBoolean(type) ||
    type.kind === "UnionVariant"
  );
}

/**
 * Check if all types in an array are literal types.
 *
 * @param $ - The Typekit instance
 * @param types - Array of types to check
 * @returns true if all types are literals
 */
export function areAllLiterals($: Typekit, types: any[]): boolean {
  return types.every((type) => isLiteral($, type));
}
