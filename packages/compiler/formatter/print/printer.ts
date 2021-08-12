import prettier, { Doc, FastPath, Printer } from "prettier";
import {
  AliasStatementNode,
  BlockComment,
  CadlScriptNode,
  Comment,
  DecoratorExpressionNode,
  EnumMemberNode,
  EnumStatementNode,
  IntersectionExpressionNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  NamespaceStatementNode,
  Node,
  NumericLiteralNode,
  OperationStatementNode,
  Statement,
  StringLiteralNode,
  SyntaxKind,
  TextRange,
  TypeReferenceNode,
  UnionExpressionNode,
} from "../../core/types.js";
import { CadlPrettierOptions, DecorableNode, PrettierChildPrint } from "./types.js";

const {
  align,
  breakParent,
  concat,
  group,
  hardline,
  ifBreak,
  indent,
  join,
  line,
  softline,
} = prettier.doc.builders;

const { isNextLineEmpty } = prettier.util;
const { replaceNewlinesWithLiterallines } = prettier.doc.utils as any;

export const cadlPrinter: Printer<Node> = {
  print: printCadl,
  canAttachComment: canAttachComment,
  printComment: printComment,
};

export function printCadl(
  // Path to the AST node to print
  path: FastPath<Node>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.Doc {
  const node: Node = path.getValue();

  switch (node.kind) {
    // Root
    case SyntaxKind.CadlScript:
      return printStatementSequence(path as FastPath<CadlScriptNode>, options, print, "statements");

    // Statements
    case SyntaxKind.ImportStatement:
      return concat([`import "${node.path.value}";`]);
    case SyntaxKind.UsingStatement:
      return concat([`using "`, path.call(print, "name"), `";`]);
    case SyntaxKind.OperationStatement:
      return printOperationStatement(path as FastPath<OperationStatementNode>, options, print);
    case SyntaxKind.NamespaceStatement:
      return printNamespaceStatement(path as FastPath<NamespaceStatementNode>, options, print);
    case SyntaxKind.ModelStatement:
      return printModelStatement(path as FastPath<ModelStatementNode>, options, print);
    case SyntaxKind.AliasStatement:
      return printAliasStatement(path as FastPath<AliasStatementNode>, options, print);
    case SyntaxKind.EnumStatement:
      return printEnumStatement(path as FastPath<EnumStatementNode>, options, print);

    // Others.
    case SyntaxKind.Identifier:
      return node.sv;
    case SyntaxKind.StringLiteral:
      return printStringLiteral(path as FastPath<StringLiteralNode>, options);
    case SyntaxKind.NumericLiteral:
      return printNumberLiteral(path as FastPath<NumericLiteralNode>, options);
    case SyntaxKind.ModelExpression:
      return printModelExpression(path as FastPath<ModelExpressionNode>, options, print);
    case SyntaxKind.ModelProperty:
      return printModelProperty(path as FastPath<ModelPropertyNode>, options, print);
    case SyntaxKind.DecoratorExpression:
      return printDecorator(path as FastPath<DecoratorExpressionNode>, options, print);
    case SyntaxKind.UnionExpression:
      return printUnion(path as FastPath<UnionExpressionNode>, options, print);
    case SyntaxKind.IntersectionExpression:
      return printIntersection(path as FastPath<IntersectionExpressionNode>, options, print);
    case SyntaxKind.EnumMember:
      return printEnumMember(path as FastPath<EnumMemberNode>, options, print);
    case SyntaxKind.TypeReference:
      return printTypeReference(path as FastPath<TypeReferenceNode>, options, print);
    default:
      return getRawText(node, options);
  }
}

export function printAliasStatement(
  path: FastPath<AliasStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const id = path.call(print, "id");
  const template = printTemplateParameters(path, options, print, "templateParameters");
  return concat(["alias ", id, template, " = ", path.call(print, "value"), ";"]);
}

function printTemplateParameters<T extends Node>(
  path: FastPath<T>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  propertyName: keyof T
) {
  const value = path.getValue()[propertyName];
  if ((value as any).length === 0) {
    return "";
  }
  return concat(["<", join(", ", path.map(print, propertyName)), ">"]);
}

export function canAttachComment(node: Node): boolean {
  const kind = node.kind as SyntaxKind;
  return Boolean(kind && kind !== SyntaxKind.LineComment && kind !== SyntaxKind.BlockComment);
}

export function printComment(
  commentPath: FastPath<Node | Comment>,
  options: CadlPrettierOptions
): Doc {
  const comment = commentPath.getValue();

  switch (comment.kind) {
    case SyntaxKind.BlockComment:
      return printBlockComment(commentPath as FastPath<BlockComment>, options);
    case SyntaxKind.LineComment:
      return `${options.originalText.slice(comment.pos, comment.end).trimRight()}`;
    default:
      throw new Error(`Not a comment: ${JSON.stringify(comment)}`);
  }
}

function printBlockComment(commentPath: FastPath<BlockComment>, options: CadlPrettierOptions) {
  const comment = commentPath.getValue();
  const rawComment = options.originalText.slice(comment.pos + 2, comment.end - 2);

  if (isIndentableBlockComment(rawComment)) {
    const printed = printIndentableBlockComment(rawComment);
    return printed;
  }

  return concat(["/*", replaceNewlinesWithLiterallines(rawComment), "*/"]);
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

  return concat([
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
  ]);
}

export function printDecorators(
  path: FastPath<DecorableNode>,
  options: object,
  print: PrettierChildPrint,
  { tryInline }: { tryInline: boolean }
) {
  const node = path.getValue();
  if (node.decorators.length === 0) {
    return "";
  }

  const decorators = path.map((x) => concat([print(x as any), ifBreak(line, " ")]), "decorators");
  const shouldBreak = tryInline && decorators.length < 3 ? "" : breakParent;

  return group(concat([...decorators, shouldBreak]));
}

export function printDecorator(
  path: FastPath<DecoratorExpressionNode>,
  options: object,
  print: PrettierChildPrint
) {
  const args = printDecoratorArgs(path, options, print);
  return concat(["@", path.call(print, "target"), args]);
}

function printDecoratorArgs(
  path: FastPath<DecoratorExpressionNode>,
  options: object,
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
    node.arguments.length === 1 && node.arguments[0].kind === SyntaxKind.ModelExpression;

  if (shouldHug) {
    return concat([
      "(",
      join(
        ", ",
        path.map((arg) => concat([print(arg)]), "arguments")
      ),
      ")",
    ]);
  }

  return concat([
    "(",
    group(
      concat([
        indent(
          join(
            ", ",
            path.map((arg) => concat([softline, print(arg)]), "arguments")
          )
        ),
        softline,
      ])
    ),
    ")",
  ]);
}

export function printEnumStatement(
  path: FastPath<EnumStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const id = path.call(print, "id");
  const decorators = printDecorators(path, options, print, { tryInline: false });
  return concat([decorators, "enum ", id, " ", printEnumBlock(path, options, print)]);
}

function printEnumBlock(
  path: FastPath<EnumStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  if (node.members.length === 0) {
    return "{}";
  }

  return group(
    concat([
      "{",
      indent(
        concat([
          hardline,
          join(
            hardline,
            path.map((x) => concat([print(x as any), ","]), "members")
          ),
        ])
      ),
      hardline,
      "}",
    ])
  );
}

export function printEnumMember(
  path: FastPath<EnumMemberNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const id = path.call(print, "id");
  const value = node.value ? concat([": ", path.call(print, "value")]) : "";
  const decorators = printDecorators(path, options, print, { tryInline: true });
  return concat([decorators, id, value]);
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
  path: FastPath<IntersectionExpressionNode>,
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
      result.push(concat([" & ", wasIndented ? indent(types[i]) : types[i]]));
    } else if (!isModelNode(node.options[i - 1]) && !isModelNode(node.options[i])) {
      // If no object is involved, go to the next line if it breaks
      result.push(indent(concat([" &", line, types[i]])));
    } else {
      // If you go from object to non-object or vis-versa, then inline it
      if (i > 1) {
        wasIndented = true;
      }
      result.push(" & ", i > 1 ? indent(types[i]) : types[i]);
    }
  }
  return group(concat(result));
}

