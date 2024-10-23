import type { AstPath, Doc, Printer } from "prettier";
import { builders } from "prettier/doc";
import { CharCode } from "../../core/charcode.js";
import { compilerAssert } from "../../core/diagnostics.js";
import { printIdentifier as printIdentifierString } from "../../core/helpers/syntax-utils.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  ArrayLiteralNode,
  AugmentDecoratorStatementNode,
  BlockComment,
  BooleanLiteralNode,
  CallExpressionNode,
  Comment,
  ConstStatementNode,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  DirectiveExpressionNode,
  DocNode,
  EnumMemberNode,
  EnumSpreadMemberNode,
  EnumStatementNode,
  FunctionDeclarationStatementNode,
  FunctionParameterNode,
  IdentifierNode,
  InterfaceStatementNode,
  IntersectionExpressionNode,
  LineComment,
  MemberExpressionNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  Node,
  NodeFlags,
  NumericLiteralNode,
  ObjectLiteralNode,
  ObjectLiteralPropertyNode,
  ObjectLiteralSpreadPropertyNode,
  OperationSignatureDeclarationNode,
  OperationSignatureReferenceNode,
  OperationStatementNode,
  ProjectionArithmeticExpressionNode,
  ProjectionBlockExpressionNode,
  ProjectionCallExpressionNode,
  ProjectionDecoratorReferenceExpressionNode,
  ProjectionEqualityExpressionNode,
  ProjectionExpressionStatementNode,
  ProjectionIfExpressionNode,
  ProjectionLambdaExpressionNode,
  ProjectionLambdaParameterDeclarationNode,
  ProjectionLogicalExpressionNode,
  ProjectionMemberExpressionNode,
  ProjectionModelExpressionNode,
  ProjectionModelPropertyNode,
  ProjectionModelSpreadPropertyNode,
  ProjectionNode,
  ProjectionParameterDeclarationNode,
  ProjectionRelationalExpressionNode,
  ProjectionStatementNode,
  ProjectionTupleExpressionNode,
  ProjectionUnaryExpressionNode,
  ReturnExpressionNode,
  ScalarConstructorNode,
  ScalarStatementNode,
  Statement,
  StringLiteralNode,
  StringTemplateExpressionNode,
  StringTemplateSpanNode,
  SyntaxKind,
  TemplateArgumentNode,
  TemplateParameterDeclarationNode,
  TextRange,
  TupleExpressionNode,
  TypeOfExpressionNode,
  TypeReferenceNode,
  TypeSpecScriptNode,
  UnionExpressionNode,
  UnionStatementNode,
  UnionVariantNode,
  UsingStatementNode,
  ValueOfExpressionNode,
} from "../../core/types.js";
import { FlattenedNamespaceStatementNode } from "../types.js";
import { commentHandler } from "./comment-handler.js";
import { needsParens } from "./needs-parens.js";
import { DecorableNode, PrettierChildPrint, TypeSpecPrettierOptions } from "./types.js";
import { util } from "./util.js";

const {
  align,
  breakParent,
  group,
  hardline,
  ifBreak,
  indent,
  join,
  line,
  softline,
  literalline,
  markAsRoot,
} = builders;

const { isNextLineEmpty } = util as any;

/**
 * If the decorators for that node should try to be kept inline.
 */
const DecoratorsTryInline = {
  modelProperty: true,
  enumMember: true,
  unionVariant: true,
};

export const typespecPrinter: Printer<Node> = {
  print: printTypeSpec,
  isBlockComment: (node: any) => isBlockComment(node),
  canAttachComment: canAttachComment,
  printComment: printComment,
  handleComments: commentHandler,
};

export function printTypeSpec(
  // Path to the AST node to print
  path: AstPath<Node>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  const docs = printDocComments(path, options, print);
  const directives = shouldPrintDirective(node) ? printDirectives(path, options, print) : "";
  const printedNode = printNode(path, options, print);
  const value = needsParens(path, options) ? ["(", printedNode, ")"] : printedNode;
  const parts: Doc[] = [docs, directives, value];
  if (node.kind === SyntaxKind.TypeSpecScript) {
    // For TypeSpecScript(root of TypeSpec document) we had a new line at the end.
    // This must be done here so the hardline entry can be the last item of the doc array returned by the printer
    // so the markdown(and other embedded formatter) can omit that extra line.
    parts.push(hardline);
  }
  return parts;
}

function shouldPrintDirective(node: Node) {
  // Model property handle printing directive itself.
  return node.kind !== SyntaxKind.ModelProperty;
}

