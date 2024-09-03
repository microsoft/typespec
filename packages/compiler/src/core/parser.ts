import { isArray, mutate } from "../utils/misc.js";
import { codePointBefore, isIdentifierContinue, trim } from "./charcode.js";
import { compilerAssert } from "./diagnostics.js";
import { CompilerDiagnostics, createDiagnostic } from "./messages.js";
import {
  Token,
  TokenDisplay,
  TokenFlags,
  createScanner,
  isComment,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  isTrivia,
  skipContinuousIdentifier,
  skipTrivia,
  skipTriviaBackward,
} from "./scanner.js";
import {
  AliasStatementNode,
  AnyKeywordNode,
  ArrayLiteralNode,
  AugmentDecoratorStatementNode,
  BlockComment,
  BooleanLiteralNode,
  CallExpressionNode,
  Comment,
  ConstStatementNode,
  DeclarationNode,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  Diagnostic,
  DiagnosticReportWithoutTarget,
  DirectiveArgument,
  DirectiveExpressionNode,
  DocContent,
  DocErrorsTagNode,
  DocNode,
  DocParamTagNode,
  DocPropTagNode,
  DocReturnsTagNode,
  DocTag,
  DocTemplateTagNode,
  DocTextNode,
  DocUnknownTagNode,
  EmptyStatementNode,
  EnumMemberNode,
  EnumSpreadMemberNode,
  EnumStatementNode,
  Expression,
  ExternKeywordNode,
  FunctionDeclarationStatementNode,
  FunctionParameterNode,
  IdentifierContext,
  IdentifierKind,
  IdentifierNode,
  ImportStatementNode,
  InterfaceStatementNode,
  InvalidStatementNode,
  LineComment,
  MemberExpressionNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  Modifier,
  ModifierFlags,
  NamespaceStatementNode,
  NeverKeywordNode,
  Node,
  NodeFlags,
  NumericLiteralNode,
  ObjectLiteralNode,
  ObjectLiteralPropertyNode,
  ObjectLiteralSpreadPropertyNode,
  OperationSignature,
  OperationStatementNode,
  ParseOptions,
  PositionDetail,
  ProjectionBlockExpressionNode,
  ProjectionEnumMemberSelectorNode,
  ProjectionEnumSelectorNode,
  ProjectionExpression,
  ProjectionExpressionStatementNode,
  ProjectionIfExpressionNode,
  ProjectionInterfaceSelectorNode,
  ProjectionLambdaExpressionNode,
  ProjectionLambdaParameterDeclarationNode,
  ProjectionModelExpressionNode,
  ProjectionModelPropertyNode,
  ProjectionModelPropertySelectorNode,
  ProjectionModelSelectorNode,
  ProjectionModelSpreadPropertyNode,
  ProjectionNode,
  ProjectionOperationSelectorNode,
  ProjectionParameterDeclarationNode,
  ProjectionScalarSelectorNode,
  ProjectionStatementItem,
  ProjectionStatementNode,
  ProjectionTupleExpressionNode,
  ProjectionUnionSelectorNode,
  ProjectionUnionVariantSelectorNode,
  ScalarConstructorNode,
  ScalarStatementNode,
  SourceFile,
  Statement,
  StringLiteralNode,
  StringTemplateExpressionNode,
  StringTemplateHeadNode,
  StringTemplateMiddleNode,
  StringTemplateSpanNode,
  StringTemplateTailNode,
  Sym,
  SyntaxKind,
  TemplateArgumentNode,
  TemplateParameterDeclarationNode,
  TextRange,
  TupleExpressionNode,
  TypeOfExpressionNode,
  TypeReferenceNode,
  TypeSpecScriptNode,
  UnionStatementNode,
  UnionVariantNode,
  UsingStatementNode,
  ValueOfExpressionNode,
  VoidKeywordNode,
} from "./types.js";

/**
 * Callback to parse each element in a delimited list
 *
 * @param pos        The position of the start of the list element before any
 *                   decorators were parsed.
 *
 * @param decorators The decorators that were applied to the list element and
 *                   parsed before entering the callback.
 */
type ParseListItem<K, T> = K extends UnannotatedListKind
  ? () => T
  : (pos: number, decorators: DecoratorExpressionNode[]) => T;

type ListDetail<T> = {
  items: T[];
  /**
   * The range of the list items as below as an example
   *   model Foo <pos>{ a: string; b: string; }<end>
   *
   * remark: if the start/end token (i.e. { } ) not found, pos/end will be -1
   */
  range: TextRange;
};

type OpenToken =
  | Token.OpenBrace
  | Token.OpenParen
  | Token.OpenBracket
  | Token.LessThan
  | Token.HashBrace
  | Token.HashBracket;
type CloseToken = Token.CloseBrace | Token.CloseParen | Token.CloseBracket | Token.GreaterThan;
type DelimiterToken = Token.Comma | Token.Semicolon;

/**
 * In order to share sensitive error recovery code, all parsing of delimited
 * lists is done using a shared driver routine parameterized by these options.
 */
interface ListKind {
  readonly allowEmpty: boolean;
  readonly open: OpenToken | Token.None;
  readonly close: CloseToken | Token.None;
  readonly delimiter: DelimiterToken;
  readonly toleratedDelimiter: DelimiterToken;
  readonly toleratedDelimiterIsValid: boolean;
  readonly trailingDelimiterIsValid: boolean;
  readonly invalidAnnotationTarget?: string;
  readonly allowedStatementKeyword: Token;
}

interface SurroundedListKind extends ListKind {
  readonly open: OpenToken;
  readonly close: CloseToken;
}

interface UnannotatedListKind extends ListKind {
  invalidAnnotationTarget: string;
}

/**
 * The fixed set of options for each of the kinds of delimited lists in TypeSpec.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ListKind {
  const PropertiesBase = {
    allowEmpty: true,
    toleratedDelimiterIsValid: true,
    trailingDelimiterIsValid: true,
    allowedStatementKeyword: Token.None,
  } as const;

  export const OperationParameters = {
    ...PropertiesBase,
    open: Token.OpenParen,
    close: Token.CloseParen,
    delimiter: Token.Comma,
    toleratedDelimiter: Token.Semicolon,
  } as const;

  export const DecoratorArguments = {
    ...OperationParameters,
    invalidAnnotationTarget: "expression",
  } as const;

  export const FunctionArguments = {
    ...OperationParameters,
    invalidAnnotationTarget: "expression",
  } as const;

  export const ModelProperties = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
  } as const;

  export const ObjectLiteralProperties = {
    ...PropertiesBase,
    open: Token.HashBrace,
    close: Token.CloseBrace,
    delimiter: Token.Comma,
    toleratedDelimiter: Token.Comma,
  } as const;

  export const InterfaceMembers = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
    toleratedDelimiterIsValid: false,
    allowedStatementKeyword: Token.OpKeyword,
  } as const;

  export const ScalarMembers = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
    toleratedDelimiterIsValid: false,
    allowedStatementKeyword: Token.InitKeyword,
  } as const;

  export const UnionVariants = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
    toleratedDelimiterIsValid: true,
  } as const;

  export const EnumMembers = {
    ...ModelProperties,
  } as const;

  const ExpresionsBase = {
    allowEmpty: true,
    delimiter: Token.Comma,
    toleratedDelimiter: Token.Semicolon,
    toleratedDelimiterIsValid: false,
    trailingDelimiterIsValid: false,
    invalidAnnotationTarget: "expression",
    allowedStatementKeyword: Token.None,
  } as const;

  export const TemplateParameters = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.LessThan,
    close: Token.GreaterThan,
    invalidAnnotationTarget: "template parameter",
  } as const;

  export const TemplateArguments = {
    ...TemplateParameters,
  } as const;

  export const CallArguments = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.OpenParen,
    close: Token.CloseParen,
  } as const;

  export const Heritage = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.None,
    close: Token.None,
  } as const;

  export const Tuple = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.OpenBracket,
    close: Token.CloseBracket,
  } as const;

  export const ArrayLiteral = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.HashBracket,
    close: Token.CloseBracket,
  } as const;

  export const FunctionParameters = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.OpenParen,
    close: Token.CloseParen,
    invalidAnnotationTarget: "expression",
  } as const;

  export const ProjectionExpression = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.OpenParen,
    close: Token.CloseParen,
  } as const;

  export const ProjectionParameter = {
    ...ExpresionsBase,
    allowEmpty: true,
    open: Token.OpenParen,
    close: Token.CloseParen,
  } as const;
}

const enum ParseMode {
  Syntax,
  Doc,
}

export function parse(code: string | SourceFile, options: ParseOptions = {}): TypeSpecScriptNode {
  const parser = createParser(code, options);
  return parser.parseTypeSpecScript();
}

export function parseStandaloneTypeReference(
  code: string | SourceFile
): [TypeReferenceNode, readonly Diagnostic[]] {
  const parser = createParser(code);
  const node = parser.parseStandaloneReferenceExpression();
  return [node, parser.parseDiagnostics];
}

interface Parser {
  parseDiagnostics: Diagnostic[];
  parseTypeSpecScript(): TypeSpecScriptNode;
  parseStandaloneReferenceExpression(): TypeReferenceNode;
}

interface DocRange extends TextRange {
  /** Parsed comment. */
  comment?: BlockComment;
}

