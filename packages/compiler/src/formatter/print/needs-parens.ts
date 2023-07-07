import { Node, SyntaxKind } from "../../core/types.js";
import { AstPath } from "./prettier-ast-path.js";
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

  // eslint-disable-next-line deprecation/deprecation
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
    case SyntaxKind.ProjectionLogicalExpression:
      return parent.kind === SyntaxKind.ProjectionLogicalExpression;
    case SyntaxKind.ProjectionArithmeticExpression:
      return parent.kind === SyntaxKind.ProjectionArithmeticExpression;
    default:
      return false;
  }
}
