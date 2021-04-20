import { SymbolTable } from "./binder.js";
import { createDiagnostic, compilerAssert, DiagnosticTarget } from "./diagnostics.js";
import {
  createScanner,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  isTrivia,
  Token,
  TokenDisplay,
} from "./scanner.js";
import * as Types from "./types.js";

/**
 * Callback to parse each element in a delimited list
 *
 * @param pos        The position of the start of the list element before any
 *                   decorators were parsed.
 *
 * @param decorators The decorators that were applied to the list element and
 *                   parsed before entering the callback.
 */
type ParseListItem<T> = (pos: number, decorators: Types.DecoratorExpressionNode[]) => T;

/**
 * In order to share sensitive error recovery code, all parsing of delimited
 * lists is done using a shared driver routine parameterized by these options.
 */
interface ListKind {
  readonly optional: boolean;
  readonly allowEmpty: boolean;
  readonly open: Token;
  readonly close: Token;
  readonly delimiter: Token;
  readonly toleratedDelimiter: Token;
  readonly toleratedDelimiterIsValid: boolean;
  readonly trailingDelimiterIsValid: boolean;
  readonly invalidDecoratorTarget?: string;
}

/**
 * The fixed set of options for each of the kinds of delimited lists in ADL.
 */
namespace ListKind {
  const PropertiesBase = {
    allowEmpty: true,
    optional: false,
    toleratedDelimiterIsValid: true,
    trailingDelimiterIsValid: true,
  };

  export const OperationParameters: ListKind = {
    ...PropertiesBase,
    open: Token.OpenParen,
    close: Token.CloseParen,
    delimiter: Token.Comma,
    toleratedDelimiter: Token.Semicolon,
  };

  export const DecoratorArguments: ListKind = {
    ...OperationParameters,
    optional: true,
    invalidDecoratorTarget: "expression",
  };

  export const ModelProperties: ListKind = {
    ...PropertiesBase,
    open: Token.OpenBrace,
    close: Token.CloseBrace,
    delimiter: Token.Semicolon,
    toleratedDelimiter: Token.Comma,
  };

  const ExpresionsBase = {
    allowEmpty: true,
    optional: false,
    delimiter: Token.Comma,
    toleratedDelimiter: Token.Semicolon,
    toleratedDelimiterIsValid: false,
    trailingDelimiterIsValid: false,
    invalidDecoratorTarget: "expression",
  };

  export const TemplateParameters: ListKind = {
    ...ExpresionsBase,
    optional: true,
    allowEmpty: false,
    open: Token.LessThan,
    close: Token.GreaterThan,
  };

  export const TemplateArguments: ListKind = {
    ...TemplateParameters,
  };

  export const Heritage: ListKind = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.None,
    close: Token.None,
  };

  export const Tuple: ListKind = {
    ...ExpresionsBase,
    allowEmpty: false,
    open: Token.OpenBracket,
    close: Token.CloseBracket,
  };
}

