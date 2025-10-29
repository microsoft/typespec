/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    // Escape ${...} in multi-line strings to prevent interpolation
    return `"""\n${value.replaceAll("${", "\\${")}\n"""`;
  }
  // Escape both quotes and ${...} in single-line strings to prevent interpolation
  return `"${value.replaceAll('"', '\\"').replaceAll("${", "\\${")}"`;
}