function isModelNode(node: Node) {
  return node.kind === SyntaxKind.ModelExpression;
}

export function printModelExpression(
  path: FastPath<ModelExpressionNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const inBlock = isModelExpressionInBlock(path);

  if (inBlock) {
    return group(printModelPropertiesBlock(path, options, print));
  } else {
    return group(
      concat([
        indent(
          join(
            ", ",
            path.map((arg) => concat([softline, print(arg)]), "properties")
          )
        ),
        softline,
      ])
    );
  }
}

export function printModelStatement(
  path: FastPath<ModelStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  const id = path.call(print, "id");
  const heritage =
    node.extends.length > 0 ? concat(["extends ", path.map(print, "extends")[0], " "]) : "";
  const isBase = node.is ? concat(["is ", path.call(print, "is"), " "]) : "";
  const generic = printTemplateParameters(path, options, print, "templateParameters");
  return concat([
    printDecorators(path, options, print, { tryInline: false }),
    "model ",
    id,
    generic,
    " ",
    heritage,
    isBase,
    printModelPropertiesBlock(path, options, print),
  ]);
}

function printModelPropertiesBlock(
  path: FastPath<Node & { properties?: (ModelPropertyNode | ModelSpreadPropertyNode)[] }>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getNode();
  if (!node?.properties || node.properties.length === 0) {
    return "{}";
  }

  const seperator = isModelAValue(path) ? "," : ";";

  return concat([
    "{",
    indent(
      concat([
        hardline,
        join(
          hardline,
          path.map((x) => concat([print(x as any), seperator]), "properties")
        ),
      ])
    ),
    hardline,
    "}",
  ]);
}

