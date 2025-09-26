import { isWhiteSpace } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import {
  SyntaxKind,
  type CodeFix,
  type DiagnosticTarget,
  type Node,
  type SourceLocation,
  type TypeSpecDiagnosticTarget,
} from "../types.js";

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

  const nodeTarget = findNodeTarget(target);
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

function findNodeTarget(target: TypeSpecDiagnosticTarget): Node | undefined {
  if ("file" in target) {
    return target;
  }

  // Symbols
  if ("declarations" in target) {
    return target.declarations[0];
  }

  // Types
  if ("entityKind" in target || "node" in target) {
    return (target as any).node;
  }

  return target;
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
