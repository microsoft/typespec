import { ADLSourceFile, Program } from './program.js';
import {
  ArrayExpressionNode,
  ArrayType,
  BooleanLiteralNode,
  BooleanLiteralType,
  IdentifierNode,
  InterfacePropertyNode,
  InterfaceStatementNode,
  InterfaceType,
  InterfaceTypeProperty,
  IntersectionExpressionNode,
  LiteralNode,
  LiteralType,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  ModelType,
  ModelTypeProperty,
  Node,
  NumericLiteralNode,
  NumericLiteralType,
  StringLiteralNode,
  StringLiteralType,
  SyntaxKind,
  TemplateApplicationNode,
  TemplateParameterDeclarationNode,
  TupleExpressionNode,
  TupleType,
  Type,
  UnionExpressionNode,
  UnionType
} from './types.js';

/**
 * A map keyed by a set of objects. Used as a type cache where the base type
 * and any types in the instantiation set are used as keys.
 *
 * This is likely non-optimal.
 */
export class MultiKeyMap<T> {
  #currentId = 0;
  #idMap = new WeakMap<object, number>();
  #items = new Map<string, T>();

  get(items: Array<object>): T | undefined {
    return this.#items.get(this.compositeKeyFor(items));
  }

  set(items: Array<object>, value: any): string {
    const key = this.compositeKeyFor(items);
    this.#items.set(key, value);
    return key;
  }

  compositeKeyFor(items: Array<object>) {
    return items.map(i => this.keyFor(i)).join(',');
  }

  keyFor(item: object) {
    if (this.#idMap.has(item)) {
      return this.#idMap.get(item);
    }

    const id = this.#currentId++;
    this.#idMap.set(item, id);
    return id;
  }
}

