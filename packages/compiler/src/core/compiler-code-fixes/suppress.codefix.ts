import { isWhiteSpace } from "../charcode.js";
import { defineCodeFix, getNodeForTarget, getSourceLocation } from "../diagnostics.js";
import {
  SyntaxKind,
  type CodeFix,
  type DiagnosticTarget,
  type Node,
  type SourceLocation,
} from "../types.js";

/**
 * Check if a warning code is already suppressed at the given location.
 * @param location The source location to check for suppression
 * @param warningCode The warning code to check for
 * @returns true if the warning code is already suppressed, false otherwise
 */
export function isCodeSuppressed(location: SourceLocation, warningCode: string): boolean {
  const { lineStart } = findLineStartAndIndent(location);
  const text = location.file.text;

  // Look for existing suppress directives before the target line
  let pos = lineStart;
  while (pos > 0) {
    // Move to start of previous line
    pos--;
    while (pos > 0 && text[pos] !== "\n") {
      pos--;
    }
    if (pos > 0) pos++; // Move past the newline

    const lineStart = pos;
    // Skip whitespace
    while (pos < text.length && isWhiteSpace(text.charCodeAt(pos))) {
      pos++;
    }

    // Check if this line starts with #suppress
    if (text.slice(pos, pos + 9) === "#suppress") {
      pos += 9;
      // Skip whitespace
      while (pos < text.length && isWhiteSpace(text.charCodeAt(pos))) {
        pos++;
      }

      // Look for quoted warning code
      if (text[pos] === '"') {
        pos++;
        const codeStart = pos;
        while (pos < text.length && text[pos] !== '"') {
          pos++;
        }
        const code = text.slice(codeStart, pos);
        if (code === warningCode) {
          return true;
        }
      }
    } else if (
      text.slice(pos).trim() !== "" &&
      !text.slice(pos).startsWith("//") &&
      !text.slice(pos).startsWith("/*")
    ) {
      // If we hit a non-comment, non-empty line that's not a directive, stop looking
      break;
    }

    pos = lineStart - 1;
  }

  return false;
}

export function createSuppressCodeFix(
  diagnosticTarget: DiagnosticTarget,
  warningCode: string,
  suppressionMessage: string = "",
): CodeFix {
  return defineCodeFix({
    id: "suppress",
    label: `Suppress warning: "${warningCode}"`,
    fix: (context) => {
      const location = findSuppressTarget(diagnosticTarget);
      if (!location) {
        return undefined;
      }

      // Check if the code is already suppressed
      if (isCodeSuppressed(location, warningCode)) {
        // Return a no-op edit that replaces nothing with nothing to trigger file write
        const emptyLocation = { ...location, pos: location.pos, end: location.pos };
        return context.replaceText(emptyLocation, "");
      }

      const { lineStart, indent } = findLineStartAndIndent(location);
      const updatedLocation = { ...location, pos: lineStart };
      return context.prependText(
        updatedLocation,
        `${indent}#suppress "${warningCode}" "${suppressionMessage}"\n`,
      );
    },
  });
}

function findSuppressTarget(target: DiagnosticTarget): SourceLocation | undefined {
  if ("file" in target) {
    return target;
  }

  const nodeTarget = getNodeForTarget(target);
  if (!nodeTarget) return undefined;

  const node = findSuppressNode(nodeTarget);
  return getSourceLocation(node);
}

/** Find the node where the suppression should be applied */
function findSuppressNode(node: Node): Node {
  switch (node.kind) {
    case SyntaxKind.Identifier:
    case SyntaxKind.TypeReference:
    case SyntaxKind.UnionExpression:
    case SyntaxKind.ModelExpression:
      return findSuppressNode(node.parent!);
    default:
      return node;
  }
}

function findLineStartAndIndent(location: SourceLocation): { lineStart: number; indent: string } {
  const text = location.file.text;
  let pos = location.pos;
  let indent = 0;
  while (pos > 0 && text[pos - 1] !== "\n") {
    if (isWhiteSpace(text.charCodeAt(pos - 1))) {
      indent++;
    } else {
      indent = 0;
    }
    pos--;
  }
  return { lineStart: pos, indent: location.file.text.slice(pos, pos + indent) };
}
