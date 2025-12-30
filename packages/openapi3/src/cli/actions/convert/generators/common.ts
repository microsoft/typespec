/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    // Escape single backslashes
    // Escape ${...} in multi-line strings to prevent interpolation
    // Also escape triple quotes
    // Avoid double-escaping backslashes in the process
    return `"""\n${value
      .replaceAll(/([^\\])\\([\s])/gi, "$1\\\\$2")
      .replaceAll(/([^\\])\${/gi, "$1\\${")
      .replaceAll(/([^\\])"""/gi, '$1\\"""')}\n"""`;
  }
  // Escape both quotes
  // Escape ${...} in single-line strings to prevent interpolation
  // Avoid double-escaping backslashes in the process
  return `"${value.replaceAll(/([^\\])"/gi, '$1\\"').replaceAll(/([^\\])\${/gi, "$1\\${")}"`;
}