export function printNode(
  // Path to the AST node to print
  path: AstPath<Node>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node: Node = path.node;

  switch (node.kind) {
    // Root
    case SyntaxKind.TypeSpecScript:
      return printTypeSpecScript(path as AstPath<TypeSpecScriptNode>, options, print);
    // Statements
    case SyntaxKind.ImportStatement:
      return [`import "${node.path.value}";`];
    case SyntaxKind.UsingStatement:
      return [`using `, (path as AstPath<UsingStatementNode>).call(print, "name"), `;`];
    case SyntaxKind.OperationStatement:
      return printOperationStatement(path as AstPath<OperationStatementNode>, options, print);
    case SyntaxKind.OperationSignatureDeclaration:
      return printOperationSignatureDeclaration(
        path as AstPath<OperationSignatureDeclarationNode>,
        options,
        print,
      );
    case SyntaxKind.OperationSignatureReference:
      return printOperationSignatureReference(
        path as AstPath<OperationSignatureReferenceNode>,
        options,
        print,
      );
    case SyntaxKind.NamespaceStatement:
      return printNamespaceStatement(
        path as AstPath<FlattenedNamespaceStatementNode>,
        options,
        print,
      );
    case SyntaxKind.ModelStatement:
      return printModelStatement(path as AstPath<ModelStatementNode>, options, print);
    case SyntaxKind.ScalarStatement:
      return printScalarStatement(path as AstPath<ScalarStatementNode>, options, print);
    case SyntaxKind.ScalarConstructor:
      return printScalarConstructor(path as AstPath<ScalarConstructorNode>, options, print);
    case SyntaxKind.AliasStatement:
      return printAliasStatement(path as AstPath<AliasStatementNode>, options, print);
    case SyntaxKind.EnumStatement:
      return printEnumStatement(path as AstPath<EnumStatementNode>, options, print);
    case SyntaxKind.UnionStatement:
      return printUnionStatement(path as AstPath<UnionStatementNode>, options, print);
    case SyntaxKind.InterfaceStatement:
      return printInterfaceStatement(path as AstPath<InterfaceStatementNode>, options, print);
    // Others.
    case SyntaxKind.Identifier:
      return printIdentifier(node, options);
    case SyntaxKind.StringLiteral:
      return printStringLiteral(path as AstPath<StringLiteralNode>, options);
    case SyntaxKind.NumericLiteral:
      return printNumberLiteral(path as AstPath<NumericLiteralNode>, options);
    case SyntaxKind.BooleanLiteral:
      return printBooleanLiteral(path as AstPath<BooleanLiteralNode>, options);
    case SyntaxKind.ModelExpression:
      return printModelExpression(path as AstPath<ModelExpressionNode>, options, print);
    case SyntaxKind.ModelProperty:
      return printModelProperty(path as AstPath<ModelPropertyNode>, options, print);
    case SyntaxKind.DecoratorExpression:
      return printDecorator(path as AstPath<DecoratorExpressionNode>, options, print);
    case SyntaxKind.AugmentDecoratorStatement:
      return printAugmentDecorator(path as AstPath<AugmentDecoratorStatementNode>, options, print);
    case SyntaxKind.DirectiveExpression:
      return printDirective(path as AstPath<DirectiveExpressionNode>, options, print);
    case SyntaxKind.UnionExpression:
      return printUnion(path as AstPath<UnionExpressionNode>, options, print);
    case SyntaxKind.IntersectionExpression:
      return printIntersection(path as AstPath<IntersectionExpressionNode>, options, print);
    case SyntaxKind.ArrayExpression:
      return printArray(path as AstPath<ArrayExpressionNode>, options, print);
    case SyntaxKind.TupleExpression:
      return printTuple(path as AstPath<TupleExpressionNode>, options, print);
    case SyntaxKind.MemberExpression:
      return printMemberExpression(path as AstPath<MemberExpressionNode>, options, print);
    case SyntaxKind.EnumMember:
      return printEnumMember(path as AstPath<EnumMemberNode>, options, print);
    case SyntaxKind.EnumSpreadMember:
      return printEnumSpreadMember(path as AstPath<EnumSpreadMemberNode>, options, print);
    case SyntaxKind.UnionVariant:
      return printUnionVariant(path as AstPath<UnionVariantNode>, options, print);
    case SyntaxKind.TypeReference:
      return printTypeReference(path as AstPath<TypeReferenceNode>, options, print);
    case SyntaxKind.TemplateArgument:
      return printTemplateArgument(path as AstPath<TemplateArgumentNode>, options, print);
    case SyntaxKind.ValueOfExpression:
      return printValueOfExpression(path as AstPath<ValueOfExpressionNode>, options, print);
    case SyntaxKind.TypeOfExpression:
      return printTypeOfExpression(path as AstPath<TypeOfExpressionNode>, options, print);
    case SyntaxKind.TemplateParameterDeclaration:
      return printTemplateParameterDeclaration(
        path as AstPath<TemplateParameterDeclarationNode>,
        options,
        print,
      );
    case SyntaxKind.ModelSpreadProperty:
      return printModelSpread(path as AstPath<ModelSpreadPropertyNode>, options, print);
    case SyntaxKind.DecoratorDeclarationStatement:
      return printDecoratorDeclarationStatement(
        path as AstPath<DecoratorDeclarationStatementNode>,
        options,
        print,
      );
    case SyntaxKind.FunctionDeclarationStatement:
      return printFunctionDeclarationStatement(
        path as AstPath<FunctionDeclarationStatementNode>,
        options,
        print,
      );
    case SyntaxKind.FunctionParameter:
      return printFunctionParameterDeclaration(
        path as AstPath<FunctionParameterNode>,
        options,
        print,
      );
    case SyntaxKind.ExternKeyword:
      return "extern";
    case SyntaxKind.VoidKeyword:
      return "void";
    case SyntaxKind.NeverKeyword:
      return "never";
    case SyntaxKind.UnknownKeyword:
      return "unknown";
    case SyntaxKind.ProjectionStatement:
      return printProjectionStatement(path as AstPath<ProjectionStatementNode>, options, print);
    case SyntaxKind.ProjectionModelSelector:
      return "model";
    case SyntaxKind.ProjectionModelPropertySelector:
      return "modelproperty";
    case SyntaxKind.ProjectionScalarSelector:
      return "scalar";
    case SyntaxKind.ProjectionOperationSelector:
      return "op";
    case SyntaxKind.ProjectionUnionSelector:
      return "union";
    case SyntaxKind.ProjectionUnionVariantSelector:
      return "unionvariant";
    case SyntaxKind.ProjectionInterfaceSelector:
      return "interface";
    case SyntaxKind.ProjectionEnumSelector:
      return "enum";
    case SyntaxKind.ProjectionEnumMemberSelector:
      return "enummember";
    case SyntaxKind.Projection:
      return printProjection(path as AstPath<ProjectionNode>, options, print);
    case SyntaxKind.ProjectionParameterDeclaration:
      return printProjectionParameterDeclaration(
        path as AstPath<ProjectionParameterDeclarationNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionExpressionStatement:
      return printProjectionExpressionStatement(
        path as AstPath<ProjectionExpressionStatementNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionIfExpression:
      return printProjectionIfExpressionNode(
        path as AstPath<ProjectionIfExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionBlockExpression:
      return printProjectionBlockExpressionNode(
        path as AstPath<ProjectionBlockExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionMemberExpression:
      return printProjectionMemberExpression(
        path as AstPath<ProjectionMemberExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionLogicalExpression:
    case SyntaxKind.ProjectionEqualityExpression:
    case SyntaxKind.ProjectionRelationalExpression:
    case SyntaxKind.ProjectionArithmeticExpression:
      return printProjectionLeftRightExpression(
        path as AstPath<ProjectionLogicalExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionUnaryExpression:
      return printProjectionUnaryExpression(
        path as AstPath<ProjectionUnaryExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionCallExpression:
      return printProjectionCallExpression(
        path as AstPath<ProjectionCallExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionLambdaExpression:
      return printProjectionLambdaExpression(
        path as AstPath<ProjectionLambdaExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionLambdaParameterDeclaration:
      return printProjectionLambdaParameterDeclaration(
        path as AstPath<ProjectionLambdaParameterDeclarationNode>,
        options,
        print,
      );
    case SyntaxKind.ProjectionModelExpression:
      return printModelExpression(path as AstPath<ProjectionModelExpressionNode>, options, print);
    case SyntaxKind.ProjectionModelProperty:
      return printModelProperty(path as AstPath<ProjectionModelPropertyNode>, options, print);
    case SyntaxKind.ProjectionModelSpreadProperty:
      return printModelSpread(path as AstPath<ProjectionModelSpreadPropertyNode>, options, print);
    case SyntaxKind.ProjectionTupleExpression:
      return printTuple(path as AstPath<ProjectionTupleExpressionNode>, options, print);
    case SyntaxKind.ProjectionDecoratorReferenceExpression:
      return (path as AstPath<ProjectionDecoratorReferenceExpressionNode>).call(print, "target");
    case SyntaxKind.Return:
      return printReturnExpression(path as AstPath<ReturnExpressionNode>, options, print);
    case SyntaxKind.Doc:
      return printDoc(path as AstPath<DocNode>, options, print);
    case SyntaxKind.DocText:
    case SyntaxKind.DocParamTag:
    case SyntaxKind.DocPropTag:
    case SyntaxKind.DocTemplateTag:
    case SyntaxKind.DocReturnsTag:
    case SyntaxKind.DocErrorsTag:
    case SyntaxKind.DocUnknownTag:
      // https://github.com/microsoft/typespec/issues/1319 Tracks pretty-printing doc comments.
      compilerAssert(
        false,
        "Currently, doc comments are only handled as regular comments and we do not opt in to parsing them so we shouldn't reach here.",
      );
      return "";
    case SyntaxKind.EmptyStatement:
      return "";
    case SyntaxKind.StringTemplateExpression:
      return printStringTemplateExpression(
        path as AstPath<StringTemplateExpressionNode>,
        options,
        print,
      );
    case SyntaxKind.ObjectLiteral:
      return printObjectLiteral(path as AstPath<ObjectLiteralNode>, options, print);
    case SyntaxKind.ObjectLiteralProperty:
      return printObjectLiteralProperty(path as AstPath<ObjectLiteralPropertyNode>, options, print);
    case SyntaxKind.ObjectLiteralSpreadProperty:
      return printObjectLiteralSpreadProperty(
        path as AstPath<ObjectLiteralSpreadPropertyNode>,
        options,
        print,
      );
    case SyntaxKind.ArrayLiteral:
      return printArrayLiteral(path as AstPath<ArrayLiteralNode>, options, print);
    case SyntaxKind.ConstStatement:
      return printConstStatement(path as AstPath<ConstStatementNode>, options, print);
    case SyntaxKind.CallExpression:
      return printCallExpression(path as AstPath<CallExpressionNode>, options, print);
    case SyntaxKind.StringTemplateSpan:
    case SyntaxKind.StringTemplateHead:
    case SyntaxKind.StringTemplateMiddle:
    case SyntaxKind.StringTemplateTail:
    case SyntaxKind.JsSourceFile:
    case SyntaxKind.JsNamespaceDeclaration:
    case SyntaxKind.InvalidStatement:
      return getRawText(node, options);
    default:
      // Dummy const to ensure we handle all node types.
      // If you get an error here, add a case for the new node type
      // you added..
      const _assertNever: never = node;
      return getRawText(node, options);
  }
}

export function printTypeSpecScript(
  path: AstPath<TypeSpecScriptNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  const body = [];
  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  body.push(printStatementSequence(path, options, print, "statements"));
  return body;
}

export function printAliasStatement(
  path: AstPath<AliasStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const id = path.call(print, "id");
  const template = printTemplateParameters(path, options, print, "templateParameters");
  return ["alias ", id, template, " = ", path.call(print, "value"), ";"];
}

export function printConstStatement(
  path: AstPath<ConstStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const id = path.call(print, "id");
  const type = node.type ? [": ", path.call(print, "type")] : "";
  return ["const ", id, type, " = ", path.call(print, "value"), ";"];
}

export function printCallExpression(
  path: AstPath<CallExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const args = printCallLikeArgs(path, options, print);
  return [path.call(print, "target"), args];
}

function printTemplateParameters<T extends Node>(
  path: AstPath<T>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
  propertyName: keyof T,
) {
  const node = path.node;
  const args = node[propertyName] as any as TemplateParameterDeclarationNode[];
  if ((args as any).length === 0) {
    return "";
  }

  const shouldHug = (args as any).length === 1;
  if (shouldHug) {
    return ["<", join(", ", path.map(print, propertyName as any)), ">"];
  } else {
    const body = indent([softline, join([", ", softline], path.map(print, propertyName as any))]);
    return group(["<", body, softline, ">"]);
  }
}

export function canAttachComment(node: Node): boolean {
  const kind = node.kind as SyntaxKind;
  return Boolean(
    kind &&
      kind !== SyntaxKind.LineComment &&
      kind !== SyntaxKind.BlockComment &&
      kind !== SyntaxKind.EmptyStatement &&
      kind !== SyntaxKind.DocParamTag &&
      kind !== SyntaxKind.DocReturnsTag &&
      kind !== SyntaxKind.DocTemplateTag &&
      kind !== SyntaxKind.DocText &&
      kind !== SyntaxKind.DocUnknownTag &&
      !(node.flags & NodeFlags.Synthetic),
  );
}

export function printComment(
  commentPath: AstPath<Node | Comment>,
  options: TypeSpecPrettierOptions,
): Doc {
  const comment = commentPath.node;
  (comment as any).printed = true;

  switch (comment.kind) {
    case SyntaxKind.BlockComment:
      return printBlockComment(commentPath as AstPath<BlockComment>, options);
    case SyntaxKind.LineComment:
      return `${options.originalText.slice(comment.pos, comment.end).trimEnd()}`;
    default:
      throw new Error(`Not a comment: ${JSON.stringify(comment)}`);
  }
}

function printBlockComment(commentPath: AstPath<BlockComment>, options: TypeSpecPrettierOptions) {
  const comment = commentPath.node;
  const rawComment = options.originalText.slice(comment.pos + 2, comment.end - 2);

  const printed = isIndentableBlockComment(rawComment)
    ? printIndentableBlockCommentContent(rawComment)
    : rawComment;
  return ["/*", printed, "*/"];
}

function isIndentableBlockComment(rawComment: string): boolean {
  // If the comment has multiple lines and every line starts with a star
  // we can fix the indentation of each line. The stars in the `/*` and
  // `*/` delimiters are not included in the comment value, so add them
  // back first.
  const lines = `*${rawComment}*`.split("\n");
  return lines.length > 1 && lines.every((line) => line.trim()[0] === "*");
}

function printIndentableBlockCommentContent(rawComment: string): Doc {
  const lines = rawComment.split("\n");

  return [
    join(
      hardline,
      lines.map((line, index) =>
        index === 0
          ? line.trimEnd()
          : " " + (index < lines.length - 1 ? line.trim() : line.trimStart()),
      ),
    ),
  ];
}

/** Print a doc comment. */
function printDoc(
  path: AstPath<DocNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const rawComment = options.originalText.slice(node.pos + 3, node.end - 2);

  const printed = isIndentableBlockComment(rawComment)
    ? printIndentableBlockCommentContent(rawComment)
    : rawComment.includes("\n")
      ? rawComment
      : ` ${rawComment.trim()} `;
  return ["/**", printed, "*/"];
}

export function printDecorators(
  path: AstPath<DecorableNode>,
  options: object,
  print: PrettierChildPrint,
  { tryInline }: { tryInline: boolean },
): { decorators: Doc; multiline: boolean } {
  const node = path.node;
  if (node.decorators.length === 0) {
    return { decorators: "", multiline: false };
  }

  const shouldBreak = shouldDecoratorBreakLine(path, options, { tryInline });
  const decorators = path.map((x) => [print(x as any), ifBreak(line, " ")], "decorators");

  return {
    decorators: group([shouldBreak ? breakParent : "", decorators]),
    multiline: shouldBreak,
  };
}

/** Check if the decorators of the given node should be broken in sparate line */
function shouldDecoratorBreakLine(
  path: AstPath<DecorableNode>,
  options: object,
  { tryInline }: { tryInline: boolean },
) {
  const node = path.node;

  return (
    !tryInline || node.decorators.length >= 3 || hasNewlineBetweenOrAfterDecorators(node, options)
  );
}

/**
 * Check if there is already new lines in between the decorators of the node.
 */
function hasNewlineBetweenOrAfterDecorators(node: DecorableNode, options: any) {
  return node.decorators.some((decorator) => util.hasNewline(options.originalText, decorator.end));
}

export function printDecorator(
  path: AstPath<DecoratorExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const args = printDecoratorArgs(path, options, print);
  return ["@", path.call(print, "target"), args];
}

export function printAugmentDecorator(
  path: AstPath<AugmentDecoratorStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const args = printAugmentDecoratorArgs(path, options, print);
  return ["@@", path.call(print, "target"), args, ";"];
}

function printAugmentDecoratorArgs(
  path: AstPath<AugmentDecoratorStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return [
    "(",
    group([
      indent(
        join(", ", [
          path.call(print, "targetType"),
          ...path.map((arg) => [softline, print(arg)], "arguments"),
        ]),
      ),
      softline,
    ]),
    ")",
  ];
}

export function printDocComments(path: AstPath<Node>, options: object, print: PrettierChildPrint) {
  const node = path.node;
  if (node.docs === undefined || node.docs.length === 0) {
    return "";
  }

  const docs = path.map((x) => [print(x as any), line], "docs");
  return group([...docs, breakParent]);
}

export function printDirectives(path: AstPath<Node>, options: object, print: PrettierChildPrint) {
  const node = path.node;
  if (node.directives === undefined || node.directives.length === 0) {
    return "";
  }

  const directives = path.map((x) => [print(x as any), line], "directives");

  return group([...directives, breakParent]);
}

export function printDirective(
  path: AstPath<DirectiveExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const args = printDirectiveArgs(path, options, print);
  return ["#", path.call(print, "target"), " ", args];
}

function printDecoratorArgs(
  path: AstPath<DecoratorExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  if (node.arguments.length === 0) {
    return "";
  }

  return printCallLikeArgs(path, options, print);
}

function printCallLikeArgs(
  path: AstPath<DecoratorExpressionNode | CallExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;

  // So that decorator with single object arguments have ( and { hugging.
  // @deco(#{
  //   value: "foo"
  // })
  const shouldHug =
    node.arguments.length === 1 &&
    (node.arguments[0].kind === SyntaxKind.ModelExpression ||
      node.arguments[0].kind === SyntaxKind.ObjectLiteral ||
      node.arguments[0].kind === SyntaxKind.ArrayLiteral ||
      node.arguments[0].kind === SyntaxKind.StringLiteral ||
      node.arguments[0].kind === SyntaxKind.StringTemplateExpression);

  if (shouldHug) {
    return [
      "(",
      join(
        ", ",
        path.map((arg) => [print(arg)], "arguments"),
      ),
      ")",
    ];
  }

  return [
    "(",
    group([
      indent(
        join(
          ", ",
          path.map((arg) => [softline, print(arg)], "arguments"),
        ),
      ),
      softline,
    ]),
    ")",
  ];
}

export function printDirectiveArgs(
  path: AstPath<DirectiveExpressionNode>,
  options: object,
  print: PrettierChildPrint,
) {
  const node = path.node;

  if (node.arguments.length === 0) {
    return "";
  }

  return join(
    " ",
    path.map((arg) => [print(arg)], "arguments"),
  );
}

export function printEnumStatement(
  path: AstPath<EnumStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  const id = path.call(print, "id");
  return [decorators, "enum ", id, " ", printEnumBlock(path, options, print)];
}

function printEnumBlock(
  path: AstPath<EnumStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  if (node.members.length === 0) {
    return "{}";
  }

  const body = joinMembersInBlock(path, "members", options, print, ",", hardline);
  return group(["{", indent(body), hardline, "}"]);
}

export function printEnumMember(
  path: AstPath<EnumMemberNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const id = path.call(print, "id");
  const value = node.value ? [": ", path.call(print, "value")] : "";
  const { decorators } = printDecorators(path, options, print, {
    tryInline: DecoratorsTryInline.enumMember,
  });
  return [decorators, id, value];
}

function printEnumSpreadMember(
  path: AstPath<EnumSpreadMemberNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  return ["...", path.call(print, "target")];
}

export function printUnionStatement(
  path: AstPath<UnionStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const id = path.call(print, "id");
  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  const generic = printTemplateParameters(path, options, print, "templateParameters");
  return [decorators, "union ", id, generic, " ", printUnionVariantsBlock(path, options, print)];
}

export function printUnionVariantsBlock(
  path: AstPath<UnionStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  if (node.options.length === 0) {
    return "{}";
  }

  const body = joinMembersInBlock(path, "options", options, print, ",", hardline);
  return group(["{", indent(body), hardline, "}"]);
}

export function printUnionVariant(
  path: AstPath<UnionVariantNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const id = path.node.id === undefined ? "" : [path.call(print, "id"), ": "];
  const { decorators } = printDecorators(path, options, print, {
    tryInline: DecoratorsTryInline.unionVariant,
  });
  return [decorators, id, path.call(print, "value")];
}

export function printInterfaceStatement(
  path: AstPath<InterfaceStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const id = path.call(print, "id");
  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  const generic = printTemplateParameters(path, options, print, "templateParameters");
  const extendList = printInterfaceExtends(path, options, print);

  return [
    decorators,
    "interface ",
    id,
    generic,
    extendList,
    " ",
    printInterfaceMembers(path, options, print),
  ];
}

function printInterfaceExtends(
  path: AstPath<InterfaceStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  if (node.extends.length === 0) {
    return "";
  }

  const keyword = "extends ";
  return [group(indent([line, keyword, indent(join([",", line], path.map(print, "extends")))]))];
}

export function printInterfaceMembers(
  path: AstPath<InterfaceStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const hasOperations = node.operations.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasOperations && !nodeHasComments) {
    return "{}";
  }

  const lastOperation = node.operations[node.operations.length - 1];

  const parts: Doc[] = [];
  path.each((operationPath) => {
    const node = operationPath.node as any as OperationStatementNode;

    const printed = print(operationPath);
    parts.push(printed);

    if (node !== lastOperation) {
      parts.push(hardline);

      if (isNextLineEmpty(options.originalText, node, options.locEnd)) {
        parts.push(hardline);
      }
    }
  }, "operations");

  const body: Doc[] = [hardline, parts];

  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["{", indent(body), hardline, "}"]);
}

function printDanglingComments(
  path: AstPath<any>,
  options: TypeSpecPrettierOptions,
  { sameIndent }: { sameIndent: boolean },
) {
  const node = path.node;
  const parts: Doc[] = [];
  if (!node || !node.comments) {
    return "";
  }
  path.each((commentPath) => {
    const comment: any = commentPath.node;
    if (!comment.leading && !comment.trailing) {
      parts.push(printComment(path, options));
    }
  }, "comments");

  if (parts.length === 0) {
    return "";
  }

  if (sameIndent) {
    return join(hardline, parts);
  }
  return indent([hardline, join(hardline, parts)]);
}

/**
 * Handle printing an intersection node.
 * @example `Foo & Bar` or `{foo: string} & {bar: string}`
 *
 * @param path Prettier AST Path.
 * @param options Prettier options
 * @param print Prettier child print callback.
 * @returns Prettier document.
 */
export function printIntersection(
  path: AstPath<IntersectionExpressionNode>,
  options: object,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const types = path.map(print, "options");
  const result: (Doc | string)[] = [];
  let wasIndented = false;
  for (let i = 0; i < types.length; ++i) {
    if (i === 0) {
      result.push(types[i]);
    } else if (isModelNode(node.options[i - 1]) && isModelNode(node.options[i])) {
      // If both are objects, don't indent
      result.push([" & ", wasIndented ? indent(types[i]) : types[i]]);
    } else if (!isModelNode(node.options[i - 1]) && !isModelNode(node.options[i])) {
      // If no object is involved, go to the next line if it breaks
      result.push(indent([" &", line, types[i]]));
    } else {
      // If you go from object to non-object or vis-versa, then inline it
      if (i > 1) {
        wasIndented = true;
      }
      result.push(" & ", i > 1 ? indent(types[i]) : types[i]);
    }
  }
  return group(result);
}

function isModelNode(node: Node) {
  return node.kind === SyntaxKind.ModelExpression;
}

export function printArray(
  path: AstPath<ArrayExpressionNode>,
  options: object,
  print: PrettierChildPrint,
): Doc {
  return [path.call(print, "elementType"), "[]"];
}

export function printTuple(
  path: AstPath<TupleExpressionNode | ProjectionTupleExpressionNode>,
  options: object,
  print: PrettierChildPrint,
): Doc {
  return group([
    "[",
    indent(
      join(
        ", ",
        path.map((arg) => [softline, print(arg)], "values"),
      ),
    ),
    softline,
    "]",
  ]);
}

export function printMemberExpression(
  path: AstPath<MemberExpressionNode>,
  options: object,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;

  return [node.base ? [path.call(print, "base"), node.selector] : "", path.call(print, "id")];
}

export function printModelExpression(
  path: AstPath<ModelExpressionNode | ProjectionModelExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const inBlock = isModelExpressionInBlock(path);
  const node = path.node;
  if (inBlock) {
    return group(printModelPropertiesBlock(path, options, print));
  } else {
    const properties =
      node.properties.length === 0
        ? ""
        : indent(
            joinMembersInBlock(path, "properties", options, print, ifBreak(",", ", "), softline),
          );
    return group([properties, softline]);
  }
}

export function printObjectLiteral(
  path: AstPath<ObjectLiteralNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const hasProperties = node.properties && node.properties.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasProperties && !nodeHasComments) {
    return "#{}";
  }
  const lineDoc = softline;
  const body: Doc[] = [
    joinMembersInBlock(path, "properties", options, print, ifBreak(",", ", "), softline),
  ];
  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["#{", ifBreak("", " "), indent(body), lineDoc, ifBreak("", " "), "}"]);
}

export function printObjectLiteralProperty(
  path: AstPath<ObjectLiteralPropertyNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const id = printIdentifier(node.id, options);
  return [printDirectives(path, options, print), id, ": ", path.call(print, "value")];
}

export function printObjectLiteralSpreadProperty(
  path: AstPath<ObjectLiteralSpreadPropertyNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return [printDirectives(path, options, print), "...", path.call(print, "target")];
}

export function printArrayLiteral(
  path: AstPath<ArrayLiteralNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return group([
    "#[",
    indent(
      join(
        ", ",
        path.map((arg) => [softline, print(arg)], "values"),
      ),
    ),
    softline,
    "]",
  ]);
}

export function printModelStatement(
  path: AstPath<ModelStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const id = path.call(print, "id");
  const heritage = node.extends
    ? [ifBreak(line, " "), "extends ", path.call(print, "extends")]
    : "";
  const isBase = node.is ? [ifBreak(line, " "), "is ", path.call(print, "is")] : "";
  const generic = printTemplateParameters(path, options, print, "templateParameters");
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  const shouldPrintBody = nodeHasComments || !(node.properties.length === 0 && node.is);
  const body = shouldPrintBody ? [" ", printModelPropertiesBlock(path, options, print)] : ";";
  return [
    printDecorators(path, options, print, { tryInline: false }).decorators,
    "model ",
    id,
    generic,
    group(indent(["", heritage, isBase])),
    body,
  ];
}

function printModelPropertiesBlock(
  path: AstPath<
    Node & {
      properties?: readonly (
        | ModelPropertyNode
        | ModelSpreadPropertyNode
        | ProjectionModelPropertyNode
        | ProjectionModelSpreadPropertyNode
      )[];
    }
  >,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const hasProperties = node.properties && node.properties.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasProperties && !nodeHasComments) {
    return "{}";
  }
  const tryInline = path.getParentNode()?.kind === SyntaxKind.TemplateParameterDeclaration;
  const lineDoc = tryInline ? softline : hardline;
  const seperator = isModelAValue(path) ? "," : ";";

  const body = [joinMembersInBlock(path, "properties", options, print, seperator, lineDoc)];
  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["{", indent(body), lineDoc, "}"]);
}

/**
 * Join members nodes that are in a block by adding extra new lines when needed.(e.g. when there are decorators or doc comments )
 * @param path Prettier AST Path.
 * @param options Prettier options
 * @param print Prettier print callback
 * @param separator Separator
 * @param regularLine What line to use when we should split lines
 * @returns
 */
function joinMembersInBlock<T extends Node>(
  path: AstPath<T>,
  member: keyof T,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
  separator: Doc,
  regularLine: Doc = hardline,
): Doc {
  const doc: Doc[] = [regularLine];
  const propertyContainerNode = path.node;

  let newLineBeforeNextProp = false;
  path.each((item, propertyIndex) => {
    const isFirst = propertyIndex === 0;
    const isLast = propertyIndex === (propertyContainerNode[member] as any).length - 1;
    const shouldWrapInNewLines = shouldWrapMemberInNewLines(item as any, options);

    if ((newLineBeforeNextProp || shouldWrapInNewLines) && !isFirst) {
      doc.push(hardline);
      newLineBeforeNextProp = false;
    }
    doc.push(print(item));
    if (isLast) {
      doc.push(ifBreak(separator));
    } else {
      doc.push(separator);
      doc.push(regularLine);
      if (shouldWrapInNewLines) {
        newLineBeforeNextProp = true;
      }
    }
  }, member as any);
  return doc;
}

/**
 * Check if property item (PropertyNode, SpreadProperty) should be wrapped in new lines.
 * It can be wrapped for the following reasons:
 * - has decorators on lines above
 * - has leading comments
 */
function shouldWrapMemberInNewLines(
  path: AstPath<
    | ModelPropertyNode
    | ModelSpreadPropertyNode
    | EnumMemberNode
    | EnumSpreadMemberNode
    | ScalarConstructorNode
    | UnionVariantNode
    | ProjectionModelPropertyNode
    | ProjectionModelSpreadPropertyNode
    | ObjectLiteralPropertyNode
    | ObjectLiteralSpreadPropertyNode
  >,
  options: any,
): boolean {
  const node = path.node;
  return (
    (node.kind !== SyntaxKind.ModelSpreadProperty &&
      node.kind !== SyntaxKind.ProjectionModelSpreadProperty &&
      node.kind !== SyntaxKind.EnumSpreadMember &&
      node.kind !== SyntaxKind.ScalarConstructor &&
      node.kind !== SyntaxKind.ObjectLiteralProperty &&
      node.kind !== SyntaxKind.ObjectLiteralSpreadProperty &&
      shouldDecoratorBreakLine(path as any, options, {
        tryInline: DecoratorsTryInline.modelProperty,
      })) ||
    hasComments(node, CommentCheckFlags.Leading) ||
    (node.docs && node.docs?.length > 0)
  );
}

/**
 * Figure out if this model is being used as a definition or value.
 * @returns true if the model is used as a value(e.g. decorator value), false if it is used as a model definition.
 */
function isModelAValue(path: AstPath<Node>): boolean {
  let count = 0;
  let node: Node | null = path.node;
  do {
    switch (node.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.AliasStatement:
      case SyntaxKind.OperationStatement:
        return false;
      case SyntaxKind.DecoratorExpression:
        return true;
    }
  } while ((node = path.getParentNode(count++)));
  return true;
}

export function printModelProperty(
  path: AstPath<ModelPropertyNode | ProjectionModelPropertyNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const { decorators } = printDecorators(path as AstPath<DecorableNode>, options, print, {
    tryInline: DecoratorsTryInline.modelProperty,
  });
  const id = printIdentifier(node.id, options);
  return [
    printDirectives(path, options, print),
    decorators,
    id,
    node.optional ? "?: " : ": ",
    path.call(print, "value"),
    node.default ? [" = ", path.call(print, "default")] : "",
  ];
}

function printIdentifier(id: IdentifierNode, options: TypeSpecPrettierOptions) {
  return printIdentifierString(id.sv);
}

function isModelExpressionInBlock(
  path: AstPath<ModelExpressionNode | ProjectionModelExpressionNode>,
) {
  const parent: Node | null = path.getParentNode() as any;

  switch (parent?.kind) {
    case SyntaxKind.OperationSignatureDeclaration:
      return parent.parameters !== path.getNode();
    default:
      return true;
  }
}

function printScalarStatement(
  path: AstPath<ScalarStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const id = path.call(print, "id");
  const template = printTemplateParameters(path, options, print, "templateParameters");

  const heritage = node.extends
    ? [ifBreak(line, " "), "extends ", path.call(print, "extends")]
    : "";
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  const shouldPrintBody = nodeHasComments || !(node.members.length === 0);

  const members = shouldPrintBody ? [" ", printScalarBody(path, options, print)] : ";";
  return [
    printDecorators(path, options, print, { tryInline: false }).decorators,
    "scalar ",
    id,
    template,
    group(indent(["", heritage])),
    members,
  ];
}

function printScalarBody(
  path: AstPath<ScalarStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const hasProperties = node.members && node.members.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasProperties && !nodeHasComments) {
    return "{}";
  }
  const body = [joinMembersInBlock(path, "members", options, print, ";", hardline)];
  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["{", indent(body), hardline, "}"]);
}

function printScalarConstructor(
  path: AstPath<ScalarConstructorNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const id = path.call(print, "id");
  const parameters = [
    group([
      indent(
        join(
          ", ",
          path.map((arg) => [softline, print(arg)], "parameters"),
        ),
      ),
      softline,
    ]),
  ];
  return ["init ", id, "(", parameters, ")"];
}

export function printNamespaceStatement(
  path: AstPath<FlattenedNamespaceStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const names = path.map(print, "ids");
  const currentNode = path.getNode();

  const suffix =
    currentNode?.statements === undefined
      ? ";"
      : [
          " {",
          indent([hardline, printStatementSequence(path, options, print, "statements")]),
          hardline,
          "}",
        ];

  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  return [decorators, `namespace `, join(".", names), suffix];
}

export function printOperationSignatureDeclaration(
  path: AstPath<OperationSignatureDeclarationNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return ["(", path.call(print, "parameters"), "): ", path.call(print, "returnType")];
}

export function printOperationSignatureReference(
  path: AstPath<OperationSignatureReferenceNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return [" is ", path.call(print, "baseOperation")];
}

export function printOperationStatement(
  path: AstPath<OperationStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const inInterface = (path.getParentNode()?.kind as any) === SyntaxKind.InterfaceStatement;
  const templateParams = printTemplateParameters(path, options, print, "templateParameters");
  const { decorators } = printDecorators(path as AstPath<DecorableNode>, options, print, {
    tryInline: true,
  });

  return [
    decorators,
    inInterface ? "" : "op ",
    path.call(print, "id"),
    templateParams,
    path.call(print, "signature"),
    `;`,
  ];
}

export function printStatementSequence<T extends Node>(
  path: AstPath<T>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
  property: keyof T,
) {
  const node = path.node;
  const parts: Doc[] = [];
  const lastStatement = getLastStatement(node[property] as any as Statement[]);

  path.each((statementPath) => {
    const node = path.node;

    if (node.kind === SyntaxKind.EmptyStatement) {
      return;
    }

    const printed = print(statementPath);
    parts.push(printed);

    if (node !== lastStatement) {
      parts.push(hardline);

      if (isNextLineEmpty(options.originalText, node, options.locEnd)) {
        parts.push(hardline);
      }
    }
  }, property as any);

  return parts;
}

function getLastStatement(statements: Statement[]): Statement | undefined {
  for (let i = statements.length - 1; i >= 0; i--) {
    const statement = statements[i];
    if (statement.kind !== SyntaxKind.EmptyStatement) {
      return statement;
    }
  }
  return undefined;
}

export function printUnion(
  path: AstPath<UnionExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const shouldHug = shouldHugType(node);

  const types = path.map((typePath) => {
    let printedType: string | Doc = print(typePath);
    if (!shouldHug) {
      printedType = align(2, printedType);
    }
    return printedType;
  }, "options");

  if (shouldHug) {
    return join(" | ", types);
  }

  const shouldAddStartLine = true;
  const code = [ifBreak([shouldAddStartLine ? line : "", "| "], ""), join([line, "| "], types)];
  return group(indent(code));
}

function shouldHugType(node: Node) {
  if (node.kind === SyntaxKind.UnionExpression || node.kind === SyntaxKind.IntersectionExpression) {
    return node.options.length < 4;
  }
  return false;
}

export function printTypeReference(
  path: AstPath<TypeReferenceNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const type = path.call(print, "target");
  const template = printTemplateParameters(path, options, print, "arguments");
  return [type, template];
}

export function printTemplateArgument(
  path: AstPath<TemplateArgumentNode>,
  _options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  if (path.node.name !== undefined) {
    const name = path.call(print, "name");
    const argument = path.call(print, "argument");

    return group([name, " = ", argument]);
  } else {
    return path.call(print, "argument");
  }
}

export function printValueOfExpression(
  path: AstPath<ValueOfExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const type = path.call(print, "target");
  return ["valueof ", type];
}
export function printTypeOfExpression(
  path: AstPath<TypeOfExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const type = path.call(print, "target");
  return ["typeof ", type];
}

function printTemplateParameterDeclaration(
  path: AstPath<TemplateParameterDeclarationNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  return [
    path.call(print, "id"),
    node.constraint ? [" extends ", path.call(print, "constraint")] : "",
    node.default ? [" = ", path.call(print, "default")] : "",
  ];
}

function printModelSpread(
  path: AstPath<ModelSpreadPropertyNode | ProjectionModelSpreadPropertyNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  return ["...", path.call(print, "target")];
}

function printDecoratorDeclarationStatement(
  path: AstPath<DecoratorDeclarationStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const id = path.call(print, "id");
  const parameters = [
    group([
      indent(
        join(", ", [
          [softline, path.call(print, "target")],
          ...path.map((arg) => [softline, print(arg)], "parameters"),
        ]),
      ),
      softline,
    ]),
  ];
  return [printModifiers(path, options, print), "dec ", id, "(", parameters, ")", ";"];
}

function printFunctionDeclarationStatement(
  path: AstPath<FunctionDeclarationStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  const id = path.call(print, "id");
  const parameters = [
    group([
      indent(
        join(
          ", ",
          path.map((arg) => [softline, print(arg)], "parameters"),
        ),
      ),
      softline,
    ]),
  ];
  const returnType = node.returnType ? [": ", path.call(print, "returnType")] : "";
  return [printModifiers(path, options, print), "fn ", id, "(", parameters, ")", returnType, ";"];
}

function printFunctionParameterDeclaration(
  path: AstPath<FunctionParameterNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  const id = path.call(print, "id");

  const type = node.type ? [": ", path.call(print, "type")] : "";

  return [
    node.rest ? "..." : "",
    printDirectives(path, options, print),
    id,
    node.optional ? "?" : "",
    type,
  ];
}

export function printModifiers(
  path: AstPath<DecoratorDeclarationStatementNode | FunctionDeclarationStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
): Doc {
  const node = path.node;
  if (node.modifiers.length === 0) {
    return "";
  }

  return path.map((x) => [print(x as any), " "], "modifiers");
}

function printStringLiteral(
  path: AstPath<StringLiteralNode>,
  options: TypeSpecPrettierOptions,
): Doc {
  const node = path.node;
  const multiline = isMultiline(node, options);

  const raw = getRawText(node, options);
  if (multiline) {
    const lines = splitLines(raw.slice(3));
    const whitespaceIndent = lines[lines.length - 1].length - 3;
    const newLines = trimMultilineString(lines, whitespaceIndent);
    return [`"""`, indent(markAsRoot(newLines))];
  } else {
    return raw;
  }
}

function isMultiline(
  node: StringLiteralNode | StringTemplateExpressionNode,
  options: TypeSpecPrettierOptions,
) {
  return (
    options.originalText[node.pos] &&
    options.originalText[node.pos + 1] === `"` &&
    options.originalText[node.pos + 2] === `"`
  );
}

function printNumberLiteral(
  path: AstPath<NumericLiteralNode>,
  options: TypeSpecPrettierOptions,
): Doc {
  const node = path.node;
  return getRawText(node, options);
}

function printBooleanLiteral(
  path: AstPath<BooleanLiteralNode>,
  options: TypeSpecPrettierOptions,
): Doc {
  const node = path.node;
  return node.value ? "true" : "false";
}

function printProjectionStatement(
  path: AstPath<ProjectionStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const selector = path.call(print, "selector");
  const id = path.call(print, "id");
  const projections = path.map(print, "projections").flatMap((x) => [hardline, x]);
  return [
    "projection ",
    selector,
    "#",
    id,
    " {",
    indent(projections),
    projections.length > 0 ? hardline : "",
    "}",
  ];
}

function printProjection(
  path: AstPath<ProjectionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const params = printProjectionParameters(path, options, print);
  const body = printProjectionExpressionStatements(path, options, print, "body");
  return [
    ...node.modifierIds.flatMap((i) => [i.sv, " "]),
    node.directionId.sv,
    params,
    " {",
    indent(body),
    hardline,
    "}",
  ];
}

function printProjectionParameters(
  path: AstPath<ProjectionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const params = node.parameters;
  if ((params as any).length === 0) {
    return "";
  }

  const shouldHug = (params as any).length === 1;
  if (shouldHug) {
    return ["(", printItemList(path, options, print, "parameters"), ")"];
  } else {
    const body = indent([softline, join([", ", softline], path.map(print, "parameters"))]);
    return group(["(", body, softline, ")"]);
  }
}

function printProjectionExpressionStatements<T extends Node>(
  path: AstPath<T>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
  key: keyof T,
) {
  const parts: Doc[] = [hardline];
  const lastIndex = (path.node[key] as any).length - 1;
  path.each((statementPath, index) => {
    const node = path.node;

    if (node.kind === SyntaxKind.EmptyStatement) {
      return;
    }

    const printed = print(statementPath);
    parts.push(printed);
    parts.push(";");
    if (index < lastIndex) {
      parts.push(hardline);

      if (isNextLineEmpty(options.originalText, node, options.locEnd)) {
        parts.push(hardline);
      }
    }
  }, key as any);
  return parts;
}

function printProjectionParameterDeclaration(
  path: AstPath<ProjectionParameterDeclarationNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return path.call(print, "id");
}

function printProjectionExpressionStatement(
  path: AstPath<ProjectionExpressionStatementNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return path.call(print, "expr");
}
function printProjectionIfExpressionNode(
  path: AstPath<ProjectionIfExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const test = path.call(print, "test");
  const consequent = path.call(print, "consequent");
  const alternate = node.alternate ? [" else ", path.call(print, "alternate")] : "";
  return ["if ", test, " ", consequent, alternate];
}

export function printProjectionBlockExpressionNode(
  path: AstPath<ProjectionBlockExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  if (node.statements.length === 0) {
    return "{}";
  }
  return [
    "{",
    indent(printProjectionExpressionStatements(path, options, print, "statements")),
    hardline,
    "}",
  ];
}

export function printProjectionMemberExpression(
  path: AstPath<ProjectionMemberExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  return [path.call(print, "base"), node.selector, path.call(print, "id")];
}

export function printProjectionLeftRightExpression(
  path: AstPath<
    | ProjectionLogicalExpressionNode
    | ProjectionRelationalExpressionNode
    | ProjectionEqualityExpressionNode
    | ProjectionArithmeticExpressionNode
  >,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  return [path.call(print, "left"), " ", node.op, " ", path.call(print, "right")];
}

export function printProjectionUnaryExpression(
  path: AstPath<ProjectionUnaryExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return ["!", path.call(print, "target")];
}

export function printProjectionCallExpression(
  path: AstPath<ProjectionCallExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const target = path.call(print, "target");
  const params = printItemList(path, options, print, "arguments");

  if (node.callKind === "method") {
    return [target, "(", params, ")"];
  } else {
    return [target, "<", params, ">"];
  }
}

export function printProjectionLambdaExpression(
  path: AstPath<ProjectionLambdaExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return [
    "(",
    printItemList(path, options, print, "parameters"),
    ")",
    " => ",
    path.call(print, "body"),
  ];
}

export function printProjectionLambdaParameterDeclaration(
  path: AstPath<ProjectionLambdaParameterDeclarationNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return path.call(print, "id");
}

export function printReturnExpression(
  path: AstPath<ReturnExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  return ["return ", path.call(print, "value")];
}

export function printStringTemplateExpression(
  path: AstPath<StringTemplateExpressionNode>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
) {
  const node = path.node;
  const multiline = isMultiline(node, options);
  const rawHead = getRawText(node.head, options);
  if (multiline) {
    const lastSpan = node.spans[node.spans.length - 1];
    const lastLines = splitLines(getRawText(lastSpan.literal, options));
    const whitespaceIndent = lastLines[lastLines.length - 1].length - 3;
    const content = [
      trimMultilineString(splitLines(rawHead.slice(3)), whitespaceIndent),
      path.map((span: AstPath<StringTemplateSpanNode>) => {
        const expression = span.call(print, "expression");
        const spanRawText = getRawText(span.node.literal, options);
        const spanLines = splitLines(spanRawText);
        return [
          expression,
          spanLines[0],
          literalline,
          trimMultilineString(spanLines.slice(1), whitespaceIndent),
        ];
      }, "spans"),
    ];

    return [`"""`, indent(markAsRoot([content]))];
  } else {
    const content = [
      rawHead,
      path.map((span: AstPath<StringTemplateSpanNode>) => {
        const expression = span.call(print, "expression");
        return [expression, getRawText(span.node.literal, options)];
      }, "spans"),
    ];
    return content;
  }
}

function splitLines(text: string): string[] {
  const lines = [];
  let start = 0;
  let pos = 0;

  while (pos < text.length) {
    const ch = text.charCodeAt(pos);
    switch (ch) {
      case CharCode.CarriageReturn:
        if (text.charCodeAt(pos + 1) === CharCode.LineFeed) {
          lines.push(text.slice(start, pos));
          start = pos;
          pos++;
        } else {
          lines.push(text.slice(start, pos));
          start = pos;
        }
        break;
      case CharCode.LineFeed:
        lines.push(text.slice(start, pos));
        start = pos;
        break;
    }
    pos++;
  }

  lines.push(text.slice(start));
  return lines;
}

function trimMultilineString(lines: string[], whitespaceIndent: number): Doc[] {
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i].slice(whitespaceIndent));
    if (i < lines.length - 1) {
      newLines.push(literalline);
    }
  }
  return newLines;
}