function createParser(code: string | SourceFile, options: ParseOptions = {}): Parser {
  let parseErrorInNextFinishedNode = false;
  let previousTokenEnd = -1;
  let realPositionOfLastError = -1;
  let missingIdentifierCounter = 0;
  let treePrintable = true;
  let newLineIsTrivia = true;
  let currentMode = ParseMode.Syntax;
  const parseDiagnostics: Diagnostic[] = [];
  const scanner = createScanner(code, reportDiagnostic);
  const comments: Comment[] = [];
  let docRanges: DocRange[] = [];

  nextToken();
  return {
    parseDiagnostics,
    parseTypeSpecScript,
    parseStandaloneReferenceExpression,
  };

  function parseTypeSpecScript(): TypeSpecScriptNode {
    const statements = parseTypeSpecScriptItemList();
    return {
      kind: SyntaxKind.TypeSpecScript,
      statements,
      file: scanner.file,
      id: {
        kind: SyntaxKind.Identifier,
        sv: scanner.file.path,
        pos: 0,
        end: 0,
        flags: NodeFlags.Synthetic,
      } as any,
      namespaces: [],
      usings: [],
      locals: undefined!,
      inScopeNamespaces: [],
      parseDiagnostics,
      comments,
      printable: treePrintable,
      parseOptions: options,
      ...finishNode(0),
    };
  }

  interface ParseAnnotationsOptions {
    /** If we shouldn't try to parse doc nodes when parsing annotations. */
    skipParsingDocNodes?: boolean;
  }

  interface Annotations {
    pos: number;
    docs: DocNode[];
    directives: DirectiveExpressionNode[];
    decorators: DecoratorExpressionNode[];
  }

  /** Try to parse doc comments, directives and decorators in any order. */
  function parseAnnotations({ skipParsingDocNodes }: ParseAnnotationsOptions = {}): Annotations {
    const directives: DirectiveExpressionNode[] = [];
    const decorators: DecoratorExpressionNode[] = [];
    const docs: DocNode[] = [];
    let pos = tokenPos();
    if (!skipParsingDocNodes) {
      const [firstPos, addedDocs] = parseDocList();
      pos = firstPos;
      for (const doc of addedDocs) {
        docs.push(doc);
      }
    }

    while (token() === Token.Hash || token() === Token.At) {
      if (token() === Token.Hash) {
        directives.push(parseDirectiveExpression());
      } else if (token() === Token.At) {
        decorators.push(parseDecoratorExpression());
      }

      if (!skipParsingDocNodes) {
        const [_, addedDocs] = parseDocList();

        for (const doc of addedDocs) {
          docs.push(doc);
        }
      }
    }

    return { pos, docs, directives, decorators };
  }

  function parseTypeSpecScriptItemList(): Statement[] {
    const stmts: Statement[] = [];
    let seenBlocklessNs = false;
    let seenDecl = false;
    let seenUsing = false;
    while (token() !== Token.EndOfFile) {
      const { pos, docs, directives, decorators } = parseAnnotations();
      const tok = token();
      let item: Statement;
      switch (tok) {
        case Token.AtAt:
          reportInvalidDecorators(decorators, "augment decorator statement");
          item = parseAugmentDecorator();
          break;
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          item = parseImportStatement();
          break;
        case Token.ModelKeyword:
          item = parseModelStatement(pos, decorators);
          break;
        case Token.ScalarKeyword:
          item = parseScalarStatement(pos, decorators);
          break;
        case Token.NamespaceKeyword:
          item = parseNamespaceStatement(pos, decorators, docs, directives);
          break;
        case Token.InterfaceKeyword:
          item = parseInterfaceStatement(pos, decorators);
          break;
        case Token.UnionKeyword:
          item = parseUnionStatement(pos, decorators);
          break;
        case Token.OpKeyword:
          item = parseOperationStatement(pos, decorators);
          break;
        case Token.EnumKeyword:
          item = parseEnumStatement(pos, decorators);
          break;
        case Token.AliasKeyword:
          reportInvalidDecorators(decorators, "alias statement");
          item = parseAliasStatement(pos);
          break;
        case Token.ConstKeyword:
          reportInvalidDecorators(decorators, "const statement");
          item = parseConstStatement(pos);
          break;
        case Token.UsingKeyword:
          reportInvalidDecorators(decorators, "using statement");
          item = parseUsingStatement(pos);
          break;
        case Token.ProjectionKeyword:
          reportInvalidDecorators(decorators, "projection statement");
          item = parseProjectionStatement(pos);
          break;
        case Token.Semicolon:
          reportInvalidDecorators(decorators, "empty statement");
          item = parseEmptyStatement(pos);
          break;
        // Start of declaration with modifiers
        case Token.ExternKeyword:
        case Token.FnKeyword:
        case Token.DecKeyword:
          item = parseDeclaration(pos);
          break;
        default:
          item = parseInvalidStatement(pos, decorators);
          break;
      }

      if (tok !== Token.NamespaceKeyword) {
        mutate(item).directives = directives;
        mutate(item).docs = docs;
      }

      if (isBlocklessNamespace(item)) {
        if (seenBlocklessNs) {
          error({ code: "multiple-blockless-namespace", target: item });
        }
        if (seenDecl) {
          error({ code: "blockless-namespace-first", target: item });
        }
        seenBlocklessNs = true;
      } else if (item.kind === SyntaxKind.ImportStatement) {
        if (seenDecl || seenBlocklessNs || seenUsing) {
          error({ code: "import-first", target: item });
        }
      } else if (item.kind === SyntaxKind.UsingStatement) {
        seenUsing = true;
      } else {
        seenDecl = true;
      }

      stmts.push(item);
    }

    return stmts;
  }

  function parseStatementList(): Statement[] {
    const stmts: Statement[] = [];

    while (token() !== Token.CloseBrace) {
      const { pos, docs, directives, decorators } = parseAnnotations();
      const tok = token();

      let item: Statement;
      switch (tok) {
        case Token.AtAt:
          reportInvalidDecorators(decorators, "augment decorator statement");
          item = parseAugmentDecorator();
          break;
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          item = parseImportStatement();
          error({ code: "import-first", messageId: "topLevel", target: item });
          break;
        case Token.ModelKeyword:
          item = parseModelStatement(pos, decorators);
          break;
        case Token.ScalarKeyword:
          item = parseScalarStatement(pos, decorators);
          break;
        case Token.NamespaceKeyword:
          const ns = parseNamespaceStatement(pos, decorators, docs, directives);

          if (isBlocklessNamespace(ns)) {
            error({ code: "blockless-namespace-first", messageId: "topLevel", target: ns });
          }
          item = ns;
          break;
        case Token.InterfaceKeyword:
          item = parseInterfaceStatement(pos, decorators);
          break;
        case Token.UnionKeyword:
          item = parseUnionStatement(pos, decorators);
          break;
        case Token.OpKeyword:
          item = parseOperationStatement(pos, decorators);
          break;
        case Token.EnumKeyword:
          item = parseEnumStatement(pos, decorators);
          break;
        case Token.AliasKeyword:
          reportInvalidDecorators(decorators, "alias statement");
          item = parseAliasStatement(pos);
          break;
        case Token.ConstKeyword:
          reportInvalidDecorators(decorators, "const statement");
          item = parseConstStatement(pos);
          break;
        case Token.UsingKeyword:
          reportInvalidDecorators(decorators, "using statement");
          item = parseUsingStatement(pos);
          break;
        case Token.ExternKeyword:
        case Token.FnKeyword:
        case Token.DecKeyword:
          item = parseDeclaration(pos);
          break;
        case Token.ProjectionKeyword:
          reportInvalidDecorators(decorators, "project statement");
          item = parseProjectionStatement(pos);
          break;
        case Token.EndOfFile:
          parseExpected(Token.CloseBrace);
          return stmts;
        case Token.Semicolon:
          reportInvalidDecorators(decorators, "empty statement");
          item = parseEmptyStatement(pos);
          break;
        default:
          item = parseInvalidStatement(pos, decorators);
          break;
      }
      mutate(item).directives = directives;
      if (tok !== Token.NamespaceKeyword) {
        mutate(item).docs = docs;
      }
      stmts.push(item);
    }

    return stmts;
  }

  function parseDecoratorList() {
    const decorators: DecoratorExpressionNode[] = [];

    while (token() === Token.At) {
      decorators.push(parseDecoratorExpression());
    }

    return decorators;
  }

  function parseDirectiveList(): DirectiveExpressionNode[] {
    const directives: DirectiveExpressionNode[] = [];

    while (token() === Token.Hash) {
      directives.push(parseDirectiveExpression());
    }

    return directives;
  }

  function parseNamespaceStatement(
    pos: number,
    decorators: DecoratorExpressionNode[],
    docs: DocNode[],
    directives: DirectiveExpressionNode[]
  ): NamespaceStatementNode {
    parseExpected(Token.NamespaceKeyword);
    let currentName = parseIdentifierOrMemberExpression();
    const nsSegments: IdentifierNode[] = [];
    while (currentName.kind !== SyntaxKind.Identifier) {
      nsSegments.push(currentName.id);
      currentName = currentName.base;
    }
    nsSegments.push(currentName);

    const nextTok = parseExpectedOneOf(Token.Semicolon, Token.OpenBrace);

    let statements: Statement[] | undefined;
    if (nextTok === Token.OpenBrace) {
      statements = parseStatementList();
      parseExpected(Token.CloseBrace);
    }

    let outerNs: NamespaceStatementNode = {
      kind: SyntaxKind.NamespaceStatement,
      decorators,
      docs: docs,
      id: nsSegments[0],
      locals: undefined!,
      statements,
      directives: directives,
      ...finishNode(pos),
    };

    for (let i = 1; i < nsSegments.length; i++) {
      outerNs = {
        kind: SyntaxKind.NamespaceStatement,
        decorators: [],
        directives: [],
        id: nsSegments[i],
        statements: outerNs,
        locals: undefined!,
        ...finishNode(pos),
      };
    }

    return outerNs;
  }

  function parseInterfaceStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): InterfaceStatementNode {
    parseExpected(Token.InterfaceKeyword);
    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();

    let extendList: ListDetail<TypeReferenceNode> = createEmptyList<TypeReferenceNode>();
    if (token() === Token.ExtendsKeyword) {
      nextToken();
      extendList = parseList(ListKind.Heritage, parseReferenceExpression);
    } else if (token() === Token.Identifier) {
      error({ code: "token-expected", format: { token: "'extends' or '{'" } });
      nextToken();
    }

    const { items: operations, range: bodyRange } = parseList(
      ListKind.InterfaceMembers,
      (pos, decorators) => parseOperationStatement(pos, decorators, true)
    );

    return {
      kind: SyntaxKind.InterfaceStatement,
      id,
      templateParameters,
      templateParametersRange,
      operations,
      bodyRange,
      extends: extendList.items,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseTemplateParameterList(): ListDetail<TemplateParameterDeclarationNode> {
    const detail = parseOptionalList(ListKind.TemplateParameters, parseTemplateParameter);
    let setDefault = false;
    for (const item of detail.items) {
      if (!item.default && setDefault) {
        error({ code: "default-required", target: item });
        continue;
      }

      if (item.default) {
        setDefault = true;
      }
    }

    return detail;
  }

  function parseUnionStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): UnionStatementNode {
    parseExpected(Token.UnionKeyword);
    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();

    const { items: options } = parseList(ListKind.UnionVariants, parseUnionVariant);

    return {
      kind: SyntaxKind.UnionStatement,
      id,
      templateParameters,
      templateParametersRange,
      decorators,
      options,
      ...finishNode(pos),
    };
  }

  function parseUnionVariant(pos: number, decorators: DecoratorExpressionNode[]): UnionVariantNode {
    const idOrExpr = parseExpression();
    if (parseOptional(Token.Colon)) {
      let id: IdentifierNode | undefined = undefined;

      if (
        idOrExpr.kind !== SyntaxKind.TypeReference &&
        idOrExpr.kind !== SyntaxKind.StringLiteral
      ) {
        error({ code: "token-expected", messageId: "identifier" });
      } else if (idOrExpr.kind === SyntaxKind.StringLiteral) {
        // convert string literal node to identifier node (back compat for string literal quoted properties)
        id = {
          kind: SyntaxKind.Identifier,
          sv: idOrExpr.value,
          ...finishNode(idOrExpr.pos),
        };
      } else {
        const target = idOrExpr.target;
        if (target.kind === SyntaxKind.Identifier) {
          id = target;
        } else {
          error({ code: "token-expected", messageId: "identifier" });
        }
      }

      const value = parseExpression();

      return {
        kind: SyntaxKind.UnionVariant,
        id,
        value,
        decorators,
        ...finishNode(pos),
      };
    }

    return {
      kind: SyntaxKind.UnionVariant,
      id: undefined,
      value: idOrExpr,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseUsingStatement(pos: number): UsingStatementNode {
    parseExpected(Token.UsingKeyword);
    const name = parseIdentifierOrMemberExpression(undefined, true);
    parseExpected(Token.Semicolon);

    return {
      kind: SyntaxKind.UsingStatement,
      name,
      ...finishNode(pos),
    };
  }

  function parseOperationStatement(
    pos: number,
    decorators: DecoratorExpressionNode[],
    inInterface?: boolean
  ): OperationStatementNode {
    if (inInterface) {
      parseOptional(Token.OpKeyword);
    } else {
      parseExpected(Token.OpKeyword);
    }

    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();

    // Make sure the next token is one that is expected
    const token = expectTokenIsOneOf(Token.OpenParen, Token.IsKeyword);

    // Check if we're parsing a declaration or reuse of another operation
    let signature: OperationSignature;
    const signaturePos = tokenPos();
    if (token === Token.OpenParen) {
      const parameters = parseOperationParameters();
      parseExpected(Token.Colon);
      const returnType = parseExpression();

      signature = {
        kind: SyntaxKind.OperationSignatureDeclaration,
        parameters,
        returnType,
        ...finishNode(signaturePos),
      };
    } else {
      parseExpected(Token.IsKeyword);
      const opReference = parseReferenceExpression();

      signature = {
        kind: SyntaxKind.OperationSignatureReference,
        baseOperation: opReference,
        ...finishNode(signaturePos),
      };
    }

    // The interface parser handles semicolon parsing between statements
    if (!inInterface) {
      parseExpected(Token.Semicolon);
    }

    return {
      kind: SyntaxKind.OperationStatement,
      id,
      templateParameters,
      templateParametersRange,
      signature,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseOperationParameters(): ModelExpressionNode {
    const pos = tokenPos();
    const { items: properties, range: bodyRange } = parseList(
      ListKind.OperationParameters,
      parseModelPropertyOrSpread
    );
    const parameters: ModelExpressionNode = {
      kind: SyntaxKind.ModelExpression,
      properties,
      bodyRange,
      ...finishNode(pos),
    };
    return parameters;
  }

  function parseModelStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ModelStatementNode {
    parseExpected(Token.ModelKeyword);
    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();

    expectTokenIsOneOf(Token.OpenBrace, Token.Equals, Token.ExtendsKeyword, Token.IsKeyword);

    const optionalExtends = parseOptionalModelExtends();
    const optionalIs = optionalExtends ? undefined : parseOptionalModelIs();

    let propDetail: ListDetail<ModelPropertyNode | ModelSpreadPropertyNode> = createEmptyList<
      ModelPropertyNode | ModelSpreadPropertyNode
    >();
    if (optionalIs) {
      const tok = expectTokenIsOneOf(Token.Semicolon, Token.OpenBrace);
      if (tok === Token.Semicolon) {
        nextToken();
      } else {
        propDetail = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);
      }
    } else {
      propDetail = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);
    }

    return {
      kind: SyntaxKind.ModelStatement,
      id,
      extends: optionalExtends,
      is: optionalIs,
      templateParameters,
      templateParametersRange,
      decorators,
      properties: propDetail.items,
      bodyRange: propDetail.range,
      ...finishNode(pos),
    };
  }

  function parseOptionalModelExtends() {
    if (parseOptional(Token.ExtendsKeyword)) {
      return parseExpression();
    }
    return undefined;
  }

  function parseOptionalModelIs() {
    if (parseOptional(Token.IsKeyword)) {
      return parseExpression();
    }
    return;
  }

  function parseTemplateParameter(): TemplateParameterDeclarationNode {
    const pos = tokenPos();
    const id = parseIdentifier();
    let constraint: Expression | ValueOfExpressionNode | undefined;
    if (parseOptional(Token.ExtendsKeyword)) {
      constraint = parseMixedParameterConstraint();
    }
    let def: Expression | undefined;
    if (parseOptional(Token.Equals)) {
      def = parseExpression();
    }
    return {
      kind: SyntaxKind.TemplateParameterDeclaration,
      id,
      constraint,
      default: def,
      ...finishNode(pos),
    };
  }

  function parseValueOfExpressionOrIntersectionOrHigher() {
    if (token() === Token.ValueOfKeyword) {
      return parseValueOfExpression();
    } else if (parseOptional(Token.OpenParen)) {
      const expr = parseMixedParameterConstraint();
      parseExpected(Token.CloseParen);
      return expr;
    }

    return parseIntersectionExpressionOrHigher();
  }

  function parseMixedParameterConstraint(): Expression | ValueOfExpressionNode {
    const pos = tokenPos();
    parseOptional(Token.Bar);
    const node: Expression = parseValueOfExpressionOrIntersectionOrHigher();

    if (token() !== Token.Bar) {
      return node;
    }

    const options = [node];
    while (parseOptional(Token.Bar)) {
      const expr = parseValueOfExpressionOrIntersectionOrHigher();
      options.push(expr);
    }

    return {
      kind: SyntaxKind.UnionExpression,
      options,
      ...finishNode(pos),
    };
  }

  function parseModelPropertyOrSpread(pos: number, decorators: DecoratorExpressionNode[]) {
    return token() === Token.Ellipsis
      ? parseModelSpreadProperty(pos, decorators)
      : parseModelProperty(pos, decorators);
  }

  function parseModelSpreadProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ModelSpreadPropertyNode {
    parseExpected(Token.Ellipsis);

    reportInvalidDecorators(decorators, "spread property");

    // This could be broadened to allow any type expression
    const target = parseReferenceExpression();

    return {
      kind: SyntaxKind.ModelSpreadProperty,
      target,
      ...finishNode(pos),
    };
  }

  function parseModelProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ModelPropertyNode {
    const id = parseIdentifier({
      message: "property",
      allowStringLiteral: true,
    });

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
    const value = parseExpression();

    const hasDefault = parseOptional(Token.Equals);
    const defaultValue = hasDefault ? parseExpression() : undefined;
    return {
      kind: SyntaxKind.ModelProperty,
      id,
      decorators,
      value,
      optional,
      default: defaultValue,
      ...finishNode(pos),
    };
  }

  function parseObjectLiteralPropertyOrSpread(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ObjectLiteralPropertyNode | ObjectLiteralSpreadPropertyNode {
    reportInvalidDecorators(decorators, "object literal property");

    return token() === Token.Ellipsis
      ? parseObjectLiteralSpreadProperty(pos)
      : parseObjectLiteralProperty(pos);
  }

  function parseObjectLiteralSpreadProperty(pos: number): ObjectLiteralSpreadPropertyNode {
    parseExpected(Token.Ellipsis);

    // This could be broadened to allow any type expression
    const target = parseReferenceExpression();

    return {
      kind: SyntaxKind.ObjectLiteralSpreadProperty,
      target,
      ...finishNode(pos),
    };
  }

  function parseObjectLiteralProperty(pos: number): ObjectLiteralPropertyNode {
    const id = parseIdentifier({
      message: "property",
    });

    parseExpected(Token.Colon);
    const value = parseExpression();

    return {
      kind: SyntaxKind.ObjectLiteralProperty,
      id,
      value,
      ...finishNode(pos),
    };
  }

  function parseScalarStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ScalarStatementNode {
    parseExpected(Token.ScalarKeyword);
    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();

    const optionalExtends = parseOptionalScalarExtends();
    const { items: members, range: bodyRange } = parseScalarMembers();

    return {
      kind: SyntaxKind.ScalarStatement,
      id,
      templateParameters,
      templateParametersRange,
      extends: optionalExtends,
      members,
      bodyRange,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseOptionalScalarExtends() {
    if (parseOptional(Token.ExtendsKeyword)) {
      return parseReferenceExpression();
    }
    return undefined;
  }

  function parseScalarMembers(): ListDetail<ScalarConstructorNode> {
    if (token() === Token.Semicolon) {
      nextToken();
      return createEmptyList<ScalarConstructorNode>();
    } else {
      return parseList(ListKind.ScalarMembers, parseScalarMember);
    }
  }

  function parseScalarMember(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ScalarConstructorNode {
    reportInvalidDecorators(decorators, "scalar member");

    parseExpected(Token.InitKeyword);
    const id = parseIdentifier();
    const { items: parameters } = parseFunctionParameters();
    return {
      kind: SyntaxKind.ScalarConstructor,
      id,
      parameters,
      ...finishNode(pos),
    };
  }

  function parseEnumStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): EnumStatementNode {
    parseExpected(Token.EnumKeyword);
    const id = parseIdentifier();
    const { items: members } = parseList(ListKind.EnumMembers, parseEnumMemberOrSpread);
    return {
      kind: SyntaxKind.EnumStatement,
      id,
      decorators,
      members,
      ...finishNode(pos),
    };
  }

  function parseEnumMemberOrSpread(pos: number, decorators: DecoratorExpressionNode[]) {
    return token() === Token.Ellipsis
      ? parseEnumSpreadMember(pos, decorators)
      : parseEnumMember(pos, decorators);
  }

  function parseEnumSpreadMember(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): EnumSpreadMemberNode {
    parseExpected(Token.Ellipsis);

    reportInvalidDecorators(decorators, "spread enum");

    const target = parseReferenceExpression();

    return {
      kind: SyntaxKind.EnumSpreadMember,
      target,
      ...finishNode(pos),
    };
  }

  function parseEnumMember(pos: number, decorators: DecoratorExpressionNode[]): EnumMemberNode {
    const id = parseIdentifier({
      message: "enumMember",
      allowStringLiteral: true,
    });

    let value: StringLiteralNode | NumericLiteralNode | undefined;
    if (parseOptional(Token.Colon)) {
      const expr = parseExpression();

      if (expr.kind === SyntaxKind.StringLiteral || expr.kind === SyntaxKind.NumericLiteral) {
        value = expr;
      } else if (
        expr.kind === SyntaxKind.TypeReference &&
        expr.target.flags & NodeFlags.ThisNodeHasError
      ) {
        parseErrorInNextFinishedNode = true;
      } else {
        error({ code: "token-expected", messageId: "numericOrStringLiteral", target: expr });
      }
    }

    return {
      kind: SyntaxKind.EnumMember,
      id,
      value,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseAliasStatement(pos: number): AliasStatementNode {
    parseExpected(Token.AliasKeyword);
    const id = parseIdentifier();
    const { items: templateParameters, range: templateParametersRange } =
      parseTemplateParameterList();
    parseExpected(Token.Equals);
    const value = parseExpression();
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.AliasStatement,
      id,
      templateParameters,
      templateParametersRange,
      value,
      ...finishNode(pos),
    };
  }

  function parseConstStatement(pos: number): ConstStatementNode {
    parseExpected(Token.ConstKeyword);
    const id = parseIdentifier();
    const type = parseOptionalTypeAnnotation();
    parseExpected(Token.Equals);
    const value = parseExpression();
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.ConstStatement,
      id,
      value,
      type,
      ...finishNode(pos),
    };
  }

  function parseOptionalTypeAnnotation(): Expression | undefined {
    if (parseOptional(Token.Colon)) {
      return parseExpression();
    }
    return undefined;
  }

  function parseExpression(): Expression {
    return parseUnionExpressionOrHigher();
  }

  function parseUnionExpressionOrHigher(): Expression {
    const pos = tokenPos();
    parseOptional(Token.Bar);
    const node: Expression = parseIntersectionExpressionOrHigher();

    if (token() !== Token.Bar) {
      return node;
    }

    const options = [node];
    while (parseOptional(Token.Bar)) {
      const expr = parseIntersectionExpressionOrHigher();
      options.push(expr);
    }

    return {
      kind: SyntaxKind.UnionExpression,
      options,
      ...finishNode(pos),
    };
  }

  function parseIntersectionExpressionOrHigher(): Expression {
    const pos = tokenPos();
    parseOptional(Token.Ampersand);
    const node: Expression = parseArrayExpressionOrHigher();

    if (token() !== Token.Ampersand) {
      return node;
    }

    const options = [node];
    while (parseOptional(Token.Ampersand)) {
      const expr = parseArrayExpressionOrHigher();
      options.push(expr);
    }

    return {
      kind: SyntaxKind.IntersectionExpression,
      options,
      ...finishNode(pos),
    };
  }

  function parseArrayExpressionOrHigher(): Expression {
    const pos = tokenPos();
    let expr = parsePrimaryExpression();

    while (parseOptional(Token.OpenBracket)) {
      parseExpected(Token.CloseBracket);

      expr = {
        kind: SyntaxKind.ArrayExpression,
        elementType: expr,
        ...finishNode(pos),
      };
    }

    return expr;
  }

  function parseStandaloneReferenceExpression() {
    const expr = parseReferenceExpression();
    if (parseDiagnostics.length === 0 && token() !== Token.EndOfFile) {
      error({ code: "token-expected", messageId: "unexpected", format: { token: Token[token()] } });
    }
    return expr;
  }

  function parseValueOfExpression(): ValueOfExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.ValueOfKeyword);
    const target = parseExpression();

    return {
      kind: SyntaxKind.ValueOfExpression,
      target,
      ...finishNode(pos),
    };
  }

  function parseTypeOfExpression(): TypeOfExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.TypeOfKeyword);
    const target = parseTypeOfTarget();

    return {
      kind: SyntaxKind.TypeOfExpression,
      target,
      ...finishNode(pos),
    };
  }

  function parseTypeOfTarget(): Expression {
    while (true) {
      switch (token()) {
        case Token.TypeOfKeyword:
          return parseTypeOfExpression();
        case Token.Identifier:
          return parseCallOrReferenceExpression();
        case Token.StringLiteral:
          return parseStringLiteral();
        case Token.StringTemplateHead:
          return parseStringTemplateExpression();
        case Token.TrueKeyword:
        case Token.FalseKeyword:
          return parseBooleanLiteral();
        case Token.NumericLiteral:
          return parseNumericLiteral();
        case Token.OpenParen:
          parseExpected(Token.OpenParen);
          const target = parseTypeOfTarget();
          parseExpected(Token.CloseParen);
          return target;
        default:
          return parseReferenceExpression("typeofTarget");
      }
    }
  }

  function parseReferenceExpression(
    message?: keyof CompilerDiagnostics["token-expected"]
  ): TypeReferenceNode {
    const pos = tokenPos();
    const target = parseIdentifierOrMemberExpression(message);
    return parseReferenceExpressionInternal(target, pos);
  }

  function parseCallOrReferenceExpression(
    message?: keyof CompilerDiagnostics["token-expected"]
  ): TypeReferenceNode | CallExpressionNode {
    const pos = tokenPos();
    const target = parseIdentifierOrMemberExpression(message);
    if (token() === Token.OpenParen) {
      const { items: args } = parseList(ListKind.FunctionArguments, parseExpression);
      return {
        kind: SyntaxKind.CallExpression,
        target,
        arguments: args,
        ...finishNode(pos),
      };
    }

    return parseReferenceExpressionInternal(target, pos);
  }

  function parseReferenceExpressionInternal(
    target: IdentifierNode | MemberExpressionNode,
    pos: number
  ): TypeReferenceNode {
    const { items: args } = parseOptionalList(ListKind.TemplateArguments, parseTemplateArgument);

    return {
      kind: SyntaxKind.TypeReference,
      target,
      arguments: args,
      ...finishNode(pos),
    };
  }

  function parseTemplateArgument(): TemplateArgumentNode {
    const pos = tokenPos();

    // Early error recovery for missing identifier followed by eq
    if (token() === Token.Equals) {
      error({ code: "token-expected", messageId: "identifier" });
      nextToken();
      return {
        kind: SyntaxKind.TemplateArgument,
        name: createMissingIdentifier(),
        argument: parseExpression(),
        ...finishNode(pos),
      };
    }

    const expr: Expression = parseExpression();

    const eq = parseOptional(Token.Equals);

    if (eq) {
      const isBareIdentifier = exprIsBareIdentifier(expr);

      if (!isBareIdentifier) {
        error({ code: "invalid-template-argument-name", target: expr });
      }

      return {
        kind: SyntaxKind.TemplateArgument,
        name: isBareIdentifier ? expr.target : createMissingIdentifier(),
        argument: parseExpression(),
        ...finishNode(pos),
      };
    } else {
      return {
        kind: SyntaxKind.TemplateArgument,
        argument: expr,
        ...finishNode(pos),
      };
    }
  }

  function parseAugmentDecorator(): AugmentDecoratorStatementNode {
    const pos = tokenPos();
    parseExpected(Token.AtAt);

    // Error recovery: false arg here means don't treat a keyword as an
    // identifier. We want to parse `@ model Foo` as invalid decorator
    // `@<missing identifier>` applied to `model Foo`, and not as `@model`
    // applied to invalid statement `Foo`.
    const target = parseIdentifierOrMemberExpression(undefined, false);
    const { items: args } = parseOptionalList(ListKind.DecoratorArguments, parseExpression);
    if (args.length === 0) {
      error({ code: "augment-decorator-target" });
      const emptyList = createEmptyList<TemplateArgumentNode>();
      return {
        kind: SyntaxKind.AugmentDecoratorStatement,
        target,
        targetType: {
          kind: SyntaxKind.TypeReference,
          target: createMissingIdentifier(),
          arguments: emptyList.items,
          ...finishNode(pos),
        },
        arguments: args,
        ...finishNode(pos),
      };
    }
    let [targetEntity, ...decoratorArgs] = args;
    if (targetEntity.kind !== SyntaxKind.TypeReference) {
      error({ code: "augment-decorator-target", target: targetEntity });
      const emptyList = createEmptyList<TemplateArgumentNode>();
      targetEntity = {
        kind: SyntaxKind.TypeReference,
        target: createMissingIdentifier(),
        arguments: emptyList.items,
        ...finishNode(pos),
      };
    }

    parseExpected(Token.Semicolon);

    return {
      kind: SyntaxKind.AugmentDecoratorStatement,
      target,
      targetType: targetEntity,
      arguments: decoratorArgs,
      ...finishNode(pos),
    };
  }
  function parseImportStatement(): ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Token.ImportKeyword);
    const path = parseStringLiteral();

    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.ImportStatement,
      path,
      ...finishNode(pos),
    };
  }

  function parseDecoratorExpression(): DecoratorExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.At);

    // Error recovery: false arg here means don't treat a keyword as an
    // identifier. We want to parse `@ model Foo` as invalid decorator
    // `@<missing identifier>` applied to `model Foo`, and not as `@model`
    // applied to invalid statement `Foo`.
    const target = parseIdentifierOrMemberExpression(undefined, false);
    const { items: args } = parseOptionalList(ListKind.DecoratorArguments, parseExpression);
    return {
      kind: SyntaxKind.DecoratorExpression,
      arguments: args,
      target,
      ...finishNode(pos),
    };
  }

  function parseDirectiveExpression(): DirectiveExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.Hash);

    const target = parseIdentifier();
    if (target.sv !== "suppress" && target.sv !== "deprecated") {
      error({
        code: "unknown-directive",
        format: { id: target.sv },
        target: { pos, end: pos + target.sv.length },
        printable: true,
      });
    }
    // The newline will mark the end of the directive.
    newLineIsTrivia = false;
    const args = [];
    while (token() !== Token.NewLine && token() !== Token.EndOfFile) {
      const param = parseDirectiveParameter();
      if (param) {
        args.push(param);
      }
    }

    newLineIsTrivia = true;
    nextToken();
    return {
      kind: SyntaxKind.DirectiveExpression,
      arguments: args,
      target,
      ...finishNode(pos),
    };
  }

  function parseDirectiveParameter(): DirectiveArgument | undefined {
    switch (token()) {
      case Token.Identifier:
        return parseIdentifier();
      case Token.StringLiteral:
        return parseStringLiteral();
      default:
        error({
          code: "token-expected",
          messageId: "unexpected",
          format: { token: Token[token()] },
        });
        do {
          nextToken();
        } while (
          !isStatementKeyword(token()) &&
          token() !== Token.NewLine &&
          token() !== Token.At &&
          token() !== Token.Semicolon &&
          token() !== Token.EndOfFile
        );
        return undefined;
    }
  }

  function parseIdentifierOrMemberExpression(
    message?: keyof CompilerDiagnostics["token-expected"],
    recoverFromKeyword = true
  ): IdentifierNode | MemberExpressionNode {
    const pos = tokenPos();
    let base: IdentifierNode | MemberExpressionNode = parseIdentifier({
      message,
      recoverFromKeyword,
    });
    while (token() !== Token.EndOfFile) {
      if (parseOptional(Token.Dot)) {
        base = {
          kind: SyntaxKind.MemberExpression,
          base,
          // Error recovery: false arg here means don't treat a keyword as an
          // identifier after `.` in member expression. Otherwise we will
          // parse `@Outer.<missing identifier> model M{}` as having decorator
          // `@Outer.model` applied to invalid statement `M {}` instead of
          // having incomplete decorator `@Outer.` applied to `model M {}`.
          id: parseIdentifier({
            recoverFromKeyword: false,
          }),
          selector: ".",
          ...finishNode(pos),
        };
      } else if (parseOptional(Token.ColonColon)) {
        base = {
          kind: SyntaxKind.MemberExpression,
          base,
          id: parseIdentifier(),
          selector: "::",
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return base;
  }

  function parsePrimaryExpression(): Expression {
    while (true) {
      switch (token()) {
        case Token.TypeOfKeyword:
          return parseTypeOfExpression();
        case Token.Identifier:
          return parseCallOrReferenceExpression();
        case Token.StringLiteral:
          return parseStringLiteral();
        case Token.StringTemplateHead:
          return parseStringTemplateExpression();
        case Token.TrueKeyword:
        case Token.FalseKeyword:
          return parseBooleanLiteral();
        case Token.NumericLiteral:
          return parseNumericLiteral();
        case Token.OpenBrace:
          return parseModelExpression();
        case Token.OpenBracket:
          return parseTupleExpression();
        case Token.OpenParen:
          return parseParenthesizedExpression();
        case Token.At:
          const decorators = parseDecoratorList();
          reportInvalidDecorators(decorators, "expression");
          continue;
        case Token.Hash:
          const directives = parseDirectiveList();
          reportInvalidDirective(directives, "expression");
          continue;
        case Token.HashBrace:
          return parseObjectLiteral();
        case Token.HashBracket:
          return parseArrayLiteral();
        case Token.VoidKeyword:
          return parseVoidKeyword();
        case Token.NeverKeyword:
          return parseNeverKeyword();
        case Token.UnknownKeyword:
          return parseUnknownKeyword();
        default:
          return parseReferenceExpression("expression");
      }
    }
  }

  function parseExternKeyword(): ExternKeywordNode {
    const pos = tokenPos();
    parseExpected(Token.ExternKeyword);
    return {
      kind: SyntaxKind.ExternKeyword,
      ...finishNode(pos),
    };
  }

  function parseVoidKeyword(): VoidKeywordNode {
    const pos = tokenPos();
    parseExpected(Token.VoidKeyword);
    return {
      kind: SyntaxKind.VoidKeyword,
      ...finishNode(pos),
    };
  }

  function parseNeverKeyword(): NeverKeywordNode {
    const pos = tokenPos();
    parseExpected(Token.NeverKeyword);
    return {
      kind: SyntaxKind.NeverKeyword,
      ...finishNode(pos),
    };
  }

  function parseUnknownKeyword(): AnyKeywordNode {
    const pos = tokenPos();
    parseExpected(Token.UnknownKeyword);
    return {
      kind: SyntaxKind.UnknownKeyword,
      ...finishNode(pos),
    };
  }

  function parseParenthesizedExpression(): Expression {
    const pos = tokenPos();
    parseExpected(Token.OpenParen);
    const expr = parseExpression();
    parseExpected(Token.CloseParen);
    return { ...expr, ...finishNode(pos) };
  }

  function parseTupleExpression(): TupleExpressionNode {
    const pos = tokenPos();
    const { items: values } = parseList(ListKind.Tuple, parseExpression);
    return {
      kind: SyntaxKind.TupleExpression,
      values,
      ...finishNode(pos),
    };
  }

  function parseModelExpression(): ModelExpressionNode {
    const pos = tokenPos();
    const { items: properties, range: bodyRange } = parseList(
      ListKind.ModelProperties,
      parseModelPropertyOrSpread
    );
    return {
      kind: SyntaxKind.ModelExpression,
      properties,
      bodyRange,
      ...finishNode(pos),
    };
  }

  function parseObjectLiteral(): ObjectLiteralNode {
    const pos = tokenPos();
    const { items: properties, range: bodyRange } = parseList(
      ListKind.ObjectLiteralProperties,
      parseObjectLiteralPropertyOrSpread
    );
    return {
      kind: SyntaxKind.ObjectLiteral,
      properties,
      bodyRange,
      ...finishNode(pos),
    };
  }

  function parseArrayLiteral(): ArrayLiteralNode {
    const pos = tokenPos();
    const { items: values } = parseList(ListKind.ArrayLiteral, parseExpression);
    return {
      kind: SyntaxKind.ArrayLiteral,
      values,
      ...finishNode(pos),
    };
  }

  function parseStringLiteral(): StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Token.StringLiteral);
    return {
      kind: SyntaxKind.StringLiteral,
      value,
      ...finishNode(pos),
    };
  }

  function parseStringTemplateExpression(): StringTemplateExpressionNode {
    const pos = tokenPos();
    const head = parseStringTemplateHead();
    const spans = parseStringTemplateSpans(head.tokenFlags);
    const last = spans[spans.length - 1];

    if (head.tokenFlags & TokenFlags.TripleQuoted) {
      const [indentationsStart, indentationEnd] = scanner.findTripleQuotedStringIndent(
        last.literal.pos,
        last.literal.end
      );
      mutate(head).value = scanner.unindentAndUnescapeTripleQuotedString(
        head.pos,
        head.end,
        indentationsStart,
        indentationEnd,
        Token.StringTemplateHead,
        head.tokenFlags
      );
      for (const span of spans) {
        mutate(span.literal).value = scanner.unindentAndUnescapeTripleQuotedString(
          span.literal.pos,
          span.literal.end,
          indentationsStart,
          indentationEnd,
          span === last ? Token.StringTemplateTail : Token.StringTemplateMiddle,
          head.tokenFlags
        );
      }
    }
    return {
      kind: SyntaxKind.StringTemplateExpression,
      head,
      spans,
      ...finishNode(pos),
    };
  }

  function parseStringTemplateHead(): StringTemplateHeadNode {
    const pos = tokenPos();
    const flags = tokenFlags();
    const text = flags & TokenFlags.TripleQuoted ? "" : tokenValue();

    parseExpected(Token.StringTemplateHead);

    return {
      kind: SyntaxKind.StringTemplateHead,
      value: text,
      tokenFlags: flags,
      ...finishNode(pos),
    };
  }

  function parseStringTemplateSpans(tokenFlags: TokenFlags): readonly StringTemplateSpanNode[] {
    const list: StringTemplateSpanNode[] = [];
    let node: StringTemplateSpanNode;
    do {
      node = parseTemplateTypeSpan(tokenFlags);
      list.push(node);
    } while (node.literal.kind === SyntaxKind.StringTemplateMiddle);
    return list;
  }

  function parseTemplateTypeSpan(tokenFlags: TokenFlags): StringTemplateSpanNode {
    const pos = tokenPos();
    const expression = parseExpression();
    const literal = parseLiteralOfTemplateSpan(tokenFlags);
    return {
      kind: SyntaxKind.StringTemplateSpan,
      literal,
      expression,
      ...finishNode(pos),
    };
  }
  function parseLiteralOfTemplateSpan(
    headTokenFlags: TokenFlags
  ): StringTemplateMiddleNode | StringTemplateTailNode {
    const pos = tokenPos();
    const flags = tokenFlags();
    const text = flags & TokenFlags.TripleQuoted ? "" : tokenValue();

    if (token() === Token.CloseBrace) {
      nextStringTemplateToken(headTokenFlags);
      return parseTemplateMiddleOrTemplateTail();
    } else {
      parseExpected(Token.StringTemplateTail);
      return {
        kind: SyntaxKind.StringTemplateTail,
        value: text,
        tokenFlags: flags,
        ...finishNode(pos),
      };
    }
  }

  function parseTemplateMiddleOrTemplateTail(): StringTemplateMiddleNode | StringTemplateTailNode {
    const pos = tokenPos();
    const flags = tokenFlags();
    const text = flags & TokenFlags.TripleQuoted ? "" : tokenValue();
    const kind =
      token() === Token.StringTemplateMiddle
        ? SyntaxKind.StringTemplateMiddle
        : SyntaxKind.StringTemplateTail;

    nextToken();
    return {
      kind,
      value: text,
      tokenFlags: flags,
      ...finishNode(pos),
    };
  }

  function parseNumericLiteral(): NumericLiteralNode {
    const pos = tokenPos();
    const valueAsString = tokenValue();
    const value = Number(valueAsString);

    parseExpected(Token.NumericLiteral);
    return {
      kind: SyntaxKind.NumericLiteral,
      value,
      valueAsString,
      ...finishNode(pos),
    };
  }

  function parseBooleanLiteral(): BooleanLiteralNode {
    const pos = tokenPos();
    const token = parseExpectedOneOf(Token.TrueKeyword, Token.FalseKeyword);
    const value = token === Token.TrueKeyword;
    return {
      kind: SyntaxKind.BooleanLiteral,
      value,
      ...finishNode(pos),
    };
  }

  function parseIdentifier(options?: {
    message?: keyof CompilerDiagnostics["token-expected"];
    allowStringLiteral?: boolean; // Allow string literals to be used as identifiers for backward-compatibility, but convert to an identifier node.
    recoverFromKeyword?: boolean;
  }): IdentifierNode {
    if (options?.recoverFromKeyword !== false && isKeyword(token())) {
      error({ code: "reserved-identifier" });
    } else if (
      token() !== Token.Identifier &&
      (!options?.allowStringLiteral || token() !== Token.StringLiteral)
    ) {
      // Error recovery: when we fail to parse an identifier or expression,
      // we insert a synthesized identifier with a unique name.
      error({ code: "token-expected", messageId: options?.message ?? "identifier" });
      return createMissingIdentifier();
    }

    const pos = tokenPos();
    const sv = tokenValue();
    nextToken();

    return {
      kind: SyntaxKind.Identifier,
      sv,
      ...finishNode(pos),
    };
  }

  function parseDeclaration(
    pos: number
  ): DecoratorDeclarationStatementNode | FunctionDeclarationStatementNode | InvalidStatementNode {
    const modifiers = parseModifiers();
    switch (token()) {
      case Token.DecKeyword:
        return parseDecoratorDeclarationStatement(pos, modifiers);
      case Token.FnKeyword:
        return parseFunctionDeclarationStatement(pos, modifiers);
    }
    return parseInvalidStatement(pos, []);
  }

  function parseModifiers(): Modifier[] {
    const modifiers: Modifier[] = [];
    let modifier;
    while ((modifier = parseModifier())) {
      modifiers.push(modifier);
    }
    return modifiers;
  }

  function parseModifier(): Modifier | undefined {
    switch (token()) {
      case Token.ExternKeyword:
        return parseExternKeyword();
      default:
        return undefined;
    }
  }

  function parseDecoratorDeclarationStatement(
    pos: number,
    modifiers: Modifier[]
  ): DecoratorDeclarationStatementNode {
    const modifierFlags = modifiersToFlags(modifiers);
    parseExpected(Token.DecKeyword);
    const id = parseIdentifier();
    const allParamListDetail = parseFunctionParameters();
    let [target, ...parameters] = allParamListDetail.items;
    if (target === undefined) {
      error({ code: "decorator-decl-target", target: { pos, end: previousTokenEnd } });
      target = {
        kind: SyntaxKind.FunctionParameter,
        id: createMissingIdentifier(),
        type: createMissingTypeReference(),
        optional: false,
        rest: false,
        ...finishNode(pos),
      };
    }
    if (target.optional) {
      error({ code: "decorator-decl-target", messageId: "required" });
    }
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.DecoratorDeclarationStatement,
      modifiers,
      modifierFlags,
      id,
      target,
      parameters,
      ...finishNode(pos),
    };
  }

  function parseFunctionDeclarationStatement(
    pos: number,
    modifiers: Modifier[]
  ): FunctionDeclarationStatementNode {
    const modifierFlags = modifiersToFlags(modifiers);
    parseExpected(Token.FnKeyword);
    const id = parseIdentifier();
    const { items: parameters } = parseFunctionParameters();
    let returnType;
    if (parseOptional(Token.Colon)) {
      returnType = parseExpression();
    }
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.FunctionDeclarationStatement,
      modifiers,
      modifierFlags,
      id,
      parameters,
      returnType,
      ...finishNode(pos),
    };
  }

  function parseFunctionParameters(): ListDetail<FunctionParameterNode> {
    const parameters = parseList<typeof ListKind.FunctionParameters, FunctionParameterNode>(
      ListKind.FunctionParameters,
      parseFunctionParameter
    );

    let foundOptional = false;
    for (const [index, item] of parameters.items.entries()) {
      if (!item.optional && foundOptional) {
        error({ code: "required-parameter-first", target: item });
        continue;
      }

      if (item.optional) {
        foundOptional = true;
      }

      if (item.rest && item.optional) {
        error({ code: "rest-parameter-required", target: item });
      }
      if (item.rest && index !== parameters.items.length - 1) {
        error({ code: "rest-parameter-last", target: item });
      }
    }
    return parameters;
  }

  function parseFunctionParameter(): FunctionParameterNode {
    const pos = tokenPos();
    const rest = parseOptional(Token.Ellipsis);
    const id = parseIdentifier({ message: "property" });

    const optional = parseOptional(Token.Question);
    let type;
    if (parseOptional(Token.Colon)) {
      type = parseMixedParameterConstraint();
    }
    return {
      kind: SyntaxKind.FunctionParameter,
      id,
      type,
      optional,
      rest,
      ...finishNode(pos),
    };
  }

  function modifiersToFlags(modifiers: Modifier[]): ModifierFlags {
    let flags = ModifierFlags.None;
    for (const modifier of modifiers) {
      switch (modifier.kind) {
        case SyntaxKind.ExternKeyword:
          flags |= ModifierFlags.Extern;
          break;
      }
    }
    return flags;
  }

  function parseProjectionStatement(pos: number): ProjectionStatementNode {
    parseExpected(Token.ProjectionKeyword);
    const selector = parseProjectionSelector();
    parseExpected(Token.Hash);

    const id = parseIdentifier();

    parseExpected(Token.OpenBrace);

    const projectionMap = new Map<string, ProjectionNode>();
    const projections: ProjectionNode[] = [];
    while (token() === Token.Identifier) {
      const projection = parseProjection();
      if (projection.direction !== "<error>") {
        if (projectionMap.has(projection.direction)) {
          error({ code: "duplicate-symbol", target: projection, format: { name: "projection" } });
        } else {
          projectionMap.set(projection.direction, projection);
        }
      }
      // NOTE: Don't drop projections with error in direction definition from the AST.
      projections.push(projection);
    }
    parseExpected(Token.CloseBrace);

    return {
      kind: SyntaxKind.ProjectionStatement,
      selector,
      projections,
      preTo: projectionMap.get("pre_to"),
      preFrom: projectionMap.get("pre_from"),
      from: projectionMap.get("from"),
      to: projectionMap.get("to"),
      id,
      ...finishNode(pos),
    };
  }

  function parseProjection(): ProjectionNode {
    const pos = tokenPos();
    let directionId = parseIdentifier({ message: "projectionDirection" });
    let direction: "to" | "from" | "pre_to" | "pre_from" | "<error>";
    const modifierIds: IdentifierNode[] = [];
    let isPre = false;

    if (directionId.sv === "pre") {
      isPre = true;
      modifierIds.push(directionId);
      directionId = parseIdentifier({ message: "projectionDirection" });
    }
    if (directionId.sv !== "to" && directionId.sv !== "from") {
      error({ code: "token-expected", messageId: "projectionDirection" });
      direction = "<error>";
    } else if (isPre) {
      direction = directionId.sv === "to" ? "pre_to" : "pre_from";
    } else {
      direction = directionId.sv;
    }

    let parameters: ProjectionParameterDeclarationNode[];
    if (token() === Token.OpenParen) {
      parameters = parseList(ListKind.ProjectionParameter, parseProjectionParameter).items;
    } else {
      parameters = [];
    }

    parseExpected(Token.OpenBrace);
    const body: ProjectionStatementItem[] = parseProjectionStatementList();
    parseExpected(Token.CloseBrace);

    return {
      kind: SyntaxKind.Projection,
      body,
      direction,
      directionId,
      modifierIds,
      parameters,
      ...finishNode(pos),
    };
  }

  function parseProjectionParameter(): ProjectionParameterDeclarationNode {
    const pos = tokenPos();
    const id = parseIdentifier();
    return {
      kind: SyntaxKind.ProjectionParameterDeclaration,
      id,
      ...finishNode(pos),
    };
  }
  function parseProjectionStatementList(): ProjectionStatementItem[] {
    const stmts = [];

    while (token() !== Token.CloseBrace) {
      const startPos = tokenPos();
      if (token() === Token.EndOfFile) {
        error({ code: "token-expected", messageId: "default", format: { token: "}" } });
        break;
      }

      const expr = parseProjectionExpressionStatement();
      stmts.push(expr);

      if (tokenPos() === startPos) {
        // we didn't manage to parse anything, so break out
        // and we'll report errors elsewhere.
        break;
      }
    }

    return stmts;
  }

  function parseProjectionExpressionStatement(): ProjectionExpressionStatementNode {
    const pos = tokenPos();
    const expr = parseProjectionExpression();
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.ProjectionExpressionStatement,
      expr,
      ...finishNode(pos),
    };
  }

  function parseProjectionExpression() {
    return parseProjectionReturnExpressionOrHigher();
  }

  function parseProjectionReturnExpressionOrHigher(): ProjectionExpression {
    if (token() === Token.ReturnKeyword) {
      const pos = tokenPos();
      parseExpected(Token.ReturnKeyword);
      return {
        kind: SyntaxKind.Return,
        value: parseProjectionExpression(),
        ...finishNode(pos),
      };
    }

    return parseProjectionLogicalOrExpressionOrHigher();
  }

  function parseProjectionLogicalOrExpressionOrHigher(): ProjectionExpression {
    let expr = parseProjectionLogicalAndExpressionOrHigher();
    while (token() !== Token.EndOfFile) {
      const pos = expr.pos;
      if (parseOptional(Token.BarBar)) {
        expr = {
          kind: SyntaxKind.ProjectionLogicalExpression,
          op: "||",
          left: expr,
          right: parseProjectionLogicalAndExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionLogicalAndExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionEqualityExpressionOrHigher();

    while (token() !== Token.EndOfFile) {
      const pos = expr.pos;
      if (parseOptional(Token.AmpsersandAmpersand)) {
        expr = {
          kind: SyntaxKind.ProjectionLogicalExpression,
          op: "&&",
          left: expr,
          right: parseProjectionEqualityExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionEqualityExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionRelationalExpressionOrHigher();
    while (token() !== Token.EndOfFile) {
      const pos = expr.pos;
      const tok = token();
      if (tok === Token.EqualsEquals || tok === Token.ExclamationEquals) {
        const op = tokenValue() as "==" | "!=";
        nextToken();
        expr = {
          kind: SyntaxKind.ProjectionEqualityExpression,
          op,
          left: expr,
          right: parseProjectionRelationalExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionRelationalExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionAdditiveExpressionOrHigher();

    while (token() !== Token.EndOfFile) {
      const pos: number = expr.pos;
      const tok = token();
      if (
        tok === Token.LessThan ||
        tok === Token.LessThanEquals ||
        tok === Token.GreaterThan ||
        tok === Token.GreaterThanEquals
      ) {
        const op = tokenValue() as "<" | "<=" | ">" | ">=";
        nextToken();
        expr = {
          kind: SyntaxKind.ProjectionRelationalExpression,
          op,
          left: expr,
          right: parseProjectionAdditiveExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionAdditiveExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionMultiplicativeExpressionOrHigher();
    while (token() !== Token.EndOfFile) {
      const pos: number = expr.pos;
      const tok = token();
      if (tok === Token.Plus || tok === Token.Hyphen) {
        const op = tokenValue() as "+" | "-";
        nextToken();
        expr = {
          kind: SyntaxKind.ProjectionArithmeticExpression,
          op,
          left: expr,
          right: parseProjectionMultiplicativeExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionMultiplicativeExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionUnaryExpressionOrHigher();
    while (token() !== Token.EndOfFile) {
      const pos: number = expr.pos;
      const tok = token();
      if (tok === Token.ForwardSlash || tok === Token.Star) {
        const op = tokenValue() as "/" | "*";
        nextToken();
        expr = {
          kind: SyntaxKind.ProjectionArithmeticExpression,
          op,
          left: expr,
          right: parseProjectionUnaryExpressionOrHigher(),
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionUnaryExpressionOrHigher(): ProjectionExpression {
    if (token() === Token.Exclamation) {
      const pos = tokenPos();
      nextToken();
      return {
        kind: SyntaxKind.ProjectionUnaryExpression,
        op: "!",
        target: parseProjectionUnaryExpressionOrHigher(),
        ...finishNode(pos),
      };
    }
    return parseProjectionCallExpressionOrHigher();
  }

  function parseProjectionCallExpressionOrHigher(): ProjectionExpression {
    let expr: ProjectionExpression = parseProjectionDecoratorReferenceExpressionOrHigher();

    while (token() !== Token.EndOfFile) {
      const pos: number = expr.pos;
      expr = parseProjectionMemberExpressionRest(expr, pos);
      if (token() === Token.OpenParen) {
        expr = {
          kind: SyntaxKind.ProjectionCallExpression,
          callKind: "method",
          target: expr,
          arguments: parseList(ListKind.CallArguments, parseProjectionExpression).items,
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionDecoratorReferenceExpressionOrHigher(): ProjectionExpression {
    if (token() === Token.At) {
      const pos = tokenPos();
      nextToken();
      return {
        kind: SyntaxKind.ProjectionDecoratorReferenceExpression,
        target: parseIdentifierOrMemberExpression(undefined, true),
        ...finishNode(pos),
      };
    }

    return parseProjectionMemberExpressionOrHigher();
  }

  function parseProjectionMemberExpressionOrHigher(): ProjectionExpression {
    const pos = tokenPos();
    let expr = parseProjectionPrimaryExpression();
    expr = parseProjectionMemberExpressionRest(expr, pos);
    return expr;
  }

  function parseProjectionMemberExpressionRest(
    expr: ProjectionExpression,
    pos: number
  ): ProjectionExpression {
    while (token() !== Token.EndOfFile) {
      if (parseOptional(Token.Dot)) {
        expr = {
          kind: SyntaxKind.ProjectionMemberExpression,
          base: expr,
          id: parseIdentifier(),
          selector: ".",
          ...finishNode(pos),
        };
      } else if (parseOptional(Token.ColonColon)) {
        expr = {
          kind: SyntaxKind.ProjectionMemberExpression,
          base: expr,
          id: parseIdentifier(),
          selector: "::",
          ...finishNode(pos),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  function parseProjectionPrimaryExpression(): ProjectionExpression {
    switch (token()) {
      case Token.IfKeyword:
        return parseProjectionIfExpression();
      case Token.NumericLiteral:
        return parseNumericLiteral();
      case Token.StringLiteral:
        return parseStringLiteral();
      case Token.TrueKeyword:
      case Token.FalseKeyword:
        return parseBooleanLiteral();
      case Token.OpenBracket:
        return parseProjectionTupleExpression();
      case Token.OpenBrace:
        return parseProjectionModelExpression();
      case Token.OpenParen:
        return parseProjectionLambdaOrParenthesizedExpression();
      case Token.VoidKeyword:
        return parseVoidKeyword();
      case Token.NeverKeyword:
        return parseNeverKeyword();
      case Token.UnknownKeyword:
        return parseUnknownKeyword();
      default:
        return parseIdentifier({ message: "expression" });
    }
  }

  function parseProjectionLambdaOrParenthesizedExpression(): ProjectionExpression {
    const pos = tokenPos();
    const exprs = parseList(ListKind.ProjectionExpression, parseProjectionExpression).items;
    if (token() === Token.EqualsGreaterThan) {
      // unpack the exprs (which should be just identifiers) into a param list
      const params: ProjectionLambdaParameterDeclarationNode[] = [];
      for (const expr of exprs) {
        if (expr.kind === SyntaxKind.Identifier) {
          params.push(
            withSymbol({
              kind: SyntaxKind.ProjectionLambdaParameterDeclaration,
              id: expr,
              pos: expr.pos,
              end: expr.end,
              flags: NodeFlags.None,
            })
          );
        } else {
          error({ code: "token-expected", messageId: "identifier", target: expr });
        }
      }

      return parseProjectionLambdaExpressionRest(pos, params);
    } else {
      if (exprs.length === 0) {
        error({
          code: "token-expected",
          messageId: "expression",
        });
      }
      // verify we only have one entry
      for (let i = 1; i < exprs.length; i++) {
        error({
          code: "token-expected",
          messageId: "unexpected",
          format: { token: "expression" },
          target: exprs[i],
        });
      }

      return exprs[0];
    }
  }

  function parseProjectionLambdaExpressionRest(
    pos: number,
    parameters: ProjectionLambdaParameterDeclarationNode[]
  ): ProjectionLambdaExpressionNode {
    parseExpected(Token.EqualsGreaterThan);
    const body = parseProjectionBlockExpression();
    return {
      kind: SyntaxKind.ProjectionLambdaExpression,
      parameters,
      body,
      ...finishNode(pos),
    };
  }

  function parseProjectionModelExpression(): ProjectionModelExpressionNode {
    const pos = tokenPos();
    const { items: properties } = parseList(
      ListKind.ModelProperties,
      parseProjectionModelPropertyOrSpread
    );
    return {
      kind: SyntaxKind.ProjectionModelExpression,
      properties,
      ...finishNode(pos),
    };
  }

  function parseProjectionModelPropertyOrSpread(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ) {
    return token() === Token.Ellipsis
      ? parseProjectionModelSpreadProperty(pos, decorators)
      : parseProjectionModelProperty(pos, decorators);
  }

  function parseProjectionModelSpreadProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ProjectionModelSpreadPropertyNode {
    parseExpected(Token.Ellipsis);

    reportInvalidDecorators(decorators, "spread property");

    const target = parseProjectionExpression();

    return {
      kind: SyntaxKind.ProjectionModelSpreadProperty,
      target,
      ...finishNode(pos),
    };
  }

  function parseProjectionModelProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ProjectionModelPropertyNode | ProjectionModelSpreadPropertyNode {
    const id = parseIdentifier({ message: "property", allowStringLiteral: true });

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
    const value = parseProjectionExpression();

    const hasDefault = parseOptional(Token.Equals);
    const defaultValue = hasDefault ? parseProjectionExpression() : undefined;
    return {
      kind: SyntaxKind.ProjectionModelProperty,
      id,
      decorators,
      value,
      optional,
      default: defaultValue,
      ...finishNode(pos),
    };
  }

  function parseProjectionIfExpression(): ProjectionIfExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.IfKeyword);
    const test = parseProjectionExpression();
    const consequent = parseProjectionBlockExpression();
    let alternate = undefined;
    if (parseOptional(Token.ElseKeyword)) {
      if (token() === Token.IfKeyword) {
        alternate = parseProjectionIfExpression();
      } else {
        alternate = parseProjectionBlockExpression();
      }
    }

    return {
      kind: SyntaxKind.ProjectionIfExpression,
      test,
      consequent,
      alternate,
      ...finishNode(pos),
    };
  }

  function parseProjectionBlockExpression(): ProjectionBlockExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.OpenBrace);
    const statements = parseProjectionStatementList();
    parseExpected(Token.CloseBrace);
    return {
      kind: SyntaxKind.ProjectionBlockExpression,
      statements,
      ...finishNode(pos),
    };
  }

  function parseProjectionTupleExpression(): ProjectionTupleExpressionNode {
    const pos = tokenPos();
    const { items: values } = parseList(ListKind.Tuple, parseProjectionExpression);
    return {
      kind: SyntaxKind.ProjectionTupleExpression,
      values,
      ...finishNode(pos),
    };
  }
  function parseProjectionSelector():
    | IdentifierNode
    | MemberExpressionNode
    | ProjectionInterfaceSelectorNode
    | ProjectionModelSelectorNode
    | ProjectionScalarSelectorNode
    | ProjectionModelPropertySelectorNode
    | ProjectionOperationSelectorNode
    | ProjectionUnionSelectorNode
    | ProjectionUnionVariantSelectorNode
    | ProjectionEnumSelectorNode
    | ProjectionEnumMemberSelectorNode {
    const pos = tokenPos();
    const selectorTok = expectTokenIsOneOf(
      Token.Identifier,
      Token.ModelKeyword,
      Token.OpKeyword,
      Token.InterfaceKeyword,
      Token.UnionKeyword,
      Token.EnumKeyword,
      Token.ScalarKeyword
    );

    switch (selectorTok) {
      case Token.Identifier:
        const id = parseIdentifierOrMemberExpression(undefined, true);
        if (id.kind === SyntaxKind.Identifier) {
          switch (id.sv) {
            case "modelproperty":
              return {
                kind: SyntaxKind.ProjectionModelPropertySelector,
                ...finishNode(pos),
              };
            case "unionvariant":
              return {
                kind: SyntaxKind.ProjectionUnionVariantSelector,
                ...finishNode(pos),
              };
            case "enummember":
              return {
                kind: SyntaxKind.ProjectionEnumMemberSelector,
                ...finishNode(pos),
              };
          }
        }
        return id;
      case Token.ModelKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionModelSelector,
          ...finishNode(pos),
        };
      case Token.OpKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionOperationSelector,
          ...finishNode(pos),
        };
      case Token.InterfaceKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionInterfaceSelector,
          ...finishNode(pos),
        };
      case Token.UnionKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionUnionSelector,
          ...finishNode(pos),
        };
      case Token.EnumKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionEnumSelector,
          ...finishNode(pos),
        };
      case Token.ScalarKeyword:
        nextToken();
        return {
          kind: SyntaxKind.ProjectionScalarSelector,
          ...finishNode(pos),
        };
      default:
        // recovery: return a missing identifier to use as the selector
        // we don't need to emit a diagnostic here as the `expectTokenOneOf` above
        // will have done so.
        return createMissingIdentifier();
    }
  }

  function parseRange<T>(mode: ParseMode, range: TextRange, callback: () => T): T {
    const savedMode = currentMode;
    const result = scanner.scanRange(range, () => {
      currentMode = mode;
      nextToken();
      return callback();
    });
    currentMode = savedMode;
    return result;
  }

  /** Remove leading slash-star-star and trailing  star-slash (if terminated) from doc comment range. */
  function innerDocRange(range: TextRange): TextRange {
    return {
      pos: range.pos + 3,
      end: tokenFlags() & TokenFlags.Unterminated ? range.end : range.end - 2,
    };
  }

  function parseDocList(): [pos: number, nodes: DocNode[]] {
    if (docRanges.length === 0 || options.docs === false) {
      return [tokenPos(), []];
    }
    const docs: DocNode[] = [];
    for (const range of docRanges) {
      const doc = parseRange(ParseMode.Doc, innerDocRange(range), () => parseDoc(range));
      docs.push(doc);
      if (range.comment) {
        mutate(range.comment).parsedAsDocs = true;
      }
    }

    return [docRanges[0].pos, docs];
  }

  function parseDoc(range: TextRange): DocNode {
    const content: DocContent[] = [];
    const tags: DocTag[] = [];

    loop: while (true) {
      switch (token()) {
        case Token.EndOfFile:
          break loop;
        case Token.At:
          const tag = parseDocTag();
          tags.push(tag);
          break;
        default:
          content.push(...parseDocContent());
          break;
      }
    }

    return {
      kind: SyntaxKind.Doc,
      content,
      tags,
      ...finishNode(range.pos),
      end: range.end,
    };
  }

  function parseDocContent(): DocContent[] {
    const parts: string[] = [];
    const source = scanner.file.text;
    const pos = tokenPos();

    let start = pos;
    let inCodeFence = false;

    loop: while (true) {
      switch (token()) {
        case Token.DocCodeFenceDelimiter:
          inCodeFence = !inCodeFence;
          nextToken();
          break;
        case Token.NewLine:
          parts.push(source.substring(start, tokenPos()));
          parts.push("\n"); // normalize line endings
          nextToken();
          start = tokenPos();
          while (parseOptional(Token.Whitespace));
          if (!parseOptional(Token.Star)) {
            break;
          }
          if (!inCodeFence) {
            parseOptional(Token.Whitespace);
            start = tokenPos();
            break;
          }
          // If we are in a code fence we want to preserve the leading whitespace
          // except for the first space after the star which is used as indentation.
          const whitespaceStart = tokenPos();
          parseOptional(Token.Whitespace);

          // This `min` handles the case when there is no whitespace after the
          // star e.g. a case like this:
          //
          // /**
          //  *```
          //  *foo-bar
          //  *```
          //  */
          //
          // Not having space after the star isn't idiomatic, but we support this.
          // `whitespaceStart + 1` strips the first space before `foo-bar` if there
          // is a space after the star (the idiomatic case).
          start = Math.min(whitespaceStart + 1, tokenPos());
          break;
        case Token.EndOfFile:
          break loop;
        case Token.At:
          if (!inCodeFence) {
            break loop;
          }
          nextToken();
          break;
        case Token.DocText:
          parts.push(source.substring(start, tokenPos()));
          parts.push(tokenValue());
          nextToken();
          start = tokenPos();
          break;
        default:
          nextToken();
          break;
      }
    }

    parts.push(source.substring(start, tokenPos()));
    const text = trim(parts.join(""));

    return [
      {
        kind: SyntaxKind.DocText,
        text,
        ...finishNode(pos),
      },
    ];
  }

  type ParamLikeTag = DocTemplateTagNode | DocParamTagNode;
  type SimpleTag = DocReturnsTagNode | DocErrorsTagNode | DocUnknownTagNode;

  /**
   * Parses a documentation tag.
   *
   * @see <a href="https://typespec.io/docs/language-basics/documentation#doc-comments">TypeSpec documentation docs</a>
   */
  function parseDocTag(): DocTag {
    const pos = tokenPos();
    parseExpected(Token.At);
    const tagName = parseDocIdentifier("tag");
    switch (tagName.sv) {
      case "param":
        return parseDocParamLikeTag(pos, tagName, SyntaxKind.DocParamTag, "param");
      case "template":
        return parseDocParamLikeTag(pos, tagName, SyntaxKind.DocTemplateTag, "templateParam");
      case "prop":
        return parseDocPropTag(pos, tagName);
      case "return":
      case "returns":
        return parseDocSimpleTag(pos, tagName, SyntaxKind.DocReturnsTag);
      case "errors":
        return parseDocSimpleTag(pos, tagName, SyntaxKind.DocErrorsTag);
      default:
        return parseDocSimpleTag(pos, tagName, SyntaxKind.DocUnknownTag);
    }
  }

  /**
   * Handles param-like documentation comment tags.
   * For example, `@param` and `@template`.
   */
  function parseDocParamLikeTag(
    pos: number,
    tagName: IdentifierNode,
    kind: ParamLikeTag["kind"],
    messageId: keyof CompilerDiagnostics["doc-invalid-identifier"]
  ): ParamLikeTag {
    const { name, content } = parseDocParamLikeTagInternal(messageId);

    return {
      kind,
      tagName,
      paramName: name,
      content,
      ...finishNode(pos),
    };
  }

  function parseDocPropTag(pos: number, tagName: IdentifierNode): DocPropTagNode {
    const { name, content } = parseDocParamLikeTagInternal("prop");

    return {
      kind: SyntaxKind.DocPropTag,
      tagName,
      propName: name,
      content,
      ...finishNode(pos),
    };
  }

  function parseDocParamLikeTagInternal(
    messageId: keyof CompilerDiagnostics["doc-invalid-identifier"]
  ): { name: IdentifierNode; content: DocTextNode[] } {
    const name = parseDocIdentifier(messageId);
    parseOptionalHyphenDocParamLikeTag();
    const content = parseDocContent();
    return { name, content };
  }

  /**
   * Handles the optional hyphen in param-like documentation comment tags.
   *
   * TypeSpec recommends no hyphen, but supports a hyphen to match TSDoc.
   * (Original design discussion recorded in [2390].)
   *
   * [2390]: https://github.com/microsoft/typespec/issues/2390
   */
  function parseOptionalHyphenDocParamLikeTag() {
    while (parseOptional(Token.Whitespace)); // Skip whitespace
    if (parseOptional(Token.Hyphen)) {
      // The doc content started with a hyphen, so skip subsequent whitespace
      // (The if statement already advanced past the hyphen itself.)
      while (parseOptional(Token.Whitespace));
    }
  }

  function parseDocSimpleTag(
    pos: number,
    tagName: IdentifierNode,
    kind: SimpleTag["kind"]
  ): SimpleTag {
    const content = parseDocContent();
    return {
      kind,
      tagName,
      content,
      ...finishNode(pos),
    };
  }

  function parseDocIdentifier(
    messageId: keyof CompilerDiagnostics["doc-invalid-identifier"]
  ): IdentifierNode {
    // We don't allow whitespace between @ and tag name, but allow
    // whitespace before all other identifiers.
    if (messageId !== "tag") {
      while (parseOptional(Token.Whitespace));
    }

    const pos = tokenPos();
    let sv: string;

    if (token() === Token.Identifier) {
      sv = tokenValue();
      nextToken();
    } else {
      sv = "";
      warning({ code: "doc-invalid-identifier", messageId });
    }

    return {
      kind: SyntaxKind.Identifier,
      sv,
      ...finishNode(pos),
    };
  }

  // utility functions
  function token() {
    return scanner.token;
  }

  function tokenFlags() {
    return scanner.tokenFlags;
  }

  function tokenValue() {
    return scanner.getTokenValue();
  }

  function tokenPos() {
    return scanner.tokenPosition;
  }

  function tokenEnd() {
    return scanner.position;
  }

  function nextToken() {
    // keep track of the previous token end separately from the current scanner
    // position as these will differ when the previous token had trailing
    // trivia, and we don't want to squiggle the trivia.
    previousTokenEnd = scanner.position;
    return currentMode === ParseMode.Syntax ? nextSyntaxToken() : nextDocToken();
  }

  function nextSyntaxToken() {
    docRanges = [];

    for (;;) {
      scanner.scan();
      if (isTrivia(token())) {
        if (!newLineIsTrivia && token() === Token.NewLine) {
          break;
        }
        let comment: LineComment | BlockComment | undefined = undefined;
        if (options.comments && isComment(token())) {
          comment = {
            kind:
              token() === Token.SingleLineComment
                ? SyntaxKind.LineComment
                : SyntaxKind.BlockComment,
            pos: tokenPos(),
            end: tokenEnd(),
          };
          comments.push(comment!);
        }
        if (tokenFlags() & TokenFlags.DocComment) {
          docRanges.push({
            pos: tokenPos(),
            end: tokenEnd(),
            comment: comment as BlockComment,
          });
        }
      } else {
        break;
      }
    }
  }

  function nextDocToken() {
    // NOTE: trivia tokens are always significant in doc comments.
    scanner.scanDoc();
  }

  function nextStringTemplateToken(tokenFlags: TokenFlags) {
    scanner.reScanStringTemplate(tokenFlags);
  }

  function createMissingIdentifier(): IdentifierNode {
    const pos = tokenPos();
    previousTokenEnd = pos;
    missingIdentifierCounter++;

    return {
      kind: SyntaxKind.Identifier,
      sv: "<missing identifier>" + missingIdentifierCounter,
      ...finishNode(pos),
    };
  }

  function createMissingTypeReference(): TypeReferenceNode {
    const pos = tokenPos();
    const { items: args } = createEmptyList<TemplateArgumentNode>();

    return {
      kind: SyntaxKind.TypeReference,
      target: createMissingIdentifier(),
      arguments: args,
      ...finishNode(pos),
    };
  }

  function finishNode(pos: number): TextRange & { flags: NodeFlags; symbol: Sym } {
    const flags = parseErrorInNextFinishedNode ? NodeFlags.ThisNodeHasError : NodeFlags.None;
    parseErrorInNextFinishedNode = false;
    return withSymbol({ pos, end: previousTokenEnd, flags });
  }

  // pretend to add as symbol property, likely to a node that is being created.
  function withSymbol<T extends { symbol: Sym }>(obj: Omit<T, "symbol">): T {
    return obj as any;
  }

  function createEmptyList<T extends Node>(range: TextRange = { pos: -1, end: -1 }): ListDetail<T> {
    return {
      items: [],
      range,
    };
  }

  /**
   * Parse a delimited list of elements, including the surrounding open and
   * close punctuation
   *
   * This shared driver function is used to share sensitive error recovery code.
   * In particular, error recovery by inserting tokens deemed missing is
   * susceptible to getting stalled in a loop iteration without making any
   * progress, and we guard against this in a shared place here.
   *
   * Note that statement and decorator lists do not have this issue. We always
   * consume at least a real '@' for a decorator and if the leading token of a
   * statement is not one of our statement keywords, ';', or '@', it is consumed
   * as part of a bad statement. As such, parsing of decorators and statements
   * do not go through here.
   */
  function parseList<K extends ListKind, T extends Node>(
    kind: K,
    parseItem: ParseListItem<K, T>
  ): ListDetail<T> {
    const r: ListDetail<T> = createEmptyList<T>();
    if (kind.open !== Token.None) {
      const t = tokenPos();
      if (parseExpected(kind.open)) {
        mutate(r.range).pos = t;
      }
    }

    if (kind.allowEmpty && parseOptional(kind.close)) {
      mutate(r.range).end = previousTokenEnd;
      return r;
    }

    while (true) {
      const startingPos = tokenPos();
      const { pos, docs, directives, decorators } = parseAnnotations({
        skipParsingDocNodes: Boolean(kind.invalidAnnotationTarget),
      });
      if (kind.invalidAnnotationTarget) {
        reportInvalidDecorators(decorators, kind.invalidAnnotationTarget);
        reportInvalidDirective(directives, kind.invalidAnnotationTarget);
      }

      if (directives.length === 0 && decorators.length === 0 && atEndOfListWithError(kind)) {
        // Error recovery: end surrounded list at statement keyword or end
        // of file. Note, however, that we must parse a missing element if
        // there were directives or decorators as we cannot drop those from
        // the tree.
        if (parseExpected(kind.close)) {
          mutate(r.range).end = previousTokenEnd;
        }
        break;
      }

      let item: T;
      if (kind.invalidAnnotationTarget) {
        item = (parseItem as ParseListItem<UnannotatedListKind, T>)();
      } else {
        item = parseItem(pos, decorators);
        mutate(item).docs = docs;
        mutate(item).directives = directives;
      }

      r.items.push(item);
      const delimiter = token();
      const delimiterPos = tokenPos();

      if (parseOptionalDelimiter(kind)) {
        // Delimiter found: check if it's trailing.
        if (parseOptional(kind.close)) {
          mutate(r.range).end = previousTokenEnd;
          if (!kind.trailingDelimiterIsValid) {
            error({
              code: "trailing-token",
              format: { token: TokenDisplay[delimiter] },
              target: {
                pos: delimiterPos,
                end: delimiterPos + 1,
              },
            });
          }
          // It was trailing and we've consumed the close token.
          break;
        }
        // Not trailing. We can safely skip the progress check below here
        // because we know that we consumed a real delimiter.
        continue;
      } else if (kind.close === Token.None) {
        // If a list is *not* surrounded by punctuation, then the list ends when
        // there's no delimiter after an item.
        break;
      } else if (parseOptional(kind.close)) {
        mutate(r.range).end = previousTokenEnd;
        // If a list *is* surrounded by punctuation, then the list ends when we
        // reach the close token.
        break;
      } else if (atEndOfListWithError(kind)) {
        // Error recovery: If a list *is* surrounded by punctuation, then
        // the list ends at statement keyword or end-of-file under the
        // assumption that the closing delimiter is missing. This check is
        // duplicated from above to preempt the parseExpected(delimeter)
        // below.
        if (parseExpected(kind.close)) {
          mutate(r.range).end = previousTokenEnd;
        }
        break;
      } else {
        // Error recovery: if a list kind *is* surrounded by punctuation and we
        // find neither a delimiter nor a close token after an item, then we
        // assume there is a missing delimiter between items.
        //
        // Example: `model M { a: B <missing semicolon> c: D }
        parseExpected(kind.delimiter);
      }

      if (startingPos === tokenPos()) {
        // Error recovery: we've inserted everything during this loop iteration
        // and haven't made any progress. Assume that the current token is a bad
        // representation of the end of the the list that we're trying to get
        // through.
        //
        // Simple repro: `model M { ]` would loop forever without this check.
        //
        if (parseExpected(kind.close)) {
          mutate(r.range).end = previousTokenEnd;
        }
        nextToken();

        // remove the item that was entirely inserted by error recovery.
        r.items.pop();
        break;
      }
    }
    return r;
  }

  /**
   * Parse a delimited list with surrounding open and close punctuation if the
   * open token is present. Otherwise, return an empty list.
   */
  function parseOptionalList<K extends SurroundedListKind, T extends Node>(
    kind: K,
    parseItem: ParseListItem<K, T>
  ): ListDetail<T> {
    return token() === kind.open ? parseList(kind, parseItem) : createEmptyList<T>();
  }

  function parseOptionalDelimiter(kind: ListKind) {
    if (parseOptional(kind.delimiter)) {
      return true;
    }

    if (token() === kind.toleratedDelimiter) {
      if (!kind.toleratedDelimiterIsValid) {
        parseExpected(kind.delimiter);
      }
      nextToken();
      return true;
    }

    return false;
  }

  function atEndOfListWithError(kind: ListKind) {
    return (
      kind.close !== Token.None &&
      (isStatementKeyword(token()) || token() === Token.EndOfFile) &&
      token() !== kind.allowedStatementKeyword
    );
  }

  function parseEmptyStatement(pos: number): EmptyStatementNode {
    parseExpected(Token.Semicolon);
    return { kind: SyntaxKind.EmptyStatement, ...finishNode(pos) };
  }

  function parseInvalidStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): InvalidStatementNode {
    // Error recovery: avoid an avalanche of errors when we get cornered into
    // parsing statements where none exist. Skip until we find a statement
    // keyword or decorator and only report one error for a contiguous range of
    // neither.
    do {
      nextToken();
    } while (
      !isStatementKeyword(token()) &&
      token() !== Token.At &&
      token() !== Token.Semicolon &&
      token() !== Token.EndOfFile
    );

    error({
      code: "token-expected",
      messageId: "statement",
      target: { pos, end: previousTokenEnd },
    });
    return { kind: SyntaxKind.InvalidStatement, decorators, ...finishNode(pos) };
  }

  function error<
    C extends keyof CompilerDiagnostics,
    M extends keyof CompilerDiagnostics[C] = "default",
  >(
    report: DiagnosticReportWithoutTarget<CompilerDiagnostics, C, M> & {
      target?: Partial<TextRange> & { realPos?: number };
      printable?: boolean;
    }
  ) {
    parseErrorInNextFinishedNode = true;

    const location = {
      file: scanner.file,
      pos: report.target?.pos ?? tokenPos(),
      end: report.target?.end ?? tokenEnd(),
    };

    if (!report.printable) {
      treePrintable = false;
    }

    // Error recovery: don't report more than 1 consecutive error at the same
    // position. The code path taken by error recovery after logging an error
    // can otherwise produce redundant and less decipherable errors, which this
    // suppresses.
    const realPos = report.target?.realPos ?? location.pos;
    if (realPositionOfLastError === realPos) {
      return;
    }
    realPositionOfLastError = realPos;

    const diagnostic = createDiagnostic({
      ...report,
      target: location,
    } as any);

    assert(
      diagnostic.severity === "error",
      "This function is for reporting errors. Use warning() for warnings."
    );

    parseDiagnostics.push(diagnostic);
  }

  function warning<
    C extends keyof CompilerDiagnostics,
    M extends keyof CompilerDiagnostics[C] = "default",
  >(
    report: DiagnosticReportWithoutTarget<CompilerDiagnostics, C, M> & {
      target?: Partial<TextRange>;
    }
  ) {
    const location = {
      file: scanner.file,
      pos: report.target?.pos ?? tokenPos(),
      end: report.target?.end ?? tokenEnd(),
    };

    const diagnostic = createDiagnostic({
      ...report,
      target: location,
    } as any);

    assert(
      diagnostic.severity === "warning",
      "This function is for reporting warnings only. Use error() for errors."
    );

    parseDiagnostics.push(diagnostic);
  }

  function reportDiagnostic(diagnostic: Diagnostic) {
    if (diagnostic.severity === "error") {
      parseErrorInNextFinishedNode = true;
      treePrintable = false;
    }
    parseDiagnostics.push(diagnostic);
  }

  function assert(condition: boolean, message: string): asserts condition {
    const location = {
      file: scanner.file,
      pos: tokenPos(),
      end: tokenEnd(),
    };
    compilerAssert(condition, message, location);
  }

  function reportInvalidDecorators(decorators: DecoratorExpressionNode[], nodeName: string) {
    for (const decorator of decorators) {
      error({ code: "invalid-decorator-location", format: { nodeName }, target: decorator });
    }
  }
  function reportInvalidDirective(directives: DirectiveExpressionNode[], nodeName: string) {
    for (const directive of directives) {
      error({ code: "invalid-directive-location", format: { nodeName }, target: directive });
    }
  }

  function parseExpected(expectedToken: Token) {
    if (token() === expectedToken) {
      nextToken();
      return true;
    }

    const location = getAdjustedDefaultLocation(expectedToken);
    error({
      code: "token-expected",
      format: { token: TokenDisplay[expectedToken] },
      target: location,
      printable: isPunctuation(expectedToken),
    });
    return false;
  }

  function expectTokenIsOneOf(...args: [option1: Token, ...rest: Token[]]) {
    const tok = token();
    for (const expected of args) {
      if (expected === Token.None) {
        continue;
      }
      if (tok === expected) {
        return tok;
      }
    }
    errorTokenIsNotOneOf(...args);
    return Token.None;
  }

  function parseExpectedOneOf(...args: [option1: Token, ...rest: Token[]]) {
    const tok = expectTokenIsOneOf(...args);
    if (tok !== Token.None) {
      nextToken();
    }
    return tok;
  }

  function errorTokenIsNotOneOf(...args: [option1: Token, ...rest: Token[]]) {
    const location = getAdjustedDefaultLocation(args[0]);
    const displayList = args.map((t, i) => {
      if (i === args.length - 1) {
        return `or ${TokenDisplay[t]}`;
      }
      return TokenDisplay[t];
    });
    error({ code: "token-expected", format: { token: displayList.join(", ") }, target: location });
  }

  function parseOptional(optionalToken: Token) {
    if (token() === optionalToken) {
      nextToken();
      return true;
    }

    return false;
  }

  function getAdjustedDefaultLocation(token: Token) {
    // Put the squiggly immediately after prior token when missing punctuation.
    // Avoids saying ';' is expected far away after a long comment, for example.
    // It's also confusing to squiggle the current token even if its nearby
    // in this case.
    return isPunctuation(token)
      ? { pos: previousTokenEnd, end: previousTokenEnd + 1, realPos: tokenPos() }
      : undefined;
  }
}

export type NodeCallback<T> = (c: Node) => T;

export function exprIsBareIdentifier(
  expr: Expression
): expr is TypeReferenceNode & { target: IdentifierNode; arguments: [] } {
  return (
    expr.kind === SyntaxKind.TypeReference &&
    expr.target.kind === SyntaxKind.Identifier &&
    expr.arguments.length === 0
  );
}

export function visitChildren<T>(node: Node, cb: NodeCallback<T>): T | undefined {
  if (node.directives) {
    const result = visitEach(cb, node.directives);
    if (result) return result;
  }
  if (node.docs) {
    const result = visitEach(cb, node.docs);
    if (result) return result;
  }

  switch (node.kind) {
    case SyntaxKind.TypeSpecScript:
      return visitNode(cb, node.id) || visitEach(cb, node.statements);
    case SyntaxKind.ArrayExpression:
      return visitNode(cb, node.elementType);
    case SyntaxKind.AugmentDecoratorStatement:
      return (
        visitNode(cb, node.target) ||
        visitNode(cb, node.targetType) ||
        visitEach(cb, node.arguments)
      );
    case SyntaxKind.DecoratorExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.CallExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.DirectiveExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.ImportStatement:
      return visitNode(cb, node.path);
    case SyntaxKind.OperationStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitNode(cb, node.signature)
      );
    case SyntaxKind.OperationSignatureDeclaration:
      return visitNode(cb, node.parameters) || visitNode(cb, node.returnType);
    case SyntaxKind.OperationSignatureReference:
      return visitNode(cb, node.baseOperation);
    case SyntaxKind.NamespaceStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        (isArray(node.statements) ? visitEach(cb, node.statements) : visitNode(cb, node.statements))
      );
    case SyntaxKind.InterfaceStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.extends) ||
        visitEach(cb, node.operations)
      );
    case SyntaxKind.UsingStatement:
      return visitNode(cb, node.name);
    case SyntaxKind.IntersectionExpression:
      return visitEach(cb, node.options);
    case SyntaxKind.MemberExpression:
      return visitNode(cb, node.base) || visitNode(cb, node.id);
    case SyntaxKind.ModelExpression:
      return visitEach(cb, node.properties);
    case SyntaxKind.ModelProperty:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.value) ||
        visitNode(cb, node.default)
      );
    case SyntaxKind.ModelSpreadProperty:
      return visitNode(cb, node.target);

    case SyntaxKind.ModelStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitNode(cb, node.extends) ||
        visitNode(cb, node.is) ||
        visitEach(cb, node.properties)
      );
    case SyntaxKind.ScalarStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.members) ||
        visitNode(cb, node.extends)
      );
    case SyntaxKind.ScalarConstructor:
      return visitNode(cb, node.id) || visitEach(cb, node.parameters);
    case SyntaxKind.UnionStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.options)
      );
    case SyntaxKind.UnionVariant:
      return visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitNode(cb, node.value);
    case SyntaxKind.EnumStatement:
      return (
        visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitEach(cb, node.members)
      );
    case SyntaxKind.EnumMember:
      return visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitNode(cb, node.value);
    case SyntaxKind.EnumSpreadMember:
      return visitNode(cb, node.target);
    case SyntaxKind.AliasStatement:
      return (
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitNode(cb, node.value)
      );
    case SyntaxKind.ConstStatement:
      return visitNode(cb, node.id) || visitNode(cb, node.value) || visitNode(cb, node.type);
    case SyntaxKind.DecoratorDeclarationStatement:
      return (
        visitEach(cb, node.modifiers) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.target) ||
        visitEach(cb, node.parameters)
      );
    case SyntaxKind.FunctionDeclarationStatement:
      return (
        visitEach(cb, node.modifiers) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.parameters) ||
        visitNode(cb, node.returnType)
      );
    case SyntaxKind.FunctionParameter:
      return visitNode(cb, node.id) || visitNode(cb, node.type);
    case SyntaxKind.TypeReference:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.ValueOfExpression:
      return visitNode(cb, node.target);
    case SyntaxKind.TypeOfExpression:
      return visitNode(cb, node.target);
    case SyntaxKind.TupleExpression:
      return visitEach(cb, node.values);
    case SyntaxKind.UnionExpression:
      return visitEach(cb, node.options);

    case SyntaxKind.Projection:
      return (
        visitNode(cb, node.directionId) ||
        visitEach(cb, node.modifierIds) ||
        visitEach(cb, node.parameters) ||
        visitEach(cb, node.body)
      );
    case SyntaxKind.ProjectionExpressionStatement:
      return visitNode(cb, node.expr);
    case SyntaxKind.ProjectionCallExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.ProjectionMemberExpression:
      return visitNode(cb, node.base) || visitNode(cb, node.id);
    // binops
    case SyntaxKind.ProjectionLogicalExpression:
    case SyntaxKind.ProjectionRelationalExpression:
    case SyntaxKind.ProjectionArithmeticExpression:
    case SyntaxKind.ProjectionEqualityExpression:
      return visitNode(cb, node.left) || visitNode(cb, node.right);
    case SyntaxKind.ProjectionUnaryExpression:
      return visitNode(cb, node.target);
    case SyntaxKind.ProjectionModelExpression:
      return visitEach(cb, node.properties);
    case SyntaxKind.ProjectionModelProperty:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.value) ||
        visitNode(cb, node.default)
      );
    case SyntaxKind.ProjectionModelSpreadProperty:
      return visitNode(cb, node.target);
    case SyntaxKind.ProjectionTupleExpression:
      return visitEach(cb, node.values);
    case SyntaxKind.ProjectionBlockExpression:
      return visitEach(cb, node.statements);
    case SyntaxKind.ProjectionIfExpression:
      return (
        visitNode(cb, node.test) || visitNode(cb, node.consequent) || visitNode(cb, node.alternate)
      );
    case SyntaxKind.ProjectionLambdaExpression:
      return visitEach(cb, node.parameters) || visitNode(cb, node.body);
    case SyntaxKind.ProjectionStatement:
      return (
        visitNode(cb, node.id) || visitNode(cb, node.selector) || visitEach(cb, node.projections)
      );
    case SyntaxKind.ProjectionDecoratorReferenceExpression:
      return visitNode(cb, node.target);
    case SyntaxKind.Return:
      return visitNode(cb, node.value);
    case SyntaxKind.InvalidStatement:
      return visitEach(cb, node.decorators);
    case SyntaxKind.TemplateParameterDeclaration:
      return (
        visitNode(cb, node.id) || visitNode(cb, node.constraint) || visitNode(cb, node.default)
      );
    case SyntaxKind.TemplateArgument:
      return (node.name && visitNode(cb, node.name)) || visitNode(cb, node.argument);
    case SyntaxKind.ProjectionLambdaParameterDeclaration:
      return visitNode(cb, node.id);
    case SyntaxKind.ProjectionParameterDeclaration:
      return visitNode(cb, node.id);
    case SyntaxKind.Doc:
      return visitEach(cb, node.content) || visitEach(cb, node.tags);
    case SyntaxKind.DocParamTag:
    case SyntaxKind.DocTemplateTag:
      return (
        visitNode(cb, node.tagName) || visitNode(cb, node.paramName) || visitEach(cb, node.content)
      );
    case SyntaxKind.DocPropTag:
      return (
        visitNode(cb, node.tagName) || visitNode(cb, node.propName) || visitEach(cb, node.content)
      );
    case SyntaxKind.DocReturnsTag:
    case SyntaxKind.DocErrorsTag:
    case SyntaxKind.DocUnknownTag:
      return visitNode(cb, node.tagName) || visitEach(cb, node.content);

    case SyntaxKind.StringTemplateExpression:
      return visitNode(cb, node.head) || visitEach(cb, node.spans);
    case SyntaxKind.StringTemplateSpan:
      return visitNode(cb, node.expression) || visitNode(cb, node.literal);
    case SyntaxKind.ObjectLiteral:
      return visitEach(cb, node.properties);
    case SyntaxKind.ObjectLiteralProperty:
      return visitNode(cb, node.id) || visitNode(cb, node.value);
    case SyntaxKind.ObjectLiteralSpreadProperty:
      return visitNode(cb, node.target);
    case SyntaxKind.ArrayLiteral:
      return visitEach(cb, node.values);
    // no children for the rest of these.
    case SyntaxKind.StringTemplateHead:
    case SyntaxKind.StringTemplateMiddle:
    case SyntaxKind.StringTemplateTail:
    case SyntaxKind.StringLiteral:
    case SyntaxKind.NumericLiteral:
    case SyntaxKind.BooleanLiteral:
    case SyntaxKind.Identifier:
    case SyntaxKind.EmptyStatement:
    case SyntaxKind.ProjectionModelSelector:
    case SyntaxKind.ProjectionModelPropertySelector:
    case SyntaxKind.ProjectionScalarSelector:
    case SyntaxKind.ProjectionUnionSelector:
    case SyntaxKind.ProjectionUnionVariantSelector:
    case SyntaxKind.ProjectionInterfaceSelector:
    case SyntaxKind.ProjectionOperationSelector:
    case SyntaxKind.ProjectionEnumSelector:
    case SyntaxKind.ProjectionEnumMemberSelector:
    case SyntaxKind.VoidKeyword:
    case SyntaxKind.NeverKeyword:
    case SyntaxKind.ExternKeyword:
    case SyntaxKind.UnknownKeyword:
    case SyntaxKind.JsSourceFile:
    case SyntaxKind.JsNamespaceDeclaration:
    case SyntaxKind.DocText:
      return;

    default:
      // Dummy const to ensure we handle all node types.
      // If you get an error here, add a case for the new node type
      // you added..
      const _assertNever: never = node;
      return;
  }
}

function visitNode<T>(cb: NodeCallback<T>, node: Node | undefined): T | undefined {
  return node && cb(node);
}

function visitEach<T>(cb: NodeCallback<T>, nodes: readonly Node[] | undefined): T | undefined {
  if (!nodes) {
    return;
  }

  for (const node of nodes) {
    const result = cb(node);
    if (result) {
      return result;
    }
  }
  return;
}

/**
 * check whether a position belongs to a range (excluding the start and end pos)
 * i.e. <range.pos>{<start to return true>...<end to return true>}<range.end>
 *
 * remark: if range.pos is -1 means no start point found, so return false
 *         if range.end is -1 means no end point found, so return true if position is greater than range.pos
 */
export function positionInRange(position: number, range: TextRange) {
  return range.pos >= 0 && position > range.pos && (range.end === -1 || position < range.end);
}

export function getNodeAtPositionDetail(
  script: TypeSpecScriptNode,
  position: number,
  filter: (node: Node, flag: "cur" | "pre" | "post") => boolean = () => true
): PositionDetail {
  const cur = getNodeAtPosition(script, position, (n) => filter(n, "cur"));

  const input = script.file.text;
  const char = input.charCodeAt(position);
  const preChar = position >= 0 ? input.charCodeAt(position - 1) : NaN;
  const nextChar = position < input.length ? input.charCodeAt(position + 1) : NaN;

  let inTrivia = false;
  let triviaStart: number | undefined;
  let triviaEnd: number | undefined;
  if (!cur || cur.kind !== SyntaxKind.StringLiteral) {
    const { char: cp } = codePointBefore(input, position);
    if (!cp || !isIdentifierContinue(cp)) {
      triviaEnd = skipTrivia(input, position);
      triviaStart = skipTriviaBackward(script, position) + 1;
      inTrivia = triviaEnd !== position;
    }
  }

  if (!inTrivia) {
    const beforeId = skipContinuousIdentifier(input, position, true /*isBackward*/);
    triviaStart = skipTriviaBackward(script, beforeId) + 1;
    const afterId = skipContinuousIdentifier(input, position, false /*isBackward*/);
    triviaEnd = skipTrivia(input, afterId);
  }

  if (triviaStart === undefined || triviaEnd === undefined) {
    compilerAssert(false, "unexpected, triviaStart and triviaEnd should be defined");
  }

  return {
    node: cur,
    char,
    preChar,
    nextChar,
    position,
    inTrivia,
    triviaStartPosition: triviaStart,
    triviaEndPosition: triviaEnd,
    getPositionDetailBeforeTrivia: () => {
      // getNodeAtPosition will also include the 'node.end' position which is the triviaStart pos
      return getNodeAtPositionDetail(script, triviaStart, (n) => filter(n, "pre"));
    },
    getPositionDetailAfterTrivia: () => {
      return getNodeAtPositionDetail(script, triviaEnd, (n) => filter(n, "post"));
    },
  };
}

/**
 * Resolve the node in the syntax tree that that is at the given position.
 * @param script TypeSpec Script node
 * @param position Position
 * @param filter Filter if wanting to return a parent containing node early.
 */
export function getNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number,
  filter?: (node: Node) => boolean
): Node | undefined;
export function getNodeAtPosition<T extends Node>(
  script: TypeSpecScriptNode,
  position: number,
  filter: (node: Node) => node is T
): T | undefined;
export function getNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number,
  filter = (node: Node) => true
): Node | undefined {
  return visit(script);

  function visit(node: Node): Node | undefined {
    // We deliberately include the end position here because we need to hit
    // nodes when the cursor is positioned immediately after an identifier.
    // This is especially vital for completion. It's also generally OK
    // because the language doesn't (and should never) have syntax where you
    // could place the cursor ambiguously between two adjacent,
    // non-punctuation, non-trivia tokens that have no punctuation or trivia
    // separating them.
    if (node.pos <= position && position <= node.end) {
      // We only need to recursively visit children of nodes that satisfied
      // the condition above and therefore contain the given position. If a
      // node does not contain a position, then neither do its children.
      const child = visitChildren(node, visit);

      // A child match here is better than a self-match below as we want the
      // deepest (most specific) node. In other words, the search is depth
      // first. For example, consider `A<B<C>>`: If the cursor is on `B`,
      // then prefer B<C> over A<B<C>>.
      if (child) {
        return child;
      }

      if (filter(node)) {
        return node;
      }
    }

    return undefined;
  }
}

