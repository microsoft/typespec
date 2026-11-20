/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    // Escape single backslashes
    // Escape ${...} in multi-line strings to prevent interpolation
    // Also escape triple quotes
    // Avoid double-escaping backslashes in the process
    return `"""\n${value
      .replaceAll(/(?:([^\\])\\([\s])|^\\([\s]))/gi, "$1\\\\$2")
      .replaceAll(/(?:([^\\])\$\{|^\$\{)/gi, "$1\\${")
      .replaceAll(/(?:([^\\])"""|^""")/gi, '$1\\"""')
      .replaceAll(/(?:([^\\])\\u|^\\u)/gi, "$1\\\\u")}\n"""`;
  }
  // Escape both quotes
  // Escape ${...} in single-line strings to prevent interpolation
  // Avoid double-escaping backslashes in the process
  return `"${value.replaceAll(/(?:([^\\])"|^")/gi, '$1\\"').replaceAll(/(?:([^\\])\$\{|^\$\{)/gi, "$1\\${")}"`;
}
import type { SupportedOpenAPISchema } from "../../../../types.js";

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
