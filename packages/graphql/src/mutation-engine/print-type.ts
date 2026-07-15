import { isArrayModelType, type ModelProperty, type Program } from "@typespec/compiler";
import { isNullable, isNullableElements } from "../../generated-defs/TypeSpec.GraphQL.js";
import { resolveGraphQLTypeName } from "../lib/graphql-type-name.js";

/**
 * Print a mutated type as its GraphQL type string representation.
 * Reads the mutation engine's metadata (nullable, nullableElements)
 * to produce the correct nullability wrapping.
 *
 * Examples:
 *   required string property     → "String!"
 *   optional string property     → "String"
 *   required string[] property   → "[String!]!"
 *   optional (string | null)[]   → "[String]"
 */
export function printMutatedType(program: Program, prop: ModelProperty): string {
  const propNullable = isNullable(program, prop) || prop.optional;
  const elementsNullable = isNullableElements(program, prop);

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
