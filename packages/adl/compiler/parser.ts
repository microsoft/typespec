import { createSymbolTable } from "./binder.js";
import { compilerAssert, createDiagnostic, DiagnosticTarget, Message } from "./diagnostics.js";
import {
  createScanner,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  isTrivia,
  Token,
  TokenDisplay,
} from "./scanner.js";
import {
  ADLScriptNode,
  BooleanLiteralNode,
  DecoratorExpressionNode,
  Diagnostic,
  EmptyStatementNode,
  Expression,
  IdentifierNode,
  ImportStatementNode,
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
 * The fixed set of options for each of the kinds of delimited lists in ADL.
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

export function parse(code: string | SourceFile) {
  let parseErrorInNextFinishedNode = false;
  let previousTokenEnd = -1;
  let realPositionOfLastError = -1;
  let missingIdentifierCounter = 0;
  const parseDiagnostics: Diagnostic[] = [];
  const scanner = createScanner(code, reportDiagnostic);

  nextToken();
  return parseADLScript();

  function parseADLScript(): ADLScriptNode {
    const statements = parseADLScriptItemList();
    return {
      kind: SyntaxKind.ADLScript,
      statements,
      file: scanner.file,
      interfaces: [],
      models: [],
      namespaces: [],
      usings: [],
      locals: createSymbolTable(),
      inScopeNamespaces: [],
      parseDiagnostics,
      ...finishNode({}, 0),
    };
  }

  function parseADLScriptItemList(): Statement[] {
    const stmts: Statement[] = [];
    let seenBlocklessNs = false;
    let seenDecl = false;
    while (!scanner.eof()) {
      const decorators = parseDecoratorList();
      const tok = token();
      let item: Statement;
      switch (tok) {
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          item = parseImportStatement();
          break;
        case Token.ModelKeyword:
          item = parseModelStatement(decorators);
          break;
        case Token.NamespaceKeyword:
          item = parseNamespaceStatement(decorators);
          break;
        case Token.OpKeyword:
          item = parseOperationStatement(decorators);
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
      const decorators = parseDecoratorList();
      const tok = token();

      switch (tok) {
        case Token.ImportKeyword:
          reportInvalidDecorators(decorators, "import statement");
          error("Imports must be top-level and come prior to namespaces or other declarations.");
          stmts.push(parseImportStatement());
          break;
        case Token.ModelKeyword:
          stmts.push(parseModelStatement(decorators));
          break;
        case Token.NamespaceKeyword:
          const ns = parseNamespaceStatement(decorators);

          if (!Array.isArray(ns.statements)) {
            error("Blockless namespace can only be top-level.");
          }
          stmts.push(ns);
          break;
        case Token.OpKeyword:
          stmts.push(parseOperationStatement(decorators));
          break;
        case Token.UsingKeyword:
          reportInvalidDecorators(decorators, "using statement");
          stmts.push(parseUsingStatement());
          break;
        case Token.EndOfFile:
          error("End of file reached without '}'.");
          return stmts;
        case Token.Semicolon:
          reportInvalidDecorators(decorators, "empty statement");
          stmts.push(parseEmptyStatement());
          break;
        default:
          reportInvalidDecorators(decorators, "invalid statement");
          stmts.push(parseInvalidStatement());
          break;
      }
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

  function parseNamespaceStatement(decorators: DecoratorExpressionNode[]): NamespaceStatementNode {
    parseExpected(Token.NamespaceKeyword);
    let currentName = parseIdentifierOrMemberExpression();
    const nsSegments: IdentifierNode[] = [];
    while (currentName.kind !== SyntaxKind.Identifier) {
      nsSegments.push(currentName.id);
      currentName = currentName.base;
    }
    nsSegments.push(currentName);

    let parameters: ModelExpressionNode | undefined;

    const nextTok = parseExpectedOneOf(Token.Semicolon, Token.OpenBrace);

    let statements: Statement[] | undefined;
    if (nextTok === Token.OpenBrace) {
      statements = parseStatementList();
      parseExpected(Token.CloseBrace);
    }

    let outerNs: NamespaceStatementNode = finishNode(
      {
        kind: SyntaxKind.NamespaceStatement,
        decorators,
        name: nsSegments[0],
        parameters,
        statements,
      },
      nsSegments[0].pos
    );

    for (let i = 1; i < nsSegments.length; i++) {
      outerNs = finishNode(
        {
          kind: SyntaxKind.NamespaceStatement,
          decorators: [],
          name: nsSegments[i],
          parameters,
          statements: outerNs,
        },
        nsSegments[i].pos
      );
    }

    return outerNs;
  }

  function parseUsingStatement(): UsingStatementNode {
    const pos = tokenPos();
    parseExpected(Token.UsingKeyword);
    const name = parseIdentifierOrMemberExpression();
    parseExpected(Token.Semicolon);

    return finishNode(
      {
        kind: SyntaxKind.UsingStatement,
        name,
      },
      pos
    );
  }

  function parseOperationStatement(decorators: DecoratorExpressionNode[]): OperationStatementNode {
    const pos = tokenPos();
    parseExpected(Token.OpKeyword);

    const id = parseIdentifier();
    const parameters = parseOperationParameters();
    parseExpected(Token.Colon);

    const returnType = parseExpression();
    parseExpected(Token.Semicolon);

    return finishNode(
      {
        kind: SyntaxKind.OperationStatement,
        id,
        parameters,
        returnType,
        decorators,
      },
      pos
    );
  }

  function parseOperationParameters(): ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.OperationParameters, parseModelPropertyOrSpread);
    const parameters: ModelExpressionNode = finishNode(
      {
        kind: SyntaxKind.ModelExpression,
        properties,
      },
      pos
    );
    return parameters;
  }

  function parseModelStatement(decorators: DecoratorExpressionNode[]): ModelStatementNode {
    const pos = tokenPos();

    parseExpected(Token.ModelKeyword);
    const id = parseIdentifier();
    const templateParameters = parseOptionalList(
      ListKind.TemplateParameters,
      parseTemplateParameter
    );

    expectTokenIsOneOf(Token.OpenBrace, Token.Equals, Token.ExtendsKeyword);

    if (parseOptional(Token.Equals)) {
      const assignment = parseExpression();
      parseExpected(Token.Semicolon);

      return finishNode(
        {
          kind: SyntaxKind.ModelStatement,
          id,
          heritage: [],
          templateParameters,
          assignment,
          decorators,
        },
        pos
      );
    } else {
      const heritage: ReferenceExpression[] = parseOptionalModelHeritage();
      const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);

      return finishNode(
        {
          kind: SyntaxKind.ModelStatement,
          id,
          heritage,
          templateParameters,
          decorators,
          properties,
        },
        pos
      );
    }
  }

  function parseOptionalModelHeritage() {
    let heritage: ReferenceExpression[] = [];
    if (parseOptional(Token.ExtendsKeyword)) {
      heritage = parseList(ListKind.Heritage, parseReferenceExpression);
    }
    return heritage;
  }

  function parseTemplateParameter(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): TemplateParameterDeclarationNode {
    reportInvalidDecorators(decorators, "template parameter");
    const id = parseIdentifier();
    return finishNode(
      {
        kind: SyntaxKind.TemplateParameterDeclaration,
        id,
      },
      pos
    );
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

    return finishNode(
      {
        kind: SyntaxKind.ModelSpreadProperty,
        target,
      },
      pos
    );
  }

  function parseModelProperty(
    pos: number,
    decorators: DecoratorExpressionNode[]
  ): ModelPropertyNode | ModelSpreadPropertyNode {
    let id =
      token() === Token.StringLiteral
        ? parseStringLiteral()
        : parseIdentifier("Property expected.");

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
    const value = parseExpression();

    return finishNode(
      {
        kind: SyntaxKind.ModelProperty,
        id,
        decorators,
        value,
        optional,
      },
      pos
    );
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

    node = finishNode(
      {
        kind: SyntaxKind.UnionExpression,
        options: [node],
      },
      pos
    );

    while (parseOptional(Token.Bar)) {
      const expr = parseIntersectionExpressionOrHigher();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseIntersectionExpressionOrHigher(): Expression {
    const pos = tokenPos();
    parseOptional(Token.Ampersand);
    let node: Expression = parseArrayExpressionOrHigher();

    if (token() !== Token.Ampersand) {
      return node;
    }

    node = finishNode(
      {
        kind: SyntaxKind.IntersectionExpression,
        options: [node],
      },
      pos
    );

    while (parseOptional(Token.Ampersand)) {
      const expr = parseArrayExpressionOrHigher();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseArrayExpressionOrHigher(): Expression {
    const pos = tokenPos();
    let expr = parsePrimaryExpression();

    while (parseOptional(Token.OpenBracket)) {
      parseExpected(Token.CloseBracket);

      expr = finishNode(
        {
          kind: SyntaxKind.ArrayExpression,
          elementType: expr,
        },
        pos
      );
    }

    return expr;
  }

  function parseReferenceExpression(): ReferenceExpression {
    const pos = tokenPos();
    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.TemplateArguments, parseExpression);

    return finishNode(
      {
        kind: SyntaxKind.TypeReference,
        target,
        arguments: args,
      },
      pos
    );
  }

  function parseImportStatement(): ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Token.ImportKeyword);
    const path = parseStringLiteral();

    parseExpected(Token.Semicolon);
    return finishNode(
      {
        kind: SyntaxKind.ImportStatement,
        path,
      },
      pos
    );
  }

  function parseDecoratorExpression(): DecoratorExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.At);

    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.DecoratorArguments, parseExpression);
    return finishNode(
      {
        kind: SyntaxKind.DecoratorExpression,
        arguments: args,
        target,
      },
      pos
    );
  }

  function parseIdentifierOrMemberExpression(): IdentifierNode | MemberExpressionNode {
    let base: IdentifierNode | MemberExpressionNode = parseIdentifier();

    while (parseOptional(Token.Dot)) {
      const pos = tokenPos();
      base = finishNode(
        {
          kind: SyntaxKind.MemberExpression,
          base,
          id: parseIdentifier(),
        },
        pos
      );
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
    return finishNode(expr, pos);
  }

  function parseTupleExpression(): TupleExpressionNode {
    const pos = tokenPos();
    const values = parseList(ListKind.Tuple, parseExpression);
    return finishNode(
      {
        kind: SyntaxKind.TupleExpression,
        values,
      },
      pos
    );
  }

  function parseModelExpression(): ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);
    return finishNode(
      {
        kind: SyntaxKind.ModelExpression,
        properties,
      },
      pos
    );
  }

  function parseStringLiteral(): StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Token.StringLiteral);
    return finishNode(
      {
        kind: SyntaxKind.StringLiteral,
        value,
      },
      pos
    );
  }

  function parseNumericLiteral(): NumericLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = Number(text);

    parseExpected(Token.NumericLiteral);
    return finishNode(
      {
        kind: SyntaxKind.NumericLiteral,
        text,
        value,
      },
      pos
    );
  }

  function parseBooleanLiteral(): BooleanLiteralNode {
    const pos = tokenPos();
    const token = parseExpectedOneOf(Token.TrueKeyword, Token.FalseKeyword);
    const value = token == Token.TrueKeyword;
    return finishNode(
      {
        kind: SyntaxKind.BooleanLiteral,
        value,
      },
      pos
    );
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

    return finishNode(
      {
        kind: SyntaxKind.Identifier,
        sv,
      },
      pos
    );
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

  function nextToken() {
    // keep track of the previous token end separately from the current scanner
    // position as these will differ when the previous token had trailing
    // trivia, and we don't want to squiggle the trivia.
    previousTokenEnd = scanner.position;

    do {
      scanner.scan();
    } while (isTrivia(token()));
  }

  function createMissingIdentifier(): IdentifierNode {
    missingIdentifierCounter++;
    return finishNode(
      {
        kind: SyntaxKind.Identifier,
        sv: "<missing identifier>" + missingIdentifierCounter,
      },
      tokenPos()
    );
  }

  function finishNode<T>(o: T, pos: number): T & TextRange & { flags: NodeFlags } {
    const flags = parseErrorInNextFinishedNode ? NodeFlags.ThisNodeHasError : NodeFlags.None;
    parseErrorInNextFinishedNode = false;

    return {
      ...o,
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
  function parseList<T>(kind: ListKind, parseItem: ParseListItem<T>): T[] {
    if (kind.open !== Token.None) {
      parseExpected(kind.open);
    }

    if (kind.allowEmpty && parseOptional(kind.close)) {
      return [];
    }

    const items: T[] = [];
    while (true) {
      const pos = tokenPos();
      const decorators = parseDecoratorList();
      if (kind.invalidDecoratorTarget) {
        reportInvalidDecorators(decorators, kind.invalidDecoratorTarget);
      }

      const item = parseItem(pos, decorators);
      items.push(item);
      const delimiter = token();
      const delimiterPos = tokenPos();

      if (parseOptionalDelimiter(kind)) {
        // Delimiter found: check if it's trailing.
        if (parseOptional(kind.close)) {
          if (!kind.toleratedDelimiterIsValid) {
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
  function parseOptionalList<T>(kind: SurroundedListKind, parseItem: ParseListItem<T>): T[] {
    return token() == kind.open ? parseList(kind, parseItem) : [];
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
    return finishNode({ kind: SyntaxKind.EmptyStatement }, pos);
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
    return finishNode({ kind: SyntaxKind.InvalidStatement }, pos);
  }

  function error(message: string, target?: TextRange & { realPos?: number }) {
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
    parseErrorInNextFinishedNode = true;
    reportDiagnostic(message, location);
  }

  function reportDiagnostic(
    message: Message | string,
    target: DiagnosticTarget,
    args?: (string | number)[]
  ) {
    const diagnostic = createDiagnostic(message, target, args);
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

  function parseExpected(expectedToken: Token) {
    if (token() === expectedToken) {
      nextToken();
      return true;
    }

    const location = getAdjustedDefaultLocation(expectedToken);
    error(`${TokenDisplay[expectedToken]} expected.`, location);
    return false;
  }

  function expectTokenIsOneOf(option1: Token, option2: Token, option3 = Token.None) {
    const tok = token();
    if (tok !== option1 && tok !== option2 && tok !== option3) {
      errorTokenIsNotOneOf(option1, option2, option3);
      return Token.None;
    }
    return tok;
  }

  function parseExpectedOneOf(option1: Token, option2: Token, option3 = Token.None) {
    const tok = expectTokenIsOneOf(option1, option2, option3);
    if (tok !== Token.None) {
      nextToken();
    }
    return tok;
  }

  function errorTokenIsNotOneOf(option1: Token, option2: Token, option3 = Token.None) {
    const location = getAdjustedDefaultLocation(option1);
    const msg =
      option3 === Token.None
        ? `Expected ${TokenDisplay[option1]} or ${TokenDisplay[option2]}.`
        : `Expected ${TokenDisplay[option1]}, ${TokenDisplay[option2]}, or ${TokenDisplay[option3]}.`;

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
    case SyntaxKind.ADLScript:
      return visitEach(cb, node.statements);
    case SyntaxKind.ArrayExpression:
      return visitNode(cb, node.elementType);
    case SyntaxKind.DecoratorExpression:
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
    case SyntaxKind.UsingStatement:
      return visitNode(cb, node.name);
    case SyntaxKind.IntersectionExpression:
      return visitEach(cb, node.options);
    case SyntaxKind.MemberExpression:
      return visitNode(cb, node.base) || visitNode(cb, node.id);
    case SyntaxKind.ModelExpression:
      return visitEach(cb, node.properties);
    case SyntaxKind.ModelProperty:
      return visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitNode(cb, node.value);
    case SyntaxKind.ModelSpreadProperty:
      return visitNode(cb, node.target);
    case SyntaxKind.ModelStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.heritage) ||
        visitNode(cb, node.assignment) ||
        visitEach(cb, node.properties)
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
