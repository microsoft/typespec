/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    // Escape ${...} in multi-line strings to prevent interpolation
    return `"""\n${value.replaceAll("${", "\\${")}\n"""`;
  }
  // Escape both quotes and ${...} in single-line strings to prevent interpolation
  return `"${value.replaceAll('"', '\\"').replaceAll("${", "\\${")}"`;
}

/**
 * Render a TypeSpec string literal for use in object literal values.
 * Always uses escaped single-line format to avoid issues with nested triple-quotes.
 */
export function escapedStringLiteral(value: string): string {
  // Escape quotes, newlines, backslashes, and ${...} for single-line strings
  return `"${value
    .replaceAll("\\", "\\\\") // Escape backslashes first
    .replaceAll('"', '\\"') // Escape quotes
    .replaceAll("\n", "\\n") // Escape newlines
    .replaceAll("\r", "\\r") // Escape carriage returns
    .replaceAll("\t", "\\t") // Escape tabs
    .replaceAll("${", "\\${")}"`; // Escape template literal syntax
}
