import prettier, { AstPath, Doc, Printer } from "prettier";
import { isIdentifierContinue, isIdentifierStart } from "../../core/charcode.js";
import { compilerAssert } from "../../core/diagnostics.js";
import { Keywords } from "../../core/scanner.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  AugmentDecoratorStatementNode,
  BlockComment,
  BooleanLiteralNode,
  CadlScriptNode,
  Comment,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  DirectiveExpressionNode,
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
  NamespaceStatementNode,
  Node,
  NodeFlags,
  NumericLiteralNode,
  OperationSignatureDeclarationNode,
  OperationSignatureReferenceNode,
  OperationStatementNode,
  ProjectionArithmeticExpressionNode,
  ProjectionBlockExpressionNode,
  ProjectionCallExpressionNode,
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
  ScalarStatementNode,
  Statement,
  StringLiteralNode,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TextRange,
  TupleExpressionNode,
  TypeReferenceNode,
  UnionExpressionNode,
  UnionStatementNode,
  UnionVariantNode,
} from "../../core/types.js";
import { isArray } from "../../core/util.js";
import { commentHandler } from "./comment-handler.js";
import { needsParens } from "./needs-parens.js";
import { CadlPrettierOptions, DecorableNode, PrettierChildPrint } from "./types.js";

const { align, breakParent, group, hardline, ifBreak, indent, join, line, softline } =
  prettier.doc.builders;

const { isNextLineEmpty } = prettier.util;

export const cadlPrinter: Printer<Node> = {
  print: printCadl,
  canAttachComment: canAttachComment,
  printComment: printComment,
  handleComments: commentHandler,
};

