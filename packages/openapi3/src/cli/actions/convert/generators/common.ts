/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    // Escape ${...} in multi-line strings to prevent interpolation
    // Also escape triple quotes
    // Avoid double-escaping backslashes
    return `"""\n${value.replaceAll("${", "\\${").replaceAll('"""', '\\"""').replaceAll("\\\\", "\\")}\n"""`;
  }
  // Escape both quotes
  // Escape ${...} in single-line strings to prevent interpolation
  // Avoid double-escaping backslashes
  return `"${value.replaceAll('"', '\\"').replaceAll("${", "\\${").replaceAll("\\\\", "\\")}"`;
}
