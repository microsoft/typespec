import { Kind, Scanner } from './scanner.js';
import * as Types from './types.js';

export function parse(code: string) {
  const scaner = new Scanner(code);
  nextToken();
  return parseADLScript();

  function parseADLScript(): Types.ADLScriptNode {
    const script: Types.ADLScriptNode = {
      kind: Types.SyntaxKind.ADLScript,
      statements: [],
      pos: 0,
      end: 0
    };

    while (!scaner.eof) {
      script.statements.push(parseStatement());
    }

    script.end = scaner.offset;
    return script;
  }

  function parseStatement(): Types.Statement {
    let decorators = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const tok = token();
      let node: Types.Statement;

      switch (tok) {
        case Kind.ImportKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an import statement');
          }
          return parseImportStatement();
        case Kind.At:
        case Kind.OpenBracket:
          decorators.push(parseDecoratorExpression());
          continue;
        case Kind.ModelKeyword:
          node = parseModelStatement(decorators);
          decorators = [];
          return node;
        case Kind.InterfaceKeyword:
          node = parseInterfaceStatement(decorators);
          decorators = [];
          return node;
        case Kind.AliasKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an alias statement');
          }
          return parseAliasStatement();
        case Kind.Semicolon:
          if (decorators.length > 0) {
            error('Cannot decorat an empty statement');
          }
          // no need to put empty statement nodes in the tree for now
          // since we aren't trying to emit ADL
          parseExpected(Kind.Semicolon);
          continue;
      }

      throw error(`Expected statement, but found ${Kind[tok]}`);
    }

  }

  function parseInterfaceStatement(
    decorators: Array<Types.DecoratorExpressionNode>
  ): Types.InterfaceStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.InterfaceKeyword);
    const id = parseIdentifier();
    let parameters: Array<Types.InterfaceParameterNode> = [];

    if (token() === Kind.OpenParen) {
      parameters = parseParameterList();
    }
    parseExpected(Kind.OpenBrace);
    const properties: Array<Types.InterfacePropertyNode> = [];


    let memberDecorators: Array<Types.DecoratorExpressionNode> = [];
    do {
      if (token() == Kind.CloseBrace) {
        break;
      }

      while (token() === Kind.At || token() === Kind.OpenBracket) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseInterfaceProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma) || parseOptional(Kind.Semicolon));

    parseExpected(Kind.CloseBrace);

    return finishNode({
      kind: Types.SyntaxKind.InterfaceStatement,
      decorators,
      id,
      parameters,
      properties
    }, pos);
  }

  function parseInterfaceProperty(decorators: Array<Types.DecoratorExpressionNode>): Types.InterfacePropertyNode {
    const pos = tokenPos();
    const id = parseIdentifier();
    const parameters = parseParameterList();
    parseExpected(Kind.Colon);
    const returnType = parseExpression();

    return finishNode({
      kind: Types.SyntaxKind.InterfaceProperty,
      id,
      parameters,
      returnType,
      decorators
    }, pos);
  }

  function parseParameterList(): Array<Types.InterfaceParameterNode> {
    parseExpected(Kind.OpenParen);

    if (parseOptional(Kind.CloseParen)) {
      return [];
    }
    const params: Array<Types.InterfaceParameterNode> = [];
    do {
      const pos = tokenPos();
      const id = parseIdentifier();
      const optional = parseOptional(Kind.Question);
      parseExpected(Kind.Colon);
      const value = parseExpression();

      params.push(finishNode({
        kind: Types.SyntaxKind.InterfaceParameter,
        id,
        value,
        optional
      }, pos));
    } while (parseOptional(Kind.Comma));
    parseExpected(Kind.CloseParen);
    return params;
  }

  function parseModelStatement(
    decorators: Array<Types.DecoratorExpressionNode>
  ): Types.ModelStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ModelKeyword);
    const id = parseIdentifier();

    let templateParameters: Array<Types.IdentifierNode> = [];
    if (parseOptional(Kind.LessThan)) {
      templateParameters = parseIdentifierList();
      parseExpected(Kind.GreaterThan);
    }

    if (token() === Kind.OpenBrace) {
      parseExpected(Kind.OpenBrace);
      const properties = parseModelPropertyList();

      return finishNode({
        kind: Types.SyntaxKind.ModelStatement,
        id,
        templateParameters,
        decorators,
        properties
      }, pos);
    } else if (token() === Kind.Equals) {
      parseExpected(Kind.Equals);
      const assignment = parseExpression();
      parseExpected(Kind.Semicolon);
      return finishNode({
        kind: Types.SyntaxKind.ModelStatement,
        id,
        templateParameters,
        assignment,
        decorators,
      }, pos);
    } else {
      throw error('Expected equals or open curly after model statement');
    }
  }

  function parseIdentifierList(): Array<Types.IdentifierNode> {
    const ids = [];
    do {
      ids.push(parseIdentifier());
    } while (parseOptional(Kind.Comma));

    return ids;
  }

  function parseModelPropertyList(): Array<Types.ModelPropertyNode> {
    const properties: Array<Types.ModelPropertyNode> = [];

    let memberDecorators: Array<Types.DecoratorExpressionNode> = [];
    do {
      if (token() == Kind.CloseBrace) {
        break;
      }
      while (token() === Kind.At || token() === Kind.OpenBracket) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseModelProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma) || parseOptional(Kind.Semicolon));

    parseExpected(Kind.CloseBrace);
    return properties;
  }

  function parseModelProperty(decorators: Array<Types.DecoratorExpressionNode>): Types.ModelPropertyNode {
    const pos = tokenPos();
    let id: Types.IdentifierNode | Types.StringLiteralNode;
    switch (token()) {
      case Kind.Identifier:
        id = parseIdentifier();
        break;
      case Kind.StringLiteral:
        id = parseStringLiteral();
        break;
      default:
        throw error('expected identifier or string literal');
    }

    const optional = parseOptional(Kind.Question);
    parseExpected(Kind.Colon);
    const value = parseExpression();

    return finishNode({
      kind: Types.SyntaxKind.ModelProperty,
      id,
      decorators,
      value,
      optional
    }, pos);
  }

  function parseExpression(): Types.Expression {
    return parseUnionExpression();
  }

  function parseUnionExpression(): Types.Expression {
    const pos = tokenPos();
    let node: Types.Expression = parseIntersectionExpression();

    if (token() !== Kind.Bar) {
      return node;
    }

    node = finishNode({
      kind: Types.SyntaxKind.UnionExpression,
      options: [node]
    }, pos);

    while (parseOptional(Kind.Bar)) {
      const expr = parseArrayExpression();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseIntersectionExpression(): Types.Expression {
    const pos = tokenPos();
    let node: Types.Expression = parseArrayExpression();

    if (token() !== Kind.Ampersand) {
      return node;
    }

    node = finishNode({
      kind: Types.SyntaxKind.IntersectionExpression,
      options: [node]
    }, pos);

    while (parseOptional(Kind.Ampersand)) {
      const expr = parseArrayExpression();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseArrayExpression(): Types.Expression {
    const pos = tokenPos();
    const expr = parseTemplateApplication();

    if (token() !== Kind.OpenBracket) {
      return expr;
    }
    parseExpected(Kind.OpenBracket);
    parseExpected(Kind.CloseBracket);

    return finishNode({
      kind: Types.SyntaxKind.ArrayExpression,
      elementType: expr
    }, pos);
  }

  function parseTemplateApplication(): Types.Expression {
    const pos = tokenPos();
    const expr = parseMemberExpression();

    if (token() !== Kind.LessThan) {
      return expr;
    }

    parseExpected(Kind.LessThan);
    const args = parseExpressionList();
    parseExpected(Kind.GreaterThan);

    return finishNode({
      kind: Types.SyntaxKind.TemplateApplication,
      target: expr,
      arguments: args,
    }, pos);
  }

  function parseImportStatement(): Types.ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ImportKeyword);
    const id = parseIdentifier();
    let as: Array<Types.NamedImportNode> = [];

    if (token() === Kind.Identifier && tokenValue() === 'as') {
      parseExpected(Kind.Identifier);
      parseExpected(Kind.OpenBrace);

      if (token() !== Kind.CloseBrace) {
        as = parseNamedImports();
      }

      parseExpected(Kind.CloseBrace);
    }

    parseExpected(Kind.Semicolon);
    return finishNode({
      kind: Types.SyntaxKind.ImportStatement,
      as, id
    }, pos);
  }

  function parseNamedImports(): Array<Types.NamedImportNode> {
    const names: Array<Types.NamedImportNode> = [];
    do {
      const pos = tokenPos();
      names.push(finishNode({
        kind: Types.SyntaxKind.NamedImport,
        id: parseIdentifier()
      }, pos));
    } while (parseOptional(Kind.Comma));
    return names;
  }

  function parseDecoratorExpression(): Types.DecoratorExpressionNode {
    const pos = tokenPos();
    let usesBrackets = false;

    if (token() === Kind.OpenBracket) {
      usesBrackets = true;
      parseExpected(Kind.OpenBracket);
    } else {
      parseExpected(Kind.At);
    }

    const target = parseMemberExpression();

    if (target.kind !== Types.SyntaxKind.Identifier
      && target.kind !== Types.SyntaxKind.MemberExpression) {
      throw error(`a ${target.kind} is not a valid decorator`);
    }

    let args: Array<Types.Expression> = [];
    if (parseOptional(Kind.OpenParen)) {
      if (!parseOptional(Kind.CloseParen)) {
        args = parseExpressionList();
        parseExpected(Kind.CloseParen);
      }
    }

    if (usesBrackets) {
      parseExpected(Kind.CloseBracket);
    }

    return finishNode({
      kind: Types.SyntaxKind.DecoratorExpression,
      arguments: args,
      target
    }, pos);
  }

  function parseExpressionList(): Array<Types.Expression> {
    const args: Array<Types.Expression> = [];

    do {
      args.push(parseExpression());
    } while (parseOptional(Kind.Comma));

    return args;
  }

  function parseMemberExpression(): Types.Expression {
    let base: Types.Expression = parsePrimaryExpression();

    while (parseOptional(Kind.Dot)) {
      if (token() !== Kind.Identifier) {
        error('Member expressions only apply to identifiers');
      }
      const pos = tokenPos();
      base = finishNode({
        kind: Types.SyntaxKind.MemberExpression,
        base,
        id: parseIdentifier()
      }, pos);
    }

    return base;
  }

  function parsePrimaryExpression(): Types.Expression {
    switch (token()) {
      case Kind.Identifier: return parseIdentifier();
      case Kind.StringLiteral: return parseStringLiteral();
      case Kind.NumericLiteral: return parseNumericLiteral();
      case Kind.OpenBrace: return parseModelExpression([]);
      case Kind.OpenBracket: return parseTupleExpression();
    }

    throw error(`Unexpected token: ${Kind[token()]}`);
  }

  function parseTupleExpression(): Types.TupleExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBracket);
    const values = parseExpressionList();
    parseExpected(Kind.CloseBracket);
    return finishNode({
      kind: Types.SyntaxKind.TupleExpression,
      values
    }, pos);
  }

  function parseModelExpression(decorators: Array<Types.DecoratorExpressionNode>): Types.ModelExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBrace);
    const properties = parseModelPropertyList();
    return finishNode({
      kind: Types.SyntaxKind.ModelExpression,
      decorators,
      properties
    }, pos);
  }

  function parseStringLiteral(): Types.StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.StringLiteral);
    return finishNode({
      kind: Types.SyntaxKind.StringLiteral,
      value
    }, pos);
  }

  function parseNumericLiteral(): Types.NumericLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.NumericLiteral);
    return finishNode({
      kind: Types.SyntaxKind.NumericLiteral,
      value
    }, pos);
  }

  function parseIdentifier(): Types.IdentifierNode {
    const id = token();
    const pos = tokenPos();

    if (id !== Kind.Identifier) {
      error(`expected an identifier, got ${Kind[id]}`);
    }
    const sv = scaner.value;

    nextToken();

    return finishNode({
      kind: Types.SyntaxKind.Identifier,
      sv
    }, pos);
  }

  function parseAliasStatement(): Types.AliasStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.AliasKeyword);

    const id = parseIdentifier();
    parseExpected(Kind.Colon);

    const target = parseExpression();
    parseExpected(Kind.Semicolon);

    return finishNode({
      kind: Types.SyntaxKind.AliasStatement,
      id,
      target
    }, pos);
  }

  // utility functions
  function token() {
    return scaner.token;
  }

  function tokenValue() {
    return scaner.value;
  }

  function tokenPos() {
    return scaner.offset;
  }

  function nextToken() {
    scaner.scan();

    // skip whitespace and comment tokens for now
    while (isTrivia(token())) {
      scaner.scan();
    }
  }

  function isTrivia(token: Kind) {
    switch (token) {
      case Kind.Whitespace:
      case Kind.NewLine:
      case Kind.MultiLineComment:
      case Kind.SingleLineComment:
        return true;
      default:
        return false;
    }
  }

  function finishNode<T>(o: T, pos: number): T & { pos: number; end: number } {
    return {
      ...o,
      pos,
      end: tokenPos()
    };
  }

  function error(msg: string) {
    throw new Error(`[${scaner.position.line + 1}, ${scaner.position.character + 1}] ${msg}`);
  }

  function parseExpected(expectedToken: Kind) {
    if (token() === expectedToken) {
      nextToken();
      return true;
    } else {
      error(`expected ${Kind[expectedToken]}, got ${Kind[token()]}`);
      return false;
    }
  }

  function parseOptional(optionalToken: Kind) {
    if (token() === optionalToken) {
      nextToken();
      return true;
    }

    return false;
  }
}
