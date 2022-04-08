import prettier, { Printer } from "prettier";
import { Node, SyntaxKind } from "../../core/types.js";

const { util } = prettier;

interface CommentNode {
  precedingNode?: Node;
  enclosingNode?: Node;
}

/**
 * Override the default behavior to attach comments to syntax node.
 */
export const commentHandler: Printer<Node>["handleComments"] = {
  ownLine: (comment) =>
    [addEmptyInterfaceComment, addEmptyModelComment, addStatementDecoratorComment].some((x) =>
      x(comment)
    ),
};

/**
 * When a comment is on an empty interface make sure it gets added as a dangling comment on it and not on the identifier.
 *
 * @example
 *
 * interface Foo {
 *   // My comment
 * }
 */
function addEmptyInterfaceComment(comment: CommentNode) {
  const { precedingNode, enclosingNode } = comment;

  if (
    enclosingNode &&
    enclosingNode.kind === SyntaxKind.InterfaceStatement &&
    enclosingNode.operations.length === 0 &&
    precedingNode &&
    precedingNode.kind === SyntaxKind.Identifier
  ) {
    util.addDanglingComment(enclosingNode, comment, undefined);
    return true;
  }
  return false;
}

/**
 * When a comment is in between a decorator and a statement.
 *
 * @example
 *
 * @foo
 * // My comment
 * model Foo {
 * }
 */
function addStatementDecoratorComment(comment: CommentNode) {
  const { enclosingNode, precedingNode } = comment;

  if (
    precedingNode &&
    precedingNode.kind === SyntaxKind.DecoratorExpression &&
    enclosingNode &&
    (enclosingNode.kind === SyntaxKind.NamespaceStatement ||
      enclosingNode.kind === SyntaxKind.ModelStatement ||
      enclosingNode.kind === SyntaxKind.EnumStatement ||
      enclosingNode.kind === SyntaxKind.UnionStatement)
  ) {
    util.addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

/**
 * When a comment is on an empty model make sure it gets added as a dangling comment on it and not on the identifier.
 *
 * @example
 *
 * model Foo {
 *   // My comment
 * }
 */
function addEmptyModelComment(comment: CommentNode) {
  const { precedingNode, enclosingNode } = comment;

  if (
    enclosingNode &&
    enclosingNode.kind === SyntaxKind.ModelStatement &&
    enclosingNode.properties.length === 0 &&
    precedingNode &&
    precedingNode.kind === SyntaxKind.Identifier
  ) {
    util.addDanglingComment(enclosingNode, comment, undefined);
    return true;
  }
  return false;
}