function printItemList<T extends Node>(
  path: AstPath<T>,
  options: TypeSpecPrettierOptions,
  print: PrettierChildPrint,
  key: keyof T,
) {
  return join(", ", path.map(print, key as any));
}

/**
 * @param node Node that has postition information.
 * @param options Prettier options
 * @returns Raw text in the file for the given node.
 */
function getRawText(node: TextRange, options: TypeSpecPrettierOptions) {
  return options.originalText.slice(node.pos, node.end);
}

function hasComments(node: any, flags?: CommentCheckFlags) {
  if (!node.comments || node.comments.length === 0) {
    return false;
  }
  const test = getCommentTestFunction(flags);
  return test ? node.comments.some(test) : true;
}

enum CommentCheckFlags {
  /** Check comment is a leading comment */
  Leading = 1 << 1,
  /** Check comment is a trailing comment */
  Trailing = 1 << 2,
  /** Check comment is a dangling comment */
  Dangling = 1 << 3,
  /** Check comment is a block comment */
  Block = 1 << 4,
  /** Check comment is a line comment */
  Line = 1 << 5,
  /** Check comment is a `prettier-ignore` comment */
  PrettierIgnore = 1 << 6,
  /** Check comment is the first attached comment */
  First = 1 << 7,
  /** Check comment is the last attached comment */
  Last = 1 << 8,
}

type CommentTestFn = (comment: any, index: number, comments: any[]) => boolean;

function getCommentTestFunction(flags: CommentCheckFlags | undefined): CommentTestFn | undefined {
  if (flags) {
    return (comment: any, index: number, comments: any[]) =>
      !(
        (flags & CommentCheckFlags.Leading && !comment.leading) ||
        (flags & CommentCheckFlags.Trailing && !comment.trailing) ||
        (flags & CommentCheckFlags.Dangling && (comment.leading || comment.trailing)) ||
        (flags & CommentCheckFlags.Block && !isBlockComment(comment)) ||
        (flags & CommentCheckFlags.Line && !isLineComment(comment)) ||
        (flags & CommentCheckFlags.First && index !== 0) ||
        (flags & CommentCheckFlags.Last && index !== comments.length - 1)
      );
  }
  return undefined;
}

function isBlockComment(comment: Comment): comment is BlockComment {
  return comment.kind === SyntaxKind.BlockComment;
}

function isLineComment(comment: Comment): comment is LineComment {
  return comment.kind === SyntaxKind.BlockComment;
}
