import { inspect } from "util";
import { createSymbolTable } from "./binder.js";
import { compilerAssert, ProjectionError } from "./diagnostics.js";
import {
  DecoratorContext,
  ProjectionModelExpressionNode,
  ProjectionModelPropertyNode,
  ProjectionModelSpreadPropertyNode,
} from "./index.js";
import { createDiagnostic, reportDiagnostic } from "./messages.js";
import { hasParseError } from "./parser.js";
import { Program } from "./program.js";
import { createProjectionMembers } from "./projectionMembers.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  ArrayType,
  BooleanLiteralNode,
  BooleanLiteralType,
  CadlScriptNode,
  ContainerNode,
  DecoratorApplication,
  DecoratorExpressionNode,
  DecoratorSymbol,
  EnumMemberNode,
  EnumMemberType,
  EnumStatementNode,
  EnumType,
  ErrorType,
  FunctionSymbol,
  FunctionType,
  IdentifierNode,
  InterfaceStatementNode,
  InterfaceType,
  IntersectionExpressionNode,
  IntrinsicType,
  JsSourceFile,
  LiteralNode,
  LiteralType,
  MemberExpressionNode,
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
  ProjectionArithmeticExpressionNode,
  ProjectionBlockExpressionNode,
  ProjectionCallExpressionNode,
  ProjectionDecoratorReferenceExpressionNode,
  ProjectionEqualityExpressionNode,
  ProjectionExpression,
  ProjectionExpressionStatement,
  ProjectionIfExpressionNode,
  ProjectionInstruction,
  ProjectionLambdaExpressionNode,
  ProjectionMemberExpressionNode,
  ProjectionNode,
  ProjectionRelationalExpressionNode,
  ProjectionStatementItem,
  ProjectionStatementNode,
  ProjectionSymbol,
  ProjectionType,
  ProjectionUnaryExpressionNode,
  ReturnExpressionNode,
  ReturnRecord,
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
  TypeOrReturnRecord,
  TypeReferenceNode,
  TypeSymbol,
  UnionExpressionNode,
  UnionStatementNode,
  UnionType,
  UnionTypeVariant,
  UnionVariantNode,
  UsingSymbol,
} from "./types.js";
import { isArray } from "./util.js";

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
  evalProjection(node: ProjectionNode, target: Type, args: Type[]): Type;
  project(
    target: Type,
    projection: ProjectionNode,
    args?: (Type | string | number | boolean)[]
  ): Type;
  getProjectionInstructions(
    target: Type,
    projection: ProjectionNode,
    args?: (Type | string | number | boolean)[]
  ): ProjectionInstruction[];
  resolveCompletions(node: IdentifierNode): Map<string, CadlCompletionItem>;

  createType<T>(typeDef: T): T & TypePrototype;
  createAndFinishType<U extends Type extends any ? Omit<Type, keyof TypePrototype> : never>(
    typeDef: U
  ): U & TypePrototype;
  finishType<T extends Type>(typeDef: T): T;
  createFunctionType(fn: (...args: Type[]) => Type): FunctionType;
  createLiteralType(value: string, node?: StringLiteralNode): StringLiteralType;
  createLiteralType(value: number, node?: NumericLiteralNode): NumericLiteralType;
  createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteralType;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteralType | NumericLiteralType | BooleanLiteralType;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteralType | NumericLiteralType | BooleanLiteralType;

  errorType: IntrinsicType;
  voidType: IntrinsicType;
  neverType: IntrinsicType;
}

interface TypePrototype {
  projections: ProjectionStatementNode[];
  projectionsByName(name: string): ProjectionStatementNode[];
}

export interface CadlCompletionItem {
  sym: Sym;