export function createChecker(program: Program) {
  let templateInstantiation: Array<Type> = [];
  let instantiatingTemplate: Node | undefined;

  const seq = 0;

  return {
    getTypeForNode,
    checkProgram,
    getLiteralType,
    getTypeName,
    checkInterfaceProperty
  };

  function getTypeForNode(node: Node): Type {
    const cached = program.typeCache.get([node, ...templateInstantiation.values()]);
    if (cached) return cached;

    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(<ModelExpressionNode>node);
      case SyntaxKind.ModelStatement:
        return checkModel(<ModelStatementNode>node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(<ModelPropertyNode>node);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(<InterfaceStatementNode>node);
      case SyntaxKind.InterfaceProperty:
        return checkInterfaceProperty(<InterfacePropertyNode>node);
      case SyntaxKind.Identifier:
        // decorator bindings presently return an empty binding
        return <any>checkIdentifier(<IdentifierNode>node);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(<NumericLiteralNode>node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(<BooleanLiteralNode>node);
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

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case 'Model':
        return getModelName(<ModelType>type);
      case 'Union':
        return (<UnionType>type).options.map(getTypeName).join(' | ');
      case 'Array':
        return getTypeName((<ArrayType>type).elementType) + '[]';
      case 'String':
      case 'Number':
      case 'Boolean':
        return type.value.toString();
    }

    return '(unnamed type)';
  }

  function getModelName(model: ModelType) {
    if ((<ModelStatementNode>model.node).assignment) {
      return model.name;
    } else if (model.templateArguments && model.templateArguments.length > 0) {
      // template instantiation
      const args = model.templateArguments.map(getTypeName);
      return `${model.name}<${args.join(', ')}>`;
    } else if (model.ownProperties.size == 0 && model.baseModels.length > 0) {
      // intersection or spread-only
      // (NOTE: might have been spelled `{ ...A, ...B }` in source but we use the terser syntax here.)
      return model.name || model.baseModels.map(getTypeName).join(' & ');
    } else if ((<ModelStatementNode>model.node).templateParameters?.length > 0) {
      // template
      const params = (<ModelStatementNode>model.node).templateParameters.map(t => t.sv);
      return `${model.name}<${params.join(', ')}>`;
    } else {
      // regular old model.
      return model.name || '(anonymous model)';
    }
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = <ModelStatementNode>node.parent!;

    if (instantiatingTemplate === parentNode) {
      const index = parentNode.templateParameters.findIndex(v => v === node);
      return templateInstantiation[index];
    }

    return createType({
      kind: 'TemplateParameter',
      node: node
    });
  }

  function checkTemplateApplication(node: TemplateApplicationNode): Type {
    const args = node.arguments.map(getTypeForNode);
    const targetType = getTypeForNode(node.target);
    // todo: check proper target
    return instantiateTemplate(<ModelStatementNode>targetType.node, args);
  }


  /**
   * Builds a model type from a template and its template arguments.
   * Adds the template node to a set we can check when we bind template
   * parameters to access type type arguments.
   *
   * This will fall over if the same template is ever being instantiated
   * twice at the same time.
   */
  function instantiateTemplate(templateNode: ModelStatementNode, args: Array<Type>): ModelType {
    if (templateNode.templateParameters!.length < args.length) {
      throw new Error('Too few template arguments provided.');
    }

    if (templateNode.templateParameters!.length > args.length) {
      throw new Error('Too many template arguments provided.');
    }

    const oldTis = templateInstantiation;
    const oldTemplate = instantiatingTemplate;
    templateInstantiation = args;
    instantiatingTemplate = templateNode;
    // this cast is invalid once we support templatized `model =`.
    const type = <ModelType>getTypeForNode(templateNode);
    type.templateNode = templateNode;
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    return createType({
      kind: 'Union',
      node,
      options: node.options.map(getTypeForNode),
    });
  }

  function allModelTypes(types: Array<Type>): types is Array<ModelType> {
    return types.every(t => t.kind === 'Model');
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(node: IntersectionExpressionNode) {
    const optionTypes = node.options.map(getTypeForNode);
    if (!allModelTypes(optionTypes)) {
      throw new Error('Cannot intersect non-model types (including union types).');
    }

    const intersection = createModelType({
      kind: 'Model',
      node,
      name: '',
      ownProperties: new Map(),
      baseModels: optionTypes
    });

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
      parameters: node.parameters ? <ModelType>getTypeForNode(node.parameters) : undefined
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
      parameters: <ModelType>getTypeForNode(prop.parameters),
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

  function checkBooleanLiteral(bool: BooleanLiteralNode): BooleanLiteralType {
    return getLiteralType(bool);
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
      const ownProperties = new Map();
      const baseModels = new Array<ModelType>();

      for (const prop of node.properties) {
        if ('id' in prop) {
          const propType = <ModelTypeProperty>getTypeForNode(prop);
          ownProperties.set(propType.name, propType);
        } else {
          // spread property
          const target = getTypeForNode(prop.target);
          if (target.kind != 'TemplateParameter') {
            if (target.kind !== 'Model') {
              throw new Error('Cannot spread properties of non-model type.');
            }
            baseModels.push(target);
          }
        }
      }

      const type: ModelType = createModelType({
        kind: 'Model',
        name: node.kind === SyntaxKind.ModelStatement ? node.id.sv : '',
        node: node,
        ownProperties,
        baseModels: baseModels
      });
      return type;
    } else {
      // model =
      // this will likely have to change, as right now `model =` is really just
      // alias and so disappears. That means you can't easily rename symbols.
      const assignmentType = getTypeForNode((<ModelStatementNode>node).assignment!);

      if (assignmentType.kind === 'Model') {
        const type: ModelType = createType({
          ... <ModelType>assignmentType,
          node: node,
          name: (<ModelStatementNode>node).id.sv,
          assignmentType
        });

        return type;
      }

      return assignmentType;
    }
  }

  function checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty {
    if (prop.id.kind === SyntaxKind.Identifier) {
      return createType({
        kind: 'ModelProperty',
        name: prop.id.sv,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    } else {
      const name = prop.id.value;
      return createType({
        kind: 'ModelProperty',
        name,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    }
  }

  function createModelType(typeDef: Omit<ModelType, 'properties'>): ModelType {
    const properties = new Map(typeDef.ownProperties);

    for (const source of typeDef.baseModels ?? []) {
      for (const [name, property] of source.properties) {
        if (properties.has(name)) {
          throw new Error(`Cannot intersect/spread duplicate property '${name}'`);
        }
        properties.set(name, property);
      }
    }

    return createType({...typeDef, properties});
  }

  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T): T {
    (<any>typeDef).seq = program.typeCache.set([typeDef.node, ...templateInstantiation], typeDef);
    (<any>typeDef).templateArguments = templateInstantiation;

    // only run decorators on fully instantiated types.
    if (templateInstantiation.every(i => i.kind !== 'TemplateParameter')) {
      program.executeDecorators(typeDef);
    }

    return typeDef;
  }

  function getLiteralType(node: StringLiteralNode): StringLiteralType;
  function getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  function getLiteralType(node: LiteralNode): LiteralType {
    let type = program.literalTypes.get(node.value);
    if (type) {
      return type;
    }

    switch (node.kind) {
      case SyntaxKind.StringLiteral:
        type = { kind: 'String', node, value: node.value };
        break;
      case SyntaxKind.NumericLiteral:
        type = { kind: 'Number', node, value: node.value };
        break;
      case SyntaxKind.BooleanLiteral:
        type = { kind: 'Boolean', node, value: node.value };
        break;
    }

    program.literalTypes.set(node.value, type);
    return type;
  }
}
