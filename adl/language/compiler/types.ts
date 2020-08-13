import {
  ArrayExpressionNode,
  InterfaceParameterNode,
  InterfacePropertyNode,
  InterfaceStatementNode,
  ModelPropertyNode,
  Node,
  NumericLiteralNode,
  StringLiteralNode,
  TupleExpressionNode
} from './parser';

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