/**
 * Figure out if this model is being used as a definition or value.
 * @returns true if the model is used as a value(e.g. decorator value), false if it is used as a model definition.
 */
function isModelAValue(path: FastPath<Node>): boolean {
  let count = 0;
  let node: Node | null = path.getValue();
  do {
    switch (node.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.AliasStatement:
        return false;
      case SyntaxKind.DecoratorExpression:
        return true;
    }
  } while ((node = path.getParentNode(count++)));
  return true;
}

export function printModelProperty(
  path: FastPath<ModelPropertyNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const node = path.getValue();
  return concat([
    printDecorators(path as FastPath<DecorableNode>, options, print, { tryInline: true }),
    path.call(print, "id"),
    node.optional ? "?: " : ": ",
    path.call(print, "value"),
  ]);
}

function isModelExpressionInBlock(path: FastPath<ModelExpressionNode>) {
  const parent: Node | null = path.getParentNode() as any;

  switch (parent?.kind) {
    case SyntaxKind.OperationStatement:
      return false;
    default:
      return true;
  }
}

export function printNamespaceStatement(
  path: FastPath<NamespaceStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  const printNamespace = (
    path: FastPath<NamespaceStatementNode>,
    names: Doc[],
    suffix: Doc | string
  ) => {};

  const printNested = (currentPath: FastPath<NamespaceStatementNode>, parentNames: Doc[]): Doc => {
    const names = [...parentNames, currentPath.call(print, "name")];
    const currentNode = currentPath.getNode();

    if (
      !Array.isArray(currentNode?.statements) &&
      currentNode?.statements?.kind === SyntaxKind.NamespaceStatement
    ) {
      return path.call((x) => printNested(x, names), "statements");
    }

    const suffix =
      currentNode?.statements === undefined
        ? ";"
        : concat([
            " {",
            indent(concat([hardline, printStatementSequence(path, options, print, "statements")])),
            hardline,
            "}",
          ]);
    return concat([
      printDecorators(path, options, print, { tryInline: false }),
      `namespace `,
      join(".", names),
      suffix,
    ]);
  };

  return printNested(path, []);
}

export function printOperationStatement(
  path: FastPath<OperationStatementNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
) {
  return concat([
    printDecorators(path as FastPath<DecorableNode>, options, print, { tryInline: true }),
    `op `,
    path.call(print, "id"),
    "(",
    path.call(print, "parameters"),
    "): ",
    path.call(print, "returnType"),
    `;`,
  ]);
}

export function printStatementSequence<T extends Node>(
  path: FastPath<T>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint,
  property: keyof T
) {
  const node = path.getValue();
  const parts: Doc[] = [];
  const lastStatement = getLastStatement((node[property] as any) as Statement[]);

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

  return concat(parts);
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
  path: FastPath<UnionExpressionNode>,
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
  const code = [
    ifBreak(concat([shouldAddStartLine ? line : "", "| "]), ""),
    join(concat([line, "| "]), types),
  ];
  return group(indent(concat(code)));
}

function shouldHugType(node: Node) {
  if (node.kind === SyntaxKind.UnionExpression || node.kind === SyntaxKind.IntersectionExpression) {
    return node.options.length < 4;
  }
  return false;
}

export function printTypeReference(
  path: prettier.FastPath<TypeReferenceNode>,
  options: CadlPrettierOptions,
  print: PrettierChildPrint
): prettier.doc.builders.Doc {
  const type = path.call(print, "target");
  const template = printTemplateParameters(path, options, print, "arguments");
  return concat([type, template]);
}

export function printStringLiteral(
  path: prettier.FastPath<StringLiteralNode>,
  options: CadlPrettierOptions
): prettier.doc.builders.Doc {
  const node = path.getValue();
  return getRawText(node, options);
}

export function printNumberLiteral(
  path: prettier.FastPath<NumericLiteralNode>,
  options: CadlPrettierOptions
): prettier.doc.builders.Doc {
  const node = path.getValue();
  return getRawText(node, options);
}

/**
 * @param node Node that has postition information.
 * @param options Prettier options
 * @returns Raw text in the file for the given node.
 */
function getRawText(node: TextRange, options: CadlPrettierOptions) {
  return options.originalText.slice(node.pos, node.end);
}
