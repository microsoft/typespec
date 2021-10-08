import { createSymbolTable } from "./binder.js";
import { compilerAssert, createDiagnosticLegacy } from "./diagnostics.js";
import {
  createScanner,
  isComment,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  isTrivia,
  Token,
  TokenDisplay,
} from "./scanner.js";
import {
  AliasStatementNode,
  BooleanLiteralNode,
  CadlScriptNode,
  Comment,
  DecoratorExpressionNode,
  Diagnostic,
  DirectiveExpressionNode,
  EmptyStatementNode,
  EnumMemberNode,
  EnumStatementNode,
  Expression,
  IdentifierNode,
  ImportStatementNode,
  InterfaceStatementNode,
  InvalidStatementNode,
  MemberExpressionNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  NamespaceStatementNode,
  Node,
  NumericLiteralNode,
  OperationStatementNode,
  ReferenceExpression,
  SourceFile,
  Statement,
  StringLiteralNode,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TextRange,
  TupleExpressionNode,
  UsingStatementNode,
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
type ParseListItem<T> = (pos: number, decorators: DecoratorExpressionNode[]) => T;

type OpenToken = Token.OpenBrace | Token.OpenParen | Token.OpenBracket | Token.LessThan;
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
  readonly invalidDecoratorTarget?: string;
}

interface SurroundedListKind extends ListKind {
  readonly open: OpenToken;
  readonly close: CloseToken;
}

/** @internal */
export const enum NodeFlags {
  None = 0,
  /**
   * If this is set, the DescendantHasError bit can be trusted. If this not set,
   * children need to be visited still to see if DescendantHasError should be
   * set.
   */
  DescendantErrorsExamined = 1 << 0,

  /**
   * Indicates that a parse error was associated with this specific node.
   */
  ThisNodeHasError = 1 << 1,

  /**
   * Indicates that a child of this node (or one of its children,
   * transitively) has a parse error.
   */
  DescendantHasError = 1 << 2,
}

/**
 * The fixed set of options for each of the kinds of delimited lists in Cadl.
 */
namespace ListKind {
  const PropertiesBase = {
    allowEmpty: true,
    toleratedDelimiterIsValid: true,
    trailingDelimiterIsValid: true,
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
    invalidDecoratorTarget: "expression",
  } as const;

  export const ModelProperties = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
  } as const;

  export const InterfaceMembers = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
    toleratedDelimiterIsValid: false,
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
    invalidDecoratorTarget: "expression",
  } as const;

  export const TemplateParameters = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.LessThan,
    close: Token.GreaterThan,
  } as const;

  export const TemplateArguments = {
    ...TemplateParameters,
  } as const;

  export const Heritage = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.None,
    close: Token.None,
  } as const;

  export const Tuple = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.OpenBracket,
    close: Token.CloseBracket,
  } as const;
}

export interface ParseOptions {
  /**
   * Include comments in resulting output.
   */
  comments?: boolean;
}

