import { AstPath } from "prettier";
import { Node, SyntaxKind } from "../../core/types.js";
import { CadlPrettierOptions } from "./types.js";

/**
 * Check if the current path should be wrapped in parentheses
 * @param path Prettier print path.
 * @param options Prettier options
 */
export function needsParens(path: AstPath<Node>, options: CadlPrettierOptions): boolean {
  const parent = path.getParentNode();
  if (!parent) {
    return false;
  }

  const node = path.getValue();
  switch (node.kind) {
    case SyntaxKind.IntersectionExpression:
      return (
        parent.kind === SyntaxKind.UnionExpression || parent.kind === SyntaxKind.ArrayExpression
      );
    case SyntaxKind.UnionExpression:
      return (
        parent.kind === SyntaxKind.IntersectionExpression ||
        parent.kind === SyntaxKind.ArrayExpression
      );
    default:
      return false;
  }
}
