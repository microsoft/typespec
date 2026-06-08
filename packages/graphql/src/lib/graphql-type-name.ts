import type { Type } from "@typespec/compiler";

const SCALAR_TO_GRAPHQL: Record<string, string> = {
  string: "String",
  boolean: "Boolean",
  int32: "Int",
  float32: "Float",
  float64: "Float",
};

/**
 * Resolve the GraphQL type name for a mutated TypeSpec type.
 *
 * For std scalars, maps to GraphQL built-in names (string → String, int32 → Int).
 * For all other types, returns type.name directly (mutation pipeline already set it).
 */
export function resolveGraphQLTypeName(type: Type): string {
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
