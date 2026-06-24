import { isArrayModelType, type ModelProperty } from "@typespec/compiler";
import { resolveGraphQLTypeName } from "../lib/graphql-type-name.js";
import { hasNullableElements, isNullable } from "../lib/nullable.js";

/**
 * Print a mutated type as its GraphQL type string representation.
 * Reads the mutation engine's metadata (nullable, hasNullableElements)
 * to produce the correct nullability wrapping.
 *
 * Examples:
 *   required string property     → "String!"
 *   optional string property     → "String"
 *   required string[] property   → "[String!]!"
 *   optional (string | null)[]   → "[String]"
 */
export function printMutatedType(prop: ModelProperty): string {
  const propNullable = isNullable(prop) || prop.optional;
  const elementsNullable = hasNullableElements(prop);

  const type = prop.type;

  if (type.kind === "Model" && isArrayModelType(type)) {
    const elementType = type.indexer.value;
    const elementName = resolveGraphQLTypeName(elementType);
    const inner = elementsNullable ? elementName : `${elementName}!`;
    const list = `[${inner}]`;
    return propNullable ? list : `${list}!`;
  }

  const name = resolveGraphQLTypeName(type);
  return propNullable ? name : `${name}!`;
}
