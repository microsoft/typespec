import { getDeprecated, getIndexer } from "../lib/decorators.js";
import { createSymbol, createSymbolTable } from "./binder.js";
import { compilerAssert, ProjectionError } from "./diagnostics.js";
import { validateInheritanceDiscriminatedUnions } from "./helpers/discriminator-utils.js";
import { getNamespaceFullName, getTypeName, TypeNameOptions } from "./helpers/index.js";
import { createDiagnostic } from "./messages.js";
import { getIdentifierContext, hasParseError, visitChildren } from "./parser.js";
import { Program, ProjectedProgram } from "./program.js";
import { createProjectionMembers } from "./projection-members.js";
import { getParentTemplateNode, isNeverType, isUnknownType, isVoidType } from "./type-utils.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  AugmentDecoratorStatementNode,
  BooleanLiteral,
  BooleanLiteralNode,
  CadlScriptNode,
  DecoratedType,
  Decorator,
  DecoratorApplication,
  DecoratorArgument,
  DecoratorContext,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  Diagnostic,
  DiagnosticTarget,
  Enum,
  EnumMember,
  EnumMemberNode,
  EnumStatementNode,
  ErrorType,
  Expression,
  FunctionDeclarationStatementNode,
  FunctionParameter,
  FunctionParameterNode,
  FunctionType,
  IdentifierKind,
  IdentifierNode,
  Interface,
  InterfaceStatementNode,
  IntersectionExpressionNode,
  IntrinsicScalarName,
  JsSourceFileNode,
  LiteralNode,
  LiteralType,
  MarshalledValue,
  MemberContainerNode,
  MemberExpressionNode,
  MemberNode,
  MemberType,
  Model,
  ModelExpressionNode,
  ModelIndexer,
  ModelProperty,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  ModifierFlags,
  Namespace,
  NamespaceStatementNode,
  NeverType,
  Node,
  NodeFlags,
  NumericLiteral,
  NumericLiteralNode,
  Operation,
  OperationStatementNode,
  Projection,
  ProjectionArithmeticExpressionNode,
  ProjectionBlockExpressionNode,
  ProjectionCallExpressionNode,
  ProjectionDecoratorReferenceExpressionNode,
  ProjectionEqualityExpressionNode,
  ProjectionExpression,
  ProjectionExpressionStatementNode,
  ProjectionIfExpressionNode,
  ProjectionLambdaExpressionNode,
  ProjectionMemberExpressionNode,
  ProjectionModelExpressionNode,
  ProjectionModelPropertyNode,
  ProjectionModelSpreadPropertyNode,
  ProjectionNode,
  ProjectionRelationalExpressionNode,
  ProjectionStatementItem,
  ProjectionStatementNode,
  ProjectionUnaryExpressionNode,
  ReturnExpressionNode,
  ReturnRecord,
  Scalar,
  ScalarStatementNode,
  StringLiteral,
  StringLiteralNode,
  Sym,
  SymbolFlags,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateableNode,
  TemplateDeclarationNode,
  TemplateParameter,
  TemplateParameterDeclarationNode,
  Tuple,
  TupleExpressionNode,
  Type,
  TypeInstantiationMap,
  TypeOrReturnRecord,
  TypeReferenceNode,
  Union,
  UnionExpressionNode,
  UnionStatementNode,
  UnionVariant,
  UnionVariantNode,
  UnknownType,
  VoidType,
} from "./types.js";
import { isArray, MultiKeyMap, Mutable, mutate } from "./util.js";

export interface Checker {
  typePrototype: TypePrototype;

  getTypeForNode(node: Node): Type;
  setUsingsForFile(file: CadlScriptNode): void;
  checkProgram(): void;
  checkSourceFile(file: CadlScriptNode): void;
  getGlobalNamespaceType(): Namespace;
  getGlobalNamespaceNode(): NamespaceStatementNode;
  getMergedSymbol(sym: Sym | undefined): Sym | undefined;
  mergeSourceFile(file: CadlScriptNode | JsSourceFileNode): void;
  getLiteralType(node: StringLiteralNode): StringLiteral;
  getLiteralType(node: NumericLiteralNode): NumericLiteral;
  getLiteralType(node: BooleanLiteralNode): BooleanLiteral;
  getLiteralType(node: LiteralNode): LiteralType;

  /**
   * @deprecated use `import { getTypeName } from "@cadl-lang/compiler";`
   */
  getTypeName(type: Type, options?: TypeNameOptions): string;

  /**
   * @deprecated use `import { getNamespaceFullName } from "@cadl-lang/compiler";`
   */
  getNamespaceString(type: Namespace | undefined, options?: TypeNameOptions): string;
  cloneType<T extends Type>(type: T, additionalProps?: { [P in keyof T]?: T[P] }): T;
  evalProjection(node: ProjectionNode, target: Type, args: Type[]): Type;
  project(
    target: Type,
    projection: ProjectionNode,
    args?: (Type | string | number | boolean)[]
  ): Type;
  resolveIdentifier(node: IdentifierNode): Sym | undefined;
  resolveCompletions(node: IdentifierNode): Map<string, CadlCompletionItem>;
  createType<T>(typeDef: T): T & TypePrototype;
  createAndFinishType<U extends Type extends any ? Omit<Type, keyof TypePrototype> : never>(
    typeDef: U
  ): U & TypePrototype;
  finishType<T extends Type>(typeDef: T): T;
  createFunctionType(fn: (...args: Type[]) => Type): FunctionType;
  createLiteralType(value: string, node?: StringLiteralNode): StringLiteral;
  createLiteralType(value: number, node?: NumericLiteralNode): NumericLiteral;
  createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteral;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteral | NumericLiteral | BooleanLiteral;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteral | NumericLiteral | BooleanLiteral;

  /**
   * Check if the source type can be assigned to the target type.
   * @param source Source type, should be assignable to the target.
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   * @returns [related, list of diagnostics]
   */
  isTypeAssignableTo(
    source: Type,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]];

  /**
   * Check if the given type is one of the built-in standard Cadl Types.
   * @param type Type to check
   * @param stdType If provided check is that standard type
   */
  isStdType(
    type: Scalar,
    stdType?: IntrinsicScalarName
  ): type is Scalar & { name: IntrinsicScalarName };
  isStdType(type: Type, stdType?: StdTypeName): type is Type & { name: StdTypeName };

  /**
   * Std type
   * @param name Name
   */
  getStdType<T extends keyof StdTypes>(name: T): StdTypes[T];

  /**
   * Check and resolve a type for the given type reference node.
   * @param node Node.
   * @returns Resolved type and diagnostics if there was an error.
   */
  resolveTypeReference(node: TypeReferenceNode): [Type | undefined, readonly Diagnostic[]];

  errorType: ErrorType;
  voidType: VoidType;
  neverType: NeverType;
  anyType: UnknownType;
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
 * Maps type arguments to type instantiation.
 */
const TypeInstantiationMap = class
  extends MultiKeyMap<readonly Type[], Type>
  implements TypeInstantiationMap {};

type StdTypeName = IntrinsicScalarName | "Array" | "Record";
type StdTypes = {
  // Models
  Array: Model;
  Record: Model;
} & Record<IntrinsicScalarName, Scalar>;
type ReflectionTypeName = keyof typeof ReflectionNameToKind;

let currentSymbolId = 0;

