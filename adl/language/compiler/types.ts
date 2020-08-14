/**
 * Type System types
 */
export interface Type {
  node: Node;
}

export interface ModelType extends Type {
  kind: 'Model';
  name: string;
  properties: Map<string, ModelTypeProperty>;
}

export interface ModelTypeProperty {
  kind: 'ModelProperty';
  node: ModelPropertyNode;
  name: string;
  type: Type;
  optional: boolean;
}

export interface InterfaceTypeProperty {
  kind: 'InterfaceProperty';
  node: InterfacePropertyNode;
  name: string;
  parameters: Array<InterfaceTypeParameter>;
  returnType: Type;
}

export interface InterfaceTypeParameter {
  kind: 'InterfaceParameter';
  node: InterfaceParameterNode;
  name: string;
  type: Type;
  optional: boolean;
}

export interface InterfaceType extends Type {
  kind: 'Interface';
  name: string;
  node: InterfaceStatementNode;
  properties: Map<string, InterfaceTypeProperty>;
}

export interface StringLiteralType extends Type {
  kind: 'String';
  node: StringLiteralNode;
  value: string;
}

export interface NumericLiteralType extends Type {
  kind: 'Number';
  node: NumericLiteralNode;
  value: number;
}
export interface ArrayType extends Type {
  kind: 'Array';
  node: ArrayExpressionNode;
  elementType: Type;
}

export interface TupleType extends Type {
  kind: 'Tuple';
  node: TupleExpressionNode;
  values: Array<Type>;
}

export interface UnionType extends Type {
  kind: 'Union';
  options: Array<Type>;
}


/**
 * AST types
 */
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
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  AliasStatement,
  TemplateApplication
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

export interface NamedImportNode extends Node {
  kind: SyntaxKind.NamedImport;
  id: IdentifierNode;
}

export interface DecoratorExpressionNode extends Node {
  kind: SyntaxKind.DecoratorExpression;
  target: IdentifierNode | MemberExpressionNode;
  arguments: Array<Expression>;
}

export type Expression =
  | ArrayExpressionNode
  | MemberExpressionNode
  | ModelExpressionNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IntersectionExpressionNode
  | TemplateApplicationNode
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode;

export interface MemberExpressionNode extends Node {
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
  templateParameters: Array<IdentifierNode>;
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

export interface IntersectionExpressionNode extends Node {
  kind: SyntaxKind.IntersectionExpression;
  options: Array<Expression>;
}

export interface AliasStatementNode extends Node {
  kind: SyntaxKind.AliasStatement;
  id: IdentifierNode;
  target: Expression;
}

export interface TemplateApplicationNode extends Node {
  kind: SyntaxKind.TemplateApplication;
  target: Expression;
  arguments: Array<Expression>;
}
