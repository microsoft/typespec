import type { Program, Type } from "@typespec/compiler";
import { reportDiagnostic } from "../lib.js";
import { resolveScalarToGraphQL } from "./scalar-mappings.js";

export function resolveGraphQLTypeName(type: Type, program?: Program): string {
  switch (type.kind) {
    case "Scalar":
      // resolveScalarToGraphQL maps std scalars to GraphQL types,
      // and returns user-defined scalar names as-is
      return resolveScalarToGraphQL(type.name);
    case "Model":
      return type.name;
    case "Enum":
      return type.name;
    case "Union":
      return type.name ?? "Union";
    default:
      // Unsupported type (literals, etc.) - warn and fall back to String
      if (program) {
        reportDiagnostic(program, {
          code: "unsupported-type",
          format: { type: type.kind },
          target: type,
        });
      }
      return "String";
  }
}