export function parse(code: string | SourceFile, options: ParseOptions = {}): CadlScriptNode {
  let parseErrorInNextFinishedNode = false;
  let previousTokenEnd = -1;
  let realPositionOfLastError = -1;
  let missingIdentifierCounter = 0;
  let treePrintable = true;
  let newLineIsTrivia = true;
  const parseDiagnostics: Diagnostic[] = [];
  const scanner = createScanner(code, reportDiagnostic);
  const comments: Comment[] = [];

  nextToken();
  return parseCadlScript();

  function parseCadlScript(): CadlScriptNode {
    const statements = parseCadlScriptItemList();
    return {
      kind: SyntaxKind.CadlScript,
      statements,
      file: scanner.file,
      namespaces: [],
      usings: [],
      locals: createSymbolTable(),
      inScopeNamespaces: [],
      parseDiagnostics,
      comments,
      printable: treePrintable,
      ...finishNode(0),
    };
  }

  function parseCadlScriptItemList(): Statement[] {
    const stmts: Statement[] = [];
    let seenBlocklessNs = false;
    let seenDecl = false;
    while (!scanner.eof()) {
      const pos = tokenPos();
      const directives = parseDirectiveList();
      const decorators = parseDecoratorList();
      const tok = token();
      let item: Statement;
      switch (tok) {
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          item = parseImportStatement();
          break;
        case Token.ModelKeyword:
          item = parseModelStatement(pos, decorators);
          break;
        case Token.NamespaceKeyword:
          item = parseNamespaceStatement(pos, decorators);
          break;
        case Token.InterfaceKeyword:
          item = parseInterfaceStatement(pos, decorators);
          break;
        case Token.OpKeyword:
          item = parseOperationStatement(pos, decorators);
          break;
        case Token.EnumKeyword:
          item = parseEnumStatement(pos, decorators);
          break;
        case Token.AliasKeyword:
          reportInvalidDecorators(decorators, "alias statement");
          item = parseAliasStatement();
          break;
        case Token.UsingKeyword:
          reportInvalidDecorators(decorators, "using statement");
          item = parseUsingStatement();
          break;
        case Token.Semicolon:
          reportInvalidDecorators(decorators, "empty statement");
          item = parseEmptyStatement();
          break;
        default:
          reportInvalidDecorators(decorators, "invalid statement");
          item = parseInvalidStatement();
          break;
      }

      item.directives = directives;

      if (isBlocklessNamespace(item)) {
        if (seenBlocklessNs) {
          error("Cannot use multiple blockless namespaces.");
        }
        if (seenDecl) {
          error("Blockless namespaces can't follow other declarations.");
        }
        seenBlocklessNs = true;
      } else if (item.kind === SyntaxKind.ImportStatement) {
        if (seenDecl || seenBlocklessNs) {
          error("Imports must come prior to namespaces or other declarations.");
        }
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
      const pos = tokenPos();
      const directives = parseDirectiveList();
      const decorators = parseDecoratorList();
      const tok = token();

      let item: Statement;
      switch (tok) {
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          error("Imports must be top-level and come prior to namespaces or other declarations.");
          item = parseImportStatement();
          break;
        case Token.ModelKeyword:
          item = parseModelStatement(pos, decorators);
          break;
        case Token.NamespaceKeyword:
          const ns = parseNamespaceStatement(pos, decorators);

          if (!Array.isArray(ns.statements)) {
            error("Blockless namespace can only be top-level.");
          }
          item = ns;
          break;
        case Token.InterfaceKeyword:
          item = parseInterfaceStatement(pos, decorators);
          break;
        case Token.OpKeyword:
          item = parseOperationStatement(pos, decorators);
          break;
        case Token.EnumKeyword:
          item = parseEnumStatement(pos, decorators);
          break;
        case Token.AliasKeyword:
          reportInvalidDecorators(decorators, "alias statement");
          item = parseAliasStatement();
          break;
        case Token.UsingKeyword:
          reportInvalidDecorators(decorators, "using statement");
          item = parseUsingStatement();
          break;
        case Token.EndOfFile:
          parseExpected(Token.CloseBrace);
          return stmts;
        case Token.Semicolon:
          reportInvalidDecorators(decorators, "empty statement");
          item = parseEmptyStatement();
          break;
        default:
          reportInvalidDecorators(decorators, "invalid statement");
          item = parseInvalidStatement();
          break;
      }
      item.directives = directives;
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
    decorators: DecoratorExpressionNode[]
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
      name: nsSegments[0],
      statements,
      ...finishNode(pos),
    };

    for (let i = 1; i < nsSegments.length; i++) {
      outerNs = {
        kind: SyntaxKind.NamespaceStatement,
        decorators: [],
        name: nsSegments[i],
        statements: outerNs,
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
    const templateParameters = parseOptionalList(
      ListKind.TemplateParameters,
      parseTemplateParameter
    );

    let mixes: ReferenceExpression[] = [];
    if (token() === Token.Identifier) {
      if (tokenValue() !== "mixes") {
        error("expected 'mixes' or '{'");
        nextToken();
      } else {
        nextToken();
        mixes = parseList(ListKind.Heritage, parseReferenceExpression);
      }
    }

    const operations = parseList(ListKind.InterfaceMembers, parseInterfaceMember);

    return {
      kind: SyntaxKind.InterfaceStatement,
      id,
      templateParameters,
      operations,
      mixes,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseInterfaceMember(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): OperationStatementNode {
    const id = parseIdentifier();
    const parameters = parseOperationParameters();
    parseExpected(Token.Colon);

    const returnType = parseExpression();
    return {
      kind: SyntaxKind.OperationStatement,
      id,
      parameters,
      returnType,
      decorators,
      ...finishNode(pos),
    };
  }
  function parseUsingStatement(): UsingStatementNode {
    const pos = tokenPos();
    parseExpected(Token.UsingKeyword);
    const name = parseIdentifierOrMemberExpression();
    parseExpected(Token.Semicolon);

    return {
      kind: SyntaxKind.UsingStatement,
      name,
      ...finishNode(pos),
    };
  }

  function parseOperationStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): OperationStatementNode {
    parseExpected(Token.OpKeyword);

    const id = parseIdentifier();
    const parameters = parseOperationParameters();
    parseExpected(Token.Colon);

    const returnType = parseExpression();
    parseExpected(Token.Semicolon);

    return {
      kind: SyntaxKind.OperationStatement,
      id,
      parameters,
      returnType,
      decorators,
      ...finishNode(pos),
    };
  }

  function parseOperationParameters(): ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.OperationParameters, parseModelPropertyOrSpread);
    const parameters: ModelExpressionNode = {
      kind: SyntaxKind.ModelExpression,
      properties,
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
    const templateParameters = parseOptionalList(
      ListKind.TemplateParameters,
      parseTemplateParameter
    );

    expectTokenIsOneOf(Token.OpenBrace, Token.Equals, Token.ExtendsKeyword, Token.IsKeyword);

    const optionalExtends: ReferenceExpression | undefined = parseOptionalModelExtends();
    const optionalIs = optionalExtends ? undefined : parseOptionalModelIs();
    const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);

    return {
      kind: SyntaxKind.ModelStatement,
      id,
      extends: optionalExtends,
      is: optionalIs,
      templateParameters,
      decorators,
      properties,
      ...finishNode(pos),
    };
  }

  function parseOptionalModelExtends() {
    if (parseOptional(Token.ExtendsKeyword)) {
      return parseReferenceExpression();
    }
    return undefined;
  }

  function parseOptionalModelIs() {
    if (parseOptional(Token.IsKeyword)) {
      return parseReferenceExpression();
    }
    return;
  }

  function parseTemplateParameter(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): TemplateParameterDeclarationNode {
    reportInvalidDecorators(decorators, "template parameter");
    const id = parseIdentifier();
    return {
      kind: SyntaxKind.TemplateParameterDeclaration,
      id,
      ...finishNode(pos),
    };
  }

  function parseModelPropertyOrSpread(pos: number, decorators: DecoratorExpressionNode[]) {
    return token() === Token.Elipsis
      ? parseModelSpreadProperty(pos, decorators)
      : parseModelProperty(pos, decorators);
  }

  function parseModelSpreadProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ModelSpreadPropertyNode {
    parseExpected(Token.Elipsis);

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
  ): ModelPropertyNode | ModelSpreadPropertyNode {
    const id =
      token() === Token.StringLiteral
        ? parseStringLiteral()
        : parseIdentifier("Property expected.");

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
    const value = parseExpression();

    const hasDefault = parseOptional(Token.Equals);
    if (hasDefault && !optional) {
      error("Cannot use default with non optional properties");
    }
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

  function parseEnumStatement(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): EnumStatementNode {
    parseExpected(Token.EnumKeyword);
    const id = parseIdentifier();
    const members = parseList(ListKind.EnumMembers, parseEnumMember);
    return {
      kind: SyntaxKind.EnumStatement,
      id,
      decorators,
      members,
      ...finishNode(pos),
    };
  }

  function parseEnumMember(pos: number, decorators: DecoratorExpressionNode[]): EnumMemberNode {
    const id =
      token() === Token.StringLiteral
        ? parseStringLiteral()
        : parseIdentifier("Enum member expected.");

    let value: StringLiteralNode | NumericLiteralNode | undefined;
    if (parseOptional(Token.Colon)) {
      const expr = parseExpression();

      if (expr.kind === SyntaxKind.StringLiteral || expr.kind === SyntaxKind.NumericLiteral) {
        value = expr;
      } else if (getFlag(expr, NodeFlags.ThisNodeHasError)) {
        parseErrorInNextFinishedNode = true;
      } else {
        error("Expected numeric or string literal", expr);
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

  function parseAliasStatement(): AliasStatementNode {
    const pos = tokenPos();
    parseExpected(Token.AliasKeyword);
    const id = parseIdentifier();
    const templateParameters = parseOptionalList(
      ListKind.TemplateParameters,
      parseTemplateParameter
    );
    parseExpected(Token.Equals);
    const value = parseExpression();
    parseExpected(Token.Semicolon);
    return {
      kind: SyntaxKind.AliasStatement,
      id,
      templateParameters,
      value,
      ...finishNode(pos),
    };
  }

  function parseExpression(): Expression {
    return parseUnionExpressionOrHigher();
  }

  function parseUnionExpressionOrHigher(): Expression {
    const pos = tokenPos();
    parseOptional(Token.Bar);
    let node: Expression = parseIntersectionExpressionOrHigher();

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
    let node: Expression = parseArrayExpressionOrHigher();

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

  function parseReferenceExpression(): ReferenceExpression {
    const pos = tokenPos();
    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.TemplateArguments, parseExpression);

    return {
      kind: SyntaxKind.TypeReference,
      target,
      arguments: args,
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

    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.DecoratorArguments, parseExpression);
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
    if (target.sv !== "suppress") {
      error(`Unknown directive '#${target.sv}'`, { pos, end: pos + target.sv.length }, true);
    }
    // The newline will mark the end of the directive.
    newLineIsTrivia = false;
    const args = [];
    console.log("Get to directive", Token[token()]);
    while (token() !== Token.NewLine && token() !== Token.EndOfFile) {
      console.log("Get to directive2", Token[token()]);
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

  function parseDirectiveParameter() {
    switch (token()) {
      case Token.Identifier:
        return parseIdentifier();
      case Token.StringLiteral:
        return parseStringLiteral();
      default:
        error(`Unexpected token ${Token[token()]}`);
        do {
          nextToken();
        } while (
          !isStatementKeyword(token()) &&
          token() != Token.At &&
          token() != Token.Semicolon &&
          token() != Token.EndOfFile
        );
        return undefined;
    }
  }

  function parseIdentifierOrMemberExpression(): IdentifierNode | MemberExpressionNode {
    const pos = tokenPos();
    let base: IdentifierNode | MemberExpressionNode = parseIdentifier();
    while (parseOptional(Token.Dot)) {
      base = {
        kind: SyntaxKind.MemberExpression,
        base,
        id: parseIdentifier(),
        ...finishNode(pos),
      };
    }

    return base;
  }

  function parsePrimaryExpression(): Expression {
    while (true) {
      switch (token()) {
        case Token.Identifier:
          return parseReferenceExpression();
        case Token.StringLiteral:
          return parseStringLiteral();
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
        default:
          return parseIdentifier("Expression expected.");
      }
    }
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
    const values = parseList(ListKind.Tuple, parseExpression);
    return {
      kind: SyntaxKind.TupleExpression,
      values,
      ...finishNode(pos),
    };
  }

  function parseModelExpression(): ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);
    return {
      kind: SyntaxKind.ModelExpression,
      properties,
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

  function parseNumericLiteral(): NumericLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = Number(text);

    parseExpected(Token.NumericLiteral);
    return {
      kind: SyntaxKind.NumericLiteral,
      value,
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

  function parseIdentifier(message?: string): IdentifierNode {
    if (isKeyword(token())) {
      error("Keyword cannot be used as identifier.");
    } else if (token() !== Token.Identifier) {
      // Error recovery: when we fail to parse an identifier or expression,
      // we insert a synthesized identifier with a unique name.
      error(message ?? "Identifier expected.");
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

  // utility functions
  function token() {
    return scanner.token;
  }

  function tokenValue() {
    return scanner.getTokenValue();
  }

  function tokenPos() {
    return scanner.tokenPosition;
  }

  function tokenEndPos() {
    return scanner.position;
  }

  function nextToken() {
    // keep track of the previous token end separately from the current scanner
    // position as these will differ when the previous token had trailing
    // trivia, and we don't want to squiggle the trivia.
    previousTokenEnd = scanner.position;

    for (;;) {
      scanner.scan();
      if (isTrivia(token())) {
        if (!newLineIsTrivia && token() === Token.NewLine) {
          break;
        }
        if (options.comments && isComment(token())) {
          comments.push({
            kind:
              token() === Token.SingleLineComment
                ? SyntaxKind.LineComment
                : SyntaxKind.BlockComment,
            pos: tokenPos(),
            end: tokenEndPos(),
          });
        }
      } else {
        break;
      }
    }
  }

  function createMissingIdentifier(): IdentifierNode {
    missingIdentifierCounter++;
    return {
      kind: SyntaxKind.Identifier,
      sv: "<missing identifier>" + missingIdentifierCounter,
      ...finishNode(tokenPos()),
    };
  }

  function finishNode(pos: number): TextRange & { flags: NodeFlags } {
    const flags = parseErrorInNextFinishedNode ? NodeFlags.ThisNodeHasError : NodeFlags.None;
    parseErrorInNextFinishedNode = false;

    return {
      pos,
      end: previousTokenEnd,
      flags,
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
  function parseList<T extends Node>(kind: ListKind, parseItem: ParseListItem<T>): T[] {
    if (kind.open !== Token.None) {
      parseExpected(kind.open);
    }

    if (kind.allowEmpty && parseOptional(kind.close)) {
      return [];
    }

    const items: T[] = [];
    while (true) {
      const pos = tokenPos();
      const directives = parseDirectiveList();
      const decorators = parseDecoratorList();
      if (kind.invalidDecoratorTarget) {
        reportInvalidDecorators(decorators, kind.invalidDecoratorTarget);
      }

      const item = parseItem(pos, decorators);
      items.push(item);
      item.directives = directives;
      const delimiter = token();
      const delimiterPos = tokenPos();

      if (parseOptionalDelimiter(kind)) {
        // Delimiter found: check if it's trailing.
        if (parseOptional(kind.close)) {
          if (!kind.trailingDelimiterIsValid) {
            error(`Trailing ${TokenDisplay[delimiter]}.`, {
              pos: delimiterPos,
              end: delimiterPos + 1,
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
        // If a list *is* surrounded by punctuation, then the list ends when we
        // reach the close token.
        break;
      } else {
        // Error recovery: if a list kind *is* surrounded by punctuation and we
        // find neither a delimiter nor a close token after an item, then we
        // assume there is a missing delimiter between items.
        //
        // Example: `model M { a: B <missing semicolon> c: D }
        parseExpected(kind.delimiter);
      }

      if (pos === tokenPos()) {
        // Error recovery: we've inserted everything during this loop iteration
        // and haven't made any progress. Assume that the current token is a bad
        // representation of the end of the the list that we're trying to get
        // through.
        //
        // Simple repro: `model M { ]` would loop forever without this check.
        //
        assert(
          realPositionOfLastError === pos,
          "Should already have logged an error if we get here."
        );
        nextToken();
        break;
      }
    }

    return items;
  }

  /**
   * Parse a delimited list with surrounding open and close punctuation if the
   * open token is present. Otherwise, return an empty list.
   */
  function parseOptionalList<T extends Node>(
    kind: SurroundedListKind,
    parseItem: ParseListItem<T>
  ): T[] {
    return token() === kind.open ? parseList(kind, parseItem) : [];
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

  function parseEmptyStatement(): EmptyStatementNode {
    const pos = tokenPos();
    parseExpected(Token.Semicolon);
    return { kind: SyntaxKind.EmptyStatement, ...finishNode(pos) };
  }

  function parseInvalidStatement(): InvalidStatementNode {
    // Error recovery: avoid an avalanche of errors when we get cornered into
    // parsing statements where none exist. Skip until we find a statement
    // keyword or decorator and only report one error for a contiguous range of
    // neither.
    const pos = tokenPos();
    do {
      nextToken();
    } while (
      !isStatementKeyword(token()) &&
      token() != Token.At &&
      token() != Token.Semicolon &&
      token() != Token.EndOfFile
    );

    error("Statement expected.", { pos, end: previousTokenEnd });
    return { kind: SyntaxKind.InvalidStatement, ...finishNode(pos) };
  }

  /**
   *
   * @param message Error message
   * @param target Location of the error.
   * @param printable True if this error didn't affect the parsing and the tree can be safely printed(formatted)
   */
  function error(message: string, target?: TextRange & { realPos?: number }, printable?: boolean) {
    const location = {
      file: scanner.file,
      pos: target?.pos ?? tokenPos(),
      end: target?.end ?? scanner.position,
    };

    // Error recovery: don't report more than 1 consecutive error at the same
    // position. The code path taken by error recovery after logging an error
    // can otherwise produce redundant and less decipherable errors, which this
    // suppresses.
    let realPos = target?.realPos ?? location.pos;
    if (realPositionOfLastError === realPos) {
      return;
    }
    realPositionOfLastError = realPos;
    if (!printable) {
      treePrintable = false;
    }
    const diagnostic = createDiagnosticLegacy(message, location);
    reportDiagnostic(diagnostic);
  }

  function reportDiagnostic(diagnostic: Diagnostic) {
    if (diagnostic.severity === "error") {
      parseErrorInNextFinishedNode = true;
    }
    parseDiagnostics.push(diagnostic);
  }

  function assert(condition: boolean, message: string): asserts condition {
    const location = {
      file: scanner.file,
      pos: tokenPos(),
      end: scanner.position,
    };
    compilerAssert(condition, message, location);
  }

  function reportInvalidDecorators(decorators: DecoratorExpressionNode[], nodeName: string) {
    for (const decorator of decorators) {
      error(`Cannot decorate ${nodeName}.`, decorator);
    }
  }
  function reportInvalidDirective(directives: DirectiveExpressionNode[], nodeName: string) {
    for (const directive of directives) {
      error(`Cannot decorate ${nodeName}.`, directive);
    }
  }

  function parseExpected(expectedToken: Token) {
    if (token() === expectedToken) {
      nextToken();
      return true;
    }

    const location = getAdjustedDefaultLocation(expectedToken);
    error(`${TokenDisplay[expectedToken]} expected.`, location, isPunctuation(expectedToken));
    return false;
  }

  function expectTokenIsOneOf(...args: [option1: Token, ...rest: Token[]]) {
    const tok = token();
    if (!args.some((expectedToken) => tok === expectedToken)) {
      errorTokenIsNotOneOf(...args);
    }
    return tok;
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
    const msg = `Expected ${displayList.join(", ")}.`;
    error(msg, location);
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

type NodeCb<T> = (c: Node) => T;

export function visitChildren<T>(node: Node, cb: NodeCb<T>): T | undefined {
  switch (node.kind) {
    case SyntaxKind.CadlScript:
      return visitEach(cb, node.statements);
    case SyntaxKind.ArrayExpression:
      return visitNode(cb, node.elementType);
    case SyntaxKind.DecoratorExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.DirectiveExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.ImportStatement:
      return visitNode(cb, node.path);
    case SyntaxKind.OperationStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.parameters) ||
        visitNode(cb, node.returnType)
      );
    case SyntaxKind.NamespaceStatement:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.name) ||
        Array.isArray(node.statements)
        ? visitEach(cb, node.statements as Statement[])
        : visitNode(cb, node.statements);
    case SyntaxKind.InterfaceStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.mixes) ||
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
    case SyntaxKind.EnumStatement:
      return (
        visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitEach(cb, node.members)
      );
    case SyntaxKind.EnumMember:
      return visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitNode(cb, node.value);
    case SyntaxKind.AliasStatement:
      return (
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitNode(cb, node.value)
      );
    case SyntaxKind.NamedImport:
      return visitNode(cb, node.id);
    case SyntaxKind.TypeReference:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case SyntaxKind.TupleExpression:
      return visitEach(cb, node.values);
    case SyntaxKind.UnionExpression:
      return visitEach(cb, node.options);
    // no children for the rest of these.
    case SyntaxKind.StringLiteral:
    case SyntaxKind.NumericLiteral:
    case SyntaxKind.BooleanLiteral:
    case SyntaxKind.Identifier:
    case SyntaxKind.TemplateParameterDeclaration:
    case SyntaxKind.InvalidStatement:
    case SyntaxKind.EmptyStatement:
      return;
    default:
      // Dummy const to ensure we handle all node types.
      // If you get an error here, add a case for the new node type
      // you added..
      const assertNever: never = node;
      return;
  }
}

function visitNode<T>(cb: NodeCb<T>, node: Node | undefined): T | undefined {
  return node && cb(node);
}

function visitEach<T>(cb: NodeCb<T>, nodes: Node[] | undefined): T | undefined {
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

export function hasParseError(node: Node) {
  if (getFlag(node, NodeFlags.ThisNodeHasError)) {
    return true;
  }

  checkForDescendantErrors(node);
  return getFlag(node, NodeFlags.DescendantHasError);
}

function checkForDescendantErrors(node: Node) {
  if (getFlag(node, NodeFlags.DescendantErrorsExamined)) {
    return;
  }

  visitChildren(node, (child) => {
    if (getFlag(child, NodeFlags.ThisNodeHasError)) {
      setFlag(node, NodeFlags.DescendantHasError | NodeFlags.DescendantErrorsExamined);
      return true;
    }

    checkForDescendantErrors(child);

    if (getFlag(child, NodeFlags.DescendantHasError)) {
      setFlag(node, NodeFlags.DescendantHasError | NodeFlags.DescendantErrorsExamined);
      return true;
    }

    setFlag(child, NodeFlags.DescendantErrorsExamined);
    return false;
  });
}

function getFlag(node: Node, flag: NodeFlags) {
  return ((node as any).flags & flag) !== 0;
}

function setFlag(node: Node, flag: NodeFlags) {
  (node as any).flags |= flag;
}

function isBlocklessNamespace(node: Node) {
  if (node.kind !== SyntaxKind.NamespaceStatement) {
    return false;
  }
  while (!Array.isArray(node.statements) && node.statements) {
    node = node.statements;
  }

  return node.statements === undefined;
}