export function hasParseError(node: Node) {
  if (node.flags & NodeFlags.ThisNodeHasError) {
    return true;
  }

  checkForDescendantErrors(node);
  return node.flags & NodeFlags.DescendantHasError;
}

function checkForDescendantErrors(node: Node) {
  if (node.flags & NodeFlags.DescendantErrorsExamined) {
    return;
  }
  mutate(node).flags |= NodeFlags.DescendantErrorsExamined;

  visitChildren(node, (child: Node) => {
    if (child.flags & NodeFlags.ThisNodeHasError) {
      mutate(node).flags |= NodeFlags.DescendantHasError | NodeFlags.DescendantErrorsExamined;
      return true;
    }
    checkForDescendantErrors(child);

    if (child.flags & NodeFlags.DescendantHasError) {
      mutate(node).flags |= NodeFlags.DescendantHasError | NodeFlags.DescendantErrorsExamined;
      return true;
    }
    mutate(child).flags |= NodeFlags.DescendantErrorsExamined;

    return false;
  });
}

export function isImportStatement(node: Node): node is ImportStatementNode {
  return node.kind === SyntaxKind.ImportStatement;
}

function isBlocklessNamespace(node: Node) {
  if (node.kind !== SyntaxKind.NamespaceStatement) {
    return false;
  }
  while (!isArray(node.statements) && node.statements) {
    node = node.statements;
  }

  return node.statements === undefined;
}

