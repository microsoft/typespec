import { format } from './messages.js';
import { Kind, Scanner } from './scanner.js';
import * as Types from './types.js';


export function parse(code: string) {
  const scanner = new Scanner(code);
  scanner.onError = (msg, params) => error(format(msg.text, ...params));
  nextToken();
  return parseADLScript();

  function parseADLScript(): Types.ADLScriptNode {
    const script: Types.ADLScriptNode = {
      kind: Types.SyntaxKind.ADLScript,
      statements: [],
      pos: 0,
      end: 0
    };

    while (!scanner.eof) {
      script.statements.push(parseStatement());
    }

    script.end = scanner.offset;
    return script;
  }

  function parseStatement(): Types.Statement {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const decorators = parseDecoratorList();
      const tok = token();

      switch (tok) {
        case Kind.ImportKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an import statement');
          }
          return parseImportStatement();
        case Kind.ModelKeyword:
          return parseModelStatement(decorators);
        case Kind.InterfaceKeyword:
          return parseInterfaceStatement(decorators);
        case Kind.AliasKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an alias statement');
          }
          return parseAliasStatement();
        case Kind.Semicolon:
          if (decorators.length > 0) {
            error('Cannot decorate an empty statement');
          }
          // no need to put empty statement nodes in the tree for now
          // since we aren't trying to emit ADL
          parseExpected(Kind.Semicolon);
          continue;
      }

      throw error(`Expected statement, but found ${Kind[tok]}`);
    }
  }

  function parseDecoratorList() {
    const decorators: Array<Types.DecoratorExpressionNode> = [];

    while (token() === Kind.At || token() === Kind.OpenBracket) {
      decorators.push(parseDecoratorExpression());
    }

    return decorators;
  }

  function parseInterfaceStatement(
    decorators: Array<Types.DecoratorExpressionNode>
  ): Types.InterfaceStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.InterfaceKeyword);
    const id = parseIdentifier();
    let parameters: Types.ModelExpressionNode | undefined;

    if (token() === Kind.OpenParen) {
      const modelPos = tokenPos();
      parseExpected(Kind.OpenParen);
      const modelProps = parseModelPropertyList();
      parseExpected(Kind.CloseParen);
      parameters = finishNode({
        kind: Types.SyntaxKind.ModelExpression,
        properties: modelProps,
        decorators: []
      }, modelPos);
    }


    parseExpected(Kind.OpenBrace);
    const properties: Array<Types.InterfacePropertyNode> = [];

    do {
      if (token() == Kind.CloseBrace) {
        break;
      }
      const memberDecorators = parseDecoratorList();
      properties.push(parseInterfaceProperty(memberDecorators));
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
    parseExpected(Kind.OpenParen);
    const modelPos = tokenPos();
    let modelProps: Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode>= [];

    if (!parseOptional(Kind.CloseParen)) {
      modelProps = parseModelPropertyList();
      parseExpected(Kind.CloseParen);
    }
    const parameters: Types.ModelExpressionNode = finishNode({
      kind: Types.SyntaxKind.ModelExpression,
      properties: modelProps,
      decorators: []
    }, modelPos);

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

  function parseModelStatement(
    decorators: Array<Types.DecoratorExpressionNode>
  ): Types.ModelStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ModelKeyword);
    const id = parseIdentifier();

    let templateParameters: Array<Types.TemplateParameterDeclarationNode> = [];
    if (parseOptional(Kind.LessThan)) {
      templateParameters = parseTemplateParameters();
      parseExpected(Kind.GreaterThan);
    }

    if (token() === Kind.OpenBrace) {
      parseExpected(Kind.OpenBrace);
      const properties = parseModelPropertyList();
      parseExpected(Kind.CloseBrace);

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

  function parseTemplateParameters(): Array<Types.TemplateParameterDeclarationNode> {
    const params: Array<Types.TemplateParameterDeclarationNode> = [];
    do {
      const pos = tokenPos();
      const id = parseIdentifier();
      const param = finishNode({
        kind: Types.SyntaxKind.TemplateParameterDeclaration,
        sv: id.sv
      } as const, pos);

      params.push(param);
    } while (parseOptional(Kind.Comma));

    return params;
  }

  function parseModelPropertyList(): Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode> {
    const properties: Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode> = [];

    do {
      if (token() === Kind.CloseBrace || token() === Kind.CloseParen) {
        break;
      }

      const memberDecorators = parseDecoratorList();

      if (token() === Kind.Elipsis) {
        if (memberDecorators.length > 0) {
          error('Cannot decorate a spread property');
        }
        properties.push(parseModelSpreadProperty());
      } else {
        properties.push(parseModelProperty(memberDecorators));
      }
    } while (parseOptional(Kind.Comma) || parseOptional(Kind.Semicolon));


    return properties;
  }

  function parseModelSpreadProperty(): Types.ModelSpreadPropertyNode {
    const pos = tokenPos();
    parseExpected(Kind.Elipsis);

    // This could be broadened to allow any type expression
    const target = parseIdentifier();

    return finishNode({
      kind: Types.SyntaxKind.ModelSpreadProperty,
      target
    }, pos);
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
        throw error(`expected a model property, got ${Kind[token()]}`);
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
    } else if (tokenIsLiteral()) {
      args = [parsePrimaryExpression()];
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
      case Kind.Identifier:
        return parseIdentifier();
      case Kind.StringLiteral:
        return parseStringLiteral();
      case Kind.TrueKeyword:
      case Kind.FalseKeyword:
        return parseBooleanLiteral();
      case Kind.NumericLiteral:
        return parseNumericLiteral();
      case Kind.OpenBrace:
        return parseModelExpression([]);
      case Kind.OpenBracket:
        return parseTupleExpression();
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
    parseExpected(Kind.CloseBrace);
    return finishNode({
      kind: Types.SyntaxKind.ModelExpression,
      decorators,
      properties
    }, pos);
  }

  function parseStringLiteral(): Types.StringLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = tokenStringValue();
    parseExpected(Kind.StringLiteral);
    return finishNode({
      kind: Types.SyntaxKind.StringLiteral,
      text,
      value
    }, pos);
  }

  function parseNumericLiteral(): Types.NumericLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = Number(text);

    parseExpected(Kind.NumericLiteral);
    return finishNode({
      kind: Types.SyntaxKind.NumericLiteral,
      text,
      value
    }, pos);
  }

  function parseBooleanLiteral(): Types.BooleanLiteralNode {
    const pos = tokenPos();
    const token = parseExpectedOneOf(Kind.TrueKeyword, Kind.FalseKeyword);
    const value = token == Kind.TrueKeyword;
    const text = value ? 'true' : 'false';
    return finishNode({
      kind: Types.SyntaxKind.BooleanLiteral,
      text,
      value
    }, pos);
  }

  function parseIdentifier(): Types.IdentifierNode {
    const id = token();
    const pos = tokenPos();

    if (id !== Kind.Identifier) {
      error(`expected an identifier, got ${Kind[id]}`);
    }
    const sv = scanner.value;

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
    return scanner.token;
  }

  function tokenValue() {
    return scanner.value;
  }

  function tokenStringValue() {
    return scanner.stringValue;
  }

  function tokenPos() {
    return scanner.offset;
  }

  function nextToken() {
    scanner.scan();

    // skip whitespace and comment tokens for now
    while (tokenIsTrivia()) {
      scanner.scan();
    }
  }

  function tokenIsTrivia() {
    switch (token()) {
      case Kind.Whitespace:
      case Kind.NewLine:
      case Kind.MultiLineComment:
      case Kind.SingleLineComment:
        return true;
      default:
        return false;
    }
  }

  function tokenIsLiteral() {
    switch (token()) {
      case Kind.NumericLiteral:
      case Kind.StringLiteral:
      case Kind.TrueKeyword:
      case Kind.FalseKeyword:
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
    throw new Error(`[${scanner.position.line + 1}, ${scanner.position.character + 1}] ${msg}`);
  }

  function parseExpected(expectedToken: Kind) {
    if (token() === expectedToken) {
      nextToken();
    } else {
      throw error(`expected ${Kind[expectedToken]}, got ${Kind[token()]}`);
    }
  }

  function parseExpectedOneOf<A extends Kind, B extends Kind>(
    expectedTokenA: A,
    expectedTokenB: B
  ): A | B {
    if (token() == expectedTokenA) {
      nextToken();
      return expectedTokenA;
    } else if (token() == expectedTokenB) {
      nextToken();
      return expectedTokenB;
    } else {
      throw error(`expected ${Kind[expectedTokenA]} or ${Kind[expectedTokenA]}, got ${Kind[token()]}`);
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

type NodeCb<T> =  (c: Types.Node) => T;

export function visitChildren<T>(node: Types.Node, cb: NodeCb<T>): T | undefined {
  switch (node.kind) {
    case Types.SyntaxKind.ADLScript:
      return visitEach(cb, (<Types.ADLScriptNode>node).statements);
    case Types.SyntaxKind.AliasStatement:
      return visitNode(cb, (<Types.AliasStatementNode>node).id) ||
        visitNode(cb, (<Types.AliasStatementNode>node).target);
    case Types.SyntaxKind.ArrayExpression:
      return visitNode(cb, (<Types.ArrayExpressionNode>node).elementType);
    case Types.SyntaxKind.DecoratorExpression:
      return visitNode(cb, (<Types.DecoratorExpressionNode>node).target) ||
        visitEach(cb, (<Types.DecoratorExpressionNode>node).arguments);
    case Types.SyntaxKind.ImportStatement:
      return visitNode(cb, (<Types.ImportStatementNode>node).id) ||
        visitEach(cb, (<Types.ImportStatementNode>node).as);
    case Types.SyntaxKind.InterfaceProperty:
      return visitEach(cb, (<Types.InterfacePropertyNode>node).decorators) ||
        visitNode(cb, (<Types.InterfacePropertyNode>node).id) ||
        visitNode(cb, (<Types.InterfacePropertyNode>node).parameters) ||
        visitNode(cb, (<Types.InterfacePropertyNode>node).returnType);
    case Types.SyntaxKind.InterfaceStatement:
      return visitEach(cb, (<Types.InterfaceStatementNode> node).decorators) ||
        visitNode(cb, (<Types.InterfaceStatementNode>node).id) ||
        visitNode(cb, (<Types.InterfaceStatementNode>node).parameters) ||
        visitEach(cb, (<Types.InterfaceStatementNode>node).properties);
    case Types.SyntaxKind.IntersectionExpression:
      return visitEach(cb, (<Types.IntersectionExpressionNode>node).options);
    case Types.SyntaxKind.MemberExpression:
      return visitNode(cb, (<Types.MemberExpressionNode>node).base) ||
        visitNode(cb, (<Types.MemberExpressionNode>node).id);
    case Types.SyntaxKind.ModelExpression:
      return visitEach(cb, (<Types.ModelExpressionNode>node).decorators) ||
        visitEach(cb, (<Types.ModelExpressionNode>node).properties);
    case Types.SyntaxKind.ModelProperty:
      return visitEach(cb, (<Types.ModelPropertyNode>node).decorators) ||
        visitNode(cb, (<Types.ModelPropertyNode>node).id) ||
        visitNode(cb, (<Types.ModelPropertyNode>node).value);
    case Types.SyntaxKind.ModelSpreadProperty:
      return visitNode(cb, (<Types.ModelSpreadPropertyNode>node).target);
    case Types.SyntaxKind.ModelStatement:
      return visitEach(cb, (<Types.ModelStatementNode>node).decorators) ||
        visitNode(cb, (<Types.ModelStatementNode>node).id) ||
        visitEach(cb, (<Types.ModelStatementNode>node).templateParameters) ||
        visitNode(cb, (<Types.ModelStatementNode>node).assignment) ||
        visitEach(cb, (<Types.ModelStatementNode>node).properties);
    case Types.SyntaxKind.NamedImport:
      return visitNode(cb, (<Types.NamedImportNode>node).id);
    case Types.SyntaxKind.TemplateApplication:
      return visitNode(cb, (<Types.TemplateApplicationNode>node).target) ||
        visitEach(cb, (<Types.TemplateApplicationNode>node).arguments);
    case Types.SyntaxKind.TupleExpression:
      return visitEach(cb, (<Types.TupleExpressionNode>node).values);
    case Types.SyntaxKind.UnionExpression:
      return visitEach(cb, (<Types.UnionExpressionNode>node).options);
    // no children for the rest of these.
    case Types.SyntaxKind.StringLiteral:
    case Types.SyntaxKind.NumericLiteral:
    case Types.SyntaxKind.BooleanLiteral:
    case Types.SyntaxKind.Identifier:
    default:
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