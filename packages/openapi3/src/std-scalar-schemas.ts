import type { IntrinsicScalarName, Scalar } from "@typespec/compiler";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import type { OpenAPI3Schema } from "./types.js";

export function getSchemaForStdScalars(
  scalar: Scalar & { name: IntrinsicScalarName },
  options: ResolvedOpenAPI3EmitterOptions,
): OpenAPI3Schema {
  switch (scalar.name) {
    case "bytes":
      return { type: "string", format: "byte" };
    case "numeric":
      return { type: "number" };
    case "integer":
      return { type: "integer" };
    case "int8":
      return { type: "integer", format: "int8" };
    case "int16":
      return { type: "integer", format: "int16" };
    case "int32":
      return { type: "integer", format: "int32" };
    case "int64":
      return { type: "integer", format: "int64" };
    case "safeint":
      switch (options.safeintStrategy) {
        case "double-int":
          return { type: "integer", format: "double-int" };
        case "int64":
        default:
          return { type: "integer", format: "int64" };
      }
    case "uint8":
      return { type: "integer", format: "uint8" };
    case "uint16":
      return { type: "integer", format: "uint16" };
    case "uint32":
      return { type: "integer", format: "uint32" };
    case "uint64":
      return { type: "integer", format: "uint64" };
    case "float":
      return { type: "number" };
    case "float64":
      return { type: "number", format: "double" };
    case "float32":
      return { type: "number", format: "float" };
    case "decimal":
      return { type: "number", format: "decimal" };
    case "decimal128":
      return { type: "number", format: "decimal128" };
    case "string":
      return { type: "string" };
    case "boolean":
      return { type: "boolean" };
    case "plainDate":
      return { type: "string", format: "date" };
    case "utcDateTime":
    case "offsetDateTime":
      return { type: "string", format: "date-time" };
    case "plainTime":
      return { type: "string", format: "time" };
    case "duration":
      return { type: "string", format: "duration" };
    case "url":
      return { type: "string", format: "uri" };
    default:
      const _assertNever: never = scalar.name;
      return {};
  }
}
