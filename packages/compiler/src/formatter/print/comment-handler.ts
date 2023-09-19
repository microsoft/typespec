import type { Printer } from "prettier";
import { Node, SyntaxKind, TypeSpecScriptNode } from "../../core/types.js";
import { util } from "./util.js";

interface CommentNode {
  precedingNode?: Node;
  enclosingNode?: Node;
  followingNode?: Node;
}

/**
 * Override the default behavior to attach comments to syntax node.
 */
export const commentHandler: Printer<Node>["handleComments"] = {
  ownLine: (comment, text, options, ast, isLastComment) =>
    [
      addEmptyInterfaceComment,
      addEmptyModelComment,
      addCommentBetweenAnnotationsAndNode,
      handleOnlyComments,
    ].some((x) => x({ comment, text, options, ast: ast as TypeSpecScriptNode, isLastComment })),
};

interface CommentContext {
  comment: CommentNode;
  text: string;
  options: any;
  ast: TypeSpecScriptNode;
  isLastComment: boolean;
}
/**
 * When a comment is on an empty interface make sure it gets added as a dangling comment on it and not on the identifier.
 *
 * @example
 *
 * interface Foo {
 *   // My comment
 * }
 */
function addEmptyInterfaceComment({ comment, ast }: CommentContext) {
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
 * When a comment is in between a node and its annotations(Decorator, directives, doc comments).
 *
 * @example
 *
 * @foo
 * // My comment
 * @bar
 * model Foo {
 * }
 */
function addCommentBetweenAnnotationsAndNode({ comment }: CommentContext) {
  const { enclosingNode, precedingNode } = comment;

  if (
    precedingNode &&
    (precedingNode.kind === SyntaxKind.DecoratorExpression ||
      precedingNode.kind === SyntaxKind.DirectiveExpression ||
      precedingNode.kind === SyntaxKind.Doc) &&
    enclosingNode &&
    (enclosingNode.kind === SyntaxKind.NamespaceStatement ||
      enclosingNode.kind === SyntaxKind.ModelStatement ||
      enclosingNode.kind === SyntaxKind.EnumStatement ||
      enclosingNode.kind === SyntaxKind.OperationStatement ||
      enclosingNode.kind === SyntaxKind.ScalarStatement ||
      enclosingNode.kind === SyntaxKind.InterfaceStatement ||
      enclosingNode.kind === SyntaxKind.ModelProperty ||
      enclosingNode.kind === SyntaxKind.EnumMember ||
      enclosingNode.kind === SyntaxKind.UnionStatement)
  ) {
    util.addTrailingComment(precedingNode, comment);
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
function addEmptyModelComment({ comment }: CommentContext) {
  const { precedingNode, enclosingNode } = comment;

  if (
    enclosingNode &&
    enclosingNode.kind === SyntaxKind.ModelStatement &&
    enclosingNode.properties.length === 0 &&
    precedingNode &&
    (precedingNode === enclosingNode.is ||
      precedingNode === enclosingNode.id ||
      precedingNode === enclosingNode.extends)
  ) {
    util.addDanglingComment(enclosingNode, comment, undefined);
    return true;
  }
  return false;
}

function handleOnlyComments({ comment, ast, isLastComment }: CommentContext) {
  const { enclosingNode } = comment;
  if (ast?.statements?.length === 0) {
    if (isLastComment) {
      util.addDanglingComment(ast, comment, undefined);
    } else {
      util.addLeadingComment(ast, comment);
    }
    return true;
  }

  if (
    enclosingNode?.kind === SyntaxKind.TypeSpecScript &&
    enclosingNode.statements.length === 0 &&
    enclosingNode.directives?.length === 0
  ) {
    if (isLastComment) {
      util.addDanglingComment(enclosingNode, comment, undefined);
    } else {
      util.addLeadingComment(enclosingNode, comment);
    }
    return true;
  }

  return false;
}
