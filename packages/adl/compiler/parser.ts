import { format } from './messages.js';
import { createScanner, Token } from './scanner.js';
import * as Types from './types.js';


export function parse(code: string | Types.SourceFile) {
  const scanner = createScanner(code, (msg, params) => error(format(msg.text, ...params)));
  nextToken();
  return parseADLScript();

  function parseADLScript(): Types.ADLScriptNode {
    const script: Types.ADLScriptNode = {
      kind: Types.SyntaxKind.ADLScript,
      statements: [],
      pos: 0,
      end: 0
    };

    while (!scanner.eof()) {
      script.statements.push(parseStatement());
    }

    script.end = scanner.position;
    return script;
  }

  function parseStatement(): Types.Statement {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const decorators = parseDecoratorList();
      const tok = token();

      switch (tok) {
        case Token.ImportKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an import statement');
          }
          return parseImportStatement();
        case Token.ModelKeyword:
          return parseModelStatement(decorators);
        case Token.NamespaceKeyword:
          return parseInterfaceStatement(decorators);
        case Token.Semicolon:
          if (decorators.length > 0) {
            error('Cannot decorate an empty statement');
          }
          // no need to put empty statement nodes in the tree for now
          // since we aren't trying to emit ADL
          parseExpected(Token.Semicolon);
          continue;
      }

      throw error(`Expected statement, but found ${Token[tok]}`);
    }
  }

  function parseDecoratorList() {
    const decorators: Array<Types.DecoratorExpressionNode> = [];

    while (token() === Token.At) {
      decorators.push(parseDecoratorExpression());
    }

    return decorators;
  }

  function parseInterfaceStatement(
    decorators: Array<Types.DecoratorExpressionNode>
  ): Types.NamespaceStatementNode {
    const pos = tokenPos();
    parseExpected(Token.NamespaceKeyword);
    const id = parseIdentifier();
    let parameters: Types.ModelExpressionNode | undefined;

    if (token() === Token.OpenParen) {
      const modelPos = tokenPos();
      parseExpected(Token.OpenParen);
      const modelProps = parseModelPropertyList();
      parseExpected(Token.CloseParen);
      parameters = finishNode({
        kind: Types.SyntaxKind.ModelExpression,
        properties: modelProps,
        decorators: []
      }, modelPos);
    }


    parseExpected(Token.OpenBrace);
    const properties: Array<Types.NamespacePropertyNode> = [];

    do {
      if (token() == Token.CloseBrace) {
        break;
      }
      const memberDecorators = parseDecoratorList();
      properties.push(parseNamespaceProperty(memberDecorators));
    } while (parseOptional(Token.Comma) || parseOptional(Token.Semicolon));

    parseExpected(Token.CloseBrace);

    return finishNode({
      kind: Types.SyntaxKind.NamespaceStatement,
      decorators,
      id,
      parameters,
      properties
    }, pos);
  }

  function parseNamespaceProperty(decorators: Array<Types.DecoratorExpressionNode>): Types.NamespacePropertyNode {
    const pos = tokenPos();
    parseExpected(Token.OpKeyword);
    const id = parseIdentifier();
    parseExpected(Token.OpenParen);
    const modelPos = tokenPos();
    let modelProps: Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode>= [];

    if (!parseOptional(Token.CloseParen)) {
      modelProps = parseModelPropertyList();
      parseExpected(Token.CloseParen);
    }
    const parameters: Types.ModelExpressionNode = finishNode({
      kind: Types.SyntaxKind.ModelExpression,
      properties: modelProps,
      decorators: []
    }, modelPos);

    parseExpected(Token.Colon);
    const returnType = parseExpression();

    return finishNode({
      kind: Types.SyntaxKind.NamespaceProperty,
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

    parseExpected(Token.ModelKeyword);
    const id = parseIdentifier();

    let templateParameters: Array<Types.TemplateParameterDeclarationNode> = [];
    if (parseOptional(Token.LessThan)) {
      templateParameters = parseTemplateParameters();
      parseExpected(Token.GreaterThan);
    }

    if (token() !== Token.Equals && token() !== Token.OpenBrace && token() !== Token.ExtendsKeyword) {
      throw error('Expected equals or open curly after model statement');
    }

    if (parseOptional(Token.Equals)) {
      const assignment = parseExpression();
      parseExpected(Token.Semicolon);
      return finishNode({
        kind: Types.SyntaxKind.ModelStatement,
        id,
        heritage: [],
        templateParameters,
        assignment,
        decorators,
      }, pos);
    } else {
      let heritage: Types.ReferenceExpression[] = [];

      if (parseOptional(Token.ExtendsKeyword)) {
        heritage = parseReferenceExpressionList();
      }
      
      parseExpected(Token.OpenBrace);
      const properties = parseModelPropertyList();
      parseExpected(Token.CloseBrace);

      return finishNode({
        kind: Types.SyntaxKind.ModelStatement,
        id,
        heritage,
        templateParameters,
        decorators,
        properties
      }, pos);
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
    } while (parseOptional(Token.Comma));

    return params;
  }

  function parseModelPropertyList(): Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode> {
    const properties: Array<Types.ModelPropertyNode | Types.ModelSpreadPropertyNode> = [];

    do {
      if (token() === Token.CloseBrace || token() === Token.CloseParen) {
        break;
      }

      const memberDecorators = parseDecoratorList();

      if (token() === Token.Elipsis) {
        if (memberDecorators.length > 0) {
          error('Cannot decorate a spread property');
        }
        properties.push(parseModelSpreadProperty());
      } else {
        properties.push(parseModelProperty(memberDecorators));
      }
    } while (parseOptional(Token.Comma) || parseOptional(Token.Semicolon));


    return properties;
  }

  function parseModelSpreadProperty(): Types.ModelSpreadPropertyNode {
    const pos = tokenPos();
    parseExpected(Token.Elipsis);

    // This could be broadened to allow any type expression
    const target = parseReferenceExpression();

    return finishNode({
      kind: Types.SyntaxKind.ModelSpreadProperty,
      target
    }, pos);
  }

  function parseModelProperty(decorators: Array<Types.DecoratorExpressionNode>): Types.ModelPropertyNode {
    const pos = tokenPos();
    let id: Types.IdentifierNode | Types.StringLiteralNode;
    switch (token()) {
      case Token.Identifier:
        id = parseIdentifier();
        break;
      case Token.StringLiteral:
        id = parseStringLiteral();
        break;
      default:
        throw error(`expected a model property, got ${Token[token()]}`);
    }

    const optional = parseOptional(Token.Question);
    parseExpected(Token.Colon);
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
    return parseUnionExpressionOrHigher();
  }

  function parseUnionExpressionOrHigher(): Types.Expression {
    const pos = tokenPos();
    let node: Types.Expression = parseIntersectionExpressionOrHigher();

    if (token() !== Token.Bar) {
      return node;
    }

    node = finishNode({
      kind: Types.SyntaxKind.UnionExpression,
      options: [node]
    }, pos);

    while (parseOptional(Token.Bar)) {
      const expr = parseIntersectionExpressionOrHigher();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseIntersectionExpressionOrHigher(): Types.Expression {
    const pos = tokenPos();
    let node: Types.Expression = parseArrayExpressionOrHigher();

    if (token() !== Token.Ampersand) {
      return node;
    }

    node = finishNode({
      kind: Types.SyntaxKind.IntersectionExpression,
      options: [node]
    }, pos);

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

      expr = finishNode({
        kind: Types.SyntaxKind.ArrayExpression,
        elementType: expr
      }, pos);
    }

    return expr;
  }

  function parseReferenceExpression(): Types.ReferenceExpression {
    const pos = tokenPos();
    const expr = parseIdentifierOrMemberExpression();

    if (token() !== Token.LessThan) {
      return expr;
    }

    parseExpected(Token.LessThan);
    const args = parseExpressionList();
    parseExpected(Token.GreaterThan);

    return finishNode({
      kind: Types.SyntaxKind.TemplateApplication,
      target: expr,
      arguments: args,
    }, pos);
  }

  function parseReferenceExpressionList(): Types.ReferenceExpression[] {
    const refs = [];
    do {
      refs.push(parseReferenceExpression());
    } while (parseOptional(Token.Comma));

    return refs;
  }

  function parseImportStatement(): Types.ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Token.ImportKeyword);
    const id = parseIdentifier();
    let as: Array<Types.NamedImportNode> = [];

    if (token() === Token.Identifier && tokenValue() === 'as') {
      parseExpected(Token.Identifier);
      parseExpected(Token.OpenBrace);

      if (token() !== Token.CloseBrace) {
        as = parseNamedImports();
      }

      parseExpected(Token.CloseBrace);
    }

    parseExpected(Token.Semicolon);
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
    } while (parseOptional(Token.Comma));
    return names;
  }

  function parseDecoratorExpression(): Types.DecoratorExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.At);

    const target = parseIdentifierOrMemberExpression();

    let args: Array<Types.Expression> = [];
    if (parseOptional(Token.OpenParen)) {
      if (!parseOptional(Token.CloseParen)) {
        args = parseExpressionList();
        parseExpected(Token.CloseParen);
      }
    } else if (tokenIsLiteral()) {
      args = [parsePrimaryExpression()];
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
    } while (parseOptional(Token.Comma));

    return args;
  }

  function parseIdentifierOrMemberExpression(): Types.IdentifierNode | Types.MemberExpressionNode {

    let base: Types.IdentifierNode | Types.MemberExpressionNode = parseIdentifier();

    while (parseOptional(Token.Dot)) {
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
        return parseModelExpression([]);
      case Token.OpenBracket:
        return parseTupleExpression();
      case Token.OpenParen:
        return parseParenthesizedExpression();
    }

    throw error(`Unexpected token: ${Token[token()]}`);
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
    parseExpected(Token.OpenBracket);
    const values = parseExpressionList();
    parseExpected(Token.CloseBracket);
    return finishNode({
      kind: Types.SyntaxKind.TupleExpression,
      values
    }, pos);
  }

  function parseModelExpression(decorators: Array<Types.DecoratorExpressionNode>): Types.ModelExpressionNode {
    const pos = tokenPos();
    parseExpected(Token.OpenBrace);
    const properties = parseModelPropertyList();
    parseExpected(Token.CloseBrace);
    return finishNode({
      kind: Types.SyntaxKind.ModelExpression,
      decorators,
      properties
    }, pos);
  }

  function parseStringLiteral(): Types.StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Token.StringLiteral);
    return finishNode({
      kind: Types.SyntaxKind.StringLiteral,
      value
    }, pos);
  }

  function parseNumericLiteral(): Types.NumericLiteralNode {
    const pos = tokenPos();
    const text = tokenValue();
    const value = Number(text);

    parseExpected(Token.NumericLiteral);
    return finishNode({
      kind: Types.SyntaxKind.NumericLiteral,
      text,
      value
    }, pos);
  }

  function parseBooleanLiteral(): Types.BooleanLiteralNode {
    const pos = tokenPos();
    const token = parseExpectedOneOf(Token.TrueKeyword, Token.FalseKeyword);
    const value = token == Token.TrueKeyword;
    return finishNode({
      kind: Types.SyntaxKind.BooleanLiteral,
      value
    }, pos);
  }

  function parseIdentifier(): Types.IdentifierNode {
    const id = token();
    const pos = tokenPos();

    if (id !== Token.Identifier) {
      error(`expected an identifier, got ${Token[id]}`);
    }
    const sv = tokenValue();

    nextToken();

    return finishNode({
      kind: Types.SyntaxKind.Identifier,
      sv
    }, pos);
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
    scanner.scan();

    // skip whitespace and comment tokens for now
    while (tokenIsTrivia()) {
      scanner.scan();
    }
  }

  function tokenIsTrivia() {
    switch (token()) {
      case Token.Whitespace:
      case Token.NewLine:
      case Token.MultiLineComment:
      case Token.SingleLineComment:
        return true;
      default:
        return false;
    }
  }

  function tokenIsLiteral() {
    switch (token()) {
      case Token.NumericLiteral:
      case Token.StringLiteral:
      case Token.TrueKeyword:
      case Token.FalseKeyword:
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
    const pos = scanner.source.getLineAndCharacterOfPosition(scanner.tokenPosition);
    throw new Error(`${scanner.source.path}:${pos.line + 1}:${pos.character + 1} - error: ${msg}`);
  }

  function parseExpected(expectedToken: Token) {
    if (token() === expectedToken) {
      nextToken();
    } else {
      throw error(`expected ${Token[expectedToken]}, got ${Token[token()]}`);
    }
  }

  function parseExpectedOneOf<T extends Token[]>(... options: T): T[number] {
    for (const tok of options) {
      if (token() === tok) {
        nextToken();
        return tok
      }
    }

    // Intl isn't in standard library as it is stage 3, however it is supported in node >= 12
    const listfmt = new (Intl as any).ListFormat('en', { style: 'long', type: 'disjunction' });
    const textOptions = options.map(o => Token[o]);
  
    throw error(`expected ${listfmt.format(textOptions)}, got ${Token[token()]}`);
  }

  function parseOptional(optionalToken: Token) {
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
      return visitEach(cb, node.statements);
    case Types.SyntaxKind.ArrayExpression:
      return visitNode(cb, node.elementType);
    case Types.SyntaxKind.DecoratorExpression:
      return visitNode(cb, node.target) ||
        visitEach(cb, node.arguments);
    case Types.SyntaxKind.ImportStatement:
      return visitNode(cb, node.id) ||
        visitEach(cb, node.as);
    case Types.SyntaxKind.NamespaceProperty:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.parameters) ||
        visitNode(cb, node.returnType);
    case Types.SyntaxKind.NamespaceStatement:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.parameters) ||
        visitEach(cb, node.properties);
    case Types.SyntaxKind.IntersectionExpression:
      return visitEach(cb, node.options);
    case Types.SyntaxKind.MemberExpression:
      return visitNode(cb, node.base) ||
        visitNode(cb, node.id);
    case Types.SyntaxKind.ModelExpression:
      return visitEach(cb, node.decorators) ||
        visitEach(cb, node.properties);
    case Types.SyntaxKind.ModelProperty:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitNode(cb, node.value);
    case Types.SyntaxKind.ModelSpreadProperty:
      return visitNode(cb, node.target);
    case Types.SyntaxKind.ModelStatement:
      return visitEach(cb, node.decorators) ||
        visitNode(cb, node.id) ||
        visitEach(cb, node.templateParameters) ||
        visitNode(cb, node.assignment) ||
        visitEach(cb, node.properties);
    case Types.SyntaxKind.NamedImport:
      return visitNode(cb, node.id);
    case Types.SyntaxKind.TemplateApplication:
      return visitNode(cb, node.target) ||
        visitEach(cb, node.arguments);
    case Types.SyntaxKind.TupleExpression:
      return visitEach(cb, node.values);
    case Types.SyntaxKind.UnionExpression:
      return visitEach(cb, node.options);
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