export function createChecker(program: Program): Checker {
  const stdTypes: Partial<StdTypes> = {};
  const symbolLinks = new Map<number, SymbolLinks>();
  const mergedSymbols = new Map<Sym, Sym>();
  const augmentDecoratorsForSym = new Map<Sym, AugmentDecoratorStatementNode[]>();
  const augmentedSymbolTables = new Map<SymbolTable, SymbolTable>();
  let onCheckerDiagnostic: (diagnostic: Diagnostic) => void = (x: Diagnostic) => {
    program.reportDiagnostic(x);
  };

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
  const unknownType = createType({ kind: "Intrinsic", name: "unknown" } as const);
  const nullType = createType({ kind: "Intrinsic", name: "null" } as const);
  const nullSym = createSymbol(undefined, "null", SymbolFlags.None);

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
  /**
   * Set keeping track of node pending type resolution.
   * Key is the SymId of a node. It can be retrieved with getNodeSymId(node)
   */
  const pendingResolutions = new Set<number>();

  for (const file of program.jsSourceFiles.values()) {
    mergeSourceFile(file);
  }

  for (const file of program.sourceFiles.values()) {
    mergeSourceFile(file);
  }

  for (const file of program.sourceFiles.values()) {
    setUsingsForFile(file);
  }

  const cadlNamespaceBinding = globalNamespaceNode.symbol.exports!.get("Cadl");
  if (cadlNamespaceBinding) {
    // the cadl namespace binding will be absent if we've passed
    // the no-std-lib option.
    // the first declaration here is the JS file for the cadl script.
    cadlNamespaceNode = cadlNamespaceBinding.declarations[1] as NamespaceStatementNode;
    initializeCadlIntrinsics();
    for (const file of program.sourceFiles.values()) {
      addUsingSymbols(cadlNamespaceBinding.exports!, file.locals);
    }
  }

  let evalContext: EvalContext | undefined = undefined;

  const checker: Checker = {
    getTypeForNode,
    checkProgram,
    checkSourceFile,
    getLiteralType,
    getTypeName,
    getNamespaceString: getNamespaceFullName,
    getGlobalNamespaceType,
    getGlobalNamespaceNode,
    setUsingsForFile,
    getMergedSymbol,
    mergeSourceFile,
    cloneType,
    resolveIdentifier,
    resolveCompletions,
    evalProjection: evalProjectionStatement,
    project,
    neverType,
    errorType,
    anyType: unknownType,
    voidType,
    typePrototype,
    createType,
    createAndFinishType,
    createFunctionType,
    createLiteralType,
    finishType,
    isTypeAssignableTo,
    isStdType,
    getStdType,
    resolveTypeReference,
  };

  const projectionMembers = createProjectionMembers(checker);
  return checker;

  function reportCheckerDiagnostic(diagnostic: Diagnostic) {
    onCheckerDiagnostic(diagnostic);
  }
  function reportCheckerDiagnostics(diagnostics: readonly Diagnostic[]) {
    diagnostics.forEach((x) => reportCheckerDiagnostic(x));
  }

  function initializeCadlIntrinsics() {
    // a utility function to log strings or numbers
    mutate(cadlNamespaceBinding!.exports)!.set("log", {
      flags: SymbolFlags.Function,
      name: "log",
      value(p: Program, ...strs: string[]): Type {
        program.trace("projection.log", strs.join(" "));
        return voidType;
      },
      declarations: [],
    });

    // Until we have an `unit` type for `null`
    mutate(cadlNamespaceBinding!.exports).set("null", nullSym);
    mutate(nullSym).type = nullType;
    getSymbolLinks(nullSym).type = nullType;
  }

  function getStdType<T extends keyof StdTypes>(name: T): StdTypes[T] {
    const type = stdTypes[name];
    if (type !== undefined) {
      return type as any;
    }

    const sym = cadlNamespaceBinding?.exports?.get(name);
    if (sym && sym.flags & SymbolFlags.Model) {
      checkModelStatement(sym!.declarations[0] as any, undefined);
    } else {
      checkScalar(sym!.declarations[0] as any, undefined);
    }

    const loadedType = stdTypes[name];
    compilerAssert(
      loadedType,
      `Cadl std type "${name}" should have been initalized before using array syntax.`
    );
    return loadedType as any;
  }

  function mergeSourceFile(file: CadlScriptNode | JsSourceFileNode) {
    mergeSymbolTable(file.symbol.exports!, mutate(globalNamespaceNode.symbol.exports!));
  }

  function setUsingsForFile(file: CadlScriptNode) {
    const usedUsing = new Set<Sym>();

    for (const using of file.usings) {
      const parentNs = using.parent! as NamespaceStatementNode | CadlScriptNode;
      const sym = resolveTypeReferenceSym(using.name, undefined);
      if (!sym) {
        continue;
      }

      if (!(sym.flags & SymbolFlags.Namespace)) {
        reportCheckerDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: using }));
      }

      const namespaceSym = getMergedSymbol(sym)!;

      if (usedUsing.has(namespaceSym)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "duplicate-using",
            format: { usingName: memberExpressionToString(using.name) },
            target: using,
          })
        );
        continue;
      }
      usedUsing.add(namespaceSym);
      addUsingSymbols(sym.exports!, parentNs.locals!);
    }

    if (cadlNamespaceNode) {
      addUsingSymbols(cadlNamespaceBinding!.exports!, file.locals);
    }
  }

  function applyAugmentDecorators(node: CadlScriptNode | NamespaceStatementNode) {
    if (!node.statements || !isArray(node.statements)) {
      return;
    }

    const augmentDecorators = node.statements.filter(
      (x): x is AugmentDecoratorStatementNode => x.kind === SyntaxKind.AugmentDecoratorStatement
    );

    for (const decNode of augmentDecorators) {
      const ref = resolveTypeReferenceSym(decNode.targetType, undefined);
      if (ref) {
        if (ref.flags & SymbolFlags.Namespace) {
          const links = getSymbolLinks(getMergedSymbol(ref));
          const type: Type & DecoratedType = links.type! as any;
          const decApp = checkDecorator(type, decNode, undefined);
          if (decApp) {
            type.decorators.push(decApp);
            applyDecoratorToType(program, decApp, type);
          }
        } else {
          let list = augmentDecoratorsForSym.get(ref);
          if (list === undefined) {
            list = [];
            augmentDecoratorsForSym.set(ref, list);
          }
          list.push(decNode);
        }
      }
    }
  }

  function addUsingSymbols(source: SymbolTable, destination: SymbolTable): void {
    const augmented = getOrCreateAugmentedSymbolTable(destination);
    for (const symbolSource of source.values()) {
      const sym: Sym = {
        flags: SymbolFlags.Using,
        declarations: [],
        name: symbolSource.name,
        symbolSource: symbolSource,
      };
      augmented.set(sym.name, sym);
    }
  }

  /**
   * We cannot inject symbols into the symbol tables hanging off syntax tree nodes as
   * syntax tree nodes can be shared by other programs. This is called as a copy-on-write
   * to inject using and late-bound symbols, and then we use the copy when resolving
   * in the table.
   */
  function getOrCreateAugmentedSymbolTable(table: SymbolTable): Mutable<SymbolTable> {
    let augmented = augmentedSymbolTables.get(table);
    if (!augmented) {
      augmented = createSymbolTable(table);
      augmentedSymbolTables.set(table, augmented);
    }
    return mutate(augmented);
  }

  /**
   * Create the link for the given type to the symbol links.
   * If currently instantiating a template it will link to the instantiations.
   * Else will link to the declaredType.
   * @param links Symbol link
   * @param type Type
   * @param mapper Type mapper if in an template instantiation
   */
  function linkType(links: SymbolLinks, type: Type, mapper: TypeMapper | undefined) {
    if (mapper === undefined) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
    } else if (links.instantiations) {
      links.instantiations.set(mapper.args, type);
    }
  }

  function linkMemberType(links: SymbolLinks, type: Type, mapper: TypeMapper | undefined) {
    if (mapper === undefined) {
      links.declaredType = type;
    }
  }

  function getTypeForNode(node: Node, mapper?: TypeMapper): Type {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(node, mapper);
      case SyntaxKind.ModelStatement:
        return checkModel(node, mapper);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node, mapper);
      case SyntaxKind.ScalarStatement:
        return checkScalar(node, mapper);
      case SyntaxKind.AliasStatement:
        return checkAlias(node, mapper);
      case SyntaxKind.EnumStatement:
        return checkEnum(node, mapper);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(node, mapper);
      case SyntaxKind.UnionStatement:
        return checkUnion(node, mapper);
      case SyntaxKind.UnionVariant:
        return checkUnionVariant(node, mapper);
      case SyntaxKind.NamespaceStatement:
        return checkNamespace(node);
      case SyntaxKind.OperationStatement:
        return checkOperation(node, mapper);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(node, mapper);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(node);
      case SyntaxKind.ArrayExpression:
        return checkArrayExpression(node, mapper);
      case SyntaxKind.UnionExpression:
        return checkUnionExpression(node, mapper);
      case SyntaxKind.IntersectionExpression:
        return checkIntersectionExpression(node, mapper);
      case SyntaxKind.DecoratorDeclarationStatement:
        return checkDecoratorDeclaration(node, mapper);
      case SyntaxKind.FunctionDeclarationStatement:
        return checkFunctionDeclaration(node, mapper);
      case SyntaxKind.TypeReference:
        return checkTypeReference(node, mapper);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(node, mapper);
      case SyntaxKind.ProjectionStatement:
        return checkProjectionDeclaration(node);
      case SyntaxKind.VoidKeyword:
        return voidType;
      case SyntaxKind.NeverKeyword:
        return neverType;
      case SyntaxKind.UnknownKeyword:
        return unknownType;
    }

    // we don't emit an error here as we blindly call this function
    // with any node type, but some nodes don't produce a type
    // (e.g. imports). errorType should result in an error if it
    // bubbles out somewhere its not supposed to be.
    return errorType;
  }

  function getFullyQualifiedSymbolName(sym: Sym | undefined): string {
    if (!sym) return "";
    const parent = sym.parent;
    return parent && parent.name !== ""
      ? `${getFullyQualifiedSymbolName(parent)}.${sym.name}`
      : sym.name;
  }

  /**
   * Return a fully qualified id of node
   */
  function getNodeSymId(
    node:
      | ModelStatementNode
      | ScalarStatementNode
      | AliasStatementNode
      | InterfaceStatementNode
      | OperationStatementNode
      | UnionStatementNode
  ): number {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    return node.symbol?.id!;
  }

  /**
   * Check if the given namespace is the standard library `Cadl` namespace.
   */
  function isCadlNamespace(
    namespace: Namespace
  ): namespace is Namespace & { name: "Cadl"; namespace: Namespace } {
    return (
      namespace.name === "Cadl" &&
      (namespace.namespace === globalNamespaceType ||
        namespace.namespace?.projectionBase === globalNamespaceType)
    );
  }

  /**
   * Check if the given type is defined right in the Cadl namespace.
   */
  function isInCadlNamespace(type: Type & { namespace?: Namespace }): boolean {
    return Boolean(type.namespace && isCadlNamespace(type.namespace));
  }

  function checkTemplateParameterDeclaration(
    node: TemplateParameterDeclarationNode,
    mapper: TypeMapper | undefined
  ): Type {
    const parentNode = node.parent! as TemplateableNode;
    const links = getSymbolLinks(node.symbol);

    let type: TemplateParameter | undefined = links.declaredType as TemplateParameter;
    if (type === undefined) {
      const index = parentNode.templateParameters.findIndex((v) => v === node);
      type = links.declaredType = createAndFinishType({
        kind: "TemplateParameter",
        node: node,
      });

      if (node.constraint) {
        type.constraint = getTypeForNode(node.constraint);
      }
      if (node.default) {
        type.default = checkTemplateParameterDefault(
          node.default,
          parentNode.templateParameters,
          index,
          type.constraint
        );
      }
    }

    return mapper ? mapper.getMappedType(type) : type;
  }

  function getResolvedTypeParameterDefault(
    declaredType: TemplateParameter,
    node: TemplateParameterDeclarationNode,
    mapper: TypeMapper
  ): Type | undefined {
    if (declaredType.default === undefined) {
      return undefined;
    }
    if (isErrorType(declaredType.default)) {
      return declaredType.default;
    }

    return getTypeForNode(node.default!, mapper);
  }

  function checkTemplateParameterDefault(
    nodeDefault: Expression,
    templateParameters: readonly TemplateParameterDeclarationNode[],
    index: number,
    constraint: Type | undefined
  ) {
    function visit(node: Node) {
      const type = getTypeForNode(node);
      let hasError = false;
      if (type.kind === "TemplateParameter") {
        for (let i = index; i < templateParameters.length; i++) {
          if (type.node.symbol === templateParameters[i].symbol) {
            reportCheckerDiagnostic(
              createDiagnostic({ code: "invalid-template-default", target: node })
            );
            return undefined;
          }
        }
        return type;
      }

      visitChildren(node, (x) => {
        const visited = visit(x);
        if (visited === undefined) {
          hasError = true;
        }
      });

      return hasError ? undefined : type;
    }
    const type = visit(nodeDefault) ?? errorType;

    if (!isErrorType(type) && constraint) {
      checkTypeAssignable(type, constraint, nodeDefault);
    }
    return type;
  }

  /**
   * Check and resolve a type for the given type reference node.
   * @param node Node.
   * @param mapper Type mapper for template instantiation context.
   * @param instantiateTemplate If templated type should be instantiated if they haven't yet.
   * @returns Resolved type.
   */
  function checkTypeReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    instantiateTemplate = true
  ): Type {
    const sym = resolveTypeReferenceSym(node, mapper);
    if (!sym) {
      return errorType;
    }

    const type = checkTypeReferenceSymbol(sym, node, mapper, instantiateTemplate);
    checkDeprecated(type, node);
    return type;
  }

  function resolveTypeReference(
    node: TypeReferenceNode
  ): [Type | undefined, readonly Diagnostic[]] {
    const oldDiagnosticHook = onCheckerDiagnostic;
    const diagnostics: Diagnostic[] = [];
    onCheckerDiagnostic = (x: Diagnostic) => diagnostics.push(x);
    const type = checkTypeReference(node, undefined, false);
    onCheckerDiagnostic = oldDiagnosticHook;
    return [type === errorType ? undefined : type, diagnostics];
  }

  function checkDeprecated(type: Type, target: DiagnosticTarget) {
    const deprecated = getDeprecated(program, type);
    if (deprecated) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "deprecated",
          format: {
            message: deprecated,
          },
          target,
        })
      );
    }
  }

  function checkTypeReferenceArgs(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined
  ): [Node, Type][] {
    const args: [Node, Type][] = [];
    if (node.kind !== SyntaxKind.TypeReference) {
      return args;
    }

    for (const arg of node.arguments) {
      const value = getTypeForNode(arg, mapper);
      args.push([arg, value]);
    }
    return args;
  }

  function checkTemplateInstantiationArgs(
    node: Node,
    args: [Node, Type][],
    declarations: readonly TemplateParameterDeclarationNode[]
  ): [TemplateParameter[], Type[]] {
    if (args.length > declarations.length) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-template-args",
          messageId: "tooMany",
          target: node,
        })
      );
      // Too many args shouldn't matter for instantiating we can still go ahead
    }

    const values: Type[] = [];
    const params: TemplateParameter[] = [];
    let tooFew = false;

    for (let i = 0; i < declarations.length; i++) {
      const declaration = declarations[i];
      const declaredType = getTypeForNode(declaration)! as TemplateParameter;
      params.push(declaredType);

      if (i < args.length) {
        let [valueNode, value] = args[i];
        if (declaredType.constraint) {
          if (!checkTypeAssignable(value, declaredType.constraint, valueNode)) {
            value = declaredType.constraint;
          }
        }
        values.push(value);
      } else {
        const mapper = createTypeMapper(params, values);
        const defaultValue = getResolvedTypeParameterDefault(declaredType, declaration, mapper);
        if (defaultValue) {
          values.push(defaultValue);
        } else {
          tooFew = true;
          values.push(declaredType.constraint ?? unknownType);
        }
      }
    }

    if (tooFew) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-template-args",
          messageId: "tooFew",
          target: node,
        })
      );
    }

    return [params, values];
  }

  /**
   * Check and resolve the type for the given symbol + node.
   * @param sym Symbol
   * @param node Node
   * @param mapper Type mapper for template instantiation context.
   * @param instantiateTemplates If a templated type should be instantiated if not yet @default true
   * @returns resolved type.
   */
  function checkTypeReferenceSymbol(
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    instantiateTemplates = true
  ): Type {
    if (sym.flags & SymbolFlags.Decorator) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "decorator", target: sym })
      );

      return errorType;
    }

    if (sym.flags & SymbolFlags.Function) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "function", target: sym })
      );

      return errorType;
    }

    if (sym.flags & SymbolFlags.LateBound) {
      compilerAssert(sym.type, "Expected late bound symbol to have type");
      return sym.type;
    }

    const symbolLinks = getSymbolLinks(sym);
    let baseType;
    const args = checkTypeReferenceArgs(node, mapper);
    if (
      sym.flags &
      (SymbolFlags.Model |
        SymbolFlags.Scalar |
        SymbolFlags.Alias |
        SymbolFlags.Interface |
        SymbolFlags.Operation |
        SymbolFlags.Union)
    ) {
      const decl = sym.declarations[0] as TemplateableNode;
      if (decl.templateParameters.length === 0) {
        if (args.length > 0) {
          reportCheckerDiagnostic(
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
            sym.flags & SymbolFlags.Model
              ? checkModelStatement(decl as ModelStatementNode, mapper)
              : sym.flags & SymbolFlags.Scalar
              ? checkScalar(decl as ScalarStatementNode, mapper)
              : sym.flags & SymbolFlags.Alias
              ? checkAlias(decl as AliasStatementNode, mapper)
              : sym.flags & SymbolFlags.Interface
              ? checkInterface(decl as InterfaceStatementNode, mapper)
              : sym.flags & SymbolFlags.Operation
              ? checkOperation(decl as OperationStatementNode, mapper)
              : checkUnion(decl as UnionStatementNode, mapper);
        }
      } else {
        // declaration is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          sym.flags & SymbolFlags.Model
            ? checkModelStatement(decl as ModelStatementNode, mapper)
            : sym.flags & SymbolFlags.Scalar
            ? checkScalar(decl as ScalarStatementNode, mapper)
            : sym.flags & SymbolFlags.Alias
            ? checkAlias(decl as AliasStatementNode, mapper)
            : sym.flags & SymbolFlags.Interface
            ? checkInterface(decl as InterfaceStatementNode, mapper)
            : sym.flags & SymbolFlags.Operation
            ? checkOperation(decl as OperationStatementNode, mapper)
            : checkUnion(decl as UnionStatementNode, mapper);
        }

        const templateParameters = decl.templateParameters;
        const [params, instantiationArgs] = checkTemplateInstantiationArgs(
          node,
          args,
          templateParameters
        );
        baseType = getOrInstantiateTemplate(decl, params, instantiationArgs, instantiateTemplates);
      }
    } else {
      // some other kind of reference

      if (args.length > 0) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-template-args",
            messageId: "notTemplate",
            target: node,
          })
        );
      }
      if (sym.flags & SymbolFlags.TemplateParameter) {
        baseType = checkTemplateParameterDeclaration(
          sym.declarations[0] as TemplateParameterDeclarationNode,
          mapper
        );
      } else if (symbolLinks.type) {
        // Have a cached type for non-declarations
        baseType = symbolLinks.type;
      } else if (symbolLinks.declaredType) {
        baseType = symbolLinks.declaredType;
      } else {
        // don't have a cached type for this symbol, so go grab it and cache it
        baseType = getTypeForNode(sym.declarations[0], mapper);
        symbolLinks.type = baseType;
      }
    }

    return baseType;
  }

  function getOrInstantiateTemplate(
    templateNode: TemplateableNode,
    params: TemplateParameter[],
    args: Type[],
    instantiateTempalates = true
  ): Type {
    const symbolLinks = getSymbolLinks(templateNode.symbol);
    if (symbolLinks.instantiations === undefined) {
      const type = getTypeForNode(templateNode);
      if (isErrorType(type)) {
        return errorType;
      } else {
        compilerAssert(
          false,
          `Unexpected checker error. symbolLinks.instantiations was not defined for ${
            SyntaxKind[templateNode.kind]
          }`
        );
      }
    }
    const cached = symbolLinks.instantiations.get(args);
    if (cached) {
      return cached;
    }
    if (instantiateTempalates) {
      return instantiateTemplate(symbolLinks.instantiations, templateNode, params, args);
    } else {
      return errorType;
    }
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
    instantiations: TypeInstantiationMap,
    templateNode: TemplateableNode,
    params: TemplateParameter[],
    args: Type[]
  ): Type {
    const mapper = createTypeMapper(params, args);
    const type = getTypeForNode(templateNode, mapper);
    if (!instantiations.get(args)) {
      instantiations.set(args, type);
    }
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode, mapper: TypeMapper | undefined): Union {
    const unionType: Union = createAndFinishType({
      kind: "Union",
      node,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: true,
      variants: new Map(),
      decorators: [],
    });

    for (const o of node.options) {
      const type = getTypeForNode(o, mapper);

      // The type `A | never` is just `A`
      if (type === neverType) {
        continue;
      }
      if (type.kind === "Union" && type.expression) {
        for (const [name, variant] of type.variants) {
          unionType.variants.set(name, variant);
        }
      } else {
        const variant: UnionVariant = createType({
          kind: "UnionVariant",
          type,
          name: Symbol("name"),
          decorators: [],
          node: undefined,
          union: unionType,
        });

        unionType.variants.set(variant.name, variant);
      }
    }

    return unionType;
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(
    node: IntersectionExpressionNode,
    mapper: TypeMapper | undefined
  ) {
    const options = node.options.map((o): [Expression, Type] => [o, getTypeForNode(o, mapper)]);
    return mergeModelTypes(node, options, mapper);
  }

  function checkDecoratorDeclaration(
    node: DecoratorDeclarationStatementNode,
    mapper: TypeMapper | undefined
  ): Decorator {
    const symbol = getMergedSymbol(node.symbol);
    const links = getSymbolLinks(symbol);
    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this operation and we've already checked it
      return links.declaredType as Decorator;
    }

    const namespace = getParentNamespaceType(node);
    compilerAssert(
      namespace,
      `Decorator ${node.id.sv} should have resolved a namespace or found the global namespace.`
    );
    const name = node.id.sv;

    if (!(node.modifierFlags & ModifierFlags.Extern)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "decorator-extern", target: node }));
    }

    const implementation = symbol.value;
    if (implementation === undefined) {
      reportCheckerDiagnostic(createDiagnostic({ code: "missing-implementation", target: node }));
    }
    const decoratorType: Decorator = createType({
      kind: "Decorator",
      name: `@${name}`,
      namespace,
      node,
      target: checkFunctionParameter(node.target, mapper),
      parameters: node.parameters.map((x) => checkFunctionParameter(x, mapper)),
      implementation: implementation ?? (() => {}),
    });

    namespace.decoratorDeclarations.set(name, decoratorType);

    linkType(links, decoratorType, mapper);

    return decoratorType;
  }

  function checkFunctionDeclaration(
    node: FunctionDeclarationStatementNode,
    mapper: TypeMapper | undefined
  ): FunctionType {
    const symbol = getMergedSymbol(node.symbol);
    const links = getSymbolLinks(symbol);
    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this operation and we've already checked it
      return links.declaredType as FunctionType;
    }

    const namespace = getParentNamespaceType(node);
    compilerAssert(
      namespace,
      `Decorator ${node.id.sv} should have resolved a namespace or found the global namespace.`
    );
    const name = node.id.sv;

    if (!(node.modifierFlags & ModifierFlags.Extern)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "function-extern", target: node }));
    }

    const implementation = symbol.value;
    if (implementation === undefined) {
      reportCheckerDiagnostic(createDiagnostic({ code: "missing-implementation", target: node }));
    }
    const functionType: FunctionType = createType({
      kind: "Function",
      name,
      namespace,
      node,
      parameters: node.parameters.map((x) => checkFunctionParameter(x, mapper)),
      returnType: node.returnType ? getTypeForNode(node.returnType, mapper) : unknownType,
      implementation: implementation ?? (() => {}),
    });

    namespace.functionDeclarations.set(name, functionType);

    linkType(links, functionType, mapper);

    return functionType;
  }

  function checkFunctionParameter(
    node: FunctionParameterNode,
    mapper: TypeMapper | undefined
  ): FunctionParameter {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType) {
      return links.declaredType as FunctionParameter;
    }
    if (node.rest && node.type && node.type.kind !== SyntaxKind.ArrayExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "rest-parameter-array", target: node.type })
      );
    }
    const type = node.type ? getTypeForNode(node.type) : unknownType;

    const parameterType: FunctionParameter = createType({
      kind: "FunctionParameter",
      node,
      name: node.id.sv,
      optional: node.optional,
      rest: node.rest,
      type,
      implementation: node.symbol.value!,
    });
    linkType(links, parameterType, mapper);

    return parameterType;
  }

  function mergeModelTypes(
    node:
      | ModelStatementNode
      | ModelExpressionNode
      | IntersectionExpressionNode
      | ProjectionModelExpressionNode,
    options: [Node, Type][],
    mapper: TypeMapper | undefined
  ) {
    const properties = new Map<string, ModelProperty>();

    const intersection: Model = createType({
      kind: "Model",
      node,
      name: "",
      namespace: getParentNamespaceType(node),
      properties: properties,
      decorators: [],
      derivedModels: [],
    });

    const indexers: ModelIndexer[] = [];
    for (const [optionNode, option] of options) {
      if (option.kind === "TemplateParameter") {
        continue;
      }
      if (option.kind !== "Model") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "intersect-non-model", target: optionNode })
        );
        continue;
      }

      if (option.indexer) {
        if (option.indexer.key.name === "integer") {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "intersect-invalid-index",
              messageId: "array",
              target: optionNode,
            })
          );
        } else {
          indexers.push(option.indexer);
        }
      }
      if (indexers.length === 1) {
        intersection.indexer = indexers[0];
      } else if (indexers.length > 1) {
        intersection.indexer = {
          key: indexers[0].key,
          value: mergeModelTypes(
            node,
            indexers.map((x) => [x.value.node!, x.value]),
            mapper
          ),
        };
      }

      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "intersect-duplicate-property",
              format: { propName: prop.name },
              target: node,
            })
          );
          continue;
        }

        const newPropType = cloneType(prop, {
          sourceProperty: prop,
          model: intersection,
        });
        properties.set(prop.name, newPropType);
      }
    }

    return finishType(intersection, mapper);
  }

  function checkArrayExpression(node: ArrayExpressionNode, mapper: TypeMapper | undefined): Model {
    const elementType = getTypeForNode(node.elementType, mapper);
    const arrayType = getStdType("Array");
    const arrayNode: ModelStatementNode = arrayType.node as any;
    const param: TemplateParameter = getTypeForNode(arrayNode.templateParameters[0]) as any;
    return getOrInstantiateTemplate(arrayNode, [param], [elementType]) as Model;
  }

  function checkNamespace(node: NamespaceStatementNode) {
    applyAugmentDecorators(node);

    const links = getSymbolLinks(getMergedSymbol(node.symbol));
    let type = links.type as Namespace;
    if (!type) {
      type = initializeTypeForNamespace(node);
    }

    if (isArray(node.statements)) {
      node.statements.forEach((x) => getTypeForNode(x));
    } else if (node.statements) {
      const subNs = checkNamespace(node.statements);
      type.namespaces.set(subNs.name, subNs);
    }
    return type;
  }

  function initializeTypeForNamespace(node: NamespaceStatementNode) {
    compilerAssert(node.symbol, "Namespace is unbound.", node);
    const mergedSymbol = getMergedSymbol(node.symbol)!;
    const symbolLinks = getSymbolLinks(mergedSymbol);
    if (!symbolLinks.type) {
      // haven't seen this namespace before
      const namespace = getParentNamespaceType(node);
      const name = node.id.sv;
      const type: Namespace = createType({
        kind: "Namespace",
        name,
        namespace,
        node,
        models: new Map(),
        scalars: new Map(),
        operations: new Map(),
        namespaces: new Map(),
        interfaces: new Map(),
        unions: new Map(),
        enums: new Map(),
        decoratorDeclarations: new Map(),
        functionDeclarations: new Map(),
        decorators: [],
      });

      symbolLinks.type = type;
      for (const sourceNode of mergedSymbol.declarations) {
        // namespaces created from cadl scripts don't have decorators
        if (sourceNode.kind !== SyntaxKind.NamespaceStatement) continue;
        type.decorators = type.decorators.concat(checkDecorators(type, sourceNode, undefined));
      }
      finishType(type);

      namespace?.namespaces.set(name, type);
    }

    return symbolLinks.type as Namespace;
  }

  function getParentNamespaceType(
    node:
      | ModelStatementNode
      | ScalarStatementNode
      | NamespaceStatementNode
      | OperationStatementNode
      | EnumStatementNode
      | InterfaceStatementNode
      | IntersectionExpressionNode
      | UnionStatementNode
      | ModelExpressionNode
      | DecoratorDeclarationStatementNode
      | FunctionDeclarationStatementNode
      | ProjectionModelExpressionNode
  ): Namespace | undefined {
    if (node === globalNamespaceType.node) return undefined;

    if (
      node.kind === SyntaxKind.ModelExpression ||
      node.kind === SyntaxKind.IntersectionExpression
    ) {
      let parent: Node | undefined = node.parent;
      while (parent !== undefined) {
        if (
          parent.kind === SyntaxKind.ModelStatement ||
          parent.kind === SyntaxKind.ScalarStatement ||
          parent.kind === SyntaxKind.OperationStatement ||
          parent.kind === SyntaxKind.EnumStatement ||
          parent.kind === SyntaxKind.InterfaceStatement ||
          parent.kind === SyntaxKind.UnionStatement ||
          parent.kind === SyntaxKind.ModelExpression ||
          parent.kind === SyntaxKind.IntersectionExpression
        ) {
          return getParentNamespaceType(parent);
        } else {
          parent = parent.parent;
        }
      }
      return undefined;
    }

    if (
      node.kind === SyntaxKind.OperationStatement &&
      node.parent &&
      node.parent.kind === SyntaxKind.InterfaceStatement
    ) {
      return getParentNamespaceType(node.parent);
    }

    if (!node.symbol.parent) {
      return globalNamespaceType;
    }

    if (
      node.symbol.parent.declarations[0].kind === SyntaxKind.CadlScript ||
      node.symbol.parent.declarations[0].kind === SyntaxKind.JsSourceFile
    ) {
      return globalNamespaceType;
    }

    const mergedSymbol = getMergedSymbol(node.symbol.parent)!;
    const symbolLinks = getSymbolLinks(mergedSymbol);
    if (!symbolLinks.type) {
      // in general namespaces should be typed before anything calls this function.
      // However, one case where this is not true is when a decorator on a namespace
      // refers to a model in another namespace. In this case, we need to evaluate
      // the namespace here.
      const namespaceNode = mergedSymbol.declarations.find(
        (x): x is NamespaceStatementNode => x.kind === SyntaxKind.NamespaceStatement
      );
      compilerAssert(namespaceNode, "Can't find namespace declaration node.", node);
      symbolLinks.type = initializeTypeForNamespace(namespaceNode);
    }

    return symbolLinks.type as Namespace;
  }

  function checkOperation(
    node: OperationStatementNode,
    mapper: TypeMapper | undefined,
    parentInterface?: Interface
  ): Operation | ErrorType {
    // Operations defined in interfaces aren't bound to symbols
    const links =
      node.parent?.kind === SyntaxKind.InterfaceStatement
        ? getMemberSymbolLinks(node)
        : getSymbolLinks(node.symbol);
    if (links) {
      if (links.declaredType && mapper === undefined) {
        // we're not instantiating this operation and we've already checked it
        return links.declaredType as Operation;
      }
    }

    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    let decorators: DecoratorApplication[] = [];

    // Is this a definition or reference?
    let parameters: Model, returnType: Type;
    if (node.signature.kind === SyntaxKind.OperationSignatureReference) {
      // Attempt to resolve the operation
      const baseOperation = checkOperationIs(node, node.signature.baseOperation, mapper);
      if (!baseOperation) {
        return errorType;
      }

      // Reference the same return type and create the parameters type
      parameters = cloneType(baseOperation.parameters);
      returnType = baseOperation.returnType;

      // Copy decorators from the base operation, inserting the base decorators first
      decorators = [...baseOperation.decorators];
    } else {
      parameters = getTypeForNode(node.signature.parameters, mapper) as Model;
      returnType = getTypeForNode(node.signature.returnType, mapper);
    }

    const operationType: Operation = createType({
      kind: "Operation",
      name,
      namespace,
      node,
      parameters,
      returnType,
      decorators,
      interface: parentInterface,
    });

    decorators.push(...checkDecorators(operationType, node, mapper));

    operationType.parameters.namespace = namespace;

    if (node.parent!.kind === SyntaxKind.InterfaceStatement) {
      if (
        shouldCreateTypeForTemplate(node.parent!, mapper) &&
        shouldCreateTypeForTemplate(node, mapper)
      ) {
        finishType(operationType, mapper);
      }
    } else {
      if (shouldCreateTypeForTemplate(node, mapper)) {
        finishType(operationType, mapper);
      }

      namespace?.operations.set(name, operationType);
    }

    if (links) {
      linkType(links, operationType, mapper);
    }

    return operationType;
  }

  function checkOperationIs(
    operation: OperationStatementNode,
    opReference: TypeReferenceNode | undefined,
    mapper: TypeMapper | undefined
  ): Operation | undefined {
    if (!opReference) return undefined;
    // Ensure that we don't end up with a circular reference to the same operation
    const opSymId = getNodeSymId(operation);
    if (opSymId) {
      pendingResolutions.add(opSymId);
    }

    const target = resolveTypeReferenceSym(opReference, mapper);
    if (target === undefined) {
      return undefined;
    }

    // Did we encounter a circular operation reference?
    if (pendingResolutions.has(getNodeSymId(target.declarations[0] as any))) {
      if (mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-op-signature",
            format: { typeName: (target.declarations[0] as any).id.sv },
            target: opReference,
          })
        );
      }

      return undefined;
    }

    // Resolve the base operation type
    const baseOperation = checkTypeReferenceSymbol(target, opReference, mapper);
    if (opSymId) {
      pendingResolutions.delete(opSymId);
    }

    if (isErrorType(baseOperation)) {
      return undefined;
    }

    // Was the wrong type referenced?
    if (baseOperation.kind !== "Operation") {
      reportCheckerDiagnostic(createDiagnostic({ code: "is-operation", target: opReference }));
      return;
    }

    return baseOperation;
  }

  function getGlobalNamespaceType() {
    return globalNamespaceType;
  }

  function getGlobalNamespaceNode() {
    return globalNamespaceNode;
  }

  function checkTupleExpression(node: TupleExpressionNode, mapper: TypeMapper | undefined): Tuple {
    return createAndFinishType({
      kind: "Tuple",
      node: node,
      values: node.values.map((v) => getTypeForNode(v, mapper)),
    });
  }

  function getSymbolLinks(s: Sym): SymbolLinks {
    const id = getSymbolId(s);

    if (symbolLinks.has(id)) {
      return symbolLinks.get(id)!;
    }

    const links = {};
    symbolLinks.set(id, links);

    return links;
  }

  function getSymbolId(s: Sym) {
    if (s.id === undefined) {
      mutate(s).id = currentSymbolId++;
    }
    return s.id!;
  }

  function resolveIdentifierInTable(
    node: IdentifierNode,
    table: SymbolTable | undefined,
    resolveDecorator = false
  ): Sym | undefined {
    if (!table) {
      return undefined;
    }

    table = augmentedSymbolTables.get(table) ?? table;
    let sym;
    if (resolveDecorator) {
      sym = table.get("@" + node.sv);
    } else {
      sym = table.get(node.sv);
    }

    if (!sym) return sym;

    if (sym.flags & SymbolFlags.DuplicateUsing) {
      reportAmbiguousIdentifier(node, [...((table.duplicates.get(sym) as any) ?? [])]);
      return sym;
    }
    return getMergedSymbol(sym);
  }

  function reportAmbiguousIdentifier(node: IdentifierNode, symbols: Sym[]) {
    const duplicateNames = symbols
      .map((x) => {
        const namespace =
          x.symbolSource!.flags & (SymbolFlags.Decorator | SymbolFlags.Function)
            ? (x.symbolSource!.value as any).namespace
            : getNamespaceFullName(
                (getTypeForNode(x.symbolSource!.declarations[0], undefined) as any).namespace
              );
        return `${namespace}.${node.sv}`;
      })
      .join(", ");
    reportCheckerDiagnostic(
      createDiagnostic({
        code: "ambiguous-symbol",
        format: { name: node.sv, duplicateNames },
        target: node,
      })
    );
  }

  function resolveIdentifier(id: IdentifierNode, mapper?: TypeMapper): Sym | undefined {
    let sym: Sym | undefined;
    const { node, kind } = getIdentifierContext(id);

    switch (kind) {
      case IdentifierKind.Declaration:
        if (node.symbol && (!("templateParameters" in node) || mapper === undefined)) {
          sym = getMergedSymbol(node.symbol);
          break;
        }

        compilerAssert(node.parent, "Parent expected.");
        const containerType = getTypeForNode(node.parent, mapper);
        if (isAnonymous(containerType)) {
          return undefined; // member of anonymous type cannot be referenced.
        }

        lateBindMemberContainer(containerType);
        let container = node.parent.symbol;
        if (!container && "symbol" in containerType && containerType.symbol) {
          container = containerType.symbol;
        }

        if (!container) {
          return undefined;
        }

        lateBindMembers(containerType, container);
        sym = resolveIdentifierInTable(id, container.exports ?? container.members);
        break;
      case IdentifierKind.Other:
        return undefined;

      case IdentifierKind.Decorator:
      case IdentifierKind.Function:
      case IdentifierKind.Using:
      case IdentifierKind.TypeReference:
        let ref: MemberExpressionNode | IdentifierNode = id;
        let resolveDecorator = kind === IdentifierKind.Decorator;
        if (id.parent?.kind === SyntaxKind.MemberExpression) {
          if (id.parent.id === id) {
            // If the identifier is Y in X.Y, then resolve (X.Y).
            ref = id.parent;
          } else {
            // If the identifier is X in X.Y then we are resolving a
            // namespace, which is never a decorator.
            resolveDecorator = false;
          }
        }
        sym = resolveTypeReferenceSym(ref, mapper, resolveDecorator);
        break;

      default:
        const _assertNever: never = kind;
        compilerAssert(false, "Unreachable");
    }

    return sym?.symbolSource ?? sym;
  }

  function resolveCompletions(identifier: IdentifierNode): Map<string, CadlCompletionItem> {
    const completions = new Map<string, CadlCompletionItem>();
    const { kind } = getIdentifierContext(identifier);

    switch (kind) {
      case IdentifierKind.Using:
      case IdentifierKind.Decorator:
      case IdentifierKind.Function:
      case IdentifierKind.TypeReference:
        break; // supported
      case IdentifierKind.Other:
        return completions; // not implemented
      case IdentifierKind.Declaration:
        return completions; // cannot complete, name can be chosen arbitrarily
      default:
        const _assertNever: never = kind;
        compilerAssert(false, "Unreachable");
    }

    if (identifier.parent && identifier.parent.kind === SyntaxKind.MemberExpression) {
      let base = resolveTypeReferenceSym(identifier.parent.base, undefined, false);
      if (base) {
        if (base.flags & SymbolFlags.Alias) {
          base = getAliasedSymbol(base, undefined);
        }
        addCompletions(base.exports ?? base.members);
      }
    } else {
      let scope: Node | undefined = identifier.parent;
      while (scope && scope.kind !== SyntaxKind.CadlScript) {
        if (scope.symbol && scope.symbol.exports) {
          const mergedSymbol = getMergedSymbol(scope.symbol)!;
          addCompletions(mergedSymbol.exports);
        }
        if ("locals" in scope) {
          addCompletions(scope.locals);
        }
        scope = scope.parent;
      }

      if (scope && scope.kind === SyntaxKind.CadlScript) {
        // check any blockless namespace decls
        for (const ns of scope.inScopeNamespaces) {
          const mergedSymbol = getMergedSymbol(ns.symbol)!;
          addCompletions(mergedSymbol.exports);
        }

        // check "global scope" declarations
        addCompletions(globalNamespaceNode.symbol.exports);

        // check "global scope" usings
        addCompletions(scope.locals);
      }
    }

    return completions;

    function addCompletions(table: SymbolTable | undefined) {
      if (!table) {
        return;
      }
      table = augmentedSymbolTables.get(table) ?? table;
      for (const [key, sym] of table) {
        if (sym.flags & SymbolFlags.DuplicateUsing) {
          const duplicates = table.duplicates.get(sym)!;
          for (const duplicate of duplicates) {
            if (duplicate.flags & SymbolFlags.Using) {
              const fqn = getFullyQualifiedSymbolName(duplicate.symbolSource);
              addCompletion(fqn, duplicate);
            }
          }
        } else {
          addCompletion(key, sym);
        }
      }
    }

    function addCompletion(key: string, sym: Sym) {
      if (sym.symbolSource) {
        sym = sym.symbolSource;
      }
      if (!shouldAddCompletion(sym)) {
        return;
      }
      if (key.startsWith("@")) {
        key = key.slice(1);
      }
      if (!completions.has(key)) {
        completions.set(key, { sym });
      }
    }

    function shouldAddCompletion(sym: Sym): boolean {
      switch (kind) {
        case IdentifierKind.Decorator:
          // Only return decorators and namespaces when completing decorator
          return !!(sym.flags & (SymbolFlags.Decorator | SymbolFlags.Namespace));
        case IdentifierKind.Using:
          // Only return namespaces when completing using
          return !!(sym.flags & SymbolFlags.Namespace);
        case IdentifierKind.TypeReference:
          // Do not return functions or decorators when completing types
          return !(sym.flags & (SymbolFlags.Function | SymbolFlags.Decorator));
        default:
          compilerAssert(false, "We should have bailed up-front on other kinds.");
      }
    }
  }

  function resolveIdentifierInScope(
    node: IdentifierNode,
    mapper: TypeMapper | undefined,
    resolveDecorator = false
  ): Sym | undefined {
    compilerAssert(
      node.parent?.kind !== SyntaxKind.MemberExpression || node.parent.id !== node,
      "This function should not be used to resolve Y in member expression X.Y. Use resolveIdentifier() to resolve an arbitrary identifier."
    );

    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    let scope: Node | undefined = node.parent;
    let binding: Sym | undefined;

    while (scope && scope.kind !== SyntaxKind.CadlScript) {
      if (scope.symbol && "exports" in scope.symbol) {
        const mergedSymbol = getMergedSymbol(scope.symbol);
        binding = resolveIdentifierInTable(node, mergedSymbol.exports, resolveDecorator);
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.CadlScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol);
        binding = resolveIdentifierInTable(node, mergedSymbol.exports, resolveDecorator);

        if (binding) return binding;
      }

      // check "global scope" declarations
      binding = resolveIdentifierInTable(
        node,
        globalNamespaceNode.symbol.exports,
        resolveDecorator
      );

      if (binding) return binding;

      // check using types
      binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
      if (binding) return binding.flags & SymbolFlags.DuplicateUsing ? undefined : binding;
    }

    if (mapper === undefined) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "unknown-identifier", format: { id: node.sv }, target: node })
      );
    }
    return undefined;
  }

  function resolveTypeReferenceSym(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    resolveDecorator = false
  ): Sym | undefined {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReferenceSym(node.target, mapper, resolveDecorator);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      let base = resolveTypeReferenceSym(node.base, mapper);
      if (!base) {
        return undefined;
      }

      // when resolving a type reference based on an alias, unwrap the alias.
      if (base.flags & SymbolFlags.Alias) {
        base = getAliasedSymbol(base, mapper);
      }

      if (base.flags & SymbolFlags.Namespace) {
        const symbol = resolveIdentifierInTable(node.id, base.exports, resolveDecorator);
        if (!symbol) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-ref",
              messageId: "underNamespace",
              format: {
                namespace: getFullyQualifiedSymbolName(base),
                id: node.id.sv,
              },
              target: node,
            })
          );
          return undefined;
        }
        return symbol;
      } else if (base.flags & SymbolFlags.Decorator) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "inDecorator",
            format: { id: node.id.sv },
            target: node,
          })
        );
        return undefined;
      } else if (base.flags & SymbolFlags.Function) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "node",
            format: { id: node.id.sv, nodeName: "function" },
            target: node,
          })
        );

        return undefined;
      } else if (base.flags & SymbolFlags.MemberContainer) {
        if ("templateParameters" in base.declarations[0]) {
          const type =
            base.flags & SymbolFlags.LateBound
              ? base.type!
              : getTypeForNode(base.declarations[0], mapper);
          lateBindMembers(type, base);
        }
        const sym = resolveIdentifierInTable(node.id, base.members!, resolveDecorator);
        if (!sym) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-ref",
              messageId: "underContainer",
              format: { kind: getMemberKindName(base.declarations[0]), id: node.id.sv },
              target: node,
            })
          );
          return undefined;
        }
        return sym;
      } else {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-ref",
            messageId: "node",
            format: {
              id: node.id.sv,
              nodeName: base.declarations[0]
                ? SyntaxKind[base.declarations[0].kind]
                : "Unknown node",
            },
            target: node,
          })
        );

        return undefined;
      }
    }

    if (node.kind === SyntaxKind.Identifier) {
      const sym = resolveIdentifierInScope(node, mapper, resolveDecorator);
      if (!sym) return undefined;

      const result = sym.flags & SymbolFlags.Using ? sym.symbolSource : sym;

      // TODO-TIM remove?
      if (result !== undefined && result.flags & SymbolFlags.MemberContainer) {
        bindMembers(result.declarations[0], result);
      }
      return result;
    }

    compilerAssert(false, "Unknown type reference kind", node);
  }

  function getMemberKindName(node: Node) {
    switch (node.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
        return "Model";
      case SyntaxKind.EnumStatement:
        return "Enum";
      case SyntaxKind.InterfaceStatement:
        return "Interface";
      case SyntaxKind.UnionStatement:
        return "Union";
      default:
        return "Type";
    }
  }

  /**
   * Return the symbol that is aliased by this alias declaration. If no such symbol is aliased,
   * return the symbol for the alias instead. For member containers which need to be late bound
   * (i.e. they contain symbols we don't know until we've instantiated the type and the type is an
   * instantiation) we late bind the container which creates the symbol that will hold its members.
   */
  function getAliasedSymbol(aliasSymbol: Sym, mapper: TypeMapper | undefined): Sym {
    const aliasType = checkAlias(aliasSymbol.declarations[0] as AliasStatementNode, mapper);
    switch (aliasType.kind) {
      case "Model":
      case "Interface":
      case "Union":
        if (aliasType.templateArguments) {
          lateBindMemberContainer(aliasType);
          // this is an alias for some instantiation, so late-bind the instantiation
          return aliasType.symbol!;
        }
      // fallthrough
      default:
        // get the symbol from the node aliased type's node, or just return the base
        // if it doesn't have a symbol (which will likely result in an error later on)
        return aliasType.node!.symbol ?? aliasSymbol;
    }
  }
  function checkStringLiteral(str: StringLiteralNode): StringLiteral {
    return getLiteralType(str);
  }

  function checkNumericLiteral(num: NumericLiteralNode): NumericLiteral {
    return getLiteralType(num);
  }

  function checkBooleanLiteral(bool: BooleanLiteralNode): BooleanLiteral {
    return getLiteralType(bool);
  }

  function checkProgram() {
    program.reportDuplicateSymbols(globalNamespaceNode.symbol.exports);
    for (const file of program.sourceFiles.values()) {
      bindAllMembers(file);
    }
    for (const file of program.sourceFiles.values()) {
      for (const ns of file.namespaces) {
        const exports = mergedSymbols.get(ns.symbol)?.exports ?? ns.symbol.exports;
        program.reportDuplicateSymbols(exports);
        initializeTypeForNamespace(ns);
      }
    }

    for (const file of program.sourceFiles.values()) {
      checkSourceFile(file);
    }

    internalDecoratorValidation();
  }

  /**
   * Post checking validation for internal decorators.
   */
  function internalDecoratorValidation() {
    validateInheritanceDiscriminatedUnions(program);
  }

  function checkSourceFile(file: CadlScriptNode) {
    applyAugmentDecorators(file);
    for (const statement of file.statements) {
      getTypeForNode(statement, undefined);
    }
  }

  function checkModel(
    node: ModelExpressionNode | ModelStatementNode,
    mapper: TypeMapper | undefined
  ): Model {
    if (node.kind === SyntaxKind.ModelStatement) {
      return checkModelStatement(node, mapper);
    } else {
      return checkModelExpression(node, mapper);
    }
  }

  function checkModelStatement(node: ModelStatementNode, mapper: TypeMapper | undefined): Model {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }

    const decorators: DecoratorApplication[] = [];

    const type: Model = createType({
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties: new Map<string, ModelProperty>(),
      namespace: getParentNamespaceType(node),
      decorators,
      derivedModels: [],
    });
    linkType(links, type, mapper);
    const isBase = checkModelIs(node, node.is, mapper);

    if (isBase) {
      checkDeprecated(isBase, node.is!);
      // copy decorators
      decorators.push(...isBase.decorators);
      if (isBase.indexer) {
        type.indexer = isBase.indexer;
      }
    }
    decorators.push(...checkDecorators(type, node, mapper));

    if (isBase) {
      for (const prop of isBase.properties.values()) {
        const newProp = cloneType(prop, {
          sourceProperty: prop,
          model: type,
        });
        linkComputedMember(node, newProp, mapper);
        type.properties.set(prop.name, newProp);
      }
    }

    if (isBase) {
      type.baseModel = isBase.baseModel;
    } else if (node.extends) {
      type.baseModel = checkClassHeritage(node, node.extends, mapper);
      if (type.baseModel) {
        checkDeprecated(type.baseModel, node.extends);
      }
    }

    if (type.baseModel) {
      type.baseModel.derivedModels.push(type);
    }

    // Hold on to the model type that's being defined so that it
    // can be referenced
    if (mapper === undefined) {
      type.namespace?.models.set(type.name, type);
    }

    // Evaluate the properties after
    checkModelProperties(node, type.properties, type, mapper);

    for (const prop of walkPropertiesInherited(type)) {
      const table = augmentedSymbolTables.get(node.symbol.members!) ?? node.symbol.members!;
      const sym = table.get(prop.name);
      if (sym) {
        mutate(sym).type = prop;
      }
    }
    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(type, mapper);
    }

    const indexer = getIndexer(program, type);
    if (type.name === "Array" && isInCadlNamespace(type)) {
      stdTypes.Array = type;
    } else if (type.name === "Record" && isInCadlNamespace(type)) {
      stdTypes.Record = type;
    }
    if (indexer) {
      type.indexer = indexer;
    }
    return type;
  }

  function shouldCreateTypeForTemplate(
    node: TemplateDeclarationNode,
    mapper: TypeMapper | undefined
  ) {
    // Node is not a template we should create the type.
    if (node.templateParameters.length === 0) {
      return true;
    }
    // There is no mapper so we shouldn't be instantiating the template.
    if (mapper === undefined) {
      return false;
    }

    // Some of the mapper args are still template parameter so we shouldn't create the type.
    return mapper.args.every((t) => t.kind !== "TemplateParameter");
  }

  function checkModelExpression(node: ModelExpressionNode, mapper: TypeMapper | undefined) {
    const properties = new Map();
    const type: Model = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
      indexer: undefined,
      namespace: getParentNamespaceType(node),
      decorators: [],
      derivedModels: [],
    });
    checkModelProperties(node, properties, type, mapper);
    return finishType(type);
  }

  function checkPropertyCompatibleWithIndexer(
    parentModel: Model,
    property: ModelProperty,
    diagnosticTarget: ModelPropertyNode | ModelSpreadPropertyNode
  ) {
    if (parentModel.indexer === undefined) {
      return;
    }

    const [valid, diagnostics] = isTypeAssignableTo(
      property.type,
      parentModel.indexer.value!,
      diagnosticTarget.kind === SyntaxKind.ModelSpreadProperty
        ? diagnosticTarget
        : diagnosticTarget.value
    );
    if (!valid) reportCheckerDiagnostics(diagnostics);
  }

  function checkModelProperties(
    node: ModelExpressionNode | ModelStatementNode,
    properties: Map<string, ModelProperty>,
    parentModel: Model,
    mapper: TypeMapper | undefined
  ) {
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const newProp = checkModelProperty(prop, mapper);
        newProp.model = parentModel;
        checkPropertyCompatibleWithIndexer(parentModel, newProp, prop);
        defineProperty(properties, newProp);
      } else {
        // spread property
        const newProperties = checkSpreadProperty(prop.target, parentModel, mapper);

        for (const newProp of newProperties) {
          linkComputedMember(node, newProp, mapper);
          checkPropertyCompatibleWithIndexer(parentModel, newProp, prop);
          defineProperty(properties, newProp, prop);
        }
      }
    }
  }

  function defineProperty(
    properties: Map<string, ModelProperty>,
    newProp: ModelProperty,
    diagnosticTarget?: DiagnosticTarget
  ) {
    if (properties.has(newProp.name)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "duplicate-property",
          format: { propName: newProp.name },
          target: diagnosticTarget ?? newProp,
        })
      );
      return;
    }

    const overriddenProp = getOverriddenProperty(newProp);
    if (overriddenProp) {
      const [isAssignable, _] = isTypeAssignableTo(newProp.type, overriddenProp.type, newProp);
      const parentScalar = overriddenProp.type.kind === "Scalar";
      const parentType = getTypeName(overriddenProp.type);
      const newPropType = getTypeName(newProp.type);

      if (!parentScalar) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "override-property-intrinsic",
            format: { propName: newProp.name, propType: newPropType, parentType: parentType },
            target: diagnosticTarget ?? newProp,
          })
        );
        return;
      }

      if (!isAssignable) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "override-property-mismatch",
            format: { propName: newProp.name, propType: newPropType, parentType: parentType },
            target: diagnosticTarget ?? newProp,
          })
        );
        return;
      }
    }

    properties.set(newProp.name, newProp);
  }

  function bindAllMembers(node: Node) {
    if (node.symbol) {
      bindMembers(node, node.symbol);
    }
    visitChildren(node, (child) => {
      bindAllMembers(child);
    });
  }

  function bindMembers(node: Node, containerSym: Sym) {
    let containerMembers: Mutable<SymbolTable>;
    // if (containerSym.flags & SymbolFlags.LateBound) {
    //   return;
    // }

    // mutate(containerSym).flags |= SymbolFlags.LateBound;

    switch (node.kind) {
      case SyntaxKind.ModelStatement:
        if (node.extends && node.extends.kind === SyntaxKind.TypeReference) {
          resolveAndCopyMembers(node.extends);
        }
        if (node.is && node.is.kind === SyntaxKind.TypeReference) {
          resolveAndCopyMembers(node.is);
        }
        for (const prop of node.properties) {
          if (prop.kind === SyntaxKind.ModelSpreadProperty) {
            resolveAndCopyMembers(prop.target);
          } else {
            const name = prop.id.kind === SyntaxKind.Identifier ? prop.id.sv : prop.id.value;
            bindMember(name, prop, SymbolFlags.ModelProperty);
          }
        }
        break;
      case SyntaxKind.EnumStatement:
        for (const member of node.members.values()) {
          if (member.kind === SyntaxKind.EnumSpreadMember) {
            resolveAndCopyMembers(member.target);
          } else {
            const name = member.id.kind === SyntaxKind.Identifier ? member.id.sv : member.id.value;
            bindMember(name, member, SymbolFlags.EnumMember);
          }
        }
        break;
      case SyntaxKind.InterfaceStatement:
        for (const member of node.operations.values()) {
          bindMember(member.id.sv, member, SymbolFlags.InterfaceMember);
        }
        break;
      case SyntaxKind.UnionStatement:
        for (const variant of node.options.values()) {
          const name = variant.id.kind === SyntaxKind.Identifier ? variant.id.sv : variant.id.value;
          bindMember(name, variant, SymbolFlags.UnionVariant);
        }
        break;
    }

    function resolveAndCopyMembers(node: TypeReferenceNode) {
      let ref = resolveTypeReferenceSym(node, undefined);
      if (ref && ref.flags & SymbolFlags.Alias) {
        ref = getAliasedSymbol(ref, undefined);
      }
      if (ref && ref.members) {
        copyMembers(ref.members);
      }
    }

    function copyMembers(table: SymbolTable) {
      const members = augmentedSymbolTables.get(table) ?? table;
      for (const member of members.values()) {
        bindMember(member.name, member.declarations[0], member.flags);
      }
    }

    function bindMember(name: string, node: Node, kind: SymbolFlags) {
      const sym = createSymbol(node, name, kind, containerSym);
      compilerAssert(containerSym.members, "containerSym.members is undefined");
      containerMembers ??= getOrCreateAugmentedSymbolTable(containerSym.members);
      containerMembers.set(name, sym);
    }
  }

  /**
   * Initializes a late bound symbol for the type. This is generally necessary when attempting to
   * access a symbol for a type that is created during the check phase.
   */
  function lateBindMemberContainer(type: Type) {
    if ((type as any).symbol) return;
    switch (type.kind) {
      case "Model":
        type.symbol = createSymbol(type.node, type.name, SymbolFlags.Model | SymbolFlags.LateBound);
        mutate(type.symbol).type = type;
        break;
      case "Interface":
        type.symbol = createSymbol(
          type.node,
          type.name,
          SymbolFlags.Interface | SymbolFlags.LateBound
        );
        mutate(type.symbol).type = type;
        break;
      case "Union":
        if (!type.name) return; // don't make a symbol for anonymous unions
        type.symbol = createSymbol(type.node, type.name, SymbolFlags.Union | SymbolFlags.LateBound);
        mutate(type.symbol).type = type;
        break;
    }
  }
  function lateBindMembers(type: Type, containerSym: Sym) {
    let containerMembers: Mutable<SymbolTable> | undefined;

    switch (type.kind) {
      case "Model":
        for (const prop of walkPropertiesInherited(type)) {
          lateBindMember(prop, SymbolFlags.ModelProperty);
        }
        break;
      case "Enum":
        for (const member of type.members.values()) {
          lateBindMember(member, SymbolFlags.EnumMember);
        }
        break;
      case "Interface":
        for (const member of type.operations.values()) {
          lateBindMember(member, SymbolFlags.InterfaceMember);
        }
        break;
      case "Union":
        for (const variant of type.variants.values()) {
          lateBindMember(variant, SymbolFlags.UnionVariant);
        }
        break;
    }

    function lateBindMember(
      member: Type & { node?: Node; name: string | symbol },
      kind: SymbolFlags
    ) {
      if (!member.node || typeof member.name !== "string") {
        // don't bind anything for union expressions
        return;
      }
      const sym = createSymbol(member.node, member.name, kind | SymbolFlags.LateBound);
      mutate(sym).type = member;
      compilerAssert(containerSym.members, "containerSym.members is undefined");
      containerMembers ??= getOrCreateAugmentedSymbolTable(containerSym.members);
      containerMembers.set(member.name, sym);
    }
  }
  function checkClassHeritage(
    model: ModelStatementNode,
    heritageRef: Expression,
    mapper: TypeMapper | undefined
  ): Model | undefined {
    if (heritageRef.kind === SyntaxKind.ModelExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "extend-model",
          messageId: "modelExpression",
          target: heritageRef,
        })
      );
      return undefined;
    }
    if (heritageRef.kind !== SyntaxKind.TypeReference) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "extend-model",
          target: heritageRef,
        })
      );
      return undefined;
    }
    const modelSymId = getNodeSymId(model);
    pendingResolutions.add(modelSymId);

    const target = resolveTypeReferenceSym(heritageRef, mapper);
    if (target === undefined) {
      return undefined;
    }

    if (pendingResolutions.has(getNodeSymId(target.declarations[0] as any))) {
      if (mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-base-type",
            format: { typeName: (target.declarations[0] as any).id.sv },
            target: target,
          })
        );
      }
      return undefined;
    }
    const heritageType = checkTypeReferenceSymbol(target, heritageRef, mapper);
    pendingResolutions.delete(modelSymId);
    if (isErrorType(heritageType)) {
      compilerAssert(program.hasError(), "Should already have reported an error.", heritageRef);
      return undefined;
    }

    if (heritageType.kind !== "Model") {
      reportCheckerDiagnostic(createDiagnostic({ code: "extend-model", target: heritageRef }));
      return undefined;
    }

    if (heritageType.name === "") {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "extend-model",
          messageId: "modelExpression",
          target: heritageRef,
        })
      );
    }

    return heritageType;
  }

  function checkModelIs(
    model: ModelStatementNode,
    isExpr: Expression | undefined,
    mapper: TypeMapper | undefined
  ): Model | undefined {
    if (!isExpr) return undefined;

    const modelSymId = getNodeSymId(model);
    pendingResolutions.add(modelSymId);
    let isType;
    if (isExpr.kind === SyntaxKind.ModelExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "is-model",
          messageId: "modelExpression",
          target: isExpr,
        })
      );
      return undefined;
    } else if (isExpr.kind === SyntaxKind.ArrayExpression) {
      isType = checkArrayExpression(isExpr, mapper);
    } else if (isExpr.kind === SyntaxKind.TypeReference) {
      const target = resolveTypeReferenceSym(isExpr, mapper);
      if (target === undefined) {
        return undefined;
      }
      if (pendingResolutions.has(getNodeSymId(target.declarations[0] as any))) {
        if (mapper === undefined) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "circular-base-type",
              format: { typeName: (target.declarations[0] as any).id.sv },
              target: target,
            })
          );
        }
        return undefined;
      }
      isType = checkTypeReferenceSymbol(target, isExpr, mapper);
    } else {
      reportCheckerDiagnostic(createDiagnostic({ code: "is-model", target: isExpr }));
      return undefined;
    }

    pendingResolutions.delete(modelSymId);

    if (isType.kind !== "Model") {
      reportCheckerDiagnostic(createDiagnostic({ code: "is-model", target: isExpr }));
      return;
    }

    if (isType.name === "") {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "is-model", messageId: "modelExpression", target: isExpr })
      );
    }

    return isType;
  }

  function checkSpreadProperty(
    targetNode: TypeReferenceNode,
    parentModel: Model,
    mapper: TypeMapper | undefined
  ): ModelProperty[] {
    const targetType = getTypeForNode(targetNode, mapper);

    if (targetType.kind === "TemplateParameter" || isErrorType(targetType)) {
      return [];
    }
    if (targetType.kind !== "Model") {
      reportCheckerDiagnostic(createDiagnostic({ code: "spread-model", target: targetNode }));
      return [];
    }

    const props: ModelProperty[] = [];
    // copy each property
    for (const prop of walkPropertiesInherited(targetType)) {
      props.push(
        cloneType(prop, {
          sourceProperty: prop,
          model: parentModel,
        })
      );
    }
    return props;
  }

  /**
   * Link a computed model property to its model member symbols.
   * @param containerNode Model Node
   * @param member New Property
   * @param mapper Type Mapper.
   */
  function linkComputedMember(
    containerNode: MemberContainerNode,
    member: MemberType,
    mapper: TypeMapper | undefined
  ) {
    if (mapper !== undefined) {
      return;
    }
    compilerAssert(typeof member.name === "string", "Cannot link unmapped unions");
    if (containerNode.symbol === undefined) {
      return;
    }
    compilerAssert(
      containerNode.symbol.members,
      `Expected container node ${SyntaxKind[containerNode.kind]} to have members.`
    );
    const memberSym = getOrCreateAugmentedSymbolTable(containerNode.symbol.members).get(
      member.name
    )!;
    const links = getSymbolLinks(memberSym);
    linkMemberType(links, member, mapper);
  }

  function checkModelProperty(
    prop: ModelPropertyNode,
    mapper: TypeMapper | undefined
  ): ModelProperty {
    const links = getMemberSymbolLinks(prop);
    if (links && links.declaredType && mapper === undefined) {
      return links.declaredType as ModelProperty;
    }

    const name = prop.id.kind === SyntaxKind.Identifier ? prop.id.sv : prop.id.value;

    const valueType = getTypeForNode(prop.value, mapper);
    const defaultValue = prop.default && checkDefault(prop.default, valueType);

    const type: ModelProperty = createType({
      kind: "ModelProperty",
      name,
      node: prop,
      optional: prop.optional,
      type: valueType,
      decorators: [],
      default: defaultValue,
    });
    if (links) {
      linkType(links, type, mapper);
    }

    type.decorators = checkDecorators(type, prop, mapper);
    const parentTemplate = getParentTemplateNode(prop);
    if (!parentTemplate || shouldCreateTypeForTemplate(parentTemplate, mapper)) {
      finishType(type, mapper);
    }

    return type;
  }

  function isValueType(type: Type): boolean {
    const valueTypes = new Set(["String", "Number", "Boolean", "EnumMember", "Tuple"]);
    return valueTypes.has(type.kind);
  }

  function checkDefault(defaultNode: Node, type: Type): Type {
    const defaultType = getTypeForNode(defaultNode, undefined);
    if (isErrorType(type)) {
      return errorType;
    }
    if (!isValueType(defaultType)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "unsupported-default",
          format: { type: type.kind },
          target: defaultType,
        })
      );
      return errorType;
    }
    const [related, diagnostics] = isTypeAssignableTo(defaultType, type, defaultNode);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
      return errorType;
    } else {
      return defaultType;
    }
  }

  function checkDecorator(
    targetType: Type,
    decNode: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    mapper: TypeMapper | undefined
  ): DecoratorApplication | undefined {
    const sym = resolveTypeReferenceSym(decNode.target, undefined, true);
    if (!sym) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "unknown-decorator",
          target: decNode,
        })
      );
      return undefined;
    }
    if (!(sym.flags & SymbolFlags.Decorator)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-decorator",
          format: { id: sym.name },
          target: decNode,
        })
      );
      return undefined;
    }

    const symbolLinks = getSymbolLinks(sym);

    const args = checkDecoratorArguments(decNode, mapper);
    let hasError = false;
    if (symbolLinks.declaredType === undefined) {
      const decoratorDeclNode: DecoratorDeclarationStatementNode | undefined =
        sym.declarations.find(
          (x): x is DecoratorDeclarationStatementNode =>
            x.kind === SyntaxKind.DecoratorDeclarationStatement
        );
      if (decoratorDeclNode) {
        checkDecoratorDeclaration(decoratorDeclNode, mapper);
      }
    }
    if (symbolLinks.declaredType) {
      compilerAssert(
        symbolLinks.declaredType.kind === ("Decorator" as const),
        "Expected to find a decorator type."
      );
      // Means we have a decorator declaration.
      hasError = checkDecoratorUsage(targetType, symbolLinks.declaredType, args, decNode);
    }
    if (hasError) {
      return undefined;
    }
    return {
      decorator: sym.value ?? ((...args: any[]) => {}),
      node: decNode,
      args,
    };
  }

  function checkDecoratorUsage(
    targetType: Type,
    declaration: Decorator,
    args: DecoratorArgument[],
    decoratorNode: Node
  ): boolean {
    let hasError = false;
    const [targetValid] = isTypeAssignableTo(targetType, declaration.target.type, decoratorNode);
    if (!targetValid) {
      hasError = true;
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "decorator-wrong-target",
          messageId: "withExpected",
          format: {
            decorator: declaration.name,
            to: getTypeName(targetType),
            expected: getTypeName(declaration.target.type),
          },
          target: decoratorNode,
        })
      );
    }
    const minArgs = declaration.parameters.filter((x) => !x.optional && !x.rest).length;
    const maxArgs = declaration.parameters[declaration.parameters.length - 1]?.rest
      ? undefined
      : declaration.parameters.length;

    if (args.length < minArgs || (maxArgs !== undefined && args.length > maxArgs)) {
      if (maxArgs === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            messageId: "atLeast",
            format: { actual: args.length.toString(), expected: minArgs.toString() },
            target: decoratorNode,
          })
        );
      } else {
        const expected = minArgs === maxArgs ? minArgs.toString() : `${minArgs}-${maxArgs}`;
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            format: { actual: args.length.toString(), expected },
            target: decoratorNode,
          })
        );
      }
    }
    for (const [index, parameter] of declaration.parameters.entries()) {
      if (parameter.rest) {
        const restType =
          parameter.type.kind === "Model" ? parameter.type.indexer?.value : undefined;
        if (restType) {
          for (let i = index; i < args.length; i++) {
            const arg = args[i];
            if (arg && arg.value) {
              if (!checkArgumentAssignable(arg.value, restType, arg.node!)) {
                hasError = true;
              }
            }
          }
        }
        break;
      }
      const arg = args[index];
      if (arg && arg.value) {
        if (!checkArgumentAssignable(arg.value, parameter.type, arg.node!)) {
          hasError = true;
        }
      }
    }
    return hasError;
  }

  function checkArgumentAssignable(
    argumentType: Type,
    parameterType: Type,
    diagnosticTarget: DiagnosticTarget
  ): boolean {
    const [valid] = isTypeAssignableTo(argumentType, parameterType, diagnosticTarget);
    if (!valid) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-argument",
          format: {
            value: getTypeName(argumentType),
            expected: getTypeName(parameterType),
          },
          target: diagnosticTarget,
        })
      );
    }
    return valid;
  }

  function checkDecorators(
    targetType: Type,
    node: Node & { decorators: readonly DecoratorExpressionNode[] },
    mapper: TypeMapper | undefined
  ) {
    const sym = isMemberNode(node) ? getMemberSymbol(node) ?? node.symbol : node.symbol;
    const decorators: DecoratorApplication[] = [];
    const decoratorNodes = [
      ...node.decorators,
      ...((sym && augmentDecoratorsForSym.get(sym)) ?? []),
    ];
    for (const decNode of decoratorNodes) {
      const decorator = checkDecorator(targetType, decNode, mapper);
      if (decorator) {
        decorators.unshift(decorator);
      }
    }

    return decorators;
  }

  function checkDecoratorArguments(
    decorator: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    mapper: TypeMapper | undefined
  ): DecoratorArgument[] {
    return decorator.arguments.map((argNode): DecoratorArgument => {
      const type = getTypeForNode(argNode, mapper);
      return {
        value: type,
        node: argNode,
      };
    });
  }

  function checkScalar(node: ScalarStatementNode, mapper: TypeMapper | undefined): Scalar {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }
    const decorators: DecoratorApplication[] = [];

    const type: Scalar = createType({
      kind: "Scalar",
      name: node.id.sv,
      node: node,
      namespace: getParentNamespaceType(node),
      decorators,
      derivedScalars: [],
    });
    linkType(links, type, mapper);

    if (node.extends) {
      type.baseScalar = checkScalarExtends(node, node.extends, mapper);
      if (type.baseScalar) {
        checkDeprecated(type.baseScalar, node.extends);
        type.baseScalar.derivedScalars.push(type);
      }
    }
    decorators.push(...checkDecorators(type, node, mapper));

    if (mapper === undefined) {
      type.namespace?.scalars.set(type.name, type);
    }
    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(type, mapper);
    }
    if (isInCadlNamespace(type)) {
      stdTypes[type.name as any as keyof StdTypes] = type as any;
    }

    return type;
  }

  function checkScalarExtends(
    scalar: ScalarStatementNode,
    extendsRef: TypeReferenceNode,
    mapper: TypeMapper | undefined
  ): Scalar | undefined {
    const symId = getNodeSymId(scalar);
    pendingResolutions.add(symId);

    const target = resolveTypeReferenceSym(extendsRef, mapper);
    if (target === undefined) {
      return undefined;
    }

    if (pendingResolutions.has(getNodeSymId(target.declarations[0] as any))) {
      if (mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-base-type",
            format: { typeName: (target.declarations[0] as any).id.sv },
            target: target,
          })
        );
      }
      return undefined;
    }
    const extendsType = checkTypeReferenceSymbol(target, extendsRef, mapper);
    pendingResolutions.delete(symId);
    if (isErrorType(extendsType)) {
      compilerAssert(program.hasError(), "Should already have reported an error.", extendsRef);
      return undefined;
    }

    if (extendsType.kind !== "Scalar") {
      reportCheckerDiagnostic(createDiagnostic({ code: "extend-model", target: extendsRef }));
      return undefined;
    }

    return extendsType;
  }

  function checkAlias(node: AliasStatementNode, mapper: TypeMapper | undefined): Type {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      return links.declaredType;
    }

    const aliasSymId = getNodeSymId(node);
    if (pendingResolutions.has(aliasSymId)) {
      if (mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-alias-type",
            format: { typeName: node.id.sv },
            target: node,
          })
        );
      }
      links.declaredType = errorType;
      return errorType;
    }

    pendingResolutions.add(aliasSymId);
    const type = getTypeForNode(node.value, mapper);
    linkType(links, type, mapper);
    pendingResolutions.delete(aliasSymId);

    return type;
  }

  function checkEnum(node: EnumStatementNode, mapper: TypeMapper | undefined): Type {
    const links = getSymbolLinks(node.symbol);
    if (!links.type) {
      const enumType: Enum = (links.type = createType({
        kind: "Enum",
        name: node.id.sv,
        node,
        members: new Map(),
        decorators: [],
      }));

      const memberNames = new Set<string>();

      for (const member of node.members) {
        if (member.kind === SyntaxKind.EnumMember) {
          const memberType = checkEnumMember(enumType, member, mapper, memberNames);
          if (memberType) {
            enumType.members.set(memberType.name, memberType);
          }
        } else {
          const members = checkEnumSpreadMember(enumType, member.target, mapper, memberNames);
          for (const memberType of members) {
            linkComputedMember(node, memberType, mapper);
            enumType.members.set(memberType.name, memberType);
          }
        }
      }

      const namespace = getParentNamespaceType(node);
      enumType.namespace = namespace;
      enumType.namespace?.enums.set(enumType.name!, enumType);
      enumType.decorators = checkDecorators(enumType, node, mapper);

      finishType(enumType, mapper);
    }

    return links.type;
  }

  function checkInterface(node: InterfaceStatementNode, mapper: TypeMapper | undefined): Interface {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as Interface;
    }

    const interfaceType: Interface = createType({
      kind: "Interface",
      decorators: [],
      node,
      namespace: getParentNamespaceType(node),
      operations: new Map(),
      name: node.id.sv,
    });

    interfaceType.decorators = checkDecorators(interfaceType, node, mapper);

    linkType(links, interfaceType, mapper);

    for (const extendsNode of node.extends) {
      const extendsType = getTypeForNode(extendsNode, mapper);
      if (extendsType.kind !== "Interface") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "extends-interface", target: extendsNode })
        );
        continue;
      }

      for (const newMember of extendsType.operations.values()) {
        if (interfaceType.operations.has(newMember.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "extends-interface-duplicate",
              format: { name: newMember.name },
              target: extendsNode,
            })
          );
        }

        interfaceType.operations.set(
          newMember.name,
          cloneType(newMember, { interface: interfaceType })
        );
      }
    }

    checkInterfaceMembers(node, mapper, interfaceType);

    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(interfaceType, mapper);
    }

    if (mapper === undefined) {
      interfaceType.namespace?.interfaces.set(interfaceType.name, interfaceType);
    }

    return interfaceType;
  }

  function checkInterfaceMembers(
    node: InterfaceStatementNode,
    mapper: TypeMapper | undefined,
    interfaceType: Interface
  ) {
    const ownMembers = new Map<string, Operation>();

    for (const opNode of node.operations) {
      const opType = checkOperation(opNode, mapper, interfaceType);
      if (opType.kind === "Operation") {
        if (ownMembers.has(opType.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "interface-duplicate",
              format: { name: opType.name },
              target: opNode,
            })
          );
          continue;
        }
        ownMembers.set(opType.name, opType);
        interfaceType.operations.set(opType.name, opType);
      }
    }
  }

  function checkUnion(node: UnionStatementNode, mapper: TypeMapper | undefined) {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this union and we've already checked it
      return links.declaredType as Union;
    }

    const variants = new Map<string, UnionVariant>();
    const unionType: Union = createType({
      kind: "Union",
      decorators: [],
      node,
      namespace: getParentNamespaceType(node),
      name: node.id.sv,
      variants,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: false,
    });
    unionType.decorators = checkDecorators(unionType, node, mapper);

    checkUnionVariants(unionType, node, variants, mapper);

    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(unionType, mapper);
    }

    linkType(links, unionType, mapper);
    if (mapper === undefined) {
      unionType.namespace?.unions.set(unionType.name!, unionType);
    }

    return unionType;
  }

  function checkUnionVariants(
    parentUnion: Union,
    node: UnionStatementNode,
    variants: Map<string, UnionVariant>,
    mapper: TypeMapper | undefined
  ) {
    for (const variantNode of node.options) {
      const variantType = checkUnionVariant(variantNode, mapper);
      variantType.union = parentUnion;
      if (variants.has(variantType.name as string)) {
        reportCheckerDiagnostic(
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

  function checkUnionVariant(
    variantNode: UnionVariantNode,
    mapper: TypeMapper | undefined
  ): UnionVariant {
    const links = getMemberSymbolLinks(variantNode);
    if (links && links.declaredType && mapper === undefined) {
      // we're not instantiating this union variant and we've already checked it
      return links.declaredType as UnionVariant;
    }

    const name =
      variantNode.id.kind === SyntaxKind.Identifier ? variantNode.id.sv : variantNode.id.value;
    const type = getTypeForNode(variantNode.value, mapper);
    const variantType: UnionVariant = createType({
      kind: "UnionVariant",
      name,
      node: variantNode,
      decorators: [],
      type,
      union: undefined as any,
    });
    variantType.decorators = checkDecorators(variantType, variantNode, mapper);

    if (shouldCreateTypeForTemplate(variantNode.parent!, mapper)) {
      finishType(variantType, mapper);
    }
    if (links) {
      linkType(links, variantType, mapper);
    }

    return variantType;
  }

  function isMemberNode(node: Node): node is MemberNode {
    return (
      node.kind === SyntaxKind.ModelProperty ||
      node.kind === SyntaxKind.EnumMember ||
      node.kind === SyntaxKind.OperationStatement ||
      node.kind === SyntaxKind.UnionVariant
    );
  }

  function getMemberSymbol(node: MemberNode): Sym | undefined {
    const name = node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value;
    const parentSym = node.parent?.symbol;
    return parentSym ? getOrCreateAugmentedSymbolTable(parentSym.members!).get(name) : undefined;
  }

  function getMemberSymbolLinks(node: MemberNode): SymbolLinks | undefined {
    const sym = getMemberSymbol(node);
    return sym ? getSymbolLinks(sym) : undefined;
  }

  function checkEnumMember(
    parentEnum: Enum,
    node: EnumMemberNode,
    mapper: TypeMapper | undefined,
    existingMemberNames: Set<string>
  ): EnumMember | undefined {
    const links = getMemberSymbolLinks(node);
    if (links?.type) {
      return links.type as EnumMember;
    }
    const name = node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value;
    const value = node.value ? node.value.value : undefined;
    if (existingMemberNames.has(name)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "enum-member-duplicate",
          format: { name: name },
          target: node,
        })
      );
      return;
    }
    existingMemberNames.add(name);
    const member: EnumMember = createType({
      kind: "EnumMember",
      enum: parentEnum,
      name,
      node,
      value,
      decorators: [],
    });
    if (links) {
      links.type = member;
    }

    member.decorators = checkDecorators(member, node, mapper);
    return finishType(member);
  }

  function checkEnumSpreadMember(
    parentEnum: Enum,
    targetNode: TypeReferenceNode,
    mapper: TypeMapper | undefined,
    existingMemberNames: Set<string>
  ): EnumMember[] {
    const members: EnumMember[] = [];
    const targetType = getTypeForNode(targetNode, mapper);

    if (!isErrorType(targetType)) {
      if (targetType.kind !== "Enum") {
        reportCheckerDiagnostic(createDiagnostic({ code: "spread-enum", target: targetNode }));
        return members;
      }

      for (const member of targetType.members.values()) {
        if (existingMemberNames.has(member.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "enum-member-duplicate",
              format: { name: member.name },
              target: targetNode,
            })
          );
        } else {
          existingMemberNames.add(member.name);
          const clonedMember = cloneType(member, {
            enum: parentEnum,
            sourceMember: member,
          });
          if (clonedMember) {
            members.push(clonedMember);
          }
        }
      }
    }

    return members;
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

  function finishType<T extends Type>(typeDef: T, mapper?: TypeMapper): T {
    return finishTypeForProgramAndChecker(program, typePrototype, typeDef, mapper);
  }

  function getLiteralType(node: StringLiteralNode): StringLiteral;
  function getLiteralType(node: NumericLiteralNode): NumericLiteral;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteral;
  function getLiteralType(node: LiteralNode): LiteralType;
  function getLiteralType(node: LiteralNode): LiteralType {
    return createLiteralType(node.value, node);
  }

  function mergeSymbolTable(source: SymbolTable, target: Mutable<SymbolTable>) {
    for (const [sym, duplicates] of source.duplicates) {
      const targetSet = target.duplicates.get(sym);
      if (targetSet === undefined) {
        mutate(target.duplicates).set(sym, new Set([...duplicates]));
      } else {
        for (const duplicate of duplicates) {
          mutate(targetSet).add(duplicate);
        }
      }
    }

    for (const [key, sourceBinding] of source) {
      if (sourceBinding.flags & SymbolFlags.Namespace) {
        let targetBinding = target.get(key);
        if (!targetBinding) {
          targetBinding = {
            ...sourceBinding,
            declarations: [],
            exports: createSymbolTable(),
          };
          target.set(key, targetBinding);
        }
        if (targetBinding.flags & SymbolFlags.Namespace) {
          mergedSymbols.set(sourceBinding, targetBinding);
          mutate(targetBinding.declarations).push(...sourceBinding.declarations);
          mergeSymbolTable(sourceBinding.exports!, mutate(targetBinding.exports!));
        } else {
          // this will set a duplicate error
          target.set(key, sourceBinding);
        }
      } else if (
        sourceBinding.flags & SymbolFlags.Declaration ||
        sourceBinding.flags & SymbolFlags.Implementation
      ) {
        if (sourceBinding.flags & SymbolFlags.Decorator) {
          mergeDeclarationOrImplementation(key, sourceBinding, target, SymbolFlags.Decorator);
        } else if (sourceBinding.flags & SymbolFlags.Function) {
          mergeDeclarationOrImplementation(key, sourceBinding, target, SymbolFlags.Function);
        } else {
          target.set(key, sourceBinding);
        }
      } else {
        target.set(key, sourceBinding);
      }
    }
  }

  function mergeDeclarationOrImplementation(
    key: string,
    sourceBinding: Sym,
    target: Mutable<SymbolTable>,
    expectTargetFlags: SymbolFlags
  ) {
    const targetBinding = target.get(key);
    if (!targetBinding || !(targetBinding.flags & expectTargetFlags)) {
      target.set(key, sourceBinding);
      return;
    }
    const isSourceDeclaration = sourceBinding.flags & SymbolFlags.Declaration;
    const isSourceImplementation = sourceBinding.flags & SymbolFlags.Implementation;
    const isTargetDeclaration = targetBinding.flags & SymbolFlags.Declaration;
    const isTargetImplementation = targetBinding.flags & SymbolFlags.Implementation;
    if (isTargetDeclaration && isTargetImplementation) {
      // If the target already has both a declration and implementation set the symbol which will mark it as duplicate
      target.set(key, sourceBinding);
    } else if (isTargetDeclaration && isSourceImplementation) {
      mergedSymbols.set(sourceBinding, targetBinding);
      mutate(targetBinding).value = sourceBinding.value;
      mutate(targetBinding).flags |= sourceBinding.flags;
      mutate(targetBinding.declarations).push(...sourceBinding.declarations);
    } else if (isTargetImplementation && isSourceDeclaration) {
      mergedSymbols.set(sourceBinding, targetBinding);
      mutate(targetBinding).flags |= sourceBinding.flags;
      mutate(targetBinding.declarations).unshift(...sourceBinding.declarations);
    } else {
      // this will set a duplicate error
      target.set(key, sourceBinding);
    }
  }

  function getMergedSymbol(sym: Sym): Sym {
    if (!sym) return sym;
    return mergedSymbols.get(sym) || sym;
  }

  function createGlobalNamespaceNode(): NamespaceStatementNode {
    const nsId: IdentifierNode = {
      kind: SyntaxKind.Identifier,
      pos: 0,
      end: 0,
      sv: "global",
      symbol: undefined!,
      flags: NodeFlags.Synthetic,
    };

    const nsNode: NamespaceStatementNode = {
      kind: SyntaxKind.NamespaceStatement,
      decorators: [],
      pos: 0,
      end: 0,
      id: nsId,
      symbol: undefined!,
      locals: createSymbolTable(),
      flags: NodeFlags.Synthetic,
    };

    mutate(nsNode).symbol = createSymbol(nsNode, nsId.sv, SymbolFlags.Namespace);
    mutate(nsNode.symbol.exports).set(nsId.sv, nsNode.symbol);
    return nsNode;
  }

  function createGlobalNamespaceType(): Namespace {
    const type = createAndFinishType({
      kind: "Namespace",
      name: "",
      node: globalNamespaceNode,
      models: new Map(),
      scalars: new Map(),
      operations: new Map(),
      namespaces: new Map(),
      interfaces: new Map(),
      unions: new Map(),
      enums: new Map(),
      decoratorDeclarations: new Map(),
      functionDeclarations: new Map(),
      decorators: [],
    });
    getSymbolLinks(globalNamespaceNode.symbol).type = type;
    return type;
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
  function cloneType<T extends Type>(type: T, additionalProps: Partial<T> = {}): T {
    // TODO: this needs to handle other types
    let clone: Type;
    switch (type.kind) {
      case "Model":
        const newModel = createType<Model>({
          ...type,
          decorators: [...type.decorators],
          properties: undefined!,
          ...additionalProps,
        });
        if (!("properties" in additionalProps)) {
          newModel.properties = new Map(
            Array.from(type.properties.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { model: newModel }),
            ])
          );
        }
        clone = finishType(newModel);
        break;

      case "Union":
        const newUnion = createType<Union>({
          ...type,
          decorators: [...type.decorators],
          variants: undefined!,
          get options() {
            return Array.from(this.variants.values()).map((v: any) => v.type);
          },
          ...additionalProps,
        });
        if (!("variants" in additionalProps)) {
          newUnion.variants = new Map(
            Array.from(type.variants.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { union: newUnion }),
            ])
          );
        }
        clone = finishType(newUnion);
        break;

      case "Interface":
        const newInterface = createType<Interface>({
          ...type,
          decorators: [...type.decorators],
          operations: undefined!,
          ...additionalProps,
        });
        if (!("operations" in additionalProps)) {
          newInterface.operations = new Map(
            Array.from(type.operations.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { interface: newInterface }),
            ])
          );
        }
        clone = finishType(newInterface);
        break;

      case "Enum":
        const newEnum = createType<Enum>({
          ...type,
          decorators: [...type.decorators],
          members: undefined!,
          ...additionalProps,
        });
        if (!("members" in additionalProps)) {
          newEnum.members = new Map(
            Array.from(type.members.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { enum: newEnum }),
            ])
          );
        }
        clone = finishType(newEnum);
        break;

      default:
        clone = createAndFinishType({
          ...type,
          ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          ...additionalProps,
        });
        break;
    }

    const projection = projectionsByType.get(type);
    if (projection) {
      projectionsByType.set(clone, projection);
    }

    compilerAssert(clone.kind === type.kind, "cloneType must not change type kind");
    return clone as T;
  }

  function checkProjectionDeclaration(node: ProjectionStatementNode): Type {
    // todo: check for duplicate projection decls on individual types
    // right now you can declare the same projection on a specific type
    // this could maybe go in the binder? But right now we don't know
    // what an identifier resolves to until check time.
    const links = getSymbolLinks(node.symbol);
    if (processedProjections.has(node)) {
      return links.declaredType!;
    }
    processedProjections.add(node);
    reportCheckerDiagnostic(
      createDiagnostic({ code: "projections-are-experimental", target: node })
    );

    let type;

    if (links.declaredType) {
      type = links.declaredType as Projection;
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
        const projected = checkTypeReference(node.selector, undefined);
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
      case SyntaxKind.UnknownKeyword:
        return unknownType;
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
    const modelType: Model = createType({
      kind: "Model",
      name: "",
      node: node,
      decorators: [],
      properties: new Map(),
      derivedModels: [],
    });

    for (const propNode of node.properties) {
      if (propNode.kind === SyntaxKind.ProjectionModelProperty) {
        const prop = evalProjectionModelProperty(propNode, modelType);
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
    node: ProjectionModelPropertyNode,
    model: Model
  ): ModelProperty | ReturnRecord {
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
      model,
    });
  }

  function evalProjectionModelSpreadProperty(
    node: ProjectionModelSpreadPropertyNode
  ): ModelProperty[] | ReturnRecord {
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
      const stmtValue = evalProjectionNode(stmt);
      if (stmtValue.kind === "Return") {
        return stmtValue;
      }
      lastVal = stmtValue;
    }

    return lastVal;
  }

  function evalProjectionArithmeticExpression(
    node: ProjectionArithmeticExpressionNode
  ): StringLiteral | NumericLiteral | ReturnRecord {
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
      return createLiteralType((lhs as StringLiteral).value + (rhs as StringLiteral).value);
    } else {
      return createLiteralType((lhs as NumericLiteral).value + (rhs as NumericLiteral).value);
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
        throw new ProjectionError(
          "need argument for parameter " + SyntaxKind[node.parameters[i].kind]
        );
      }

      const argVal = args[i];
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

  function evalProjectionExpressionStatement(node: ProjectionExpressionStatementNode) {
    return evalProjectionNode(node.expr);
  }

  function evalProjectionCallExpression(node: ProjectionCallExpressionNode): any {
    const target = evalProjectionNode(node.target);

    if (!target) throw new ProjectionError("target undefined");
    const args = [];
    for (const arg of node.arguments) {
      args.push(evalProjectionNode(arg));
    }

    if (target.kind !== "Function") {
      throw new ProjectionError("Can't call non-function, got type " + target.kind);
    }

    return target.implementation(...args);
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
          const sym = base.node.symbol.exports!.get(member);
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
          const enumMember = base.members.get(member);
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
    const parameters: FunctionParameter[] = [];
    return createType({
      kind: "Function",
      name: "",
      parameters,
      returnType: unknownType,
      implementation: fn as any,
    } as const);
  }

  function createLiteralType(value: string, node?: StringLiteralNode): StringLiteral;
  function createLiteralType(value: number, node?: NumericLiteralNode): NumericLiteral;
  function createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteral | NumericLiteral | BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode
  ): StringLiteral | NumericLiteral | BooleanLiteral {
    if (program.literalTypes.has(value)) {
      return program.literalTypes.get(value)!;
    }
    let type: StringLiteral | NumericLiteral | BooleanLiteral;

    switch (typeof value) {
      case "string":
        type = createType({ kind: "String", value });
        break;
      case "boolean":
        type = createType({ kind: "Boolean", value });
        break;
      case "number":
        type = createType({
          kind: "Number",
          value,
        });
        break;
    }
    program.literalTypes.set(value, type);
    return type;
  }

  function evalProjectionDecoratorReference(
    node: ProjectionDecoratorReferenceExpressionNode
  ): Type {
    const ref = resolveTypeReferenceSym(node.target, undefined, true);
    if (!ref) throw new ProjectionError("Can't find decorator.");
    compilerAssert(ref.flags & SymbolFlags.Decorator, "should only resolve decorator symbols");
    return createFunctionType((...args: Type[]): Type => {
      ref.value!({ program }, ...marshalArgumentsForJS(args));
      return voidType;
    });
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
    const ref = resolveTypeReferenceSym(node, undefined);
    if (!ref) throw new ProjectionError("Unknown identifier " + node.sv);

    if (ref.flags & SymbolFlags.Decorator) {
      // shouldn't ever resolve a decorator symbol here (without passing
      // true to resolveTypeReference)
      return errorType;
    } else if (ref.flags & SymbolFlags.Function) {
      // TODO: store this in a symbol link probably?
      const t: FunctionType = createFunctionType((...args: Type[]): Type => {
        const retval = ref.value!(program, ...marshalArgumentsForJS(args));
        return marshalProjectionReturn(retval, { functionName: node.sv });
      });
      return t;
    } else {
      const links = getSymbolLinks(ref);
      compilerAssert(links.declaredType, "Should have checked all types by now");

      return links.declaredType;
    }
  }

  interface MarshalOptions {
    /**
     * Name of the function in case of error.
     */
    functionName?: string;
  }

  function marshalProjectionReturn(value: unknown, options: MarshalOptions = {}): Type {
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

    if (options.functionName) {
      throw new ProjectionError(
        `Can't marshal value "${value}" returned from JS function "${options.functionName}" into cadl`
      );
    } else {
      throw new ProjectionError(`Can't marshal value "${value}" into cadl`);
    }
  }

  function evalProjectionLambdaExpression(node: ProjectionLambdaExpressionNode): FunctionType {
    return createFunctionType((...args: Type[]): Type => {
      return callLambdaExpression(node, args);
    });
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

  function evalStringLiteral(node: StringLiteralNode): StringLiteral {
    return createLiteralType(node.value, node);
  }

  function evalNumericLiteral(node: NumericLiteralNode): NumericLiteral {
    return createLiteralType(node.value, node);
  }

  function evalBooleanLiteral(node: BooleanLiteralNode): BooleanLiteral {
    return createLiteralType(node.value, node);
  }

  function project(
    target: Type,
    projection: ProjectionNode,
    args: (Type | boolean | string | number)[] = []
  ) {
    return evalProjectionStatement(
      projection,
      target,
      args.map((x) => marshalProjectionReturn(x))
    );
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

  /**
   * Check if the source type can be assigned to the target type and emit diagnostics
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function checkTypeAssignable(
    source: Type,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): boolean {
    const [related, diagnostics] = isTypeAssignableTo(source, target, diagnosticTarget);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
    }
    return related;
  }

  /**
   * Check if the source type can be assigned to the target type.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function isTypeAssignableTo(
    source: Type,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    if (source === target) return [true, []];

    if (source.kind === "TemplateParameter") {
      source = source.constraint ?? unknownType;
    }

    const isSimpleTypeRelated = isSimpleTypeAssignableTo(source, target);

    if (isSimpleTypeRelated === true) {
      return [true, []];
    } else if (isSimpleTypeRelated === false) {
      return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    if (source.kind === "Union") {
      for (const variant of source.variants.values()) {
        const [variantAssignable] = isTypeAssignableTo(variant.type, target, diagnosticTarget);
        if (!variantAssignable) {
          return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      }
      return [true, []];
    }

    if (target.kind === "Model" && target.indexer !== undefined && source.kind === "Model") {
      return isIndexerValid(source, target as Model & { indexer: ModelIndexer }, diagnosticTarget);
    } else if (target.kind === "Model" && source.kind === "Model") {
      return isModelRelatedTo(source, target, diagnosticTarget);
    } else if (target.kind === "Model" && target.indexer && source.kind === "Tuple") {
      for (const item of source.values) {
        const [related, diagnostics] = isTypeAssignableTo(
          item,
          target.indexer.value!,
          diagnosticTarget
        );
        if (!related) {
          return [false, diagnostics];
        }
      }
      return [true, []];
    } else if (target.kind === "Tuple" && source.kind === "Tuple") {
      return isTupleAssignableToTuple(source, target, diagnosticTarget);
    } else if (target.kind === "Union") {
      return isAssignableToUnion(source, target, diagnosticTarget);
    } else if (target.kind === "Enum") {
      return isAssignableToEnum(source, target, diagnosticTarget);
    }

    return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isReflectionType(type: Type): type is Model & { name: ReflectionTypeName } {
    return (
      type.kind === "Model" &&
      type.namespace?.name === "Reflection" &&
      type.namespace?.namespace?.name === "Cadl"
    );
  }

  function isRelatedToScalar(source: Type, target: Scalar): boolean | undefined {
    switch (source.kind) {
      case "Number":
        return (
          areScalarsRelated(target, getStdType("numeric")) &&
          isNumericLiteralRelatedTo(source, target.name as any)
        );
      case "String":
        return areScalarsRelated(target, getStdType("string"));
      case "Boolean":
        return areScalarsRelated(target, getStdType("boolean"));
      case "Scalar":
        return areScalarsRelated(source, target);
      case "Union":
        return undefined;
      default:
        return false;
    }
  }

  function areScalarsRelated(source: Scalar, target: Scalar) {
    let current: Scalar | undefined = source;
    while (current) {
      if (current === target) {
        return true;
      }

      current = current.baseScalar;
    }
    return false;
  }

  function isSimpleTypeAssignableTo(source: Type, target: Type): boolean | undefined {
    if (isVoidType(target) || isNeverType(target)) return false;
    if (isUnknownType(target)) return true;
    if (isReflectionType(target)) {
      return source.kind === ReflectionNameToKind[target.name];
    }

    if (target.kind === "Scalar") {
      return isRelatedToScalar(source, target);
    }

    if (source.kind === "Scalar" && target.kind === "Model") {
      return false;
    }
    if (target.kind === "String") {
      return source.kind === "String" && target.value === source.value;
    }
    if (target.kind === "Number") {
      return source.kind === "Number" && target.value === source.value;
    }
    return undefined;
  }

  function isNumericLiteralRelatedTo(
    source: NumericLiteral,
    targetIntrinsicType:
      | "int64"
      | "int32"
      | "int16"
      | "int8"
      | "uint64"
      | "uint32"
      | "uint16"
      | "uint8"
      | "safeint"
      | "float32"
      | "float64"
      | "numeric"
      | "integer"
      | "float"
  ) {
    if (targetIntrinsicType === "numeric") return true;
    const isInt = Number.isInteger(source.value);
    if (targetIntrinsicType === "integer") return isInt;
    if (targetIntrinsicType === "float") return true;

    const [low, high, options] = numericRanges[targetIntrinsicType];
    return source.value >= low && source.value <= high && (!options.int || isInt);
  }

  function isModelRelatedTo(
    source: Model,
    target: Model,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    const diagnostics: Diagnostic[] = [];
    for (const prop of walkPropertiesInherited(target)) {
      const sourceProperty = getProperty(source, prop.name);
      if (sourceProperty === undefined) {
        if (!prop.optional) {
          diagnostics.push(
            createDiagnostic({
              code: "missing-property",
              format: {
                propertyName: prop.name,
                sourceType: getTypeName(source),
                targetType: getTypeName(target),
              },
              target: source,
            })
          );
        }
      } else {
        const [related, propDiagnostics] = isTypeAssignableTo(
          sourceProperty.type,
          prop.type,
          diagnosticTarget
        );
        if (!related) {
          diagnostics.push(...propDiagnostics);
        }
      }
    }
    return [diagnostics.length === 0, diagnostics];
  }

  function getProperty(model: Model, name: string): ModelProperty | undefined {
    return (
      model.properties.get(name) ??
      (model.baseModel !== undefined ? getProperty(model.baseModel, name) : undefined)
    );
  }

  function isIndexerValid(
    source: Model,
    target: Model & { indexer: ModelIndexer },
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    // Model expressions should be able to be assigned.
    if (source.name === "") {
      return isIndexConstraintValid(target.indexer.value, source, diagnosticTarget);
    } else {
      if (source.indexer === undefined || source.indexer.key !== target.indexer.key) {
        return [
          false,
          [
            createDiagnostic({
              code: "missing-index",
              format: {
                indexType: getTypeName(target.indexer.key),
                sourceType: getTypeName(source),
              },
              target,
            }),
          ],
        ];
      }
      return isTypeAssignableTo(source.indexer.value!, target.indexer.value, diagnosticTarget);
    }
  }
  /**
   * @param constraintType Type of the constraints(All properties must have this type).
   * @param type Type of the model that should be respecting the constraint.
   * @param diagnosticTarget Diagnostic target unless something better can be inferred.
   */
  function isIndexConstraintValid(
    constraintType: Type,
    type: Model,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    for (const prop of type.properties.values()) {
      const [related, diagnostics] = isTypeAssignableTo(
        prop.type,
        constraintType,
        diagnosticTarget
      );
      if (!related) {
        return [false, diagnostics];
      }
    }

    if (type.baseModel) {
      const [related, diagnostics] = isIndexConstraintValid(
        constraintType,
        type.baseModel,
        diagnosticTarget
      );
      if (!related) {
        return [false, diagnostics];
      }
    }
    return [true, []];
  }

  function isTupleAssignableToTuple(
    source: Tuple,
    target: Tuple,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    if (source.values.length !== target.values.length) {
      return [
        false,
        [
          createDiagnostic({
            code: "unassignable",
            messageId: "withDetails",
            format: {
              sourceType: getTypeName(source),
              targetType: getTypeName(target),
              details: `Source has ${source.values.length} element(s) but target requires ${target.values.length}.`,
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    }
    for (const [index, sourceItem] of source.values.entries()) {
      const targetItem = target.values[index];
      const [related, diagnostics] = isTypeAssignableTo(sourceItem, targetItem, diagnosticTarget);
      if (!related) {
        return [false, diagnostics];
      }
    }
    return [true, []];
  }

  function isAssignableToUnion(
    source: Type,
    target: Union,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    for (const option of target.options) {
      const [related] = isTypeAssignableTo(source, option, diagnosticTarget);
      if (related) {
        return [true, []];
      }
    }
    return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isAssignableToEnum(
    source: Type,
    target: Enum,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, Diagnostic[]] {
    switch (source.kind) {
      case "Enum":
        if (source === target) {
          return [true, []];
        } else {
          return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      case "EnumMember":
        if (source.enum === target) {
          return [true, []];
        } else {
          return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      default:
        return [false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
  }

  function createUnassignableDiagnostic(
    source: Type,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ) {
    return createDiagnostic({
      code: "unassignable",
      format: { targetType: getTypeName(target), value: getTypeName(source) },
      target: diagnosticTarget,
    });
  }

  function isStdType(
    type: Scalar,
    stdType?: IntrinsicScalarName
  ): type is Scalar & { name: IntrinsicScalarName };
  function isStdType(type: Type, stdType?: StdTypeName): type is Type & { name: StdTypeName } {
    type = type.projectionBase ?? type;
    if (
      (type.kind !== "Model" && type.kind !== "Scalar") ||
      type.namespace === undefined ||
      !isCadlNamespace(type.namespace)
    )
      return false;
    if (type.kind === "Scalar") return stdType === undefined || stdType === type.name;
    if (stdType === "Array" && type === stdTypes["Array"]) return true;
    if (stdType === "Record" && type === stdTypes["Record"]) return true;
    return false;
  }
}

function isAnonymous(type: Type) {
  return !("name" in type) || typeof type.name !== "string" || !type.name;
}

function isErrorType(type: Type): type is ErrorType {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}

const numericRanges = {
  int64: [BigInt("-9223372036854775807"), BigInt("9223372036854775808"), { int: true }],
  int32: [-2147483648, 2147483647, { int: true }],
  int16: [-32768, 32767, { int: true }],
  int8: [-128, 127, { int: true }],
  uint64: [0, BigInt("18446744073709551615"), { int: true }],
  uint32: [0, 4294967295, { int: true }],
  uint16: [0, 65535, { int: true }],
  uint8: [0, 255, { int: true }],
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { int: true }],
  float32: [-3.4e38, 3.4e38, { int: false }],
  float64: [Number.MIN_VALUE, Number.MAX_VALUE, { int: false }],
} as const;

/**
 * Find all named models that could have been the source of the given
 * property. This includes the named parents of all property sources in a
 * chain.
 */
function getNamedSourceModels(property: ModelProperty): Set<Model> | undefined {
  if (!property.sourceProperty) {
    return undefined;
  }

  const set = new Set<Model>();
  for (let p: ModelProperty | undefined = property; p; p = p.sourceProperty) {
    if (p.model?.name) {
      set.add(p.model);
    }
  }

  return set;
}

/**
 * Find derived types of `models` in `possiblyDerivedModels` and add them to
 * `models`.
 */
function addDerivedModels(models: Set<Model>, possiblyDerivedModels: ReadonlySet<Model>) {
  for (const element of possiblyDerivedModels) {
    if (!models.has(element)) {
      for (let t = element.baseModel; t; t = t.baseModel) {
        if (models.has(t)) {
          models.add(element);
          break;
        }
      }
    }
  }
}

interface TypeMapper {
  getMappedType(type: TemplateParameter): Type;
  args: readonly Type[];
}

function createTypeMapper(parameters: TemplateParameter[], args: Type[]): TypeMapper {
  const map = new Map<TemplateParameter, Type>();

  for (const [index, param] of parameters.entries()) {
    map.set(param, args[index]);
  }

  return {
    args,
    getMappedType: (type: TemplateParameter) => {
      return map.get(type) ?? type;
    },
  };
}

/**
 * If the input is anonymous (or the provided filter removes properties)
 * and there exists a named model with the same set of properties
 * (ignoring filtered properties), then return that named model.
 * Otherwise, return the input unchanged.
 *
 * This can be used by emitters to find a better name for a set of
 * properties after filtering. For example, given `{ @metadata prop:
 * string} & SomeName`, and an emitter that wishes to discard properties
 * marked with `@metadata`, the emitter can use this to recover that the
 * best name for the remaining properties is `SomeName`.
 *
 * @param model The input model
 * @param filter An optional filter to apply to the input model's
 * properties.
 */
export function getEffectiveModelType(
  program: Program,
  model: Model,
  filter?: (property: ModelProperty) => boolean
): Model {
  if (filter) {
    model = filterModelProperties(program, model, filter);
  }

  if (model.name) {
    // named model
    return model;
  }

  // We would need to change the algorithm if this doesn't hold. We
  // assume model has no inherited properties below.
  compilerAssert(!model.baseModel, "Anonymous model with base model.");

  if (model.properties.size === 0) {
    // empty model
    return model;
  }

  // Find the candidate set of named model types that could have been the
  // source of every property in the model.
  let candidates: Set<Model> | undefined;
  for (const property of model.properties.values()) {
    const sources = getNamedSourceModels(property);
    if (!sources) {
      // unsourced property: no possible match
      return model;
    }

    if (!candidates) {
      // first sourced property: initialize candidates to its sources
      candidates = sources;
      continue;
    }

    // Add derived sources as we encounter them. If a model is sourced from
    // a base property, then it can also be sourced from a derived model.
    //
    // (Unless it is overridden, but then the presence of the overridden
    // property will still cause the the base model to be excluded from the
    // candidates.)
    //
    // Note: We depend on the order of that spread and intersect source
    // properties here, which is that we see properties sourced from derived
    // types before properties sourced from their base types.
    addDerivedModels(sources, candidates);

    // remove candidates that are not common to this property.
    for (const candidate of candidates) {
      if (!sources.has(candidate)) {
        candidates.delete(candidate);
      }
    }
  }

  // Search for a candidate that has no additional properties (ignoring
  // filtered properties). If so, it is effectively the same type as the
  // input model. Consider a candidate that meets this test without
  // ignoring filtering as a better match than one that requires filtering
  // to meet this test.
  let match: Model | undefined;
  for (const candidate of candidates ?? []) {
    if (model.properties.size === countPropertiesInherited(candidate)) {
      match = candidate;
      break; // exact match
    }
    if (filter && !match && model.properties.size === countPropertiesInherited(candidate, filter)) {
      match = candidate;
      continue; // match with filter: keep searching for exact match
    }
  }

  return match ?? model;
}

/**
 * Applies a filter to the properties of a given type. If no properties
 * are filtered out, then return the input unchanged. Otherwise, return
 * a new anonymous model with only the filtered properties.
 *
 * @param model The input model to filter.
 * @param filter The filter to apply. Properties are kept when this returns true.
 */
export function filterModelProperties(
  program: Program | ProjectedProgram,
  model: Model,
  filter: (property: ModelProperty) => boolean
): Model {
  let filtered = false;
  for (const property of walkPropertiesInherited(model)) {
    if (!filter(property)) {
      filtered = true;
      break;
    }
  }

  if (!filtered) {
    return model;
  }

  const properties = new Map<string, ModelProperty>();
  const newModel: Model = program.checker.createType({
    kind: "Model",
    node: undefined,
    name: "",
    indexer: undefined,
    properties,
    decorators: [],
    derivedModels: [],
  });

  for (const property of walkPropertiesInherited(model)) {
    if (filter(property)) {
      const newProperty = program.checker.cloneType(property, {
        sourceProperty: property,
        model: newModel,
      });
      properties.set(property.name, newProperty);
    }
  }

  return finishTypeForProgram(program, newModel);
}

/**
 * Gets the property from the nearest base type that is overridden by the
 * given property, if any.
 */
export function getOverriddenProperty(property: ModelProperty): ModelProperty | undefined {
  compilerAssert(
    property.model,
    "Parent model must be set before overridden property can be found."
  );

  for (let current = property.model.baseModel; current; current = current.baseModel) {
    const overridden = current.properties.get(property.name);
    if (overridden) {
      return overridden;
    }
  }

  return undefined;
}

/**
 * Enumerates the properties declared by model or inherited from its base.
 *
 * Properties declared by more derived types are enumerated before properties
 * of less derived types.
 *
 * Properties that are overridden are not enumerated.
 */
export function* walkPropertiesInherited(model: Model) {
  const returned = new Set<string>();

  for (let current: Model | undefined = model; current; current = current.baseModel) {
    for (const property of current.properties.values()) {
      if (returned.has(property.name)) {
        // skip properties that have been overridden
        continue;
      }
      returned.add(property.name);
      yield property;
    }
  }
}

function countPropertiesInherited(model: Model, filter?: (property: ModelProperty) => boolean) {
  let count = 0;
  for (const property of walkPropertiesInherited(model)) {
    if (!filter || filter(property)) {
      count++;
    }
  }
  return count;
}

export function finishTypeForProgram<T extends Type>(
  program: Program,
  typeDef: T,
  mapper?: TypeMapper
): T {
  return finishTypeForProgramAndChecker(program, program.checker.typePrototype, typeDef, mapper);
}

function finishTypeForProgramAndChecker<T extends Type>(
  program: Program,
  typePrototype: TypePrototype,
  typeDef: T,
  mapper?: TypeMapper
): T {
  if (mapper) {
    compilerAssert(
      !(typeDef as any).templateArguments,
      "Mapper provided but template arguments already set."
    );
    (typeDef as any).templateArguments = mapper.args;
  }

  if ("decorators" in typeDef) {
    for (const decApp of typeDef.decorators) {
      applyDecoratorToType(program, decApp, typeDef);
    }
  }

  Object.setPrototypeOf(typeDef, typePrototype);

  return typeDef;
}

function applyDecoratorToType(program: Program, decApp: DecoratorApplication, target: Type) {
  compilerAssert("decorators" in target, "Cannot apply decorator to non-decoratable type", target);

  for (const arg of decApp.args) {
    if (isErrorType(arg.value)) {
      // If one of the decorator argument is an error don't run it.
      return;
    }
  }

  // peel `fn` off to avoid setting `this`.
  try {
    const args = marshalArgumentsForJS(decApp.args.map((x) => x.value));
    const fn = decApp.decorator;
    const context = createDecoratorContext(program, decApp);
    fn(context, target, ...args);
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

function createDecoratorContext(program: Program, decApp: DecoratorApplication): DecoratorContext {
  function createPassThruContext(program: Program, decApp: DecoratorApplication): DecoratorContext {
    return {
      program,
      decoratorTarget: decApp.node!,
      getArgumentTarget: () => decApp.node!,
      call: (decorator, target, ...args) => {
        return decorator(createPassThruContext(program, decApp), target, ...args);
      },
    };
  }

  return {
    program,
    decoratorTarget: decApp.node!,
    getArgumentTarget: (index: number) => {
      return decApp.args[index]?.node;
    },
    call: (decorator, target, ...args) => {
      return decorator(createPassThruContext(program, decApp), target, ...args);
    },
  };
}

/**
 * Convert cadl argument to JS argument.
 */
function marshalArgumentsForJS<T extends Type>(args: T[]): MarshalledValue<T>[] {
  return args.map((arg) => {
    if (arg.kind === "Boolean" || arg.kind === "String" || arg.kind === "Number") {
      return literalTypeToValue(arg);
    }
    return arg as any;
  });
}

function literalTypeToValue<T extends StringLiteral | NumericLiteral | BooleanLiteral>(
  type: T
): MarshalledValue<T> {
  return type.value as any;
}

/**
 * Mapping from the reflection models to Type["kind"] value
 */
const ReflectionNameToKind = {
  Model: "Model",
  ModelProperty: "ModelProperty",
  Interface: "Interface",
  Enum: "Enum",
  EnumMember: "EnumMember",
  TemplateParameter: "TemplateParameter",
  Namespace: "Namespace",
  Operation: "Operation",
  Tuple: "Tuple",
  Union: "Union",
  UnionVariant: "UnionVariant",
} as const;

const _assertReflectionNameToKind: Record<string, Type["kind"]> = ReflectionNameToKind;
