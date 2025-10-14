/** Render a TypeSpec string literal. Automatically render a multiline one if needed */
export function stringLiteral(value: string): string {
  if (value.includes("\n")) {
    return `"""\n${value}\n"""`;
  }
  return `"${value.replaceAll('"', '\\"')}"`;
}
