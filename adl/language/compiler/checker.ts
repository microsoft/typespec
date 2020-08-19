import { ADLSourceFile, Program } from './program.js';
import {
  ArrayExpressionNode, IdentifierNode,


  InterfacePropertyNode, InterfaceStatementNode, InterfaceType,


  InterfaceTypeProperty,


  IntersectionExpressionNode, ModelExpressionNode,
  ModelStatementNode, ModelType,
  Node,
  NumericLiteralNode, NumericLiteralType,
  StringLiteralNode, StringLiteralType,
  SyntaxKind,
  TemplateApplicationNode,

  TemplateParameterDeclarationNode, TupleExpressionNode, TupleType,
  Type,
  UnionExpressionNode, UnionType
} from './types.js';

export function createChecker(program: Program) {

  const templateInstantiation: Map<ModelStatementNode, Array<Type>> = new Map();

  return {
    getTypeForNode,
    checkProgram,
    getLiteralType,
  };

  function getTypeForNode(node: Node): Type {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(<ModelExpressionNode>node);
      case SyntaxKind.ModelStatement:
        return checkModel(<ModelStatementNode>node);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(<InterfaceStatementNode>node);
      case SyntaxKind.InterfaceProperty:
        return checkInterfaceProperty(<InterfacePropertyNode>node);
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
      case SyntaxKind.IntersectionExpression:
        return checkIntersectionExpression(<IntersectionExpressionNode>node);
      case SyntaxKind.TemplateApplication:
        return checkTemplateApplication(<TemplateApplicationNode>node);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(<TemplateParameterDeclarationNode>node);
    }

    throw new Error('cant eval ' + SyntaxKind[node.kind]);
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = <ModelStatementNode>node.parent!;

    const instanceArgs = templateInstantiation.get(parentNode);
    if (!instanceArgs) {
      return createType({
        kind: 'TemplateParameter',
        node: node
      });
    } else {
      const index = parentNode.templateParameters.findIndex(v => v === node);
      return instanceArgs[index];
    }
  }

  function checkTemplateApplication(node: TemplateApplicationNode): Type {
    const args = node.arguments.map(getTypeForNode);
    const targetType = getTypeForNode(node.target);
    // todo: check proper target
    return instantiateTemplate(<ModelStatementNode>targetType.node, args);
  }


  function instantiateTemplate(templateNode: ModelStatementNode, args: Array<Type>): ModelType {
    if (templateNode.templateParameters!.length < args.length) {
      throw new Error('Too few template arguments provided.');
    }

    if (templateNode.templateParameters!.length > args.length) {
      throw new Error('Too many template arguments provided.');
    }

    templateInstantiation.set(templateNode, args);
    const type = checkModel(templateNode);
    templateInstantiation.delete(templateNode);
    return <ModelType> type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    return createType({
      kind: 'Union',
      node,
      options: node.options.map(getTypeForNode),
    });
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(node: IntersectionExpressionNode) {
    const optionTypes = node.options.map(getTypeForNode);
    const allModels = optionTypes.every(t => t.kind === 'Model');
    if (!allModels) {
      throw new Error('Cannot intersect non-model types (including union types).');
    }

    const intersection = createType({
      kind: 'Model',
      node,
      name: '',
      properties: new Map(),
    });

    for (const type of optionTypes) {
      for (const [key, prop] of (<ModelType>type).properties) {
        if (intersection.properties.has(key)) {
          throw new Error('Cannot intersect two types with duplicate property ' + key);
        }
        intersection.properties.set(key, prop);
      }
    }

    return intersection;
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
      type.properties.set(prop.id.sv, checkInterfaceProperty(prop));
    }

    return type;
  }

  function checkInterfaceProperty(prop: InterfacePropertyNode): InterfaceTypeProperty {
    return createType({
      kind: 'InterfaceProperty',
      name: prop.id.sv,
      node: prop,
      parameters: <ModelType>checkModel(prop.parameters),
      returnType: getTypeForNode(prop.returnType),
    });
  }


  function checkTupleExpression(node: TupleExpressionNode): TupleType {
    return createType({
      kind: 'Tuple',
      node: node,
      values: node.values.map((v) => getTypeForNode(v)),
    });
  }

  function checkIdentifier(node: IdentifierNode) {
    const binding = resolveIdentifier(node);
    if (binding.kind === 'decorator') {
      return {};
    } else {
      return getTypeForNode(binding.node);
    }
  }

  function resolveIdentifier(node: IdentifierNode) {
    let scope: Node | undefined = node.parent;
    let binding;

    while (scope) {
      if ('locals' in scope) {
        binding = (<any>scope).locals.get(node.sv);
        if (binding) break;
      }
      scope = scope.parent;
    }

    if (!binding) {
      binding = program.globalSymbols.get(node.sv);
    }

    if (!binding) {
      throw new Error('Unknown identifier ' + node.sv);
    }

    return binding;
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
    if (node.properties) {
      const type: ModelType = createType({
        kind: 'Model',
        name: node.kind === SyntaxKind.ModelStatement ? node.id.sv : '',
        node: node,
        properties: new Map(),
      });

      for (const prop of node.properties) {
        if ('id' in prop) {
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
        } else {
          // spread property
          const target = getTypeForNode(prop.target);
          if (target.kind === 'Model') {
            for (const targetProp of (<ModelType>target).properties.values()) {
              type.properties.set(targetProp.name, targetProp);
            }
          }
        }
      }

      return type;
    } else {
      // model =
      return getTypeForNode((<ModelStatementNode>node).assignment!);
    }
  }

  function createType<T extends Type>(type: T): T {
    // will eventually want caching logic here
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
