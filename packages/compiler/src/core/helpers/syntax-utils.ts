import { CharCode, isIdentifierContinue, isIdentifierStart, utf16CodeUnits } from "../charcode.js";
import { isModifier, Keywords, ReservedKeywords } from "../scanner.js";
import {
  IdentifierNode,
  MemberExpressionNode,
  Node,
  SyntaxKind,
  TypeReferenceNode,
} from "../types.js";

/**
 * Determine whether a declaration node (model/enum/union/scalar) appears in expression
 * position (e.g. as an alias value or a property type) rather than as a top-level
 * statement directly under a namespace or source file. Anonymous declarations (used as
 * expressions) are always in expression position.
 *
 * This is the single source of truth shared by the binder and checker so the two cannot
 * drift apart.
 */
export function isDeclarationInExpressionPosition(node: Node): boolean {
  const parent = node.parent;
  return (
    parent === undefined ||
    (parent.kind !== SyntaxKind.NamespaceStatement &&
      parent.kind !== SyntaxKind.TypeSpecScript &&
      parent.kind !== SyntaxKind.JsSourceFile)
  );
}

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

export function printMemberExpressionPath(base: string, selector: "." | "::", id: string): string {
  return `${base}${selector}${printIdentifier(id)}`;
}

function needBacktick(sv: string, context: "allow-reserved" | "disallow-reserved"): boolean {
  if (sv.length === 0) {
    return false;
  }
  if (context === "allow-reserved") {
    if (ReservedKeywords.has(sv)) {
      return false;
    }
    // Modifier keywords (e.g. "internal", "extern") are contextual and can be
    // used as identifiers without escaping in non-modifier positions.
    const kwToken = Keywords.get(sv);
    if (kwToken !== undefined && isModifier(kwToken)) {
      return false;
    }
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
