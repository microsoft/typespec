import type { Printer } from "prettier";
import type { Node, TextRange, TypeSpecScriptNode } from "../../core/types.js";
import { SyntaxKind } from "../../core/types.js";
import { util } from "./util.js";

interface CommentNode extends TextRange {
  readonly kind: SyntaxKind.LineComment | SyntaxKind.BlockComment;
  precedingNode?: Node;
  enclosingNode?: Node;
  followingNode?: Node;
}

/**
 * Override the default behavior to attach comments to syntax node.
 */
export const commentHandler: Printer<Node>["handleComments"] = {
  ownLine: (comment, text, options, ast, isLastComment) =>
    [addEmptyDeclarationComment, addCommentBetweenAnnotationsAndNode, handleOnlyComments].some(
      (x) => x({ comment, text, options, ast: ast as TypeSpecScriptNode, isLastComment }),
    ),
  remaining: (comment, text, options, ast, isLastComment) =>
    [handleOnlyComments].some((x) =>
      x({ comment, text, options, ast: ast as TypeSpecScriptNode, isLastComment }),
    ),
  endOfLine: (comment, text, options, ast, isLastComment) =>
    [handleOnlyComments].some((x) =>
      x({ comment, text, options, ast: ast as TypeSpecScriptNode, isLastComment }),
    ),
};

interface CommentContext {
  comment: CommentNode;
  text: string;
  options: any;
  ast: TypeSpecScriptNode;
  isLastComment: boolean;
}
/**
 * When a comment is inside an empty declaration body, attach it to the declaration instead of
 * the last node in the declaration header.
 *
 * @example
 *
 * union Foo extends Bar {
 *   // My comment
 * }
 */
function addEmptyDeclarationComment({ comment }: CommentContext) {
  const { precedingNode, enclosingNode } = comment;

  if (!enclosingNode || !precedingNode) {
    return false;
  }

  let isEmptyDeclarationBody = false;
  switch (enclosingNode.kind) {
    case SyntaxKind.InterfaceStatement:
      isEmptyDeclarationBody =
        enclosingNode.operations.length === 0 && precedingNode.kind === SyntaxKind.Identifier;
      break;
    case SyntaxKind.ModelStatement:
      isEmptyDeclarationBody =
        enclosingNode.properties.length === 0 &&
        (precedingNode === enclosingNode.is ||
          precedingNode === enclosingNode.id ||
          precedingNode === enclosingNode.extends);
      break;
    case SyntaxKind.ScalarStatement:
      isEmptyDeclarationBody =
        enclosingNode.members.length === 0 &&
        (precedingNode === enclosingNode.id || precedingNode === enclosingNode.extends);
      break;
    case SyntaxKind.UnionStatement:
      isEmptyDeclarationBody =
        enclosingNode.options.length === 0 &&
        (precedingNode === enclosingNode.id || precedingNode === enclosingNode.extends);
      break;
  }

  if (isEmptyDeclarationBody) {
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
  const { precedingNode, enclosingNode } = comment;

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
      enclosingNode.kind === SyntaxKind.UnionVariant ||
      enclosingNode.kind === SyntaxKind.UnionStatement)
  ) {
    util.addTrailingComment(precedingNode, comment);
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
