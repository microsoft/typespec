import type { Type } from "@typespec/compiler";
import { resolveScalarToGraphQL } from "./scalar-mappings.js";

export function resolveGraphQLTypeName(type: Type): string {
  switch (type.kind) {
    case "Scalar":
      return resolveScalarToGraphQL(type.name);
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
