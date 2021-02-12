import { getSourceLocationOfNode, throwDiagnostic } from './diagnostics.js';
import { ADLSourceFile, Program } from './program.js';
import {
  ArrayExpressionNode,
  BooleanLiteralNode,
  BooleanLiteralType,
  IdentifierNode,
  NamespacePropertyNode,
  NamespaceStatementNode,
  Namespace,
  NamespaceProperty,
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
  UnionType,
  ReferenceExpression
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
    checkNamespaceProperty
  };

  function getTypeForNode(node: Node): Type {
    const cached = program.typeCache.get([node, ...templateInstantiation.values()]);
    if (cached) return cached;

    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(node);
      case SyntaxKind.ModelStatement:
        return checkModel(node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node);
      case SyntaxKind.NamespaceStatement:
        return checkNamespace(node);
      case SyntaxKind.NamespaceProperty:
        return checkNamespaceProperty(node);
      case SyntaxKind.Identifier:
        // decorator bindings presently return an empty binding
        return <any>checkIdentifier(node);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(node);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(node);
      case SyntaxKind.ArrayExpression:
        return checkArrayExpression(node);
      case SyntaxKind.UnionExpression:
        return checkUnionExpression(node);
      case SyntaxKind.IntersectionExpression:
        return checkIntersectionExpression(node);
      case SyntaxKind.TemplateApplication:
        return checkTemplateApplication(node);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(node);
    }

    throwDiagnostic('Cannot evaluate ' + SyntaxKind[node.kind], getSourceLocationOfNode(node));
  }

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case 'Model':
        return getModelName(type);
      case 'Union':
        return type.options.map(getTypeName).join(' | ');
      case 'Array':
        return getTypeName(type.elementType) + '[]';
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
      throwDiagnostic('Too few template arguments provided.', getSourceLocationOfNode(templateNode));
    }

    if (templateNode.templateParameters!.length > args.length) {
      throwDiagnostic('Too many template arguments provided.', getSourceLocationOfNode(templateNode));
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
      throwDiagnostic('Cannot intersect non-model types (including union types).', getSourceLocationOfNode(node));
    }

    const properties = new Map<string, ModelTypeProperty>();
    for (const option of optionTypes) {
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          throwDiagnostic(`Intersection contains duplicate property definitions for ${prop.name}`, getSourceLocationOfNode(node));
        }

        const newPropType = createType({
          ... prop,
          sourceProperty: prop
        }, true);

        properties.set(prop.name, newPropType);
      }
    }


    const intersection = createType({
      kind: 'Model',
      node,
      name: '',
      baseModels: [],
      properties: properties
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

  function checkNamespace(node: NamespaceStatementNode) {
    const type: Namespace = createType({
      kind: 'Namespace',
      name: node.id.sv,
      node: node,
      properties: new Map(),
      parameters: node.parameters ? <ModelType>getTypeForNode(node.parameters) : undefined
    });

    for (const prop of node.properties) {
      type.properties.set(prop.id.sv, checkNamespaceProperty(prop));
    }

    return type;
  }

  function checkNamespaceProperty(prop: NamespacePropertyNode): NamespaceProperty {
    return createType({
      kind: 'NamespaceProperty',
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
      throwDiagnostic('Unknown identifier ' + node.sv, getSourceLocationOfNode(node));
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
      const properties = new Map();
      const baseModels = node.kind === SyntaxKind.ModelExpression
                          ? []
                          : checkClassHeritage(node.heritage);

      for (const prop of node.properties) {
        if ('id' in prop) {
          const propType = <ModelTypeProperty>getTypeForNode(prop);
          properties.set(propType.name, propType);
        } else {
          // spread property
          const newProperties = checkSpreadProperty(prop.target);

          for (const newProp of newProperties) {
            if (properties.has(newProp.name)) {
              throwDiagnostic(`Model already has a property named ${newProp.name}`, getSourceLocationOfNode(node));
            }

            properties.set(newProp.name, newProp);
          }
        }
      }

      const type: ModelType = createType({
        kind: 'Model',
        name: node.kind === SyntaxKind.ModelStatement ? node.id.sv : '',
        node: node,
        properties,
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

  function checkClassHeritage(heritage: ReferenceExpression[]): ModelType[] {
    return heritage.map(heritageRef => {
      const heritageType = getTypeForNode(heritageRef);

      if (heritageType.kind !== "Model") {
        throwDiagnostic("Models must extend other models.", getSourceLocationOfNode(heritageRef))
      }

      return heritageType;
    });
  }

  function checkSpreadProperty(targetNode: ReferenceExpression): ModelTypeProperty[] {
    const props: ModelTypeProperty[] = [];
    const targetType = getTypeForNode(targetNode);


    if (targetType.kind != 'TemplateParameter') {
      if (targetType.kind !== 'Model') {
        throwDiagnostic('Cannot spread properties of non-model type.', getSourceLocationOfNode(targetNode));
      }

      // copy each property
      for (const prop of walkPropertiesInherited(targetType)) {
        const newProp = createType({
          ... prop,
          sourceProperty: prop
        }, true)
        props.push(newProp);
      }
    }

    return props;
  }

  function* walkPropertiesInherited(model: ModelType) {
    const parents = [model];
    const props: ModelTypeProperty[] = [];

    while (parents.length > 0) {
      const parent = parents.pop()!;
      yield* parent.properties.values();
      parents.push(...parent.baseModels);
    }

    return props;
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
  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T, skipCache = false): T {
    if (!skipCache) {
      (<any>typeDef).seq = program.typeCache.set([typeDef.node, ...templateInstantiation], typeDef);
    }
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