export function getFirstAncestor(
  node: Node,
  test: NodeCallback<boolean>,
  includeSelf: boolean = false
): Node | undefined {
  if (includeSelf && test(node)) {
    return node;
  }
  for (let n = node.parent; n; n = n.parent) {
    if (test(n)) {
      return n;
    }
  }
  return undefined;
}

export function getIdentifierContext(id: IdentifierNode): IdentifierContext {
  const node = getFirstAncestor(id, (n) => n.kind !== SyntaxKind.MemberExpression);
  compilerAssert(node, "Identifier with no non-member-expression ancestor.");

  let kind: IdentifierKind;
  switch (node.kind) {
    case SyntaxKind.TypeReference:
      kind = IdentifierKind.TypeReference;
      break;
    case SyntaxKind.AugmentDecoratorStatement:
    case SyntaxKind.DecoratorExpression:
      kind = IdentifierKind.Decorator;
      break;
    case SyntaxKind.ProjectionCallExpression:
      kind = IdentifierKind.Function;
      break;
    case SyntaxKind.UsingStatement:
      kind = IdentifierKind.Using;
      break;
    case SyntaxKind.TemplateArgument:
      kind = IdentifierKind.TemplateArgument;
      break;
    case SyntaxKind.ObjectLiteralProperty:
      kind = IdentifierKind.ObjectLiteralProperty;
      break;
    case SyntaxKind.ModelProperty:
      switch (node.parent?.kind) {
        case SyntaxKind.ModelExpression:
          kind = IdentifierKind.ModelExpressionProperty;
          break;
        case SyntaxKind.ModelStatement:
          kind = IdentifierKind.ModelStatementProperty;
          break;
        default:
          compilerAssert("false", "ModelProperty with unexpected parent kind.");
          kind =
            (id.parent as DeclarationNode).id === id
              ? IdentifierKind.Declaration
              : IdentifierKind.Other;
          break;
      }
      break;
    default:
      kind =
        (id.parent as DeclarationNode).id === id
          ? IdentifierKind.Declaration
          : IdentifierKind.Other;
      break;
  }

  return { node, kind };
}
