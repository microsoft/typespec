import type { SupportedOpenAPISchema } from "../../../../types.js";

/** Render a raw string as a TypeSpec literal, using triple quotes for multiline values. */
export function stringLiteral(value: string): string {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("${", "\\${")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");
  if (value.includes("\n")) {
    // Break up every run of three or more quotes so none can close the literal.
    return `"""\n${escaped.replaceAll(/"(?="")/g, '\\"')}\n"""`;
  }
  return `"${escaped.replaceAll('"', '\\"')}"`;
}

export function getStringType(schema: SupportedOpenAPISchema): string {
  if ("contentEncoding" in schema && schema.contentEncoding === "base64") {
    return "bytes";
  }

  switch (schema.format) {
    case "binary":
    case "byte":
      return "bytes";
    case "date":
      return "plainDate";
    case "date-time":
      return "utcDateTime";
    case "time":
      return "plainTime";
    case "duration":
      return "duration";
    case "uri":
      return "url";
    default:
      return "string";
  }
}
