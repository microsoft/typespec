import {
  ArrayExpressionNode,
  IdentifierNode,
  InterfaceParameterNode,
  InterfaceStatementNode,
  ModelExpressionNode,
  ModelStatementNode,
  Node,
  NumericLiteralNode,
  StringLiteralNode,
  SyntaxKind,
  TupleExpressionNode,
  UnionExpressionNode
} from './parser';
import { ADLSourceFile, Program } from './program';
import {
  InterfaceType,
  InterfaceTypeParameter,
  ModelType,
  NumericLiteralType,
  StringLiteralType,
  TupleType,
  Type,
  UnionType
} from './types';

export function createChecker(program: Program) {
  return {
    getTypeForNode,
    checkProgram,
    getLiteralType,
  };

  function getTypeForNode(node: Node): Type {
    if (program.typeCache.has(node)) {
      return program.typeCache.get(node)!;
    }
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(<ModelExpressionNode>node);
      case SyntaxKind.ModelStatement:
        return checkModel(<ModelStatementNode>node);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(<InterfaceStatementNode>node);
      case SyntaxKind.Identifier:
        // decorator bindings presently return an empty binding
        return <any>checkIdentifier(<IdentifierNode>node);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(<NumericLiteralNode>node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(<TupleExpressionNode>node);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(<StringLiteralNode>node);
      case SyntaxKind.ArrayExpression:
        return checkArrayExpression(<ArrayExpressionNode>node);
      case SyntaxKind.UnionExpression:
        return checkUnionExpression(<UnionExpressionNode>node);
    }

    throw new Error('cant eval ' + SyntaxKind[node.kind]);
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    return createType({
      kind: 'Union',
      node,
      options: node.options.map(getTypeForNode),
    });
  }
  function checkArrayExpression(node: ArrayExpressionNode) {
    return createType({
      kind: 'Array',
      node,
      elementType: getTypeForNode(node.elementType),
    });
  }

  function checkInterface(node: InterfaceStatementNode) {
    const type: InterfaceType = createType({
      kind: 'Interface',
      name: node.id.sv,
      node: node,
      properties: new Map(),
    });

    for (const prop of node.properties) {
      type.properties.set(
        prop.id.sv,
        createType({
          kind: 'InterfaceProperty',
          name: prop.id.sv,
          node: prop,
          parameters: prop.parameters.flatMap(checkInterfaceParam),
          returnType: getTypeForNode(prop.returnType),
        })
      );
    }

    return type;
  }

  function checkInterfaceParam(paramNode: InterfaceParameterNode) {
    const type: InterfaceTypeParameter = createType({
      kind: 'InterfaceParameter',
      name: paramNode.id.sv,
      node: paramNode,
      optional: paramNode.optional,
      type: getTypeForNode(paramNode.value),
    });

    return type;
  }

  function checkTupleExpression(node: TupleExpressionNode): TupleType {
    return createType({
      kind: 'Tuple',
      node: node,
      values: node.values.map((v) => getTypeForNode(v)),
    });
  }

  function checkIdentifier(node: IdentifierNode) {
    const binding = program.globalSymbols.get(node.sv);
    if (!binding) {
      throw new Error('Unknown identifier ' + node.sv);
    }

    if (binding.kind === 'decorator') {
      return {};
    } else {
      return getTypeForNode(binding.node);
    }
  }

  function checkStringLiteral(str: StringLiteralNode): StringLiteralType {
    return getLiteralType(str);
  }

  function checkNumericLiteral(num: NumericLiteralNode): NumericLiteralType {
    return getLiteralType(num);
  }

  function checkProgram(program: Program) {
    for (const file of program.sourceFiles) {
      checkSourceFile(file);
    }
  }

  function checkSourceFile(file: ADLSourceFile) {
    for (const statement of file.ast.statements) {
      getTypeForNode(statement);
    }
  }
  function checkModel(node: ModelExpressionNode | ModelStatementNode) {
    const type: ModelType = createType({
      name: node.kind === SyntaxKind.ModelStatement ? node.id.sv : '',
      kind: 'Model',
      node: node,
      properties: new Map(),
    });

    for (const prop of node.properties) {
      if (prop.id.kind === SyntaxKind.Identifier) {
        type.properties.set(
          prop.id.sv,
          createType({
            kind: 'ModelProperty',
            name: prop.id.sv,
            node: prop,
            optional: prop.optional,
            type: getTypeForNode(prop.value),
          })
        );
      } else {
        const name = prop.id.value.slice(1, -1);
        type.properties.set(
          name,
          createType({
            kind: 'ModelProperty',
            name,
            node: prop,
            optional: prop.optional,
            type: getTypeForNode(prop.value),
          })
        );
      }
    }

    return type;
  }

  function createType<T extends Type>(type: T): T {
    program.typeCache.set(type.node, type);
    return type;
  }

  function getLiteralType(node: StringLiteralNode): StringLiteralType;
  function getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  function getLiteralType(
    node: StringLiteralNode | NumericLiteralNode
  ): StringLiteralType | NumericLiteralType {
    const value =
      node.kind === SyntaxKind.NumericLiteral
        ? Number(node.value)
        : node.value.slice(1, -1);

    if (program.literalTypes.has(value)) {
      return program.literalTypes.get(value)!;
    }

    const kind = node.kind === SyntaxKind.NumericLiteral ? 'Number' : 'String';

    const type: StringLiteralType | NumericLiteralType = <any>{
      kind,
      node,
      value,
    };

    program.literalTypes.set(value, <any>type);
    return type;
  }
}
