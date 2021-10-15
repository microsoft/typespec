import { createSymbolTable } from "./binder.js";
import { compilerAssert } from "./diagnostics.js";
import { createDiagnostic } from "./messages.js";
import { hasParseError } from "./parser.js";
import { Program } from "./program.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  ArrayType,
  BooleanLiteralNode,
  BooleanLiteralType,
  CadlScriptNode,
  DecoratorApplication,
  DecoratorExpressionNode,
  DecoratorSymbol,
  EnumMemberNode,
  EnumMemberType,
  EnumStatementNode,
  EnumType,
  ErrorType,
  IdentifierNode,
  InterfaceStatementNode,
  InterfaceType,
  IntersectionExpressionNode,
  JsSourceFile,
  LiteralNode,
  LiteralType,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  ModelType,
  ModelTypeProperty,
  NamespaceStatementNode,
  NamespaceType,
  Node,
  NumericLiteralNode,
  NumericLiteralType,
  OperationStatementNode,
  OperationType,
  ReferenceExpression,
  StringLiteralNode,
  StringLiteralType,
  Sym,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateDeclarationNode,
  TemplateParameterDeclarationNode,
  TupleExpressionNode,
  TupleType,
  Type,
  TypeInstantiationMap,
  TypeReferenceNode,
  TypeSymbol,
  UnionExpressionNode,
  UnionStatementNode,
  UnionType,
  UnionTypeVariant,
  UnionVariantNode,
} from "./types.js";

export interface Checker {
  getTypeForNode(node: Node): Type;
  mergeJsSourceFile(file: JsSourceFile): void;
  mergeCadlSourceFile(file: CadlScriptNode): void;
  setUsingsForFile(file: CadlScriptNode): void;
  checkProgram(): void;
  checkSourceFile(file: CadlScriptNode): void;
  checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty;
  checkUnionExpression(node: UnionExpressionNode): UnionType;
  getGlobalNamespaceType(): NamespaceType;
  getGlobalNamespaceNode(): NamespaceStatementNode;
  getMergedSymbol(sym: Sym | undefined): Sym | undefined;
  getMergedNamespace(node: NamespaceStatementNode): NamespaceStatementNode;
  getLiteralType(node: StringLiteralNode): StringLiteralType;
  getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  getLiteralType(node: LiteralNode): LiteralType;
  getTypeName(type: Type): string;
  getNamespaceString(type: NamespaceType | undefined): string;
  cloneType<T extends Type>(type: T): T;
}

/**
 * A map keyed by a set of objects.
 *
 * This is likely non-optimal.
 */
class MultiKeyMap<K extends object[], V> {
  #currentId = 0;
  #idMap = new WeakMap<object, number>();
  #items = new Map<string, V>();

  get(items: K): V | undefined {
    return this.#items.get(this.compositeKeyFor(items));
  }

  set(items: K, value: V): void {
    const key = this.compositeKeyFor(items);
    this.#items.set(key, value);
  }

  private compositeKeyFor(items: K) {
    return items.map((i) => this.keyFor(i)).join(",");
  }

  private keyFor(item: object) {
    if (this.#idMap.has(item)) {
      return this.#idMap.get(item);
    }

    const id = this.#currentId++;
    this.#idMap.set(item, id);
    return id;
  }
}

/**
 * Maps type arguments to type instantiation.
 */
const TypeInstantiationMap = class
  extends MultiKeyMap<Type[], Type>
  implements TypeInstantiationMap {};

interface PendingModelInfo {
  id: IdentifierNode;
  type: ModelType;
}

