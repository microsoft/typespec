import { isArrayModelType, type ModelProperty, type Program, type Type } from "@typespec/compiler";
import { hasNullableElements, isNullable } from "../lib/nullable.js";

const SCALAR_TO_GRAPHQL: Record<string, string> = {
  string: "String",
  boolean: "Boolean",
  int32: "Int",
  float32: "Float",
  float64: "Float",
};

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
export function printMutatedType(program: Program, prop: ModelProperty): string {
  const propNullable = isNullable(program, prop) || prop.optional;
  const elementsNullable = hasNullableElements(program, prop);

  const type = prop.type;

  if (type.kind === "Model" && isArrayModelType(type)) {
    const elementType = type.indexer.value;
    const elementName = resolveTypeName(elementType);
    const inner = elementsNullable ? elementName : `${elementName}!`;
    const list = `[${inner}]`;
    return propNullable ? list : `${list}!`;
  }

  const name = resolveTypeName(type);
  return propNullable ? name : `${name}!`;
}

function resolveTypeName(type: Type): string {
  switch (type.kind) {
    case "Scalar":
      return SCALAR_TO_GRAPHQL[type.name] ?? type.name;
    case "Model":
      return type.name;
    case "Enum":
      return type.name;
    case "Union":
      return type.name ?? "Union";
    default:
      return type.kind;
  }
}
