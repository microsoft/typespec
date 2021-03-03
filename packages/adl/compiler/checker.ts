import { throwDiagnostic } from "./diagnostics.js";
import { ADLSourceFile, Program } from "./program.js";
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
  TypeReferenceNode,
  TemplateParameterDeclarationNode,
  TupleExpressionNode,
  TupleType,
  Type,
  UnionExpressionNode,
  UnionType,
  ReferenceExpression,
  DecoratorSymbol,
  TypeSymbol,
  SymbolLinks,
} from "./types.js";

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
    return items.map((i) => this.keyFor(i)).join(",");
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
  let currentSymbolId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();

  const seq = 0;

  return {
    getTypeForNode,
    checkProgram,
    getLiteralType,
    getTypeName,
    checkNamespaceProperty,
  };

  function getTypeForNode(node: Node): Type {
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
      case SyntaxKind.TypeReference:
        return checkTypeReference(node);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(node);
    }

    throwDiagnostic("Cannot evaluate " + SyntaxKind[node.kind], node);
  }

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case "Model":
        return getModelName(type);
      case "Union":
        return type.options.map(getTypeName).join(" | ");
      case "Array":
        return getTypeName(type.elementType) + "[]";
      case "String":
      case "Number":
      case "Boolean":
        return type.value.toString();
    }

    return "(unnamed type)";
  }

  function getModelName(model: ModelType) {
    if ((<ModelStatementNode>model.node).assignment) {
      return model.name;
    } else if (model.templateArguments && model.templateArguments.length > 0) {
      // template instantiation
      const args = model.templateArguments.map(getTypeName);
      return `${model.name}<${args.join(", ")}>`;
    } else if ((<ModelStatementNode>model.node).templateParameters?.length > 0) {
      // template
      const params = (<ModelStatementNode>model.node).templateParameters.map((t) => t.sv);
      return `${model.name}<${params.join(", ")}>`;
    } else {
      // regular old model.
      return model.name || "(anonymous model)";
    }
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = <ModelStatementNode>node.parent!;

    if (instantiatingTemplate === parentNode) {
      const index = parentNode.templateParameters.findIndex((v) => v === node);
      return templateInstantiation[index];
    }

    return createType({
      kind: "TemplateParameter",
      node: node,
    });
  }

  function checkTypeReference(node: TypeReferenceNode): Type {
    // todo: support member expressions
    const sym = resolveTypeReference(node.target as IdentifierNode);
    if (sym.kind === "decorator") {
      throwDiagnostic("Can't put a decorator in a type", node);
    }

    const symbolLinks = getSymbolLinks(sym);
    const args = node.arguments.map(getTypeForNode);

    if (sym.node.kind === SyntaxKind.ModelStatement && !sym.node.assignment) {
      // model statement, possibly templated
      if (sym.node.templateParameters.length === 0) {
        if (args.length > 0) {
          throwDiagnostic("Can't pass template arguments to model that is not templated", node);
        }

        if (symbolLinks.declaredType) {
          return symbolLinks.declaredType;
        }

        return checkModelStatement(sym.node);
      } else {
        // model is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          checkModelStatement(sym.node);
        }
        if (sym.node.templateParameters!.length > node.arguments.length) {
          throwDiagnostic("Too few template arguments provided.", node);
        }

        if (sym.node.templateParameters!.length < node.arguments.length) {
          throwDiagnostic("Too many template arguments provided.", node);
        }

        return instantiateTemplate(sym.node, args);
      }
    }
    // some other kind of reference

    if (args.length > 0) {
      throwDiagnostic("Can't pass template arguments to non-templated type", node);
    }

    if (sym.node.kind === SyntaxKind.TemplateParameterDeclaration) {
      const type = checkTemplateParameterDeclaration(sym.node);
      // TODO: could cache this probably.
      return type;
    }
    // types for non-templated types
    if (symbolLinks.type) {
      return symbolLinks.type;
    }

    const type = getTypeForNode(sym.node);
    symbolLinks.type = type;

    return type;
  }

  /**
   * Builds a model type from a template and its template arguments.
   * Adds the template node to a set we can check when we bind template
   * parameters to access type type arguments.
   *
   * This will fall over if the same template is ever being instantiated
   * twice at the same time, or if template parameters from more than one template
   * are ever in scope at once.
   */
  function instantiateTemplate(templateNode: ModelStatementNode, args: Array<Type>): ModelType {
    const symbolLinks = getSymbolLinks(templateNode.symbol!);
    const cached = symbolLinks.instantiations!.get(args) as ModelType;
    if (cached) {
      return cached;
    }

    const oldTis = templateInstantiation;
    const oldTemplate = instantiatingTemplate;
    templateInstantiation = args;
    instantiatingTemplate = templateNode;
    // this cast is invalid once we support templatized `model =`.
    const type = <ModelType>getTypeForNode(templateNode);

    symbolLinks.instantiations!.set(args, type);

    type.templateNode = templateNode;
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    return createType({
      kind: "Union",
      node,
      options: node.options.map(getTypeForNode),
    });
  }

  function allModelTypes(types: Array<Type>): types is Array<ModelType> {
    return types.every((t) => t.kind === "Model");
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(node: IntersectionExpressionNode) {
    const optionTypes = node.options.map(getTypeForNode);
    if (!allModelTypes(optionTypes)) {
      throwDiagnostic("Cannot intersect non-model types (including union types).", node);
    }

    const properties = new Map<string, ModelTypeProperty>();
    for (const option of optionTypes) {
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          throwDiagnostic(
            `Intersection contains duplicate property definitions for ${prop.name}`,
            node
          );
        }

        const newPropType = createType({
          ...prop,
          sourceProperty: prop,
        });

        properties.set(prop.name, newPropType);
      }
    }

    const intersection = createType({
      kind: "Model",
      node,
      name: "",
      baseModels: [],
      properties: properties,
    });

    return intersection;
  }

  function checkArrayExpression(node: ArrayExpressionNode) {
    return createType({
      kind: "Array",
      node,
      elementType: getTypeForNode(node.elementType),
    });
  }

  function checkNamespace(node: NamespaceStatementNode) {
    const type: Namespace = createType({
      kind: "Namespace",
      name: node.id.sv,
      node: node,
      properties: new Map(),
      parameters: node.parameters ? <ModelType>getTypeForNode(node.parameters) : undefined,
    });

    for (const prop of node.properties) {
      type.properties.set(prop.id.sv, checkNamespaceProperty(prop));
    }

    const links = getSymbolLinks(node.symbol!);
    links.type = type;

    return type;
  }

  function checkNamespaceProperty(prop: NamespacePropertyNode): NamespaceProperty {
    return createType({
      kind: "NamespaceProperty",
      name: prop.id.sv,
      node: prop,
      parameters: <ModelType>getTypeForNode(prop.parameters),
      returnType: getTypeForNode(prop.returnType),
    });
  }

  function checkTupleExpression(node: TupleExpressionNode): TupleType {
    return createType({
      kind: "Tuple",
      node: node,
      values: node.values.map((v) => getTypeForNode(v)),
    });
  }

  function getSymbolLinks(s: TypeSymbol): SymbolLinks {
    const id = getSymbolId(s);

    if (symbolLinks.has(id)) {
      return symbolLinks.get(id)!;
    }

    const links = {};
    symbolLinks.set(id, links);

    return links;
  }

  function getSymbolId(s: TypeSymbol) {
    if (s.id === undefined) {
      s.id = currentSymbolId++;
    }

    return s.id;
  }

  function resolveIdentifier(node: IdentifierNode): DecoratorSymbol | TypeSymbol {
    let scope: Node | undefined = node.parent;
    let binding;

    while (scope) {
      if ("locals" in scope) {
        binding = (<any>scope).locals.get(node.sv);
        if (binding) break;
      }
      scope = scope.parent;
    }

    if (!binding) {
      binding = program.globalSymbols.get(node.sv);
    }

    if (!binding) {
      throwDiagnostic("Unknown identifier " + node.sv, node);
    }

    return binding;
  }

  function resolveTypeReference(node: IdentifierNode): DecoratorSymbol | TypeSymbol {
    // TODO: Support for member expressions
    return resolveIdentifier(node);
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
    if (node.kind === SyntaxKind.ModelStatement) {
      if (node.properties) {
        return checkModelStatement(node);
      } else {
        return checkModelEquals(node);
      }
    } else {
      return checkModelExpression(node);
    }
  }

  function checkModelStatement(node: ModelStatementNode) {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType;
    }

    const baseModels = checkClassHeritage(node.heritage);
    const properties = checkModelProperties(node);
    const type: ModelType = {
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties,
      baseModels: baseModels,
    };

    if (
      instantiatingThisTemplate &&
      templateInstantiation.every((t) => t.kind !== "TemplateParameter")
    ) {
      createType(type);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new MultiKeyMap();
    }

    return type;
  }

  function checkModelExpression(node: ModelExpressionNode) {
    const properties = checkModelProperties(node);
    const type: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
      baseModels: [],
    });

    return type;
  }

  function checkModelProperties(node: ModelExpressionNode | ModelStatementNode) {
    const properties = new Map();
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const propType = <ModelTypeProperty>getTypeForNode(prop);
        properties.set(propType.name, propType);
      } else {
        // spread property
        const newProperties = checkSpreadProperty(prop.target);

        for (const newProp of newProperties) {
          if (properties.has(newProp.name)) {
            throwDiagnostic(`Model already has a property named ${newProp.name}`, node);
          }

          properties.set(newProp.name, newProp);
        }
      }
    }

    return properties;
  }

  function checkModelEquals(node: ModelStatementNode) {
    // model =
    // this will likely have to change, as right now `model =` is really just
    // alias and so disappears. That means you can't easily rename symbols.
    const assignmentType = getTypeForNode((<ModelStatementNode>node).assignment!);

    if (assignmentType.kind === "Model") {
      const type: ModelType = createType({
        ...(<ModelType>assignmentType),
        node: node,
        name: (<ModelStatementNode>node).id.sv,
        assignmentType,
      });

      return type;
    }

    const links = getSymbolLinks(node.symbol!);
    links.type = assignmentType;

    return assignmentType;
  }

  function checkClassHeritage(heritage: ReferenceExpression[]): ModelType[] {
    return heritage.map((heritageRef) => {
      const heritageType = getTypeForNode(heritageRef);

      if (heritageType.kind !== "Model") {
        throwDiagnostic("Models must extend other models.", heritageRef);
      }

      return heritageType;
    });
  }

  function checkSpreadProperty(targetNode: ReferenceExpression): ModelTypeProperty[] {
    const props: ModelTypeProperty[] = [];
    const targetType = getTypeForNode(targetNode);

    if (targetType.kind != "TemplateParameter") {
      if (targetType.kind !== "Model") {
        throwDiagnostic("Cannot spread properties of non-model type.", targetNode);
      }

      // copy each property
      for (const prop of walkPropertiesInherited(targetType)) {
        const newProp = createType({
          ...prop,
          sourceProperty: prop,
        });
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
        kind: "ModelProperty",
        name: prop.id.sv,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    } else {
      const name = prop.id.value;
      return createType({
        kind: "ModelProperty",
        name,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    }
  }

  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T): T {
    (<any>typeDef).templateArguments = templateInstantiation;

    program.executeDecorators(typeDef);
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
        type = { kind: "String", node, value: node.value };
        break;
      case SyntaxKind.NumericLiteral:
        type = { kind: "Number", node, value: node.value };
        break;
      case SyntaxKind.BooleanLiteral:
        type = { kind: "Boolean", node, value: node.value };
        break;
    }

    program.literalTypes.set(node.value, type);
    return type;
  }
}