export function parse(code: string | Types.SourceFile) {
  let previousTokenEnd = -1;
  let realPositionOfLastError = -1;
  let missingIdentifierCounter = 0;
  const parseDiagnostics: Types.Diagnostic[] = [];
  const scanner = createScanner(code, reportDiagnostic);

  nextToken();
  return parseADLScript();

  function parseADLScript(): Types.ADLScriptNode {
    const script: Types.ADLScriptNode = {
      kind: Types.SyntaxKind.ADLScript,
      statements: [],
      pos: 0,
      end: 0,
      file: scanner.file,
      interfaces: [],
      models: [],
      namespaces: [],
      usings: [],
      locals: new SymbolTable(),
      inScopeNamespaces: [],
      parseDiagnostics,
    };

    script.statements = parseADLScriptItemList();
    script.end = scanner.position;
    return script;
  }

  function parseADLScriptItemList(): Types.Statement[] {
    const stmts: Types.Statement[] = [];
    let seenBlocklessNs = false;
    let seenDecl = false;
    while (!scanner.eof()) {
      const decorators = parseDecoratorList();
      const tok = token();
      let item: Types.Statement;
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
          // no need to put empty statement nodes in the tree for now
          // since we aren't trying to emit ADL
          parseExpected(Token.Semicolon);
          continue;
        default:
          recoverFromInvalidStatement(decorators);
          continue;
      }

      if (isBlocklessNamespace(item)) {
        if (seenBlocklessNs) {
          error("Cannot use multiple blockless namespaces.");
        }
        if (seenDecl) {
          error("Blockless namespaces can't follow other declarations.");
        }
        seenBlocklessNs = true;
      } else if (item.kind === Types.SyntaxKind.ImportStatement) {
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

  function parseStatementList(): Types.Statement[] {
    const stmts: Types.Statement[] = [];

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
          // no need to put empty statement nodes in the tree for now
          // since we aren't trying to emit ADL
          parseExpected(Token.Semicolon);
          continue;
        default:
          recoverFromInvalidStatement(decorators);
          continue;
      }
    }

    return stmts;
  }

  function parseDecoratorList() {
    const decorators: Types.DecoratorExpressionNode[] = [];

    while (token() === Token.At) {
      decorators.push(parseDecoratorExpression());
    }

    return decorators;
  }

  function parseNamespaceStatement(
    decorators: Types.DecoratorExpressionNode[]
  ): Types.NamespaceStatementNode {
    parseExpected(Token.NamespaceKeyword);
    let currentName = parseIdentifierOrMemberExpression();
    const nsSegments: Types.IdentifierNode[] = [];
    while (currentName.kind !== Types.SyntaxKind.Identifier) {
      nsSegments.push(currentName.id);
      currentName = currentName.base;
    }
    nsSegments.push(currentName);

    let parameters: Types.ModelExpressionNode | undefined;

    const nextTok = parseExpectedOneOf(Token.Semicolon, Token.OpenBrace);

    let statements: Types.Statement[] | undefined;
    if (nextTok === Token.OpenBrace) {
      statements = parseStatementList();
      parseExpected(Token.CloseBrace);
    }

    let outerNs: Types.NamespaceStatementNode = finishNode(
      {
        kind: Types.SyntaxKind.NamespaceStatement,
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
          kind: Types.SyntaxKind.NamespaceStatement,
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

  function parseUsingStatement(): Types.UsingStatementNode {
    const pos = tokenPos();
    parseExpected(Token.UsingKeyword);
    const name = parseIdentifierOrMemberExpression();
    parseExpected(Token.Semicolon);

    return finishNode(
      {
        kind: Types.SyntaxKind.UsingStatement,
        name,
      },
      pos
    );
  }

  function parseOperationStatement(
    decorators: Types.DecoratorExpressionNode[]
  ): Types.OperationStatementNode {
    const pos = tokenPos();
    parseExpected(Token.OpKeyword);

    const id = parseIdentifier();
    const parameters = parseOperationParameters();
    parseExpected(Token.Colon);

    const returnType = parseExpression();
    parseExpected(Token.Semicolon);

    return finishNode(
      {
        kind: Types.SyntaxKind.OperationStatement,
        id,
        parameters,
        returnType,
        decorators,
      },
      pos
    );
  }

  function parseOperationParameters(): Types.ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.OperationParameters, parseModelPropertyOrSpread);
    const parameters: Types.ModelExpressionNode = finishNode(
      {
        kind: Types.SyntaxKind.ModelExpression,
        properties,
      },
      pos
    );
    return parameters;
  }

  function parseModelStatement(
    decorators: Types.DecoratorExpressionNode[]
  ): Types.ModelStatementNode {
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
          kind: Types.SyntaxKind.ModelStatement,
          id,
          heritage: [],
          templateParameters,
          assignment,
          decorators,
        },
        pos
      );
    } else {
      const heritage: Types.ReferenceExpression[] = parseOptionalModelHeritage();
      const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);

      return finishNode(
        {
          kind: Types.SyntaxKind.ModelStatement,
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
    let heritage: Types.ReferenceExpression[] = [];
    if (parseOptional(Token.ExtendsKeyword)) {
      heritage = parseList(ListKind.Heritage, parseReferenceExpression);
    }
    return heritage;
  }

  function parseTemplateParameter(
    pos: number,
    decorators: Types.DecoratorExpressionNode[]
  ): Types.TemplateParameterDeclarationNode {
    reportInvalidDecorators(decorators, "template parameter");
    const id = parseIdentifier();
    return finishNode(
      {
        kind: Types.SyntaxKind.TemplateParameterDeclaration,
        id,
      },
      pos
    );
  }

  function parseModelPropertyOrSpread(pos: number, decorators: Types.DecoratorExpressionNode[]) {
    return token() === Token.Elipsis
      ? parseModelSpreadProperty(pos, decorators)
      : parseModelProperty(pos, decorators);
  }

  function parseModelSpreadProperty(
    pos: number,
    decorators: Types.DecoratorExpressionNode[]
  ): Types.ModelSpreadPropertyNode {
    parseExpected(Token.Elipsis);

    reportInvalidDecorators(decorators, "spread property");

    // This could be broadened to allow any type expression
    const target = parseReferenceExpression();

    return finishNode(
      {
        kind: Types.SyntaxKind.ModelSpreadProperty,
        target,
      },
      pos
    );
  }

  function parseModelProperty(
    pos: number,
    decorators: Types.DecoratorExpressionNode[]
  ): Types.ModelPropertyNode | Types.ModelSpreadPropertyNode {
    let id =
      token() === Token.StringLiteral
        ? parseStringLiteral()
        : parseIdentifier("Property expected.");

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
    const value = parseExpression();

    return finishNode(
      {
        kind: Types.SyntaxKind.ModelProperty,
        id,
        decorators,
        value,
        optional,
      },
      pos
    );
  }

  function parseExpression(): Types.Expression {
    return parseUnionExpressionOrHigher();
  }

  function parseUnionExpressionOrHigher(): Types.Expression {
    const pos = tokenPos();
    parseOptional(Token.Bar);
    let node: Types.Expression = parseIntersectionExpressionOrHigher();

    if (token() !== Token.Bar) {
      return node;
    }

    node = finishNode(
      {
        kind: Types.SyntaxKind.UnionExpression,
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

  function parseIntersectionExpressionOrHigher(): Types.Expression {
    const pos = tokenPos();
    parseOptional(Token.Ampersand);
    let node: Types.Expression = parseArrayExpressionOrHigher();

    if (token() !== Token.Ampersand) {
      return node;
    }

    node = finishNode(
      {
        kind: Types.SyntaxKind.IntersectionExpression,
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

  function parseArrayExpressionOrHigher(): Types.Expression {
    const pos = tokenPos();
    let expr = parsePrimaryExpression();

    while (parseOptional(Token.OpenBracket)) {
      parseExpected(Token.CloseBracket);

      expr = finishNode(
        {
          kind: Types.SyntaxKind.ArrayExpression,
          elementType: expr,
        },
        pos
      );
    }

    return expr;
  }

  function parseReferenceExpression(): Types.ReferenceExpression {
    const pos = tokenPos();
    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.TemplateArguments, parseExpression);

    return finishNode(
      {
        kind: Types.SyntaxKind.TypeReference,
        target,
        arguments: args,
      },
      pos
    );
  }

  function parseImportStatement(): Types.ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Token.ImportKeyword);
    const pathLiteral = parseStringLiteral();
    const path = pathLiteral.value;
    parseExpected(Token.Semicolon);
    return finishNode(
      {
        kind: Types.SyntaxKind.ImportStatement,
        path,
      },
      pos
    );
  }

  function parseDecoratorExpression(): Types.DecoratorExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.At);

    const target = parseIdentifierOrMemberExpression();
    const args = parseOptionalList(ListKind.DecoratorArguments, parseExpression);
    return finishNode(
      {
        kind: Types.SyntaxKind.DecoratorExpression,
        arguments: args,
        target,
      },
      pos
    );
  }

  function parseIdentifierOrMemberExpression(): Types.IdentifierNode | Types.MemberExpressionNode {
    let base: Types.IdentifierNode | Types.MemberExpressionNode = parseIdentifier();

    while (parseOptional(Token.Dot)) {
      const pos = tokenPos();
      base = finishNode(
        {
          kind: Types.SyntaxKind.MemberExpression,
          base,
          id: parseIdentifier(),
        },
        pos
      );
    }

    return base;
  }

  function parsePrimaryExpression(): Types.Expression {
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

  function parseParenthesizedExpression(): Types.Expression {
    const pos = tokenPos();
    parseExpected(Token.OpenParen);
    const expr = parseExpression();
    parseExpected(Token.CloseParen);
    return finishNode(expr, pos);
  }

  function parseTupleExpression(): Types.TupleExpressionNode {
    const pos = tokenPos();
    const values = parseList(ListKind.Tuple, parseExpression);
    return finishNode(
      {
        kind: Types.SyntaxKind.TupleExpression,
        values,
      },
      pos
    );
  }

  function parseModelExpression(): Types.ModelExpressionNode {
    const pos = tokenPos();
    const properties = parseList(ListKind.ModelProperties, parseModelPropertyOrSpread);
    return finishNode(
      {
        kind: Types.SyntaxKind.ModelExpression,
        properties,
      },
      pos
    );
  }

  function parseStringLiteral(): Types.StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Token.StringLiteral);
    return finishNode(
      {
        kind: Types.SyntaxKind.StringLiteral,
        value,
      },
      pos
    );
  }

  function parseNumericLiteral(): Types.NumericLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = Number(text);

    parseExpected(Token.NumericLiteral);
    return finishNode(
      {
        kind: Types.SyntaxKind.NumericLiteral,
        text,
        value,
      },
      pos
    );
  }

  function parseBooleanLiteral(): Types.BooleanLiteralNode {
    const pos = tokenPos();
    const token = parseExpectedOneOf(Token.TrueKeyword, Token.FalseKeyword);
    const value = token == Token.TrueKeyword;
    return finishNode(
      {
        kind: Types.SyntaxKind.BooleanLiteral,
        value,
      },
      pos
    );
  }

  function parseIdentifier(message?: string): Types.IdentifierNode {
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
        kind: Types.SyntaxKind.Identifier,
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

  function createMissingIdentifier(): Types.IdentifierNode {
    missingIdentifierCounter++;
    return finishNode(
      {
        kind: Types.SyntaxKind.Identifier,
        sv: "<missing identifier>" + missingIdentifierCounter,
      },
      tokenPos()
    );
  }

  function finishNode<T>(o: T, pos: number): T & Types.TextRange {
    return {
      ...o,
      pos,
      end: previousTokenEnd,
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
   * Parse a delimited list with surround open and close punctuation if the open
   * token is present. Otherwise, return an empty list.
   */
  function parseOptionalList<T>(kind: ListKind, parseItem: ParseListItem<T>): T[] {
    assert(kind.open !== Token.None, "A list cannot be optional without open punctuation.");
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

  function recoverFromInvalidStatement(decorators: Types.DecoratorExpressionNode[]) {
    // Error recovery: avoid an avalanche of errors when we get cornered into
    // parsing statements where none exist. Skip until we find a statement
    // keyword or decorator and only report one error for a contiguous range of
    // neither.
    reportInvalidDecorators(decorators, "invalid statement");
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
  }

  function error(message: string, target?: Types.TextRange & { realPos?: number }) {
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
    reportDiagnostic(message, location);
  }

  function reportDiagnostic(
    message: Types.Message | string,
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

  function reportInvalidDecorators(decorators: Types.DecoratorExpressionNode[], nodeName: string) {
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

  function expectTokenIsOneOf(...options: Token[]): boolean {
    for (const tok of options) {
      if (token() === tok) {
        return true;
      }
    }

    errorTokenIsNotOneOf(options);
    return false;
  }

  function parseExpectedOneOf<T extends Token[]>(...options: T): T[number] | undefined {
    for (const tok of options) {
      if (token() === tok) {
        nextToken();
        return tok;
      }
    }
    errorTokenIsNotOneOf(options);
    return undefined;
  }

  function errorTokenIsNotOneOf(options: Token[]) {
    // Intl isn't in standard library as it is stage 3, however it is supported in node >= 12
    const location = getAdjustedDefaultLocation(options[0]);
    const listfmt = new (Intl as any).ListFormat("en", { style: "long", type: "disjunction" });
    const textOptions = options.map((o) => `${TokenDisplay[o]}`);
    error(`Expected ${listfmt.format(textOptions)}.`, location);
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

type NodeCb<T> = (c: Types.Node) => T;

export function visitChildren<T>(node: Types.Node, cb: NodeCb<T>): T | undefined {
  switch (node.kind) {
    case Types.SyntaxKind.ADLScript:
      return visitEach(cb, node.statements);
    case Types.SyntaxKind.ArrayExpression:
      return visitNode(cb, node.elementType);
    case Types.SyntaxKind.DecoratorExpression:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case Types.SyntaxKind.ImportStatement:
      return;
    case Types.SyntaxKind.OperationStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.parameters) ||
        visitNode(cb, node.returnType)
      );
    case Types.SyntaxKind.NamespaceStatement:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.name) ||
        Array.isArray(node.statements)
        ? visitEach(cb, node.statements as Types.Statement[])
        : visitNode(cb, node.statements);
    case Types.SyntaxKind.UsingStatement:
      return visitNode(cb, node.name);
    case Types.SyntaxKind.IntersectionExpression:
      return visitEach(cb, node.options);
    case Types.SyntaxKind.MemberExpression:
      return visitNode(cb, node.base) || visitNode(cb, node.id);
    case Types.SyntaxKind.ModelExpression:
      return visitEach(cb, node.properties);
    case Types.SyntaxKind.ModelProperty:
      return visitEach(cb, node.decorators) || visitNode(cb, node.id) || visitNode(cb, node.value);
    case Types.SyntaxKind.ModelSpreadProperty:
      return visitNode(cb, node.target);
    case Types.SyntaxKind.ModelStatement:
      return (
        visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitEach(cb, node.heritage) ||
        visitNode(cb, node.assignment) ||
        visitEach(cb, node.properties)
      );
    case Types.SyntaxKind.NamedImport:
      return visitNode(cb, node.id);
    case Types.SyntaxKind.TypeReference:
      return visitNode(cb, node.target) || visitEach(cb, node.arguments);
    case Types.SyntaxKind.TupleExpression:
      return visitEach(cb, node.values);
    case Types.SyntaxKind.UnionExpression:
      return visitEach(cb, node.options);
    // no children for the rest of these.
    case Types.SyntaxKind.StringLiteral:
    case Types.SyntaxKind.NumericLiteral:
    case Types.SyntaxKind.BooleanLiteral:
    case Types.SyntaxKind.Identifier:
    case Types.SyntaxKind.TemplateParameterDeclaration:
      return;
    default:
      // Dummy const to ensure we handle all node types.
      // If you get an error here, add a case for the new node type
      // you added..
      const assertNever: never = node;
      return;
  }
}

function visitNode<T>(cb: NodeCb<T>, node: Types.Node | undefined): T | undefined {
  return node && cb(node);
}

function visitEach<T>(cb: NodeCb<T>, nodes: Array<Types.Node> | undefined): T | undefined {
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

export function walk<T>(node: Types.Node, cb: NodeCb<T>, seen = new Set()): T | undefined {
  return visitChildren(node, (childNode) => {
    if (seen.has(childNode)) return;
    seen.add(childNode);
    const value = cb(childNode);
    if (value) {
      return value;
    }
    return walk(childNode, cb, seen);
  });
}

function isBlocklessNamespace(node: Types.Node) {
  if (node.kind !== Types.SyntaxKind.NamespaceStatement) {
    return false;
  }
  while (!Array.isArray(node.statements) && node.statements) {
    node = node.statements;
  }

  return node.statements === undefined;
}
