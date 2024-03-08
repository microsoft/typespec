import type { AstPath } from "prettier";
import { Node, SyntaxKind } from "../../core/types.js";
import { TypeSpecPrettierOptions } from "./types.js";

/**
 * Check if the current path should be wrapped in parentheses
 * @param path Prettier print path.
 * @param options Prettier options
 */
export function needsParens(path: AstPath<Node>, options: TypeSpecPrettierOptions): boolean {
  const parent = path.getParentNode();
  if (!parent) {
    return false;
  }

  const node = path.node;
  switch (node.kind) {
    case SyntaxKind.ValueOfExpression:
      return (
        parent.kind === SyntaxKind.UnionExpression ||
        parent.kind === SyntaxKind.ArrayExpression ||
        parent.kind === SyntaxKind.IntersectionExpression
      );
    case SyntaxKind.IntersectionExpression:
      return (
        parent.kind === SyntaxKind.UnionExpression || parent.kind === SyntaxKind.ArrayExpression
      );
    case SyntaxKind.UnionExpression:
      return (
        parent.kind === SyntaxKind.IntersectionExpression ||
        parent.kind === SyntaxKind.ArrayExpression
      );
    case SyntaxKind.ProjectionLogicalExpression:
      return parent.kind === SyntaxKind.ProjectionLogicalExpression;
    case SyntaxKind.ProjectionArithmeticExpression:
      return parent.kind === SyntaxKind.ProjectionArithmeticExpression;
    default:
      return false;
  }
}
