import { SymbolTable } from './binder';

/**
 * Type System types
 */
export interface BaseType {
  kind: string;
  node: Node;
  instantiationParameters?: Array<Type>;
}

export type Type =
  | ModelType
  | ModelTypeProperty
  | TemplateParameterType
  | InterfaceType
  | InterfaceTypeProperty
  | StringLiteralType
  | NumericLiteralType
  | BooleanLiteralType
  | ArrayType
  | TupleType
  | UnionType;

export interface ModelType extends BaseType {
  kind: 'Model';
  name: string;
  properties: Map<string, ModelTypeProperty>;
  ownProperties: Map<string, ModelTypeProperty>;
  baseModels: Array<ModelType>;
  templateArguments?: Array<Type>;
  templateNode?: Node;
  assignmentType?: Type;
}

export interface ModelTypeProperty {
  kind: 'ModelProperty';
  node: ModelPropertyNode | ModelSpreadPropertyNode;
  name: string;
  type: Type;
  optional: boolean;
}

export interface InterfaceTypeProperty {
  kind: 'InterfaceProperty';
  node: InterfacePropertyNode;
  name: string;
  parameters?: ModelType;
  returnType: Type;
}

export interface InterfaceType extends BaseType {
  kind: 'Interface';
  name: string;
  node: InterfaceStatementNode;
  properties: Map<string, InterfaceTypeProperty>;
  parameters?: ModelType;
}

export type LiteralType = StringLiteralType | NumericLiteralType | BooleanLiteralType;

export interface StringLiteralType extends BaseType {
  kind: 'String';
  node: StringLiteralNode;
  value: string;
}

export interface NumericLiteralType extends BaseType {
  kind: 'Number';
  node: NumericLiteralNode;
  value: number;
}

export interface BooleanLiteralType extends BaseType {
  kind: 'Boolean';
  node: BooleanLiteralNode;
  value: boolean;
}

export interface ArrayType extends BaseType {
  kind: 'Array';
  node: ArrayExpressionNode;
  elementType: Type;
}

export interface TupleType extends BaseType {
  kind: 'Tuple';
  node: TupleExpressionNode;
  values: Array<Type>;
}

export interface UnionType extends BaseType {
  kind: 'Union';
  options: Array<Type>;
}

export interface TemplateParameterType extends BaseType {
  kind: 'TemplateParameter';
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
  ModelStatement,
  ModelExpression,
  ModelProperty,
  ModelSpreadProperty,
  UnionExpression,
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  TemplateApplication,
  TemplateParameterDeclaration
}

export interface Node {
  kind: SyntaxKind;
  pos: number;
  end: number;
  parent?: Node;
}

export interface ADLScriptNode extends Node {
  kind: SyntaxKind.ADLScript;
  statements: Array<Statement>;
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | InterfaceStatementNode;

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
  | NumericLiteralNode
  | BooleanLiteralNode;

export interface MemberExpressionNode extends Node {
  kind: SyntaxKind.MemberExpression;
  id: IdentifierNode;
  base: MemberExpressionNode | IdentifierNode;
}

export interface InterfaceStatementNode extends Node {
  kind: SyntaxKind.InterfaceStatement;
  id: IdentifierNode;
  parameters?: ModelExpressionNode;
  properties: Array<InterfacePropertyNode>;
  decorators: Array<DecoratorExpressionNode>;
}

export interface InterfacePropertyNode extends Node {
  kind: SyntaxKind.InterfaceProperty;
  id: IdentifierNode;
  parameters: ModelExpressionNode;
  returnType: Expression;
  decorators: Array<DecoratorExpressionNode>;
}


export interface ModelStatementNode extends Node {
  kind: SyntaxKind.ModelStatement;
  id: IdentifierNode;
  properties?: Array<ModelPropertyNode | ModelSpreadPropertyNode>;
  assignment?: Expression;
  templateParameters: Array<TemplateParameterDeclarationNode>;
  locals?: SymbolTable;
  decorators: Array<DecoratorExpressionNode>;
}

export interface ModelExpressionNode extends Node {
  kind: SyntaxKind.ModelExpression;
  properties: Array<ModelPropertyNode | ModelSpreadPropertyNode>;
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

export interface ModelSpreadPropertyNode extends Node {
  kind: SyntaxKind.ModelSpreadProperty;
  target: IdentifierNode;
}

export type LiteralNode = StringLiteralNode | NumericLiteralNode | BooleanLiteralNode;

export interface StringLiteralNode extends Node {
  kind: SyntaxKind.StringLiteral;
  value: string;
  text: string;
}

export interface NumericLiteralNode extends Node {
  kind: SyntaxKind.NumericLiteral;
  value: number;
  text: string;
}

export interface BooleanLiteralNode extends Node {
  kind: SyntaxKind.BooleanLiteral;
  value: boolean;
  text: string;
}

export interface UnionExpressionNode extends Node {
  kind: SyntaxKind.UnionExpression;
  options: Array<Expression>;
}

export interface IntersectionExpressionNode extends Node {
  kind: SyntaxKind.IntersectionExpression;
  options: Array<Expression>;
}

export interface TemplateApplicationNode extends Node {
  kind: SyntaxKind.TemplateApplication;
  target: Expression;
  arguments: Array<Expression>;
}

export interface TemplateParameterDeclarationNode extends Node {
  kind: SyntaxKind.TemplateParameterDeclaration;
  sv: string;
}