  /**
   *  Optional label if different from the text to complete.
   */
  label?: string;
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

export function createChecker(program: Program): Checker {
  let templateInstantiation: Type[] = [];
  let instantiatingTemplate: Node | undefined;
  let currentSymbolId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();
  const mergedSymbols = new Map<Sym, Sym>();
  const typePrototype: TypePrototype = {
    get projections(): ProjectionStatementNode[] {
      return (projectionsByTypeKind.get((this as Type).kind) || []).concat(
        projectionsByType.get(this as Type) || []
      );
    },
    projectionsByName(name: string): ProjectionStatementNode[] {
      return this.projections.filter((p) => p.id.sv === name);
    },
  };
  const globalNamespaceNode = createGlobalNamespaceNode();
  const globalNamespaceType = createGlobalNamespaceType();
  let cadlNamespaceNode: NamespaceStatementNode | undefined;

  const errorType: ErrorType = createType({ kind: "Intrinsic", name: "ErrorType" });
  const voidType = createType({ kind: "Intrinsic", name: "void" } as const);
  const neverType = createType({ kind: "Intrinsic", name: "never" } as const);

  const projectionsByTypeKind = new Map<Type["kind"], ProjectionStatementNode[]>([
    ["Model", []],
    ["Union", []],
    ["Operation", []],
    ["Interface", []],
    ["Enum", []],
  ]);
  const projectionsByType = new Map<Type, ProjectionStatementNode[]>();
  // whether we've checked this specific projection statement before
  // and added it to the various projection maps.
  const processedProjections = new Set<ProjectionStatementNode>();

  // interpreter state
  let currentProjectionDirection: "to" | "from" | undefined;
  let emitInstructions = false;
  let emittedInstructions: ProjectionInstruction[] = [];

  /**
   * Set keeping track of node pending type resolution.
   * Key is the SymId of a node. It can be retrieved with getNodeSymId(node)
   */
  const pendingResolutions = new Set<number>();

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
    initializeCadlIntrinsics();
    for (const file of program.sourceFiles.values()) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, { kind: "using", symbolSource: binding });
      }
    }
  }

  let evalContext: EvalContext | undefined = undefined;

  const checker: Checker = {
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
    resolveCompletions,
    evalProjection: evalProjectionStatement,
    project,
    getProjectionInstructions,
    neverType,
    errorType,
    voidType,
    createType,
    createAndFinishType,
    createFunctionType,
    createLiteralType,
    finishType,
  };

  const projectionMembers = createProjectionMembers(checker);
  return checker;

  function initializeCadlIntrinsics() {
    // a utility function to log strings or numbers
    cadlNamespaceNode!.exports!.set("log", {
      kind: "function",
      name: "log",
      value(p: Program, str: string): Type {
        program.logger.log({ level: "debug", message: str });
        return voidType;
      },
    });

    // a utility function to dump a type
    cadlNamespaceNode!.exports!.set("inspect", {
      kind: "function",
      name: "inspect",
      value(p: Program, arg: Type): Type {
        program.logger.log({ level: "debug", message: inspect(arg) });
        return voidType;
      },
    });
  }

  function mergeJsSourceFile(file: JsSourceFile) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function mergeCadlSourceFile(file: CadlScriptNode) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function setUsingsForFile(file: CadlScriptNode) {
    const usedUsing = new Set<Sym>();

    for (const using of file.usings) {
      const parentNs = using.parent! as NamespaceStatementNode | CadlScriptNode;
      const sym = resolveTypeReference(using.name);
      if (!sym) {
        continue;
      }
      if (sym.kind === "decorator" || sym.kind === "function" || sym.kind === "projection") {
        program.reportDiagnostic(
          createDiagnostic({ code: "using-invalid-ref", messageId: sym.kind, target: using })
        );
        continue;
      }

      if (sym.node.kind !== SyntaxKind.NamespaceStatement) {
        program.reportDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: using }));
        continue;
      }

      const namespaceSym = getMergedSymbol(sym)!;
      if (usedUsing.has(namespaceSym)) {
        reportDiagnostic(program, {
          code: "duplicate-using",
          format: { usingName: memberExpressionToString(using.name) },
          target: using,
        });
        continue;
      }
      usedUsing.add(namespaceSym);

      for (const [name, binding] of sym.node.exports!) {
        parentNs.locals!.set(name, { kind: "using", symbolSource: binding });
      }
    }

    if (cadlNamespaceNode) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, { kind: "using", symbolSource: binding });
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
      case SyntaxKind.ProjectionStatement:
        return checkProjectionDeclaration(node);
      case SyntaxKind.VoidKeyword:
        return voidType;
      case SyntaxKind.NeverKeyword:
        return neverType;
    }

    // we don't emit an error here as we blindly call this function
    // with any node type, but some nodes don't produce a type
    // (e.g. imports). errorType should result in an error if it
    // bubbles out somewhere its not supposed to be.
    return errorType;
  }

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case "Model":
        return getModelName(type);
      case "Enum":
        return getEnumName(type);
      case "Union":
        return type.name || type.options.map(getTypeName).join(" | ");
      case "UnionVariant":
        return getTypeName(type.type);
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

  /**
   * Return a fully qualified id of node
   */
  function getNodeSymId(
    node: ModelStatementNode | AliasStatementNode | InterfaceStatementNode | UnionStatementNode
  ): number {
    return node.symbol?.id!;
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

    return createAndFinishType({
      kind: "TemplateParameter",
      node: node,
    });
  }

  function checkTypeReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode
  ): Type {
    const sym = resolveTypeReference(node);
    if (!sym) {
      return errorType;
    }
    return checkTypeReferenceSymbol(sym, node);
  }

  function checkTypeReferenceSymbol(
    sym: TypeSymbol | DecoratorSymbol | FunctionSymbol | ProjectionSymbol,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode
  ): Type {
    if (sym.kind === "decorator") {
      program.reportDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "decorator", target: sym })
      );

      return errorType;
    }

    if (sym.kind === "function") {
      program.reportDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "function", target: sym })
      );

      return errorType;
    }

    const symbolLinks = getSymbolLinks(sym);
    let baseType;
    let args = node.kind === SyntaxKind.TypeReference ? node.arguments.map(getTypeForNode) : [];
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
          baseType = symbolLinks.declaredType;
        } else {
          baseType =
            sym.node.kind === SyntaxKind.ModelStatement
              ? checkModelStatement(sym.node)
              : sym.node.kind === SyntaxKind.AliasStatement
              ? checkAlias(sym.node)
              : sym.node.kind === SyntaxKind.InterfaceStatement
              ? checkInterface(sym.node)
              : checkUnion(sym.node);
        }
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
        baseType = instantiateTemplate(sym.node, args);
      }
    } else {
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
        // TODO: could cache this probably.
        baseType = checkTemplateParameterDeclaration(sym.node);
      } else if (symbolLinks.type) {
        // Have a cached type for non-declarations
        baseType = symbolLinks.type;
      } else {
        // don't have a cached type for this symbol, so go grab it and cache it
        baseType = getTypeForNode(sym.node);
        symbolLinks.type = baseType;
      }
    }

    return baseType;
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

    const type =
      symbolLinks.declaredType && oldTemplate === templateNode
        ? symbolLinks.declaredType
        : getTypeForNode(templateNode);

    symbolLinks.instantiations!.set(args, type);
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    const variants: [string | Symbol, UnionTypeVariant][] = node.options.flatMap((o) => {
      const type = getTypeForNode(o);

      // The type `A | never` is just `A`
      if (type === neverType) {
        return [];
      }
      if (type.kind === "Union" && type.expression) {
        return Array.from(type.variants.entries());
      }
      const variant: UnionTypeVariant = createType({
        kind: "UnionVariant",
        type,
        name: Symbol(),
        decorators: [],
        node: undefined,
      });

      return [[variant.name, variant]];
    });

    const type: UnionType = createAndFinishType({
      kind: "Union",
      node,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: true,
      variants: new Map(variants),
      decorators: [],
    });

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

        const newPropType = finishType({
          ...prop,
          sourceProperty: prop,
        });

        properties.set(prop.name, newPropType);
      }
    }

    const intersection = createAndFinishType({
      kind: "Model",
      node,
      name: "",
      properties: properties,
      decorators: [], // could probably include both sets of decorators here...
    });

    return intersection;
  }

  function checkArrayExpression(node: ArrayExpressionNode): ArrayType {
    return createAndFinishType({
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

    if (isArray(node.statements)) {
      node.statements.forEach(getTypeForNode);
    } else if (node.statements) {
      const subNs = checkNamespace(node.statements);
      type.namespaces.set(subNs.name, subNs);
    }
    return type;
  }

  function initializeTypeForNamespace(node: NamespaceStatementNode) {
    compilerAssert(node.symbol, "Namespace is unbound.", node);
    const mergedSymbol = getMergedSymbol(node.symbol) as TypeSymbol;
    const symbolLinks = getSymbolLinks(mergedSymbol as TypeSymbol);
    if (!symbolLinks.type) {
      // haven't seen this namespace before
      const namespace = getParentNamespaceType(node);
      const name = node.name.sv;
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
        enums: new Map(),
        decorators: [],
      });

      symbolLinks.type = type;
      if (mergedSymbol.merged) {
        for (const sourceNode of mergedSymbol.nodes!) {
          type.decorators = type.decorators.concat(
            checkDecorators(sourceNode as NamespaceStatementNode)
          );
        }
      } else {
        type.decorators = checkDecorators(node);
      }

      finishType(type);

      namespace?.namespaces.set(name, type);
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
    // we leave namespaces for interface members as undefined
    if (!node.namespaceSymbol) {
      if (
        node.kind === SyntaxKind.OperationStatement &&
        node.parent &&
        node.parent.kind === SyntaxKind.InterfaceStatement
      ) {
        return undefined;
      }
      return globalNamespaceType;
    }

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

  function checkOperation(
    node: OperationStatementNode,
    parentInterface?: InterfaceType
  ): OperationType {
    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    const decorators = checkDecorators(node);
    const type: OperationType = createType({
      kind: "Operation",
      name,
      namespace,
      node,
      parameters: getTypeForNode(node.parameters) as ModelType,
      returnType: getTypeForNode(node.returnType),
      decorators,
      interface: parentInterface,
    });

    type.parameters.namespace = namespace;

    if (node.parent!.kind === SyntaxKind.InterfaceStatement) {
      if (shouldCreateTypeForTemplate(node.parent!)) {
        finishType(type);
      }
    } else {
      finishType(type);
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
    return createAndFinishType({
      kind: "Tuple",
      node: node,
      values: node.values.map((v) => getTypeForNode(v)),
    });
  }

  function getSymbolLinks(s: TypeSymbol | ProjectionSymbol): SymbolLinks {
    const id = getSymbolId(s);

    if (symbolLinks.has(id)) {
      return symbolLinks.get(id)!;
    }

    const links = {};
    symbolLinks.set(id, links);

    return links;
  }

  function getSymbolId(s: TypeSymbol | ProjectionSymbol) {
    if (s.id === undefined) {
      s.id = currentSymbolId++;
    }

    return s.id;
  }

  function resolveIdentifierInTable<T extends Sym>(
    node: IdentifierNode,
    table: SymbolTable<T> | undefined,
    resolveDecorator = false
  ): T | undefined {
    if (!table) {
      return undefined;
    }
    let sym;
    if (resolveDecorator) {
      sym = table.get("@" + node.sv);
    } else {
      sym = table.get(node.sv);
    }

    if (!sym) return sym;

    if ("duplicate" in sym && sym.duplicate) {
      reportAmbiguousIdentifier(node, [...((table.duplicates.get(sym) as any) ?? [])]);
      return sym;
    }
    return getMergedSymbol(sym);
  }

  function reportAmbiguousIdentifier(node: IdentifierNode, symbols: UsingSymbol[]) {
    const duplicateNames = symbols
      .map((x) => {
        const namespace =
          x.symbolSource.kind == "type" || x.symbolSource.kind === "projection"
            ? getNamespaceString((getTypeForNode(x.symbolSource.node) as any).namespace)
            : (x.symbolSource.value as any).namespace;
        return `${namespace}.${node.sv}`;
      })
      .join(", ");
    program.reportDiagnostic(
      createDiagnostic({
        code: "ambiguous-symbol",
        format: { name: node.sv, duplicateNames },
        target: node,
      })
    );
  }

  function resolveCompletions(identifier: IdentifierNode): Map<string, CadlCompletionItem> {
    const completions = new Map<string, CadlCompletionItem>();

    // If first non-MemberExpression parent of identifier is a TypeReference
    // or DecoratorExpression, then we can complete it.
    const parent = findFirstNonMemberExpressionParent(identifier);
    const resolveDecorator = parent.kind === SyntaxKind.DecoratorExpression;
    if (parent.kind !== SyntaxKind.TypeReference && !resolveDecorator) {
      return completions;
    }

    if (identifier.parent && identifier.parent.kind === SyntaxKind.MemberExpression) {
      const base = resolveTypeReference(identifier.parent.base, resolveDecorator);
      if (base && base.kind === "type" && base.node.kind === SyntaxKind.NamespaceStatement) {
        addCompletions(base.node.exports);
      }
    } else {
      let scope: Node | undefined = identifier.parent;
      while (scope && scope.kind !== SyntaxKind.CadlScript) {
        if ("exports" in scope) {
          const mergedSymbol = getMergedSymbol(scope.symbol) as TypeSymbol;
          addCompletions((mergedSymbol.node as ContainerNode).exports);
        }
        if ("locals" in scope) {
          addCompletions(scope.locals);
        }
        scope = scope.parent;
      }

      if (scope && scope.kind === SyntaxKind.CadlScript) {
        // check any blockless namespace decls
        for (const ns of scope.inScopeNamespaces) {
          const mergedSymbol = getMergedSymbol(ns.symbol) as TypeSymbol;
          addCompletions((mergedSymbol.node as ContainerNode).exports);
        }

        // check "global scope" declarations
        addCompletions(globalNamespaceNode.exports);

        // check "global scope" usings
        addCompletions(scope.locals);
      }
    }

    return completions;

    function findFirstNonMemberExpressionParent(identifier: IdentifierNode) {
      for (let node = identifier.parent; node; node = node.parent) {
        if (node.kind !== SyntaxKind.MemberExpression) {
          return node;
        }
      }

      compilerAssert(
        false,
        "Shouldn't have an identifier with only member expression parents all the way to the root.",
        identifier
      );
    }

    function addCompletions(table: SymbolTable<Sym> | undefined) {
      if (!table) {
        return;
      }
      for (let [key, sym] of table) {
        if (resolveDecorator !== key.startsWith("@")) {
          continue;
        }
        if (resolveDecorator) {
          key = key.slice(1);
        }
        if (!completions.has(key)) {
          // TODO? should complete propose different options and use fqn?

          if (sym.kind === "using" && sym.duplicate) {
            const duplicates = table.duplicates.get(sym)!;
            for (const duplicate of duplicates) {
              if (duplicate.kind !== "using") {
                continue;
              }
              const namespace =
                duplicate.symbolSource.kind === "type" ||
                duplicate.symbolSource.kind === "projection"
                  ? getNamespaceString(
                      (getTypeForNode(duplicate.symbolSource.node) as any).namespace
                    )
                  : (duplicate.symbolSource.value as any).namespace;
              const fqn = `${namespace}.${key}`;
              completions.set(fqn, { sym: duplicate });
            }
          } else {
            completions.set(key, { sym });
          }
        }
      }
    }
  }

  function resolveIdentifier(node: IdentifierNode, resolveDecorator = false): Sym | undefined {
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
          (mergedSymbol.node as ContainerNode).exports,
          resolveDecorator
        );

        if (binding) return binding;
      }

      if ("locals" in scope) {
        if ("duplicates" in scope.locals!) {
          binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
        } else {
          binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
        }

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
          (mergedSymbol.node as ContainerNode).exports,
          resolveDecorator
        );

        if (binding) return binding;
      }

      // check "global scope" declarations
      binding = resolveIdentifierInTable(node, globalNamespaceNode.exports, resolveDecorator);

      if (binding) return binding;

      // check using types
      binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
      if (binding) return binding.kind === "using" && binding.duplicate ? undefined : binding;
    }

    program.reportDiagnostic(
      createDiagnostic({ code: "unknown-identifier", format: { id: node.sv }, target: node })
    );
    return undefined;
  }

  function resolveTypeReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    resolveDecorator = false
  ): DecoratorSymbol | TypeSymbol | ProjectionSymbol | FunctionSymbol | undefined {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node.target, resolveDecorator);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      const base = resolveTypeReference(node.base);
      if (!base) {
        return undefined;
      }
      if (base.kind === "type" && base.node.kind === SyntaxKind.NamespaceStatement) {
        const symbol = resolveIdentifierInTable(node.id, base.node.exports, resolveDecorator);
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
      } else if (base.kind === "function") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "node",
            format: { id: node.id.sv, nodeName: "function" },
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
      const sym = resolveIdentifier(node, resolveDecorator);
      return sym?.kind === "using" ? sym.symbolSource : sym;
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
    program.reportDuplicateSymbols(globalNamespaceNode.exports);
    for (const file of program.sourceFiles.values()) {
      for (const ns of file.namespaces) {
        program.reportDuplicateSymbols(ns.exports);
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
    const decorators: DecoratorApplication[] = [];

    const type: ModelType = createType({
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties: new Map<string, ModelTypeProperty>(),
      namespace: getParentNamespaceType(node),
      decorators,
    });

    if (!instantiatingThisTemplate) {
      links.declaredType = type;
    }
    const isBase = checkModelIs(node, node.is);

    if (isBase) {
      // copy decorators
      decorators.push(...isBase.decorators);
    }
    decorators.push(...checkDecorators(node));

    if (isBase) {
      for (const prop of isBase.properties.values()) {
        type.properties.set(
          prop.name,
          finishType({
            ...prop,
          })
        );
      }
    }

    if (isBase) {
      type.baseModel = isBase.baseModel;
    } else if (node.extends) {
      type.baseModel = checkClassHeritage(node, node.extends);
    }

    // Hold on to the model type that's being defined so that it
    // can be referenced
    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
      type.namespace?.models.set(type.name, type);
    }

    const inheritedPropNames = new Set(
      Array.from(walkPropertiesInherited(type)).map((v) => v.name)
    );

    // Evaluate the properties after
    checkModelProperties(node, type.properties, inheritedPropNames);

    if (shouldCreateTypeForTemplate(node)) {
      finishType(type);
    }

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
    const type: ModelType = createAndFinishType({
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

  function checkClassHeritage(
    model: ModelStatementNode,
    heritageRef: TypeReferenceNode
  ): ModelType | undefined {
    const modelSymId = getNodeSymId(model);
    pendingResolutions.add(modelSymId);

    const target = resolveTypeReference(heritageRef) as TypeSymbol;
    if (target === undefined) {
      return undefined;
    }
    if (pendingResolutions.has(getNodeSymId(target.node as any))) {
      reportDiagnostic(program, {
        code: "circular-base-type",
        format: { typeName: (target.node as any).id.sv },
        target: target,
      });
      return undefined;
    }
    const heritageType = checkTypeReferenceSymbol(target, heritageRef);
    pendingResolutions.delete(modelSymId);
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

  function checkModelIs(
    model: ModelStatementNode,
    isExpr: TypeReferenceNode | undefined
  ): ModelType | undefined {
    if (!isExpr) return undefined;
    const modelSymId = getNodeSymId(model);
    pendingResolutions.add(modelSymId);
    const target = resolveTypeReference(isExpr) as TypeSymbol;
    if (target === undefined) {
      return undefined;
    }
    if (pendingResolutions.has(getNodeSymId(target.node as any))) {
      reportDiagnostic(program, {
        code: "circular-base-type",
        format: { typeName: (target.node as any).id.sv },
        target: target,
      });
      return undefined;
    }
    const isType = checkTypeReferenceSymbol(target, isExpr);
    pendingResolutions.delete(modelSymId);

    if (isType.kind !== "Model") {
      program.reportDiagnostic(createDiagnostic({ code: "is-model", target: isExpr }));
      return;
    }

    return isType;
  }

  function checkSpreadProperty(targetNode: TypeReferenceNode): ModelTypeProperty[] {
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

    let type: ModelTypeProperty = createType({
      kind: "ModelProperty",
      name,
      node: prop,
      optional: prop.optional,
      type: valueType,
      decorators,
      default: defaultValue,
    });

    const parentModel = prop.parent! as
      | ModelStatementNode
      | ModelExpressionNode
      | OperationStatementNode;
    if (
      parentModel.kind !== SyntaxKind.ModelStatement ||
      shouldCreateTypeForTemplate(parentModel)
    ) {
      finishType(type);
    }

    return type;
  }

  function checkDefault(defaultType: Type, type: Type): Type {
    switch (type.kind) {
      case "Model":
        return checkDefaultForModelType(defaultType, type);
      case "Array":
        return checkDefaultForArrayType(defaultType, type);
      case "Union":
        return checkDefaultForUnionType(defaultType, type);
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

  function checkDefaultForUnionType(defaultType: Type, type: UnionType): Type {
    for (const option of type.options) {
      if (option.kind === defaultType.kind) {
        switch (defaultType.kind) {
          case "String":
            if (defaultType.value === (option as StringLiteralType).value) {
              return defaultType;
            }
          case "Number":
            if (defaultType.value === (option as NumericLiteralType).value) {
              return defaultType;
            }
        }
      }
    }

    // Didn't find any compatible options
    program.reportDiagnostic(
      createDiagnostic({
        code: "unassignable",
        format: { value: getTypeName(defaultType), targetType: getTypeName(type) },
        target: defaultType,
      })
    );
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

  function checkDecorators(node: { decorators: readonly DecoratorExpressionNode[] }) {
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
        node: decNode,
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

    const aliasSymId = getNodeSymId(node);
    if (pendingResolutions.has(aliasSymId)) {
      reportDiagnostic(program, {
        code: "circular-alias-type",
        format: { typeName: node.id.sv },
        target: node,
      });
      return errorType;
    }

    pendingResolutions.add(aliasSymId);
    const type = getTypeForNode(node.value);
    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
    }
    pendingResolutions.delete(aliasSymId);

    return type;
  }

  function checkEnum(node: EnumStatementNode): Type {
    const links = getSymbolLinks(node.symbol!);
    if (!links.type) {
      const decorators = checkDecorators(node);
      const enumType: EnumType = (links.type = createType({
        kind: "Enum",
        name: node.id.sv,
        node,
        members: [],
        namespace: getParentNamespaceType(node),
        decorators,
      }));
      enumType.namespace?.enums.set(enumType.name!, enumType);
      const memberNames = new Set<string>();

      for (const member of node.members) {
        const memberType = checkEnumMember(enumType, member, memberNames);
        if (memberType) {
          memberNames.add(memberType.name);
          enumType.members.push(memberType);
        }
      }

      finishType(enumType);
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

    const interfaceType: InterfaceType = createType({
      kind: "Interface",
      decorators,
      node,
      namespace: getParentNamespaceType(node),
      operations: new Map(),
      name: node.id.sv,
    });

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

        interfaceType.operations.set(
          newMember.name,
          cloneType(newMember, { interface: interfaceType })
        );
      }
    }

    const ownMembers = new Map<string, OperationType>();

    checkInterfaceMembers(node, ownMembers, interfaceType);

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
      finishType(interfaceType);
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
    members: Map<string, OperationType>,
    interfaceType: InterfaceType
  ) {
    for (const opNode of node.operations) {
      const opType = checkOperation(opNode, interfaceType);
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
    const unionType: UnionType = createType({
      kind: "Union",
      decorators,
      node,
      namespace: getParentNamespaceType(node),
      name: node.id.sv,
      variants,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: false,
    });

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      finishType(unionType);
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
    return createAndFinishType({
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
    return createAndFinishType({
      kind: "EnumMember",
      enum: parentEnum,
      name,
      node,
      value,
      decorators,
    });
  }

  // the types here aren't ideal and could probably be refactored.

  function createAndFinishType<
    U extends Type extends any ? Omit<Type, keyof typeof typePrototype> : never
  >(typeDef: U): U & typeof typePrototype {
    createType(typeDef);
    return finishType(typeDef as any) as any;
  }

  /**
   * Given the own-properties of a type, returns a fully-initialized type.
   * So far, that amounts to setting the prototype to typePrototype which
   * contains the `projections` getter.
   */
  function createType<T>(typeDef: T): T & TypePrototype {
    Object.setPrototypeOf(typeDef, typePrototype);
    return typeDef as any;
  }

  function finishType<T extends Type>(typeDef: T): T {
    (typeDef as any).templateArguments = templateInstantiation;

    if ("decorators" in typeDef) {
      for (const decApp of typeDef.decorators) {
        applyDecoratorToType(decApp, typeDef);
      }
    }

    Object.setPrototypeOf(typeDef, typePrototype);

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
      const context: DecoratorContext = { program };
      fn(context, target, ...decApp.args);
    } catch (error: any) {
      // do not fail the language server for exceptions in decorators
      if (program.compilerOptions.designTimeBuild) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "decorator-fail",
            format: { decoratorName: decApp.decorator.name, error: error.stack },
            target: decApp.node ?? target,
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
    return createLiteralType(node.value, node);
  }

  function mergeSymbolTable(source: SymbolTable<Sym>, target: SymbolTable<Sym>) {
    for (const [sym, duplicates] of source.duplicates) {
      const targetSet = target.duplicates.get(sym);
      if (targetSet === undefined) {
        target.duplicates.set(sym, new Set([...duplicates]));
      } else {
        for (const duplicate of duplicates) {
          targetSet.add(duplicate);
        }
      }
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
            merged: sourceBinding.merged,
            nodes: sourceBinding.nodes,
          };
          target.set(key, existingBinding);
          mergedSymbols.set(sourceBinding, existingBinding);
        } else if (
          existingBinding.kind === "type" &&
          existingBinding.node.kind === SyntaxKind.NamespaceStatement
        ) {
          if (!existingBinding.merged) {
            // promote the binding to a merged symbol
            existingBinding.merged = true;
            existingBinding.nodes = [existingBinding.node];
          }
          mergedSymbols.set(sourceBinding, existingBinding);
          existingBinding.nodes!.push(sourceBinding.node);
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

  function getMergedSymbol<T extends Sym>(sym: T | undefined): T | undefined {
    if (!sym) return sym;
    return mergedSymbols.get(sym) || (sym as any);
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
      symbol: undefined as any,
      locals: createSymbolTable(),
      exports: createSymbolTable(),
    };
  }

  function createGlobalNamespaceType() {
    return createAndFinishType({
      kind: "Namespace",
      name: "",
      node: globalNamespaceNode,
      models: new Map(),
      operations: new Map(),
      namespaces: new Map(),
      interfaces: new Map(),
      unions: new Map(),
      enums: new Map(),
      decorators: [],
    });
  }

  /**
   * Clone a type, resulting in an identical type with all the same decorators
   * applied. Decorators are re-run on the clone to achieve this.
   *
   * Care is taken to clone nested data structures that are part of the type.
   * Any type with e.g. a map or an array property must recreate the map or array
   * so that clones don't share the same object.
   *
   * For types which have sub-types that are part of it, e.g. enums with members,
   * unions with variants, or models with properties, the sub-types are cloned
   * as well.
   *
   * If the entire type graph needs to be cloned, then cloneType must be called
   * recursively by the caller.
   */
  function cloneType<T extends Type>(type: T, additionalProps: { [P in keyof T]?: T[P] } = {}): T {
    // TODO: this needs to handle other types
    let clone;
    switch (type.kind) {
      case "Model":
        clone = finishType({
          ...type,
          properties: additionalProps.hasOwnProperty("properties")
            ? undefined
            : new Map(
                Array.from(type.properties.entries()).map(([key, prop]) => [key, cloneType(prop)])
              ),
          ...additionalProps,
        });
        break;
      case "Union":
        clone = finishType({
          ...type,
          variants: new Map<string | Symbol, UnionTypeVariant>(
            Array.from(type.variants.entries()).map(([key, prop]) => [
              key,
              prop.kind === "UnionVariant" ? cloneType(prop) : prop,
            ])
          ),
          get options() {
            return Array.from(this.variants.values()).map((v: any) => v.type);
          },
          ...additionalProps,
        });
        break;
      case "Interface":
        clone = finishType({
          ...type,
          operations: new Map(type.operations.entries()),
          ...additionalProps,
        });
        break;
      case "Enum":
        clone = finishType({
          ...type,
          members: type.members.map((v) => cloneType(v)),
          ...additionalProps,
        });
        break;
      default:
        clone = finishType({
          ...type,
          ...additionalProps,
        });
    }

    const projection = projectionsByType.get(type);
    if (projection) {
      projectionsByType.set(clone, projection);
    }

    return clone;
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

  function checkProjectionDeclaration(node: ProjectionStatementNode): Type {
    // todo: check for duplicate projection decls on individual types
    // right now you can declare the same projection on a specific type
    // this could maybe go in the binder? But right now we don't know
    // what an identifier resolves to until check time.
    const links = getSymbolLinks(node.symbol!);
    if (processedProjections.has(node)) {
      return links.declaredType!;
    }
    processedProjections.add(node);
    program.reportDiagnostic(
      createDiagnostic({ code: "projections-are-experimental", target: node })
    );

    let type;

    if (links.declaredType) {
      type = links.declaredType as ProjectionType;
    } else {
      type = links.declaredType = createType({
        kind: "Projection",
        node: undefined,
        nodeByKind: new Map(),
        nodeByType: new Map(),
      });
    }

    switch (node.selector.kind) {
      case SyntaxKind.ProjectionModelSelector:
        projectionsByTypeKind.get("Model")!.push(node);
        type.nodeByKind.set("Model", node);
        break;
      case SyntaxKind.ProjectionOperationSelector:
        projectionsByTypeKind.get("Operation")!.push(node);
        type.nodeByKind.set("Operation", node);
        break;
      case SyntaxKind.ProjectionUnionSelector:
        projectionsByTypeKind.get("Union")!.push(node);
        type.nodeByKind.set("Union", node);
        break;
      case SyntaxKind.ProjectionInterfaceSelector:
        projectionsByTypeKind.get("Interface")!.push(node);
        type.nodeByKind.set("Interface", node);
        break;
      case SyntaxKind.ProjectionEnumSelector:
        projectionsByTypeKind.get("Enum")!.push(node);
        type.nodeByKind.set("Enum", node);
        break;
      default:
        const projected = checkTypeReference(node.selector);
        let current = projectionsByType.get(projected);
        if (!current) {
          current = [];
          projectionsByType.set(projected, current);
        }
        current.push(node);
        type.nodeByType.set(projected, node);
        break;
    }

    return type;
  }

  function evalProjectionNode(
    node: ProjectionExpression | ProjectionStatementItem
  ): TypeOrReturnRecord {
    switch (node.kind) {
      case SyntaxKind.ProjectionExpressionStatement:
        return evalProjectionExpressionStatement(node);
      case SyntaxKind.ProjectionCallExpression:
        return evalProjectionCallExpression(node);
      case SyntaxKind.ProjectionMemberExpression:
        return evalProjectionMemberExpression(node);
      case SyntaxKind.ProjectionDecoratorReferenceExpression:
        return evalProjectionDecoratorReference(node);
      case SyntaxKind.Identifier:
        return evalProjectionIdentifier(node);
      case SyntaxKind.ProjectionLambdaExpression:
        return evalProjectionLambdaExpression(node);
      case SyntaxKind.StringLiteral:
        return evalStringLiteral(node);
      case SyntaxKind.NumericLiteral:
        return evalNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return evalBooleanLiteral(node);
      case SyntaxKind.ProjectionBlockExpression:
        return evalProjectionBlockExpression(node);
      case SyntaxKind.ProjectionArithmeticExpression:
        return evalProjectionArithmeticExpression(node);
      case SyntaxKind.ProjectionIfExpression:
        return evalProjectionIfExpression(node);
      case SyntaxKind.ProjectionEqualityExpression:
        return evalProjectionEqualityExpression(node);
      case SyntaxKind.ProjectionUnaryExpression:
        return evalProjectionUnaryExpression(node);
      case SyntaxKind.ProjectionRelationalExpression:
        return evalProjectionRelationalExpression(node);
      case SyntaxKind.ProjectionModelExpression:
        return evalProjectionModelExpression(node);
      case SyntaxKind.VoidKeyword:
        return voidType;
      case SyntaxKind.NeverKeyword:
        return neverType;
      case SyntaxKind.Return:
        return evalReturnKeyword(node);
      default:
        compilerAssert(false, `Can't eval the node ${SyntaxKind[node.kind]}`);
    }
  }

  interface EvalContext {
    node: Node;
    locals: Map<string, Type>;
    parent?: EvalContext;
  }

  function evalReturnKeyword(node: ReturnExpressionNode): ReturnRecord {
    const value = evalProjectionNode(node.value);
    if (value.kind === "Return") {
      return value;
    }

    return {
      kind: "Return",
      value,
    };
  }

  function evalProjectionModelExpression(node: ProjectionModelExpressionNode): TypeOrReturnRecord {
    const modelType: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      decorators: [],
      properties: new Map(),
    });

    for (const propNode of node.properties) {
      if (propNode.kind === SyntaxKind.ProjectionModelProperty) {
        const prop = evalProjectionModelProperty(propNode);
        if (prop.kind === "Return") {
          return prop;
        }
        modelType.properties.set(prop.name, prop);
      } else {
        const props = evalProjectionModelSpreadProperty(propNode);
        if (!Array.isArray(props)) {
          // return record
          return props;
        }

        for (const newProp of props) {
          modelType.properties.set(newProp.name, newProp);
        }
      }
    }

    return modelType;
  }

  function evalProjectionModelProperty(
    node: ProjectionModelPropertyNode
  ): ModelTypeProperty | ReturnRecord {
    const type = evalProjectionNode(node.value);
    if (type.kind === "Return") {
      return type;
    }

    return createType({
      kind: "ModelProperty",
      name: node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value,
      node: node,
      decorators: [],
      optional: node.optional,
      type,
    });
  }

  function evalProjectionModelSpreadProperty(
    node: ProjectionModelSpreadPropertyNode
  ): ModelTypeProperty[] | ReturnRecord {
    const target = evalProjectionNode(node.target);
    if (target.kind === "Return") {
      return target;
    }

    if (target.kind !== "Model") {
      throw new ProjectionError(`Can only spread models`);
    }
    const props = [];
    // copy each property
    for (const prop of walkPropertiesInherited(target)) {
      const newProp = cloneType(prop, { sourceProperty: prop });
      props.push(newProp);
    }

    return props;
  }

  function evalProjectionRelationalExpression(
    node: ProjectionRelationalExpressionNode
  ): TypeOrReturnRecord {
    const left = evalProjectionNode(node.left);
    if (left.kind === "Return") {
      return left;
    } else if (left.kind !== "Number" && left.kind !== "String") {
      throw new ProjectionError("Can only compare numbers or strings");
    }

    const right = evalProjectionNode(node.right);
    if (right.kind === "Return") {
      return right;
    } else if (right.kind !== "Number" && right.kind !== "String") {
      throw new ProjectionError("Can only compare numbers or strings");
    }

    if (left.kind !== right.kind) {
      throw new ProjectionError("Can't compare numbers and strings");
    }

    switch (node.op) {
      case "<":
        return createLiteralType(left.value < right.value);
      case "<=":
        return createLiteralType(left.value <= right.value);
      case ">":
        return createLiteralType(left.value > right.value);
      case ">=":
        return createLiteralType(left.value >= right.value);
    }
  }

  function evalProjectionUnaryExpression(node: ProjectionUnaryExpressionNode): TypeOrReturnRecord {
    const target = evalProjectionNode(node.target);
    if (target.kind !== "Boolean") {
      throw new ProjectionError("Can't negate a non-boolean");
    }

    switch (node.op) {
      case "!":
        return createLiteralType(!target.value);
    }
  }
  function evalProjectionEqualityExpression(
    node: ProjectionEqualityExpressionNode
  ): TypeOrReturnRecord {
    const left = evalProjectionNode(node.left);
    if (left.kind === "Return") {
      return left;
    } else if (left.kind !== "Number" && left.kind !== "String") {
      throw new ProjectionError("Comparisons must be strings or numbers");
    }

    const right = evalProjectionNode(node.right);
    if (right.kind === "Return") {
      return right;
    } else if (right.kind !== "Number" && right.kind !== "String") {
      throw new ProjectionError("Comparisons must be strings or numbers");
    }

    if (right.kind !== left.kind) {
      throw new ProjectionError("Can't compare number and string");
    }

    switch (node.op) {
      case "==":
        return createLiteralType(left.value === right.value);
      case "!=":
        return createLiteralType(left.value !== right.value);
    }
  }

  function evalProjectionIfExpression(node: ProjectionIfExpressionNode): TypeOrReturnRecord {
    let ifExpr: ProjectionIfExpressionNode | undefined = node;
    while (ifExpr) {
      const test = evalProjectionNode(ifExpr.test);
      if (test.kind === "Return") {
        return test;
      }

      if (typeIsTruthy(test)) {
        return evalProjectionBlockExpression(ifExpr.consequent);
      } else if (
        ifExpr.alternate &&
        ifExpr.alternate.kind === SyntaxKind.ProjectionBlockExpression
      ) {
        return evalProjectionBlockExpression(ifExpr.alternate);
      } else {
        ifExpr = ifExpr.alternate;
      }
    }

    return voidType;
  }

  function typeIsTruthy(t: Type) {
    switch (t.kind) {
      case "Boolean":
        return t.value;
      case "Number":
        return !!t.value;
      case "String":
        return !!t.value;
      default:
        return true;
    }
  }

  function createEvalContext(node: Node, parent?: EvalContext): EvalContext {
    return {
      node,
      locals: new Map(),
      parent,
    };
  }

  function evalProjectionBlockExpression(node: ProjectionBlockExpressionNode): TypeOrReturnRecord {
    let lastVal: Type = voidType;
    for (const stmt of node.statements) {
      let stmtValue = evalProjectionNode(stmt);
      if (stmtValue.kind === "Return") {
        return stmtValue;
      }
      lastVal = stmtValue;
    }

    return lastVal;
  }

  function evalProjectionArithmeticExpression(
    node: ProjectionArithmeticExpressionNode
  ): StringLiteralType | NumericLiteralType | ReturnRecord {
    const lhs = evalProjectionNode(node.left);
    if (lhs.kind === "Return") {
      return lhs;
    }

    if (lhs.kind !== "Number" && lhs.kind !== "String") {
      throw new ProjectionError(`Operator ${node.op} can only apply to strings or numbers`);
    }
    const rhs = evalProjectionNode(node.right);
    if (rhs.kind === "Return") {
      return rhs;
    }
    if (rhs.kind !== "Number" && rhs.kind !== "String") {
      throw new ProjectionError(`Operator ${node.op} can only apply to strings or numbers`);
    }

    if (rhs.kind !== lhs.kind) {
      throw new ProjectionError(`Operator ${node.op}'s operands need to be the same type`);
    }

    if (lhs.kind === "String") {
      return createLiteralType((lhs as StringLiteralType).value + (rhs as StringLiteralType).value);
    } else {
      return createLiteralType(
        (lhs as NumericLiteralType).value + (rhs as NumericLiteralType).value
      );
    }
  }

  function evalProjectionStatement(node: ProjectionNode, target: Type, args: Type[]): Type {
    let topLevelProjection = false;
    if (!currentProjectionDirection) {
      topLevelProjection = true;
      currentProjectionDirection = node.direction;
    }
    if (currentProjectionDirection === "from" && !target.projectionSource) {
      // this model wasn't projected, so we'll just return the target
      return target;
    }

    const originalContext = evalContext;
    evalContext = createEvalContext(node);
    for (const [i, param] of node.parameters.entries()) {
      if (!args[i]) {
        throw new ProjectionError("need argument for parameter " + node.parameters[i]);
      }

      let argVal = args[i];
      let typeVal;

      if (typeof argVal === "number" || typeof argVal === "string" || typeof argVal === "boolean") {
        typeVal = createLiteralType(argVal);
      } else {
        typeVal = argVal;
      }

      evalContext.locals.set(param.id.sv, typeVal);
    }

    evalContext.locals.set("self", target);
    let lastVal: TypeOrReturnRecord = voidType;
    for (const item of node.body) {
      lastVal = evalProjectionNode(item);
      if (lastVal.kind === "Return") {
        break;
      }
    }

    if (topLevelProjection) {
      currentProjectionDirection = undefined;
    }
    const selfResult = evalContext.locals.get("self")!;
    evalContext = originalContext;

    if (lastVal.kind === "Return") {
      return lastVal.value;
    } else {
      return selfResult;
    }
  }

  function evalProjectionExpressionStatement(node: ProjectionExpressionStatement) {
    return evalProjectionNode(node.expr);
  }

  function evalProjectionCallExpression(node: ProjectionCallExpressionNode) {
    const target = evalProjectionNode(node.target);

    if (!target) throw new ProjectionError("target undefined");
    const args = [];
    for (const arg of node.arguments) {
      args.push(evalProjectionNode(arg));
    }

    if (target.kind !== "Function") {
      throw new ProjectionError("Can't call non-function, got type " + target.kind);
    }

    return target.call(...args);
  }

  function evalProjectionMemberExpression(
    node: ProjectionMemberExpressionNode
  ): TypeOrReturnRecord {
    const base = evalProjectionNode(node.base);
    if (base.kind === "Return") {
      return base;
    }
    const member = node.id.sv;
    const selector = node.selector;

    if (selector === ".") {
      switch (base.kind) {
        case "Namespace":
          const sym = base.node.exports!.get(member) as TypeSymbol;
          if (sym) {
            const links = getSymbolLinks(sym);
            return links.declaredType || links.type || errorType;
          } else {
            throw new ProjectionError(`Namespace doesn't have member ${member}`);
          }
        case "Model":
          const prop = base.properties.get(member);
          if (!prop) {
            throw new ProjectionError(`Model doesn't have property ${member}`);
          }
          return prop;
        case "Enum":
          const enumMember = base.members.find((v) => v.name === member);
          if (!enumMember) {
            throw new ProjectionError(`Enum doesn't have member ${member}`);
          }
          return enumMember;
        case "Union":
          const variant = base.variants.get(member);
          if (!variant) {
            throw new ProjectionError(`Union doesn't have variant ${member}`);
          }
          return variant;
        default:
          throw new ProjectionError(
            `Can't get member "${member}" of type ${base.kind} because it has no members. Did you mean to use "::" instead of "."?`
          );
      }
    }

    switch (base.kind) {
      case "Object":
        return base.properties[member] || errorType;
      default:
        const typeOps = projectionMembers[base.kind];
        if (!typeOps) {
          throw new ProjectionError(
            `${base.kind} doesn't have an object model member named ${member}`
          );
        }
        // any cast needed to ensure we don't get a too complex union error on the call
        // to op further down.
        const op: any = typeOps[member];
        if (!op) {
          throw new ProjectionError(
            `${base.kind} doesn't have an object model member named ${member}`
          );
        }

        return op(base);
    }
  }

  function createFunctionType(fn: (...args: Type[]) => Type): FunctionType {
    return createType({
      kind: "Function",
      call: fn,
    } as const);
  }

  function isLiteralType(
    type: Type
  ): type is StringLiteralType | NumericLiteralType | BooleanLiteralType {
    switch (type.kind) {
      case "String":
      case "Number":
      case "Boolean":
        return true;
      default:
        return false;
    }
  }
  function literalTypeToValue(type: StringLiteralType): string;
  function literalTypeToValue(type: NumericLiteralType): number;
  function literalTypeToValue(type: BooleanLiteralType): boolean;
  function literalTypeToValue(
    type: StringLiteralType | NumericLiteralType | BooleanLiteralType
  ): boolean;
  function literalTypeToValue(
    type: StringLiteralType | NumericLiteralType | BooleanLiteralType
  ): string | number | boolean {
    return type.value;
  }

  function createLiteralType(value: string, node?: StringLiteralNode): StringLiteralType;
  function createLiteralType(value: number, node?: NumericLiteralNode): NumericLiteralType;
  function createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteralType;
  function createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteralType | NumericLiteralType | BooleanLiteralType;
  function createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteralType | NumericLiteralType | BooleanLiteralType {
    if (program.literalTypes.has(value)) {
      return program.literalTypes.get(value)!;
    }
    const kind =
      typeof value === "string" ? "String" : typeof value === "number" ? "Number" : "Boolean";
    const type: StringLiteralType | NumericLiteralType | BooleanLiteralType = createType({
      kind,
      value: value as any,
    });

    program.literalTypes.set(value, type);
    return type;
  }

  function evalProjectionDecoratorReference(
    node: ProjectionDecoratorReferenceExpressionNode
  ): Type {
    const ref = resolveTypeReference(node.target, true);
    if (!ref) throw new ProjectionError("Can't find decorator.");
    compilerAssert(ref.kind === "decorator", "should only resolve decorator symbols");
    return createType({
      kind: "Function",
      call(...args: Type[]): Type {
        let retval = ref.value({ program }, ...marshalProjectionArguments(args));
        return voidType;
      },
    } as const);
  }

  function evalProjectionIdentifier(node: IdentifierNode): Type {
    // first check the eval context

    let currentContext = evalContext;
    while (currentContext) {
      if (currentContext.locals.has(node.sv)) {
        return currentContext.locals.get(node.sv)!;
      }
      currentContext = currentContext.parent;
    }

    // next, resolve outside
    const ref = resolveTypeReference(node);
    if (!ref) throw new ProjectionError("Unknown identifier " + node.sv);

    switch (ref.kind) {
      case "decorator":
        // shouldn't ever resolve a decorator symbol here (without passing
        // true to resolveTypeReference)
        return errorType;
      case "function":
        // TODO: store this in a symbol link probably?
        const t: FunctionType = createType({
          kind: "Function",
          call(...args: Type[]): Type {
            let retval = ref.value(program, ...marshalProjectionArguments(args));
            return marshalProjectionReturn(retval);
          },
        } as const);
        return t;
      case "type":
      case "projection":
        const links = getSymbolLinks(ref);
        compilerAssert(links.declaredType, "Should have checked all types by now");

        return links.declaredType;
    }
  }

  function marshalProjectionArguments(args: Type[]): (Type | number | boolean | string | object)[] {
    return args.map((arg) => {
      if (arg.kind === "Boolean" || arg.kind === "String" || arg.kind === "Number") {
        return literalTypeToValue(arg);
      }
      return arg;
    });
  }

  function marshalProjectionReturn(value: unknown): Type {
    if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
      return createLiteralType(value);
    }

    if (typeof value === "object" && value !== null) {
      if ("kind" in value) {
        return value as Type;
      } else {
        // this could probably be more robust
        return createType({
          kind: "Object",
          properties: value as any,
        });
      }
    }

    throw new ProjectionError("Can't marshal value returned from JS function into cadl");
  }

  function evalProjectionLambdaExpression(node: ProjectionLambdaExpressionNode): FunctionType {
    const type = createType({
      kind: "Function",
      call(...args: Type[]): Type {
        return callLambdaExpression(node, args);
      },
    } as const);

    return type;
  }

  function callLambdaExpression(node: ProjectionLambdaExpressionNode, args: Type[]): Type {
    const originalContext = evalContext;
    evalContext = createEvalContext(node, originalContext);
    for (const [i, param] of node.parameters.entries()) {
      evalContext.locals.set(param.id.sv, args[i]);
    }
    const retval = evalProjectionBlockExpression(node.body);
    evalContext = originalContext;
    if (retval.kind === "Return") {
      return retval.value;
    }
    return retval;
  }

  function evalStringLiteral(node: StringLiteralNode): StringLiteralType {
    return createLiteralType(node.value, node);
  }

  function evalNumericLiteral(node: NumericLiteralNode): NumericLiteralType {
    return createLiteralType(node.value, node);
  }

  function evalBooleanLiteral(node: BooleanLiteralNode): BooleanLiteralType {
    return createLiteralType(node.value, node);
  }

  function project(
    target: Type,
    projection: ProjectionNode,
    args: (Type | boolean | string | number)[] = []
  ) {
    return evalProjectionStatement(projection, target, args.map(marshalProjectionReturn));
  }

  function getProjectionInstructions(target: Type, projection: ProjectionNode, args: Type[] = []) {
    emitInstructions = true;
    project(target, projection, args);
    let instructions = emittedInstructions;
    emitInstructions = false;
    emittedInstructions = [];

    return instructions;
  }

  function memberExpressionToString(expr: IdentifierNode | MemberExpressionNode) {
    let current = expr;
    const parts = [];

    while (current.kind === SyntaxKind.MemberExpression) {
      parts.push(current.id.sv);
      current = current.base;
    }

    parts.push(current.sv);

    return parts.reverse().join(".");
  }
}

function isErrorType(type: Type): type is ErrorType {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}