export function printCadl(
  // Path to the AST node to print
  path: AstPath<Node>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node = path.getValue();
  const directives = shouldPrintDirective(node) ? printDirectives(path, options, print) : "";
  const printedNode = printNode(path, options, print);
  const value = needsParens(path, options) ? ["(", printedNode, ")"] : printedNode;
  const parts: Doc[] = [directives, value];
  if (node.kind === SyntaxKind.CadlScript) {
    // For CadlScript(root of cadl document) we had a new line at the end.
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node: Node = path.getValue();
  printDirectives(path, options, print);
  switch (node.kind) {
    // Root
    case SyntaxKind.CadlScript:
      return [
        printStatementSequence(path as AstPath<CadlScriptNode>, options, print, "statements"),
      ];

    // Statements
    case SyntaxKind.ImportStatement:
      return [`import "${node.path.value}";`];
    case SyntaxKind.UsingStatement:
      return [`using `, path.call(print, "name"), `;`];
    case SyntaxKind.OperationStatement:
      return printOperationStatement(path as AstPath<OperationStatementNode>, options, print);
    case SyntaxKind.OperationSignatureDeclaration:
      return printOperationSignatureDeclaration(
        path as AstPath<OperationSignatureDeclarationNode>,
        options,
        print
      );
    case SyntaxKind.OperationSignatureReference:
      return printOperationSignatureReference(
        path as AstPath<OperationSignatureReferenceNode>,
        options,
        print
      );
    case SyntaxKind.NamespaceStatement:
      return printNamespaceStatement(path as AstPath<NamespaceStatementNode>, options, print);
    case SyntaxKind.ModelStatement:
      return printModelStatement(path as AstPath<ModelStatementNode>, options, print);
    case SyntaxKind.ScalarStatement:
      return printScalarStatement(path as AstPath<ScalarStatementNode>, options, print);
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
      return node.sv;
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
    case SyntaxKind.TemplateParameterDeclaration:
      return printTemplateParameterDeclaration(
        path as AstPath<TemplateParameterDeclarationNode>,
        options,
        print
      );
    case SyntaxKind.ModelSpreadProperty:
      return printModelSpread(path as AstPath<ModelSpreadPropertyNode>, options, print);
    case SyntaxKind.DecoratorDeclarationStatement:
      return printDecoratorDeclarationStatement(
        path as AstPath<DecoratorDeclarationStatementNode>,
        options,
        print
      );
    case SyntaxKind.FunctionDeclarationStatement:
      return printFunctionDeclarationStatement(
        path as AstPath<FunctionDeclarationStatementNode>,
        options,
        print
      );
    case SyntaxKind.FunctionParameter:
      return printFunctionParameterDeclaration(
        path as AstPath<FunctionParameterNode>,
        options,
        print
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
    case SyntaxKind.ProjectionOperationSelector:
      return "op";
    case SyntaxKind.ProjectionUnionSelector:
      return "union";
    case SyntaxKind.ProjectionInterfaceSelector:
      return "interface";
    case SyntaxKind.ProjectionEnumSelector:
      return "enum";
    case SyntaxKind.Projection:
      return printProjection(path as AstPath<ProjectionNode>, options, print);
    case SyntaxKind.ProjectionParameterDeclaration:
      return printProjectionParameterDeclaration(
        path as AstPath<ProjectionParameterDeclarationNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionExpressionStatement:
      return printProjectionExpressionStatement(
        path as AstPath<ProjectionExpressionStatementNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionIfExpression:
      return printProjectionIfExpressionNode(
        path as AstPath<ProjectionIfExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionBlockExpression:
      return printProjectionBlockExpressionNode(
        path as AstPath<ProjectionBlockExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionMemberExpression:
      return printProjectionMemberExpression(
        path as AstPath<ProjectionMemberExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionLogicalExpression:
    case SyntaxKind.ProjectionEqualityExpression:
    case SyntaxKind.ProjectionRelationalExpression:
    case SyntaxKind.ProjectionArithmeticExpression:
      return printProjectionLeftRightExpression(
        path as AstPath<ProjectionLogicalExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionUnaryExpression:
      return printProjectionUnaryExpression(
        path as AstPath<ProjectionUnaryExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionCallExpression:
      return printProjectionCallExpression(
        path as AstPath<ProjectionCallExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionLambdaExpression:
      return printProjectionLambdaExpression(
        path as AstPath<ProjectionLambdaExpressionNode>,
        options,
        print
      );
    case SyntaxKind.ProjectionLambdaParameterDeclaration:
      return printProjectionLambdaParameterDeclaration(
        path as AstPath<ProjectionLambdaParameterDeclarationNode>,
        options,
        print
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
      return path.call(print, "target");
    case SyntaxKind.Return:
      return printReturnExpression(path as AstPath<ReturnExpressionNode>, options, print);
    case SyntaxKind.Doc:
    case SyntaxKind.DocText:
    case SyntaxKind.DocParamTag:
    case SyntaxKind.DocTemplateTag:
    case SyntaxKind.DocReturnsTag:
    case SyntaxKind.DocUnknownTag:
      // https://github.com/microsoft/cadl/issues/1319 Tracks pretty-printing doc comments.
      compilerAssert(
        false,
        "Currently, doc comments are only handled as regular comments and we do not opt in to parsing them so we shouldn't reach here."
      );
      return "";
    case SyntaxKind.JsSourceFile:
    case SyntaxKind.EmptyStatement:
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

export function printAliasStatement(
  path: AstPath<AliasStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const id = path.call(print, "id");
  const template = printTemplateParameters(path, options, print, "templateParameters");
  return ["alias ", id, template, " = ", path.call(print, "value"), ";"];
}

function printTemplateParameters<T extends Node>(
  path: AstPath<T>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  propertyName: keyof T
) {
  const node = path.getValue();
  const args = node[propertyName] as any as TemplateParameterDeclarationNode[];
  if ((args as any).length === 0) {
    return "";
  }

  const shouldHug = (args as any).length === 1;
  if (shouldHug) {
    return ["<", join(", ", path.map(print, propertyName)), ">"];
  } else {
    const body = indent([softline, join([", ", softline], path.map(print, propertyName))]);
    return group(["<", body, softline, ">"]);
  }
}

export function canAttachComment(node: Node): boolean {
  const kind = node.kind as SyntaxKind;
  return Boolean(
    kind &&
      kind !== SyntaxKind.LineComment &&
      kind !== SyntaxKind.BlockComment &&
      !(node.flags & NodeFlags.Synthetic)
  );
}

export function printComment(
  commentPath: AstPath<Node | Comment>,
  options: CadlPrettierOptions
): Doc {
  const comment = commentPath.getValue();
  (comment as any).printed = true;

  switch (comment.kind) {
    case SyntaxKind.BlockComment:
      return printBlockComment(commentPath as AstPath<BlockComment>, options);
    case SyntaxKind.LineComment:
      return `${options.originalText.slice(comment.pos, comment.end).trimRight()}`;
    default:
      throw new Error(`Not a comment: ${JSON.stringify(comment)}`);
  }
}

function printBlockComment(commentPath: AstPath<BlockComment>, options: CadlPrettierOptions) {
  const comment = commentPath.getValue();
  const rawComment = options.originalText.slice(comment.pos + 2, comment.end - 2);

  if (isIndentableBlockComment(rawComment)) {
    const printed = printIndentableBlockComment(rawComment);
    return printed;
  }

  return ["/*", rawComment, "*/"];
}

function isIndentableBlockComment(rawComment: string): boolean {
  // If the comment has multiple lines and every line starts with a star
  // we can fix the indentation of each line. The stars in the `/*` and
  // `*/` delimiters are not included in the comment value, so add them
  // back first.
  const lines = `*${rawComment}*`.split("\n");
  return lines.length > 1 && lines.every((line) => line.trim()[0] === "*");
}

function printIndentableBlockComment(rawComment: string): Doc {
  const lines = rawComment.split("\n");

  return [
    "/*",
    join(
      hardline,
      lines.map((line, index) =>
        index === 0
          ? line.trimEnd()
          : " " + (index < lines.length - 1 ? line.trim() : line.trimStart())
      )
    ),
    "*/",
  ];
}

export function printDecorators(
  path: AstPath<DecorableNode>,
  options: object,
  print: PrettierChildPrint,
  { tryInline }: { tryInline: boolean }
): { decorators: prettier.Doc; multiline: boolean } {
  const node = path.getValue();
  if (node.decorators.length === 0) {
    return { decorators: "", multiline: false };
  }

  const shouldBreak =
    !tryInline || node.decorators.length >= 3 || hasNewlineBetweenOrAfterDecorators(node, options);
  const decorators = path.map((x) => [print(x as any), ifBreak(line, " ")], "decorators");

  return {
    decorators: group([shouldBreak ? breakParent : "", decorators]),
    multiline: shouldBreak,
  };
}

/**
 * Check if there is already new lines in between the decorators of the node.
 */
function hasNewlineBetweenOrAfterDecorators(node: DecorableNode, options: any) {
  return node.decorators.some((decorator) =>
    prettier.util.hasNewline(options.originalText, decorator.end)
  );
}

export function printDecorator(
  path: AstPath<DecoratorExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const args = printDecoratorArgs(path, options, print);
  return ["@", path.call(print, "target"), args];
}

export function printAugmentDecorator(
  path: AstPath<AugmentDecoratorStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const args = printAugmentDecoratorArgs(path, options, print);
  return ["@@", path.call(print, "target"), args, ";"];
}

function printAugmentDecoratorArgs(
  path: AstPath<AugmentDecoratorStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return [
    "(",
    group([
      indent(
        join(", ", [
          path.call(print, "targetType"),
          ...path.map((arg) => [softline, print(arg)], "arguments"),
        ])
      ),
      softline,
    ]),
    ")",
  ];
}

export function printDirectives(path: AstPath<Node>, options: object, print: PrettierChildPrint) {
  const node = path.getValue();
  if (node.directives === undefined || node.directives.length === 0) {
    return "";
  }

  const directives = path.map((x) => [print(x as any), line], "directives");

  return group([...directives, breakParent]);
}

export function printDirective(
  path: AstPath<DirectiveExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const args = printDirectiveArgs(path, options, print);
  return ["#", path.call(print, "target"), " ", args];
}

function printDecoratorArgs(
  path: AstPath<DecoratorExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  if (node.arguments.length === 0) {
    return "";
  }

  // So that decorator with single object arguments have ( and { hugging.
  // @deco({
  //   value: "foo"
  // })
  const shouldHug =
    node.arguments.length === 1 &&
    (node.arguments[0].kind === SyntaxKind.ModelExpression ||
      node.arguments[0].kind === SyntaxKind.StringLiteral);

  if (shouldHug) {
    return [
      "(",
      join(
        ", ",
        path.map((arg) => [print(arg)], "arguments")
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
          path.map((arg) => [softline, print(arg)], "arguments")
        )
      ),
      softline,
    ]),
    ")",
  ];
}

export function printDirectiveArgs(
  path: AstPath<DirectiveExpressionNode>,
  options: object,
  print: PrettierChildPrint
) {
  const node = path.getValue();

  if (node.arguments.length === 0) {
    return "";
  }

  return join(
    " ",
    path.map((arg) => [print(arg)], "arguments")
  );
}

export function printEnumStatement(
  path: AstPath<EnumStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  const id = path.call(print, "id");
  return [decorators, "enum ", id, " ", printEnumBlock(path, options, print)];
}

function printEnumBlock(
  path: AstPath<EnumStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  if (node.members.length === 0) {
    return "{}";
  }

  return group([
    "{",
    indent([
      hardline,
      join(
        hardline,
        path.map((x) => [print(x as any), ","], "members")
      ),
    ]),
    hardline,
    "}",
  ]);
}

export function printEnumMember(
  path: AstPath<EnumMemberNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const id = path.call(print, "id");
  const value = node.value ? [": ", path.call(print, "value")] : "";
  const { decorators, multiline } = printDecorators(path, options, print, { tryInline: true });
  const propertyIndex = path.stack[path.stack.length - 2];
  const isNotFirst = typeof propertyIndex === "number" && propertyIndex > 0;
  return [multiline && isNotFirst ? hardline : "", decorators, id, value];
}

function printEnumSpreadMember(
  path: prettier.AstPath<EnumSpreadMemberNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  return ["...", path.call(print, "target")];
}

export function printUnionStatement(
  path: AstPath<UnionStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const id = path.call(print, "id");
  const { decorators } = printDecorators(path, options, print, { tryInline: false });
  const generic = printTemplateParameters(path, options, print, "templateParameters");
  return [decorators, "union ", id, generic, " ", printUnionVariantsBlock(path, options, print)];
}

export function printUnionVariantsBlock(
  path: AstPath<UnionStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  if (node.options.length === 0) {
    return "{}";
  }

  return group([
    "{",
    indent([
      hardline,
      join(
        hardline,
        path.map((x) => [print(x as any), ","], "options")
      ),
    ]),
    hardline,
    "}",
  ]);
}

export function printUnionVariant(
  path: AstPath<UnionVariantNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const id = path.call(print, "id");
  const value = [": ", path.call(print, "value")];
  const { decorators } = printDecorators(path, options, print, { tryInline: true });
  return [decorators, id, value];
}

export function printInterfaceStatement(
  path: AstPath<InterfaceStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node = path.getValue();
  if (node.extends.length === 0) {
    return "";
  }

  const keyword = "extends ";
  return [group(indent([line, keyword, indent(join([",", line], path.map(print, "extends")))]))];
}

export function printInterfaceMembers(
  path: AstPath<InterfaceStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const hasOperations = node.operations.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasOperations && !nodeHasComments) {
    return "{}";
  }

  const lastOperation = node.operations[node.operations.length - 1];

  const parts: prettier.Doc[] = [];
  path.each((operationPath) => {
    const node = operationPath.getValue() as any as OperationStatementNode;

    const printed = print(operationPath);
    parts.push(printed);

    if (node !== lastOperation) {
      parts.push(hardline);

      if (isNextLineEmpty(options.originalText, node, options.locEnd)) {
        parts.push(hardline);
      }
    }
  }, "operations");

  const body: prettier.Doc[] = [hardline, parts];

  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["{", indent(body), hardline, "}"]);
}

function printDanglingComments(
  path: AstPath<any>,
  options: CadlPrettierOptions,
  { sameIndent }: { sameIndent: boolean }
) {
  const node = path.getValue();
  const parts: prettier.Doc[] = [];
  if (!node || !node.comments) {
    return "";
  }
  path.each((commentPath) => {
    const comment = commentPath.getValue();
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
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const types = path.map(print, "options");
  const result: (prettier.Doc | string)[] = [];
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
  print: PrettierChildPrint
): Doc {
  return [path.call(print, "elementType"), "[]"];
}

export function printTuple(
  path: AstPath<TupleExpressionNode | ProjectionTupleExpressionNode>,
  options: object,
  print: PrettierChildPrint
): Doc {
  return group([
    "[",
    indent(
      join(
        ", ",
        path.map((arg) => [softline, print(arg)], "values")
      )
    ),
    softline,
    "]",
  ]);
}

export function printMemberExpression(
  path: AstPath<MemberExpressionNode>,
  options: object,
  print: PrettierChildPrint
): Doc {
  const node = path.getValue();
  return [node.base ? [path.call(print, "base"), "."] : "", path.call(print, "id")];
}

export function printModelExpression(
  path: AstPath<ModelExpressionNode | ProjectionModelExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const inBlock = isModelExpressionInBlock(path);

  if (inBlock) {
    return group(printModelPropertiesBlock(path, options, print));
  } else {
    return group([
      indent(
        join(
          ", ",
          path.map((arg) => [softline, print(arg)], "properties")
        )
      ),
      softline,
    ]);
  }
}

export function printModelStatement(
  path: AstPath<ModelStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const hasProperties = node.properties && node.properties.length > 0;
  const nodeHasComments = hasComments(node, CommentCheckFlags.Dangling);
  if (!hasProperties && !nodeHasComments) {
    return "{}";
  }
  const tryInline = path.getParentNode()?.kind === SyntaxKind.TemplateParameterDeclaration;
  const lineDoc = tryInline ? softline : hardline;
  const seperator = isModelAValue(path) ? "," : ";";

  const body: prettier.Doc = [
    lineDoc,
    join(
      [seperator, lineDoc],
      path.map((x) => [print(x as any)], "properties")
    ),
    hasProperties ? ifBreak(seperator) : "",
  ];
  if (nodeHasComments) {
    body.push(printDanglingComments(path, options, { sameIndent: true }));
  }
  return group(["{", indent(body), lineDoc, "}"]);
}

/**
 * Figure out if this model is being used as a definition or value.
 * @returns true if the model is used as a value(e.g. decorator value), false if it is used as a model definition.
 */
function isModelAValue(path: AstPath<Node>): boolean {
  let count = 0;
  let node: Node | null = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const propertyIndex = path.stack[path.stack.length - 2];
  const isNotFirst = typeof propertyIndex === "number" && propertyIndex > 0;
  const { decorators, multiline } = printDecorators(
    path as AstPath<DecorableNode>,
    options,
    print,
    {
      tryInline: true,
    }
  );
  const id = needBacktick(node.id) ? `\`${node.id.sv}\`` : node.id.sv;
  return [
    multiline && isNotFirst ? hardline : "",
    printDirectives(path, options, print),
    decorators,
    id,
    node.optional ? "?: " : ": ",
    path.call(print, "value"),
    node.default ? [" = ", path.call(print, "default")] : "",
  ];
}

function needBacktick(id: IdentifierNode) {
  if (Keywords.has(id.sv)) {
    return true;
  }
  if (!isIdentifierStart(id.sv.charCodeAt(0))) {
    return true;
  }
  for (let i = 1; i < id.sv.length; i++) {
    if (!isIdentifierContinue(id.sv.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}

function isModelExpressionInBlock(
  path: AstPath<ModelExpressionNode | ProjectionModelExpressionNode>
) {
  const parent: Node | null = path.getParentNode() as any;

  switch (parent?.kind) {
    case SyntaxKind.OperationSignatureDeclaration:
      return parent.parameters !== path.getNode();
    default:
      return true;
  }
}

export function printScalarStatement(
  path: AstPath<ScalarStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const id = path.call(print, "id");
  const template = printTemplateParameters(path, options, print, "templateParameters");

  const heritage = node.extends
    ? [ifBreak(line, " "), "extends ", path.call(print, "extends")]
    : "";
  return [
    printDecorators(path, options, print, { tryInline: false }).decorators,
    "scalar ",
    id,
    template,
    group(indent(["", heritage])),
    ";",
  ];
}

export function printNamespaceStatement(
  path: AstPath<NamespaceStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const printNested = (currentPath: AstPath<NamespaceStatementNode>, parentNames: Doc[]): Doc => {
    const names = [...parentNames, currentPath.call(print, "id")];
    const currentNode = currentPath.getNode();

    if (
      !isArray(currentNode?.statements) &&
      currentNode?.statements?.kind === SyntaxKind.NamespaceStatement
    ) {
      return path.call((x) => printNested(x, names), "statements");
    }

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
  };

  return printNested(path, []);
}

export function printOperationSignatureDeclaration(
  path: AstPath<OperationSignatureDeclarationNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return ["(", path.call(print, "parameters"), "): ", path.call(print, "returnType")];
}

export function printOperationSignatureReference(
  path: AstPath<OperationSignatureReferenceNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return [" is ", path.call(print, "baseOperation")];
}

export function printOperationStatement(
  path: AstPath<OperationStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  property: keyof T
) {
  const node = path.getValue();
  const parts: Doc[] = [];
  const lastStatement = getLastStatement(node[property] as any as Statement[]);

  path.each((statementPath) => {
    const node = path.getValue();

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
  }, property);

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
  options: object,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const shouldHug = shouldHugType(node);

  const types = path.map((typePath) => {
    let printedType: string | prettier.Doc = print(typePath);
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
  path: prettier.AstPath<TypeReferenceNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.doc.builders.Doc {
  const type = path.call(print, "target");
  const template = printTemplateParameters(path, options, print, "arguments");
  return [type, template];
}

function printTemplateParameterDeclaration(
  path: AstPath<TemplateParameterDeclarationNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): Doc {
  const node = path.getValue();
  return [
    path.call(print, "id"),
    node.constraint ? [" extends ", path.call(print, "constraint")] : "",
    node.default ? [" = ", path.call(print, "default")] : "",
  ];
}

function printModelSpread(
  path: prettier.AstPath<ModelSpreadPropertyNode | ProjectionModelSpreadPropertyNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  return ["...", path.call(print, "target")];
}

function printDecoratorDeclarationStatement(
  path: prettier.AstPath<DecoratorDeclarationStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const id = path.call(print, "id");
  const parameters = [
    group([
      indent(
        join(", ", [
          [softline, path.call(print, "target")],
          ...path.map((arg) => [softline, print(arg)], "parameters"),
        ])
      ),
      softline,
    ]),
  ];
  return [printModifiers(path, options, print), "dec ", id, "(", parameters, ")", ";"];
}

function printFunctionDeclarationStatement(
  path: prettier.AstPath<FunctionDeclarationStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node = path.getValue();
  const id = path.call(print, "id");
  const parameters = [
    group([
      indent(
        join(
          ", ",
          path.map((arg) => [softline, print(arg)], "parameters")
        )
      ),
      softline,
    ]),
  ];
  const returnType = node.returnType ? [": ", path.call(print, "returnType")] : "";
  return [printModifiers(path, options, print), "fn ", id, "(", parameters, ")", returnType, ";"];
}

function printFunctionParameterDeclaration(
  path: prettier.AstPath<FunctionParameterNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node = path.getValue();
  if (node.modifiers.length === 0) {
    return "";
  }

  return path.map((x) => [print(x as any), " "], "modifiers");
}

function printStringLiteral(
  path: prettier.AstPath<StringLiteralNode>,
  options: CadlPrettierOptions
): prettier.doc.builders.Doc {
  const node = path.getValue();
  return getRawText(node, options);
}

function printNumberLiteral(
  path: prettier.AstPath<NumericLiteralNode>,
  options: CadlPrettierOptions
): prettier.doc.builders.Doc {
  const node = path.getValue();
  return getRawText(node, options);
}

function printBooleanLiteral(
  path: prettier.AstPath<BooleanLiteralNode>,
  options: CadlPrettierOptions
): prettier.doc.builders.Doc {
  const node = path.getValue();
  return node.value ? "true" : "false";
}

function printProjectionStatement(
  path: AstPath<ProjectionStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const selector = path.call(print, "selector");
  const id = path.call(print, "id");
  const to = node.to ? [hardline, path.call(print, "to")] : "";
  const from = node.from ? [hardline, path.call(print, "from")] : "";
  const body = [to, from];
  return [
    "projection ",
    selector,
    "#",
    id,
    " {",
    indent(body),
    node.to || node.from ? hardline : "",
    "}",
  ];
}

function printProjection(
  path: AstPath<ProjectionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const params = printProjectionParameters(path, options, print);
  const body = printProjectionExpressionStatements(path, options, print, "body");
  return [node.direction, params, " {", indent(body), hardline, "}"];
}

function printProjectionParameters(
  path: AstPath<ProjectionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  key: keyof T
) {
  const parts: Doc[] = [hardline];
  const lastIndex = (path.getValue()[key] as any).length - 1;
  path.each((statementPath, index) => {
    const node = path.getValue();

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
  }, key);
  return parts;
}

function printProjectionParameterDeclaration(
  path: AstPath<ProjectionParameterDeclarationNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return path.call(print, "id");
}

function printProjectionExpressionStatement(
  path: AstPath<ProjectionExpressionStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return path.call(print, "expr");
}
function printProjectionIfExpressionNode(
  path: AstPath<ProjectionIfExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const test = path.call(print, "test");
  const consequent = path.call(print, "consequent");
  const alternate = node.alternate ? [" else ", path.call(print, "alternate")] : "";
  return ["if ", test, " ", consequent, alternate];
}

export function printProjectionBlockExpressionNode(
  path: AstPath<ProjectionBlockExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  return [path.call(print, "base"), node.selector, path.call(print, "id")];
}

export function printProjectionLeftRightExpression(
  path: AstPath<
    | ProjectionLogicalExpressionNode
    | ProjectionRelationalExpressionNode
    | ProjectionEqualityExpressionNode
    | ProjectionArithmeticExpressionNode
  >,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  return [path.call(print, "left"), " ", node.op, " ", path.call(print, "right")];
}

export function printProjectionUnaryExpression(
  path: AstPath<ProjectionUnaryExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return ["!", path.call(print, "target")];
}

export function printProjectionCallExpression(
  path: AstPath<ProjectionCallExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
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
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return path.call(print, "id");
}

export function printReturnExpression(
  path: AstPath<ReturnExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return ["return ", path.call(print, "value")];
}

function printItemList<T extends Node>(
  path: AstPath<T>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  key: keyof T
) {
  return join(", ", path.map(print, key));
}

/**
 * @param node Node that has postition information.
 * @param options Prettier options
 * @returns Raw text in the file for the given node.
 */
function getRawText(node: TextRange, options: CadlPrettierOptions) {
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
