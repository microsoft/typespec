import { Kind, Scanner } from './scanner';

export function parse(code: string) {
  const scaner = new Scanner(code);
  nextToken();
  return parseADLScript();

  function parseADLScript(): ADLScriptNode {
    const script: ADLScriptNode = {
      kind: SyntaxKind.ADLScript,
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

  function parseStatement(): Statement {
    let decorators = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const tok = token();
      let node: Statement;

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
      }

      throw new Error('Unable to parse statement');
    }

  }

  function parseInterfaceStatement(
    decorators: Array<DecoratorExpressionNode>
  ): InterfaceStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.InterfaceKeyword);
    const id = parseIdentifier();
    parseExpected(Kind.OpenBrace);
    const properties: Array<InterfacePropertyNode> = [];


    let memberDecorators: Array<DecoratorExpressionNode> = [];
    do {
      if (token() == Kind.CloseBrace) {
        break;
      }
      if (token() === Kind.At || token() === Kind.OpenBracket) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseInterfaceProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma) || parseOptional(Kind.Semicolon));

    parseExpected(Kind.CloseBrace);

    return finishNode({
      kind: SyntaxKind.InterfaceStatement,
      decorators,
      id,
      properties
    }, pos);
  }

  function parseInterfaceProperty(decorators: Array<DecoratorExpressionNode>): InterfacePropertyNode {
    const pos = tokenPos();
    const id = parseIdentifier();
    const parameters = parseParameterList();
    parseExpected(Kind.Colon);
    const returnType = parseExpression();

    return finishNode({
      kind: SyntaxKind.InterfaceProperty,
      id,
      parameters,
      returnType,
      decorators
    }, pos);
  }

  function parseParameterList(): Array<InterfaceParameterNode> {
    parseExpected(Kind.OpenParen);

    if (parseOptional(Kind.CloseParen)) {
      return [];
    }
    const params: Array<InterfaceParameterNode> = [];
    do {
      const pos = tokenPos();
      const id = parseIdentifier();
      const optional = parseOptional(Kind.Question);
      parseExpected(Kind.Colon);
      const value = parseExpression();

      params.push(finishNode({
        kind: SyntaxKind.InterfaceParameter,
        id,
        value,
        optional
      }, pos));
    } while (parseOptional(Kind.Comma));
    parseExpected(Kind.CloseParen);
    return params;
  }

  function parseModelStatement(
    decorators: Array<DecoratorExpressionNode>
  ): ModelStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ModelKeyword);
    const id = parseIdentifier();

    if (token() === Kind.OpenBrace) {
      parseExpected(Kind.OpenBrace);
      const properties = parseModelPropertyList();

      return finishNode({
        kind: SyntaxKind.ModelStatement,
        id,
        decorators,
        properties
      }, pos);
    } else if (token() === Kind.Equals) {
      parseExpected(Kind.Equals);
      const assignment = parseExpression();
      return finishNode({
        kind: SyntaxKind.ModelStatement,
        id,
        assignment,
        decorators,
      }, pos);
    } else {
      throw error('Expected equals or open curly after model statement');
    }


  }

  function parseModelPropertyList(): Array<ModelPropertyNode> {
    const properties: Array<ModelPropertyNode> = [];

    let memberDecorators: Array<DecoratorExpressionNode> = [];
    do {
      if (token() == Kind.CloseBrace) {
        break;
      }
      if (token() === Kind.At || token() === Kind.OpenBracket) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseModelProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma) || parseOptional(Kind.Semicolon));

    parseExpected(Kind.CloseBrace);
    return properties;
  }

  function parseModelProperty(decorators: Array<DecoratorExpressionNode>): ModelPropertyNode {
    const pos = tokenPos();
    let id: IdentifierNode | StringLiteralNode;
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
      kind: SyntaxKind.ModelProperty,
      id,
      decorators,
      value,
      optional
    }, pos);
  }

  function parseExpression(): Expression {
    return parseUnionExpression();
  }

  function parseUnionExpression(): Expression {
    const pos = tokenPos();
    let node: Expression = parseArrayExpression();

    if (token() !== Kind.Bar) {
      return node;
    }

    node = finishNode({
      kind: SyntaxKind.UnionExpression,
      options: [node]
    }, pos);

    while (parseOptional(Kind.Bar)) {
      const expr = parseArrayExpression();
      node.options.push(expr);
    }

    node.end = tokenPos();

    return node;
  }

  function parseArrayExpression(): Expression {
    const pos = tokenPos();
    const expr = parseMemberExpression();

    if (token() !== Kind.OpenBracket) {
      return expr;
    }
    parseExpected(Kind.OpenBracket);
    parseExpected(Kind.CloseBracket);

    return finishNode({
      kind: SyntaxKind.ArrayExpression,
      elementType: expr
    }, pos);
  }

  function parseImportStatement(): ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ImportKeyword);
    const id = parseIdentifier();
    let as: Array<NamedImportNode> = [];

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
      kind: SyntaxKind.ImportStatement,
      as, id
    }, pos);
  }

  function parseNamedImports(): Array<NamedImportNode> {
    const names: Array<NamedImportNode> = [];
    do {
      const pos = tokenPos();
      names.push(finishNode({
        kind: SyntaxKind.NamedImport,
        id: parseIdentifier()
      }, pos));
    } while (parseOptional(Kind.Comma));
    return names;
  }

  function parseDecoratorExpression(): DecoratorExpressionNode {
    const pos = tokenPos();
    let usesBrackets = false;

    if (token() === Kind.OpenBracket) {
      usesBrackets = true;
      parseExpected(Kind.OpenBracket);
    } else {
      parseExpected(Kind.At);
    }

    const target = parseMemberExpression();

    if (target.kind !== SyntaxKind.Identifier
      && target.kind !== SyntaxKind.MemberExpression) {
      throw error(`a ${target.kind} is not a valid decorator`);
    }

    let args: Array<Expression> = [];
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
      kind: SyntaxKind.DecoratorExpression,
      arguments: args,
      target
    }, pos);
  }

  function parseExpressionList(): Array<Expression> {
    const args: Array<Expression> = [];

    do {
      args.push(parseExpression());
    } while (parseOptional(Kind.Comma));

    return args;
  }

  function parseMemberExpression(): Expression {
    let base: Expression = parsePrimaryExpression();

    while (parseOptional(Kind.Dot)) {
      if (token() !== Kind.Identifier) {
        error('Member expressions only apply to identifiers');
      }
      const pos = tokenPos();
      base = finishNode({
        kind: SyntaxKind.MemberExpression,
        base,
        id: parseIdentifier()
      }, pos);
    }

    return base;
  }

  function parsePrimaryExpression(): Expression {
    switch (token()) {
      case Kind.Identifier: return parseIdentifier();
      case Kind.StringLiteral: return parseStringLiteral();
      case Kind.NumericLiteral: return parseNumericLiteral();
      case Kind.OpenBrace: return parseModelExpression([]);
      case Kind.OpenBracket: return parseTupleExpression();
    }

    throw error(`Unexpected token: ${Kind[token()]}`);
  }

  function parseTupleExpression(): TupleExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBracket);
    const values = parseExpressionList();
    parseExpected(Kind.CloseBracket);
    return finishNode({
      kind: SyntaxKind.TupleExpression,
      values
    }, pos);
  }

  function parseModelExpression(decorators: Array<DecoratorExpressionNode>): ModelExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBrace);
    const properties = parseModelPropertyList();
    return finishNode({
      kind: SyntaxKind.ModelExpression,
      decorators,
      properties
    }, pos);
  }

  function parseStringLiteral(): StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.StringLiteral);
    return finishNode({
      kind: SyntaxKind.StringLiteral,
      value
    }, pos);
  }

  function parseNumericLiteral(): NumericLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.NumericLiteral);
    return finishNode({
      kind: SyntaxKind.NumericLiteral,
      value
    }, pos);
  }

  function parseIdentifier(): IdentifierNode {
    const id = token();
    const pos = tokenPos();

    if (id !== Kind.Identifier) {
      error(`expected an identifier, got ${Kind[id]}`);
    }
    const sv = scaner.value;

    nextToken();

    return finishNode({
      kind: SyntaxKind.Identifier,
      sv
    }, pos);
  }

  function parseAliasStatement(): AliasStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.AliasKeyword);

    const id = parseIdentifier();
    parseExpected(Kind.Colon);

    const target = parseExpression();
    parseExpected(Kind.Semicolon);

    return finishNode({
      kind: SyntaxKind.AliasStatement,
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

    // skip whitespace tokens for now
    while (token() === Kind.Whitespace || token() === Kind.NewLine) {
      scaner.scan();
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
    throw new Error(`[${scaner.position.line}, ${scaner.position.character}] ${msg}`);
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

export enum SyntaxKind {
  ADLScript,
  ImportStatement,
  Identifier,
  NamedImport,
  DecoratorExpression,
  MemberExpression,
  InterfaceStatement,
  InterfaceProperty,
  InterfaceParameter,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  UnionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  AliasStatement
}

export interface Node {
  kind: SyntaxKind;
  pos: number;
  end: number;
}

export interface ADLScriptNode extends Node {
  kind: SyntaxKind.ADLScript;
  statements: Array<Statement>;
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode;

export interface ImportStatementNode extends Node {
  kind: SyntaxKind.ImportStatement;
  id: IdentifierNode;
  as: Array<NamedImportNode>;
}

export interface IdentifierNode extends Node {
  kind: SyntaxKind.Identifier;
  sv: string;
}

interface NamedImportNode extends Node {
  kind: SyntaxKind.NamedImport;
  id: IdentifierNode;
}

interface DecoratorExpressionNode extends Node {
  kind: SyntaxKind.DecoratorExpression;
  target: IdentifierNode | MemberExpressionNode;
  arguments: Array<Expression>;
}

type Expression =
  | ArrayExpressionNode
  | MemberExpressionNode
  | ModelExpressionNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode;

interface MemberExpressionNode extends Node {
  kind: SyntaxKind.MemberExpression;
  id: IdentifierNode;
  base: Expression | IdentifierNode;
}

export interface InterfaceStatementNode extends Node {
  kind: SyntaxKind.InterfaceStatement;
  id: IdentifierNode;
  properties: Array<InterfacePropertyNode>;
  decorators: Array<DecoratorExpressionNode>;
}

export interface InterfacePropertyNode extends Node {
  kind: SyntaxKind.InterfaceProperty;
  id: IdentifierNode;
  parameters: Array<InterfaceParameterNode>;
  returnType: Expression;
  decorators: Array<DecoratorExpressionNode>;
}

export interface InterfaceParameterNode extends Node {
  kind: SyntaxKind.InterfaceParameter;
  id: IdentifierNode;
  value: Expression;
  optional: boolean;
}

export interface ModelStatementNode extends Node {
  kind: SyntaxKind.ModelStatement;
  id: IdentifierNode;
  properties?: Array<ModelPropertyNode>;
  assignment?: Expression;
  decorators: Array<DecoratorExpressionNode>;
}

export interface ModelExpressionNode extends Node {
  kind: SyntaxKind.ModelExpression;
  properties: Array<ModelPropertyNode>;
  decorators: Array<DecoratorExpressionNode>;
}

export interface ArrayExpressionNode extends Node {
  kind: SyntaxKind.ArrayExpression;
  elementType: Expression;
}
export interface TupleExpressionNode extends Node {
  kind: SyntaxKind.TupleExpression;
  values: Array<Expression>;
}

export interface ModelPropertyNode extends Node {
  kind: SyntaxKind.ModelProperty;
  id: IdentifierNode | StringLiteralNode;
  value: Expression;
  decorators: Array<DecoratorExpressionNode>;
  optional: boolean;
}

export interface StringLiteralNode extends Node {
  kind: SyntaxKind.StringLiteral;
  value: string;
}

export interface NumericLiteralNode extends Node {
  kind: SyntaxKind.NumericLiteral;
  value: string;
}

export interface UnionExpressionNode extends Node {
  kind: SyntaxKind.UnionExpression;
  options: Array<Expression>;
}

export interface AliasStatementNode extends Node {
  kind: SyntaxKind.AliasStatement;
  id: IdentifierNode;
  target: Expression;
}