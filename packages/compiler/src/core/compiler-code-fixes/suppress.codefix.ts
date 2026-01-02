import { defineCodeFix, getNodeForTarget, getSourceLocation } from "../diagnostics.js";
import {
  SyntaxKind,
  type CodeFix,
  type DiagnosticTarget,
  type Node,
  type SourceLocation,
} from "../types.js";
import { findLineStartAndIndent } from "./utils.js";

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
      // Check if this node is the 'is' or 'extends' expression of a ModelStatement
      // If so, move up to the parent statement to place suppression before 'model' keyword
      if (node.parent && node.parent.kind === SyntaxKind.ModelStatement) {
        const modelParent = node.parent;
        if (modelParent.is === node || modelParent.extends === node) {
          return node.parent;
        }
      }
      return node;
  }
}