export function createChecker(program: Program): Checker {
  let templateInstantiation: Type[] = [];
  let instantiatingTemplate: Node | undefined;
  let currentSymbolId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();
  const mergedSymbols = new Map<Sym, Sym>();
  const globalNamespaceNode = createGlobalNamespaceNode();
  const globalNamespaceType = createGlobalNamespaceType();
  let cadlNamespaceNode: NamespaceStatementNode | undefined;
  const errorType: ErrorType = { kind: "Intrinsic", name: "ErrorType" };

  // This variable holds on to the model type that is currently
  // being instantiated in checkModelStatement so that it is
  // possible to have recursive type references in properties.
  let pendingModelType: PendingModelInfo | undefined = undefined;
  for (const file of program.jsSourceFiles.values()) {
    mergeJsSourceFile(file);
  }
  for (const file of program.sourceFiles.values()) {
    mergeCadlSourceFile(file);
  }

  for (const file of program.sourceFiles.values()) {
    setUsingsForFile(file);
  }

  const cadlNamespaceBinding = globalNamespaceNode.exports?.get("Cadl");
  if (cadlNamespaceBinding) {
    // the cadl namespace binding will be absent if we've passed
    // the no-std-lib option.
    compilerAssert(cadlNamespaceBinding.kind === "type", "expected Cadl to be a type binding");
    compilerAssert(
      cadlNamespaceBinding.node.kind === SyntaxKind.NamespaceStatement,
      "expected Cadl to be a namespace"
    );
    cadlNamespaceNode = cadlNamespaceBinding.node;
    for (const file of program.sourceFiles.values()) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, binding);
      }
    }
  }

  return {
    getTypeForNode,
    checkProgram,
    checkSourceFile,
    checkModelProperty,
    checkUnionExpression,
    getLiteralType,
    getTypeName,
    getNamespaceString,
    getGlobalNamespaceType,
    getGlobalNamespaceNode,
    mergeJsSourceFile,
    mergeCadlSourceFile,
    setUsingsForFile,
    getMergedSymbol,
    getMergedNamespace,
    cloneType,
  };

  function mergeJsSourceFile(file: JsSourceFile) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function mergeCadlSourceFile(file: CadlScriptNode) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function setUsingsForFile(file: CadlScriptNode) {
    for (const using of file.usings) {
      const parentNs = using.parent! as NamespaceStatementNode | CadlScriptNode;

      const sym = resolveTypeReference(using.name);
      if (!sym) {
        continue;
      }
      if (sym.kind === "decorator") {
        program.reportDiagnostic(
          createDiagnostic({ code: "using-invalid-ref", messageId: "decorator", target: using })
        );
        continue;
      }

      if (sym.node.kind !== SyntaxKind.NamespaceStatement) {
        program.reportDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: using }));
        continue;
      }

      for (const [name, binding] of sym.node.exports!) {
        parentNs.locals!.set(name, binding);
      }
    }

    if (cadlNamespaceNode) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, binding);
      }
    }
  }

  function getTypeForNode(node: Node): Type {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(node);
      case SyntaxKind.ModelStatement:
        return checkModel(node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node);
      case SyntaxKind.AliasStatement:
        return checkAlias(node);
      case SyntaxKind.EnumStatement:
        return checkEnum(node);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(node);
      case SyntaxKind.UnionStatement:
        return checkUnion(node);
      case SyntaxKind.NamespaceStatement:
        return checkNamespace(node);
      case SyntaxKind.OperationStatement:
        return checkOperation(node);
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

    return errorType;
  }

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case "Model":
        return getModelName(type);
      case "Enum":
        return getEnumName(type);
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

  function getNamespaceString(type: NamespaceType | undefined): string {
    if (!type) return "";
    const parent = type.namespace;
    return parent && parent.name !== "" ? `${getNamespaceString(parent)}.${type.name}` : type.name;
  }

  function getEnumName(e: EnumType): string {
    const nsName = getNamespaceString(e.namespace);
    return nsName ? `${nsName}.${e.name}` : e.name;
  }

  function getModelName(model: ModelType) {
    const nsName = getNamespaceString(model.namespace);
    const modelName = (nsName ? nsName + "." : "") + (model.name || "(anonymous model)");
    if (model.templateArguments && model.templateArguments.length > 0) {
      // template instantiation
      const args = model.templateArguments.map(getTypeName);
      return `${modelName}<${args.join(", ")}>`;
    } else if ((model.node as ModelStatementNode).templateParameters?.length > 0) {
      // template
      const params = (model.node as ModelStatementNode).templateParameters.map((t) => t.id.sv);
      return `${model.name}<${params.join(", ")}>`;
    } else {
      // regular old model.
      return modelName;
    }
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = node.parent! as ModelStatementNode;

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
    const sym = resolveTypeReference(node);
    if (!sym) {
      return errorType;
    }

    if (sym.kind === "decorator") {
      program.reportDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "decorator", target: node })
      );

      return errorType;
    }

    const symbolLinks = getSymbolLinks(sym);
    let args = node.arguments.map(getTypeForNode);

    if (
      sym.node.kind === SyntaxKind.ModelStatement ||
      sym.node.kind === SyntaxKind.AliasStatement ||
      sym.node.kind === SyntaxKind.InterfaceStatement ||
      sym.node.kind === SyntaxKind.UnionStatement
    ) {
      if (sym.node.templateParameters.length === 0) {
        if (args.length > 0) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "notTemplate",
              target: node,
            })
          );
        }

        if (symbolLinks.declaredType) {
          return symbolLinks.declaredType;
        } else if (pendingModelType && pendingModelType.id.sv === sym.node.id.sv) {
          return pendingModelType.type;
        }

        return sym.node.kind === SyntaxKind.ModelStatement
          ? checkModelStatement(sym.node)
          : sym.node.kind === SyntaxKind.AliasStatement
          ? checkAlias(sym.node)
          : sym.node.kind === SyntaxKind.InterfaceStatement
          ? checkInterface(sym.node)
          : checkUnion(sym.node);
      } else {
        // declaration is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          sym.node.kind === SyntaxKind.ModelStatement
            ? checkModelStatement(sym.node)
            : sym.node.kind === SyntaxKind.AliasStatement
            ? checkAlias(sym.node)
            : sym.node.kind === SyntaxKind.InterfaceStatement
            ? checkInterface(sym.node)
            : checkUnion(sym.node);
        }

        const templateParameters = sym.node.templateParameters;
        if (args.length < templateParameters.length) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "tooFew",
              target: node,
            })
          );
          args = [...args, ...new Array(templateParameters.length - args.length).fill(errorType)];
        } else if (args.length > templateParameters.length) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "tooMany",
              target: node,
            })
          );
          args = args.slice(0, templateParameters.length);
        }
        return instantiateTemplate(sym.node, args);
      }
    }
    // some other kind of reference

    if (args.length > 0) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-template-args",
          messageId: "notTemplate",
          target: node,
        })
      );
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
  function instantiateTemplate(
    templateNode:
      | ModelStatementNode
      | AliasStatementNode
      | InterfaceStatementNode
      | UnionStatementNode,
    args: Type[]
  ): Type {
    const symbolLinks = getSymbolLinks(templateNode.symbol!);
    const cached = symbolLinks.instantiations!.get(args) as ModelType;
    if (cached) {
      return cached;
    }

    const oldTis = templateInstantiation;
    const oldTemplate = instantiatingTemplate;
    templateInstantiation = args;
    instantiatingTemplate = templateNode;

    const type = getTypeForNode(templateNode);

    symbolLinks.instantiations!.set(args, type);
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    const options: [string | Symbol, Type][] = node.options.flatMap((o) => {
      const type = getTypeForNode(o);
      if (type.kind === "Union" && type.expression) {
        return Array.from(type.variants.entries());
      }
      return [[Symbol(), type]];
    });

    const type: UnionType = {
      kind: "Union",
      node,
      get options() {
        return Array.from(this.variants.values());
      },
      expression: true,
      variants: new Map(options),
      decorators: [],
    };

    createType(type);
    return type;
  }

  function allModelTypes(types: Type[]): types is ModelType[] {
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
      program.reportDiagnostic(createDiagnostic({ code: "intersect-non-model", target: node }));
      return errorType;
    }

    const properties = new Map<string, ModelTypeProperty>();
    for (const option of optionTypes) {
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "intersect-duplicate-property",
              format: { propName: prop.name },
              target: node,
            })
          );
          continue;
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
      properties: properties,
      decorators: [], // could probably include both sets of decorators here...
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
    const links = getSymbolLinks(getMergedSymbol(node.symbol!) as TypeSymbol);
    let type = links.type as NamespaceType;
    if (!type) {
      type = initializeTypeForNamespace(node);
    }

    if (Array.isArray(node.statements)) {
      node.statements.forEach(getTypeForNode);
    } else if (node.statements) {
      const subNs = checkNamespace(node.statements);
      type.namespaces.set(subNs.name, subNs);
    }
    return type;
  }

  function initializeTypeForNamespace(node: NamespaceStatementNode) {
    compilerAssert(node.symbol, "Namespace is unbound.", node);

    const symbolLinks = getSymbolLinks(getMergedSymbol(node.symbol) as TypeSymbol);
    if (!symbolLinks.type) {
      // haven't seen this namespace before
      const namespace = getParentNamespaceType(node);
      const name = node.name.sv;
      const decorators = checkDecorators(node);

      const type: NamespaceType = createType({
        kind: "Namespace",
        name,
        namespace,
        node,
        models: new Map(),
        operations: new Map(),
        namespaces: new Map(),
        interfaces: new Map(),
        unions: new Map(),
        decorators,
      });
      namespace?.namespaces.set(name, type);
      symbolLinks.type = type;
    } else {
      compilerAssert(
        symbolLinks.type.kind === "Namespace",
        "Got non-namespace type when resolving namespace"
      );
      // seen it before, need to execute the decorators on this node
      // against the type we've already made.
      symbolLinks.type.kind;
      const newDecorators = checkDecorators(node);
      symbolLinks.type.decorators.push(...newDecorators);

      for (const dec of newDecorators) {
        symbolLinks.type.decorators.push(dec);
        applyDecoratorToType(dec, symbolLinks.type);
      }
    }

    return symbolLinks.type as NamespaceType;
  }

  function getParentNamespaceType(
    node:
      | ModelStatementNode
      | NamespaceStatementNode
      | OperationStatementNode
      | EnumStatementNode
      | InterfaceStatementNode
      | UnionStatementNode
  ): NamespaceType | undefined {
    if (node === globalNamespaceType.node) return undefined;
    if (!node.namespaceSymbol) return globalNamespaceType;

    const mergedSymbol = getMergedSymbol(node.namespaceSymbol) as TypeSymbol;
    const symbolLinks = getSymbolLinks(mergedSymbol);
    if (!symbolLinks.type) {
      // in general namespaces should be typed before anything calls this function.
      // However, one case where this is not true is when a decorator on a namespace
      // refers to a model in another namespace. In this case, we need to evaluate
      // the namespace here.
      symbolLinks.type = initializeTypeForNamespace(mergedSymbol.node as NamespaceStatementNode);
    }

    return symbolLinks.type as NamespaceType;
  }

  function checkOperation(node: OperationStatementNode): OperationType {
    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    const decorators = checkDecorators(node);
    const type: OperationType = {
      kind: "Operation",
      name,
      namespace,
      node,
      parameters: getTypeForNode(node.parameters) as ModelType,
      returnType: getTypeForNode(node.returnType),
      decorators,
    };

    if (
      node.parent!.kind !== SyntaxKind.InterfaceStatement ||
      shouldCreateTypeForTemplate(node.parent!)
    ) {
    }

    if (node.parent!.kind === SyntaxKind.InterfaceStatement) {
      if (shouldCreateTypeForTemplate(node.parent!)) {
        createType(type);
      }
    } else {
      createType(type);
      namespace?.operations.set(name, type);
    }

    return type;
  }

  function getGlobalNamespaceType() {
    return globalNamespaceType;
  }

  function getGlobalNamespaceNode() {
    return globalNamespaceNode;
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

  function resolveIdentifierInTable(
    node: IdentifierNode,
    table: SymbolTable,
    resolveDecorator = false
  ) {
    let sym;
    if (resolveDecorator) {
      sym = table.get("@" + node.sv);
    } else {
      sym = table.get(node.sv);
    }

    return getMergedSymbol(sym);
  }

  function resolveIdentifier(node: IdentifierNode, resolveDecorator = false) {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    let scope: Node | undefined = node.parent;
    let binding;

    while (scope && scope.kind !== SyntaxKind.CadlScript) {
      if ("exports" in scope) {
        const mergedSymbol = getMergedSymbol(scope.symbol) as TypeSymbol;
        binding = resolveIdentifierInTable(
          node,
          (mergedSymbol.node as any).exports!,
          resolveDecorator
        );
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals!, resolveDecorator);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.CadlScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol) as TypeSymbol;
        binding = resolveIdentifierInTable(
          node,
          (mergedSymbol.node as any).exports!,
          resolveDecorator
        );
        if (binding) return binding;
      }

      // check "global scope" declarations
      binding = resolveIdentifierInTable(node, globalNamespaceNode.exports!, resolveDecorator);
      if (binding) return binding;

      // check "global scope" usings
      binding = resolveIdentifierInTable(node, scope.locals!, resolveDecorator);
      if (binding) return binding;
    }

    program.reportDiagnostic(
      createDiagnostic({ code: "unknown-identifier", format: { id: node.sv }, target: node })
    );
    return undefined;
  }

  function resolveTypeReference(
    node: ReferenceExpression,
    resolveDecorator = false
  ): DecoratorSymbol | TypeSymbol | undefined {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node.target, resolveDecorator);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      const base = resolveTypeReference(node.base);
      if (!base) {
        return undefined;
      }
      if (base.kind === "type" && base.node.kind === SyntaxKind.NamespaceStatement) {
        const symbol = resolveIdentifierInTable(node.id, base.node.exports!, resolveDecorator);
        if (!symbol) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-ref",
              messageId: "underNamespace",
              format: { id: node.id.sv },
              target: node,
            })
          );
          return undefined;
        }
        return symbol;
      } else if (base.kind === "decorator") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "inDecorator",
            format: { id: node.id.sv },
            target: node,
          })
        );
        return undefined;
      } else {
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "node",
            format: { id: node.id.sv, nodeName: SyntaxKind[base.node.kind] },
            target: node,
          })
        );

        return undefined;
      }
    }

    if (node.kind === SyntaxKind.Identifier) {
      return resolveIdentifier(node, resolveDecorator);
    }

    compilerAssert(false, "Unknown type reference kind", node);
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

  function checkProgram() {
    program.reportDuplicateSymbols(globalNamespaceNode.exports!);
    for (const file of program.sourceFiles.values()) {
      program.reportDuplicateSymbols(file.locals!);
      for (const ns of file.namespaces) {
        program.reportDuplicateSymbols(ns.locals!);
        program.reportDuplicateSymbols(ns.exports!);

        initializeTypeForNamespace(ns);
      }
    }

    for (const file of program.sourceFiles.values()) {
      checkSourceFile(file);
    }
  }

  function checkSourceFile(file: CadlScriptNode) {
    for (const statement of file.statements) {
      getTypeForNode(statement);
    }
  }

  function checkModel(node: ModelExpressionNode | ModelStatementNode) {
    if (node.kind === SyntaxKind.ModelStatement) {
      return checkModelStatement(node);
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

    const isBase = checkModelIs(node.is);

    const decorators: DecoratorApplication[] = [];
    if (isBase) {
      // copy decorators
      decorators.push(...isBase.decorators);
    }
    decorators.push(...checkDecorators(node));

    const properties = new Map<string, ModelTypeProperty>();
    if (isBase) {
      for (const prop of isBase.properties.values()) {
        properties.set(
          prop.name,
          createType({
            ...prop,
          })
        );
      }
    }

    let baseModels;
    if (isBase) {
      baseModels = isBase.baseModel;
    } else if (node.extends) {
      baseModels = checkClassHeritage(node.extends);
    }

    const type: ModelType = {
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties,
      baseModel: baseModels,
      namespace: getParentNamespaceType(node),
      decorators,
    };

    // Hold on to the model type that's being defined so that it
    // can be referenced
    pendingModelType = {
      id: node.id,
      type,
    };

    const inheritedPropNames = new Set(
      Array.from(walkPropertiesInherited(type)).map((v) => v.name)
    );

    // Evaluate the properties after
    checkModelProperties(node, properties, inheritedPropNames);

    if (shouldCreateTypeForTemplate(node)) {
      createType(type);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
      type.namespace?.models.set(type.name, type);
    }

    // The model is fully created now
    pendingModelType = undefined;

    return type;
  }

  function shouldCreateTypeForTemplate(node: TemplateDeclarationNode) {
    const instantiatingThisTemplate = instantiatingTemplate === node;

    return (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    );
  }

  function checkModelExpression(node: ModelExpressionNode) {
    const properties = new Map();
    checkModelProperties(node, properties);
    const type: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
      decorators: [],
    });

    return type;
  }

  function checkModelProperties(
    node: ModelExpressionNode | ModelStatementNode,
    properties: Map<string, ModelTypeProperty>,
    inheritedPropertyNames?: Set<string>
  ) {
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const newProp = getTypeForNode(prop) as ModelTypeProperty;
        defineProperty(properties, newProp, inheritedPropertyNames);
      } else {
        // spread property
        const newProperties = checkSpreadProperty(prop.target);

        for (const newProp of newProperties) {
          defineProperty(properties, newProp, inheritedPropertyNames);
        }
      }
    }
  }

  function defineProperty(
    properties: Map<string, ModelTypeProperty>,
    newProp: ModelTypeProperty,
    inheritedPropertyNames?: Set<string>
  ) {
    if (properties.has(newProp.name)) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "duplicate-property",
          format: { propName: newProp.name },
          target: newProp,
        })
      );
      return;
    }

    if (inheritedPropertyNames?.has(newProp.name)) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "override-property",
          format: { propName: newProp.name },
          target: newProp,
        })
      );

      return;
    }

    properties.set(newProp.name, newProp);
  }

  function checkClassHeritage(heritageRef: ReferenceExpression): ModelType | undefined {
    const heritageType = getTypeForNode(heritageRef);
    if (isErrorType(heritageType)) {
      compilerAssert(program.hasError(), "Should already have reported an error.", heritageRef);
      return undefined;
    }

    if (heritageType.kind !== "Model") {
      program.reportDiagnostic(createDiagnostic({ code: "extend-model", target: heritageRef }));
      return undefined;
    }

    return heritageType;
  }

  function checkModelIs(isExpr: ReferenceExpression | undefined): ModelType | undefined {
    if (!isExpr) return undefined;
    const isType = getTypeForNode(isExpr);

    if (isType.kind !== "Model") {
      program.reportDiagnostic(createDiagnostic({ code: "is-model", target: isExpr }));
      return;
    }

    return isType;
  }

  function checkSpreadProperty(targetNode: ReferenceExpression): ModelTypeProperty[] {
    const props: ModelTypeProperty[] = [];
    const targetType = getTypeForNode(targetNode);

    if (targetType.kind != "TemplateParameter") {
      if (targetType.kind !== "Model") {
        program.reportDiagnostic(createDiagnostic({ code: "spread-model", target: targetNode }));
        return props;
      }

      // copy each property
      for (const prop of walkPropertiesInherited(targetType)) {
        const newProp = cloneType(prop, { sourceProperty: prop });
        props.push(newProp);
      }
    }

    return props;
  }

  function* walkPropertiesInherited(model: ModelType) {
    let current: ModelType | undefined = model;

    while (current) {
      yield* current.properties.values();
      current = current.baseModel;
    }
  }

  function checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty {
    const decorators = checkDecorators(prop);
    const valueType = getTypeForNode(prop.value);
    const defaultValue = prop.default && checkDefault(getTypeForNode(prop.default), valueType);
    const name = prop.id.kind === SyntaxKind.Identifier ? prop.id.sv : prop.id.value;

    let type: ModelTypeProperty = {
      kind: "ModelProperty",
      name,
      node: prop,
      optional: prop.optional,
      type: valueType,
      decorators,
      default: defaultValue,
    };

    const parentModel = prop.parent! as
      | ModelStatementNode
      | ModelExpressionNode
      | OperationStatementNode;
    if (
      parentModel.kind !== SyntaxKind.ModelStatement ||
      shouldCreateTypeForTemplate(parentModel)
    ) {
      createType(type);
    }

    return type;
  }

  function checkDefault(defaultType: Type, type: Type): Type {
    switch (type.kind) {
      case "Model":
        return checkDefaultForModelType(defaultType, type);
      case "Array":
        return checkDefaultForArrayType(defaultType, type);
      default:
        program.reportDiagnostic(
          createDiagnostic({
            code: "unsupported-default",
            format: { type: type.kind },
            target: defaultType,
          })
        );
    }
    return errorType;
  }

  function checkDefaultForModelType(defaultType: Type, type: ModelType): Type {
    switch (type.name) {
      case "string":
        return checkDefaultTypeIsString(defaultType);
      case "boolean":
        return checkDefaultTypeIsBoolean(defaultType);
      case "int32":
      case "int64":
      case "int32":
      case "int16":
      case "int8":
      case "uint64":
      case "uint32":
      case "uint16":
      case "uint8":
      case "safeint":
      case "float32":
      case "float64":
        return checkDefaultTypeIsNumeric(defaultType);
      default:
        program.reportDiagnostic(
          createDiagnostic({
            code: "unsupported-default",
            format: { type: type.name },
            target: defaultType,
          })
        );
    }
    return errorType;
  }

  function checkDefaultForArrayType(defaultType: Type, type: ArrayType): Type {
    if (defaultType.kind === "Tuple") {
      for (const item of defaultType.values) {
        checkDefault(item, type.elementType);
      }
    } else {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-default-type",
          format: { type: "tuple" },
          target: defaultType,
        })
      );
    }
    return defaultType;
  }

  function checkDefaultTypeIsString(defaultType: Type): Type {
    if (defaultType.kind !== "String") {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-default-type",
          format: { type: "string" },
          target: defaultType,
        })
      );
    }
    return defaultType;
  }

  function checkDefaultTypeIsNumeric(defaultType: Type): Type {
    if (defaultType.kind !== "Number") {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-default-type",
          format: { type: "number" },
          target: defaultType,
        })
      );
    }
    return defaultType;
  }

  function checkDefaultTypeIsBoolean(defaultType: Type): Type {
    if (defaultType.kind !== "Boolean") {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-default-type",
          format: { type: "boolean" },
          target: defaultType,
        })
      );
    }
    return defaultType;
  }

  function checkDecorators(node: { decorators: DecoratorExpressionNode[] }) {
    const decorators: DecoratorApplication[] = [];
    for (const decNode of node.decorators) {
      const sym = resolveTypeReference(decNode.target, true);
      if (!sym) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "unknown-decorator",
            target: decNode,
          })
        );
        continue;
      }
      if (sym.kind !== "decorator") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-decorator",
            format: { id: sym.name },
            target: decNode,
          })
        );
        continue;
      }

      const args = decNode.arguments.map(getTypeForNode).map((type) => {
        if (type.kind === "Number" || type.kind === "String" || type.kind === "Boolean") {
          return type.value;
        }

        return type;
      });

      decorators.unshift({
        decorator: sym.value,
        args,
      });
    }

    return decorators;
  }

  function checkAlias(node: AliasStatementNode): Type {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      return links.declaredType;
    }

    const type = getTypeForNode(node.value);
    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
    }

    return type;
  }

  function checkEnum(node: EnumStatementNode): Type {
    const links = getSymbolLinks(node.symbol!);

    if (!links.type) {
      const decorators = checkDecorators(node);
      const enumType: EnumType = {
        kind: "Enum",
        name: node.id.sv,
        node,
        members: [],
        namespace: getParentNamespaceType(node),
        decorators,
      };

      const memberNames = new Set<string>();

      for (const member of node.members) {
        const memberType = checkEnumMember(enumType, member, memberNames);
        if (memberType) {
          memberNames.add(memberType.name);
          enumType.members.push(memberType);
        }
      }

      createType(enumType);

      links.type = enumType;
    }

    return links.type;
  }

  function checkInterface(node: InterfaceStatementNode): InterfaceType {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as InterfaceType;
    }

    const decorators = checkDecorators(node);

    const interfaceType: InterfaceType = {
      kind: "Interface",
      decorators,
      node,
      namespace: getParentNamespaceType(node),
      operations: new Map(),
      name: node.id.sv,
    };

    for (const mixinNode of node.mixes) {
      const mixinType = getTypeForNode(mixinNode);
      if (mixinType.kind !== "Interface") {
        program.reportDiagnostic(createDiagnostic({ code: "mixes-interface", target: mixinNode }));
        continue;
      }

      for (const newMember of mixinType.operations.values()) {
        if (interfaceType.operations.has(newMember.name)) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "mixes-interface-duplicate",
              format: { name: newMember.name },
              target: mixinNode,
            })
          );
        }

        interfaceType.operations.set(newMember.name, cloneType(newMember));
      }
    }

    const ownMembers = new Map<string, OperationType>();

    checkInterfaceMembers(node, ownMembers);

    for (const [k, v] of ownMembers) {
      // don't do a duplicate check here because interface members can override
      // an member coming from a mixin.
      interfaceType.operations.set(k, v);
    }

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      createType(interfaceType);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = interfaceType;
      links.instantiations = new TypeInstantiationMap();
      interfaceType.namespace?.interfaces.set(interfaceType.name, interfaceType);
    }

    return interfaceType;
  }

  function checkInterfaceMembers(
    node: InterfaceStatementNode,
    members: Map<string, OperationType>
  ) {
    for (const opNode of node.operations) {
      const opType = checkOperation(opNode);
      if (members.has(opType.name)) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "interface-duplicate",
            format: { name: opType.name },
            target: opNode,
          })
        );
        continue;
      }
      members.set(opType.name, opType);
    }
  }

  function checkUnion(node: UnionStatementNode) {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as InterfaceType;
    }

    const decorators = checkDecorators(node);
    const variants = new Map<string, UnionTypeVariant>();
    checkUnionVariants(node, variants);
    const unionType: UnionType = {
      kind: "Union",
      decorators,
      node,
      namespace: getParentNamespaceType(node),
      name: node.id.sv,
      variants,
      get options() {
        return Array.from(this.variants.values());
      },
      expression: false,
    };

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      createType(unionType);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = unionType;
      links.instantiations = new TypeInstantiationMap();
      unionType.namespace?.unions.set(unionType.name!, unionType);
    }

    return unionType;
  }

  function checkUnionVariants(union: UnionStatementNode, variants: Map<string, UnionTypeVariant>) {
    for (const variantNode of union.options) {
      const variantType = checkUnionVariant(variantNode);
      if (variants.has(variantType.name as string)) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "union-duplicate",
            format: { name: variantType.name.toString() },
            target: variantNode,
          })
        );
        continue;
      }
      variants.set(variantType.name as string, variantType);
    }
  }

  function checkUnionVariant(variantNode: UnionVariantNode): UnionTypeVariant {
    const name =
      variantNode.id.kind === SyntaxKind.Identifier ? variantNode.id.sv : variantNode.id.value;
    const decorators = checkDecorators(variantNode);
    const type = getTypeForNode(variantNode.value);
    return createType({
      kind: "UnionVariant",
      name,
      node: variantNode,
      decorators,
      type,
    });
  }

  function checkEnumMember(
    parentEnum: EnumType,
    node: EnumMemberNode,
    existingMemberNames: Set<string>
  ): EnumMemberType | undefined {
    const name = node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value;
    const value = node.value ? node.value.value : undefined;
    const decorators = checkDecorators(node);
    if (existingMemberNames.has(name)) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "enum-member-duplicate",
          format: { name: name },
          target: node,
        })
      );
      return;
    }
    return createType({
      kind: "EnumMember",
      enum: parentEnum,
      name,
      node,
      value,
      decorators,
    });
  }

  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T): T {
    (typeDef as any).templateArguments = templateInstantiation;

    if ("decorators" in typeDef) {
      for (const decApp of typeDef.decorators) {
        applyDecoratorToType(decApp, typeDef);
      }
    }

    return typeDef;
  }

  function applyDecoratorToType(decApp: DecoratorApplication, target: Type) {
    compilerAssert(
      "decorators" in target,
      "Cannot apply decorator to non-decoratable type",
      target
    );

    // peel `fn` off to avoid setting `this`.

    try {
      const fn = decApp.decorator;
      fn(program, target, ...decApp.args);
    } catch (error) {
      // do not fail the language server for exceptions in decorators
      if (program.compilerOptions.designTimeBuild) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "decorator-fail",
            format: { decoratorName: decApp.decorator.name, error },
            target,
          })
        );
      } else {
        throw error;
      }
    }
  }

  function getLiteralType(node: StringLiteralNode): StringLiteralType;
  function getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  function getLiteralType(node: LiteralNode): LiteralType;
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

  function mergeSymbolTable(source: SymbolTable, target: SymbolTable) {
    for (const dupe of source.duplicates) {
      target.duplicates.add(dupe);
    }
    for (const [key, sourceBinding] of source) {
      if (
        sourceBinding.kind === "type" &&
        sourceBinding.node.kind === SyntaxKind.NamespaceStatement
      ) {
        // we are merging a namespace symbol. See if is an existing namespace symbol
        // to merge with.
        let existingBinding = target.get(key);

        if (!existingBinding) {
          existingBinding = {
            kind: "type",
            node: sourceBinding.node,
            name: sourceBinding.name,
            id: sourceBinding.id,
          };
          target.set(key, existingBinding);
          mergedSymbols.set(sourceBinding, existingBinding);
        } else if (
          existingBinding.kind === "type" &&
          existingBinding.node.kind === SyntaxKind.NamespaceStatement
        ) {
          mergedSymbols.set(sourceBinding, existingBinding);
          // merge the namespaces
          mergeSymbolTable(sourceBinding.node.exports!, existingBinding.node.exports!);
        } else {
          target.set(key, sourceBinding);
        }
      } else {
        target.set(key, sourceBinding);
      }
    }
  }

  function getMergedSymbol(sym: Sym | undefined): Sym | undefined {
    if (!sym) return sym;
    return mergedSymbols.get(sym) || sym;
  }

  function getMergedNamespace(node: NamespaceStatementNode): NamespaceStatementNode {
    const sym = getMergedSymbol(node.symbol) as TypeSymbol;
    return sym.node as NamespaceStatementNode;
  }

  function createGlobalNamespaceNode(): NamespaceStatementNode {
    const nsId: IdentifierNode = {
      kind: SyntaxKind.Identifier,
      pos: 0,
      end: 0,
      sv: "__GLOBAL_NS",
    };

    return {
      kind: SyntaxKind.NamespaceStatement,
      decorators: [],
      pos: 0,
      end: 0,
      name: nsId,
      locals: createSymbolTable(),
      exports: createSymbolTable(),
    };
  }

  function createGlobalNamespaceType() {
    return createType({
      kind: "Namespace",
      name: "",
      node: globalNamespaceNode,
      models: new Map(),
      operations: new Map(),
      namespaces: new Map(),
      interfaces: new Map(),
      unions: new Map(),
      decorators: [],
    });
  }

  function cloneType<T extends Type>(type: T, additionalProps: { [P in keyof T]?: T[P] } = {}): T {
    return createType({
      ...type,
      ...additionalProps,
    });
  }

  /**
   * useful utility function to debug the scopes produced by the binder,
   * the result of symbol merging, and identifier resolution.
   */
  function dumpScope(scope = globalNamespaceNode, indent = 0) {
    if (scope.locals) {
      console.log(`${Array(indent * 2).join(" ")}-locals:`);
      for (const [name, sym] of scope.locals) {
        console.log(
          `${Array(indent * 2 + 1).join(" ")}${name} => ${
            sym.kind === "type" ? SyntaxKind[sym.node.kind] : "[fn]"
          }`
        );
      }
    }
    console.log(`${Array(indent * 2).join(" ")}-exports:`);
    for (const [name, sym] of scope.exports!) {
      console.log(
        `${Array(indent * 2 + 1).join(" ")}${name} => ${
          sym.kind === "type" ? SyntaxKind[sym.node.kind] : "[fn]"
        }`
      );
      if (sym.kind === "type" && sym.node.kind == SyntaxKind.NamespaceStatement) {
        dumpScope(sym.node, indent + 1);
      }
    }
  }
}

function isErrorType(type: Type): type is ErrorType {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}
