import { CharCode, isIdentifierContinue, isIdentifierStart, utf16CodeUnits } from "../charcode.js";
import { Keywords, ReservedKeywords } from "../scanner.js";
import { IdentifierNode, MemberExpressionNode, SyntaxKind, TypeReferenceNode } from "../types.js";

/**
 * Print a string as a TypeSpec identifier. If the string is a valid identifier, return it as is otherwise wrap it into backticks.
 * @param sv Identifier string value.
 * @returns Identifier string as it would be represented in a TypeSpec file.
 *
 * @example
 * ```ts
 * printIdentifier("foo") // foo
 * printIdentifier("foo bar") // `foo bar`
 * ```
 */
export function printIdentifier(
  sv: string,
  /** @internal */ context: "allow-reserved" | "disallow-reserved" = "disallow-reserved",
) {
  if (needBacktick(sv, context)) {
    const escapedString = sv
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/`/g, "\\`");
    return `\`${escapedString}\``;
  } else {
    return sv;
  }
}

function needBacktick(sv: string, context: "allow-reserved" | "disallow-reserved"): boolean {
  if (sv.length === 0) {
    return false;
  }
  if (context === "allow-reserved" && ReservedKeywords.has(sv)) {
    return false;
  }
  if (Keywords.has(sv)) {
    return true;
  }
  let cp = sv.codePointAt(0)!;
  if (!isIdentifierStart(cp)) {
    return true;
  }
  let pos = 0;
  do {
    pos += utf16CodeUnits(cp);
  } while (pos < sv.length && isIdentifierContinue((cp = sv.codePointAt(pos)!)));
  return pos < sv.length;
}

export function typeReferenceToString(
  node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
): string {
  switch (node.kind) {
    case SyntaxKind.MemberExpression:
      return `${typeReferenceToString(node.base)}${node.selector}${typeReferenceToString(node.id)}`;
    case SyntaxKind.TypeReference:
      return typeReferenceToString(node.target);
    case SyntaxKind.Identifier:
      return node.sv;
  }
}

export function splitLines(text: string): string[] {
  const lines = [];
  let start = 0;
  let pos = 0;

  while (pos < text.length) {
    const ch = text.charCodeAt(pos);
    switch (ch) {
      case CharCode.CarriageReturn:
        if (text.charCodeAt(pos + 1) === CharCode.LineFeed) {
          lines.push(text.slice(start, pos));
          start = pos + 2;
          pos++;
        } else {
          lines.push(text.slice(start, pos));
          start = pos + 1;
        }
        break;
      case CharCode.LineFeed:
        lines.push(text.slice(start, pos));
        start = pos + 1;
        break;
    }
    pos++;
  }

  lines.push(text.slice(start));
  return lines;
}
