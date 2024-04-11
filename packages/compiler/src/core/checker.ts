import { $docFromComment, getIndexer, isArrayModelType } from "../lib/decorators.js";
import { MultiKeyMap, Mutable, createRekeyableMap, isArray, mutate } from "../utils/misc.js";
import { createSymbol, createSymbolTable } from "./binder.js";
import { createChangeIdentifierCodeFix } from "./compiler-code-fixes/change-identifier.codefix.js";
import { createModelToLiteralCodeFix } from "./compiler-code-fixes/model-to-literal.codefix.js";
import { createTupleToLiteralCodeFix } from "./compiler-code-fixes/tuple-to-literal.codefix.js";
import { getDeprecationDetails, markDeprecated } from "./deprecation.js";
import {
  ProjectionError,
  compilerAssert,
  ignoreDiagnostics,
  reportDeprecated,
} from "./diagnostics.js";
import { validateInheritanceDiscriminatedUnions } from "./helpers/discriminator-utils.js";
import {
  TypeNameOptions,
  getEntityName,
  getNamespaceFullName,
  getTypeName,
  stringTemplateToString,
} from "./helpers/index.js";
import { marshallTypeForJSWithLegacyCast, tryMarshallTypeForJS } from "./js-marshaller.js";
import { createDiagnostic } from "./messages.js";
import { Numeric } from "./numeric.js";
import {
  exprIsBareIdentifier,
  getIdentifierContext,
  hasParseError,
  visitChildren,
} from "./parser.js";
import { Program, ProjectedProgram } from "./program.js";
import { createProjectionMembers } from "./projection-members.js";
import {
  getFullyQualifiedSymbolName,
  getParentTemplateNode,
  isErrorType,
  isNeverType,
  isTemplateInstance,
  isType,
  isUnknownType,
  isValue,
  isVoidType,
} from "./type-utils.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  ArrayModelType,
  ArrayValue,
  AugmentDecoratorStatementNode,
  BooleanLiteral,
  BooleanLiteralNode,
  BooleanValue,
  CallExpressionNode,
  CodeFix,
  ConstStatementNode,
  DecoratedType,
  Decorator,
  DecoratorApplication,
  DecoratorArgument,
  DecoratorContext,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  Diagnostic,
  DiagnosticTarget,
  DocContent,
  Entity,
  Enum,
  EnumMember,
  EnumMemberNode,
  EnumStatementNode,
  EnumValue,
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
  JsNamespaceDeclarationNode,
  JsSourceFileNode,
  LiteralNode,
  LiteralType,
  MemberContainerNode,
  MemberContainerType,
  MemberExpressionNode,
  MemberNode,
  MemberType,
  Model,
  ModelExpressionNode,
  ModelIndexer,
  ModelProperty,
  ModelPropertyNode,
  ModelStatementNode,
  ModifierFlags,
  Namespace,
  NamespaceStatementNode,
  NeverType,
  Node,
  NodeFlags,
  NullType,
  NullValue,
  NumericLiteral,
  NumericLiteralNode,
  NumericValue,
  ObjectLiteralNode,
  ObjectValue,
  ObjectValuePropertyDescriptor,
  Operation,
  OperationStatementNode,
  ParamConstraintUnion,
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
  ScalarConstructor,
  ScalarConstructorNode,
  ScalarStatementNode,
  ScalarValue,
  StdTypeName,
  StdTypes,
  StringLiteral,
  StringLiteralNode,
  StringTemplate,
  StringTemplateExpressionNode,
  StringTemplateHeadNode,
  StringTemplateMiddleNode,
  StringTemplateSpan,
  StringTemplateSpanLiteral,
  StringTemplateSpanValue,
  StringTemplateTailNode,
  StringValue,
  Sym,
  SymbolFlags,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateArgumentNode,
  TemplateDeclarationNode,
  TemplateParameter,
  TemplateParameterDeclarationNode,
  TemplateableNode,
  TemplatedType,
  Tuple,
  TupleExpressionNode,
  TupleLiteralNode,
  Type,
  TypeInstantiationMap,
  TypeMapper,
  TypeOrReturnRecord,
  TypeReferenceNode,
  TypeSpecScriptNode,
  Union,
  UnionExpressionNode,
  UnionStatementNode,
  UnionVariant,
  UnionVariantNode,
  UnknownType,
  Value,
  ValueOfExpressionNode,
  ValueType,
  VoidType,
} from "./types.js";

export type CreateTypeProps = Omit<Type, "isFinished" | keyof TypePrototype>;

export interface Checker {
  typePrototype: TypePrototype;

  getTypeForNode(node: Node): Type;
  setUsingsForFile(file: TypeSpecScriptNode): void;
  checkProgram(): void;
  checkSourceFile(file: TypeSpecScriptNode): void;
  getGlobalNamespaceType(): Namespace;
  getGlobalNamespaceNode(): NamespaceStatementNode;
  getMergedSymbol(sym: Sym | undefined): Sym | undefined;
  mergeSourceFile(file: TypeSpecScriptNode | JsSourceFileNode): void;
  getLiteralType(node: StringLiteralNode): StringLiteral;
  getLiteralType(node: NumericLiteralNode): NumericLiteral;
  getLiteralType(node: BooleanLiteralNode): BooleanLiteral;
  getLiteralType(node: LiteralNode): LiteralType;

  /**
   * @deprecated use `import { getTypeName } from "@typespec/compiler";`
   */
  getTypeName(type: Type, options?: TypeNameOptions): string;

  /**
   * @deprecated use `import { getNamespaceFullName } from "@typespec/compiler";`
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
  resolveCompletions(node: IdentifierNode): Map<string, TypeSpecCompletionItem>;
  createType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T
  ): T & TypePrototype & { isFinished: boolean };
  createAndFinishType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T
  ): T & TypePrototype;
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
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]];

  /**
   * Check if the given type is one of the built-in standard TypeSpec Types.
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

  /** @internal */
  getTypeOrValueForNode(node: Node): Type | Value | null;

  errorType: ErrorType;
  voidType: VoidType;
  neverType: NeverType;
  anyType: UnknownType;
}

interface TypePrototype {
  projections: ProjectionStatementNode[];
  projectionsByName(name: string): ProjectionStatementNode[];
}

/** @deprecated Use TypeSpecCompletionItem */
export type CadlCompletionItem = TypeSpecCompletionItem;

export interface TypeSpecCompletionItem {
  sym: Sym;

  /**
   *  Optional label if different from the text to complete.
   */
  label?: string;

  /**
   * Optional text to be appended to the completion if accepted.
   */
  suffix?: string;
}

/**
 * Maps type arguments to type instantiation.
 */
const TypeInstantiationMap = class
  extends MultiKeyMap<readonly Type[], Type>
  implements TypeInstantiationMap {};

type ReflectionTypeName = keyof typeof ReflectionNameToKind;

let currentSymbolId = 0;

export function createChecker(program: Program): Checker {
  const stdTypes: Partial<StdTypes> = {};
  const symbolLinks = new Map<number, SymbolLinks>();
  const mergedSymbols = new Map<Sym, Sym>();
  const augmentDecoratorsForSym = new Map<Sym, AugmentDecoratorStatementNode[]>();
  const augmentedSymbolTables = new Map<SymbolTable, SymbolTable>();
  const referenceSymCache = new WeakMap<
    TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    Sym | undefined
  >();
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

  // Caches the deprecation test of nodes in the program
  const nodeDeprecationMap = new Map<Node, boolean>();

  const errorType: ErrorType = createType({ kind: "Intrinsic", name: "ErrorType" });
  const voidType = createType({ kind: "Intrinsic", name: "void" } as const);
  const neverType = createType({ kind: "Intrinsic", name: "never" } as const);
  const unknownType = createType({ kind: "Intrinsic", name: "unknown" } as const);
  const nullType = createType({ kind: "Intrinsic", name: "null" } as const);
  const nullSym = createSymbol(undefined, "null", SymbolFlags.None);

  const projectionsByTypeKind = new Map<Type["kind"], ProjectionStatementNode[]>([
    ["Model", []],
    ["ModelProperty", []],
    ["Scalar", []],
    ["Union", []],
    ["UnionVariant", []],
    ["Operation", []],
    ["Interface", []],
    ["Enum", []],
    ["EnumMember", []],
  ]);
  const projectionsByType = new Map<Type, ProjectionStatementNode[]>();
  // whether we've checked this specific projection statement before
  // and added it to the various projection maps.
  const processedProjections = new Set<ProjectionStatementNode>();

  // interpreter state
  let currentProjectionDirection: "to" | "from" | "pre_to" | "pre_from" | undefined;
  /**
   * Set keeping track of node pending type resolution.
   * Key is the SymId of a node. It can be retrieved with getNodeSymId(node)
   */
  const pendingResolutions = new PendingResolutions();

  for (const file of program.jsSourceFiles.values()) {
    mergeSourceFile(file);
  }

  for (const file of program.sourceFiles.values()) {
    mergeSourceFile(file);
  }

  const typespecNamespaceBinding = globalNamespaceNode.symbol.exports!.get("TypeSpec");
  if (typespecNamespaceBinding) {
    // the TypeSpec namespace binding will be absent if we've passed
    // the no-std-lib option.
    // the first declaration here is the JS file for the TypeSpec script.
    initializeTypeSpecIntrinsics();
    for (const file of program.sourceFiles.values()) {
      addUsingSymbols(typespecNamespaceBinding.exports!, file.locals);
    }
  }

  for (const file of program.sourceFiles.values()) {
    setUsingsForFile(file);
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
    evalProjection,
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
    getTypeOrValueForNode,
  };

  const projectionMembers = createProjectionMembers(checker);
  return checker;

  function reportCheckerDiagnostic(diagnostic: Diagnostic) {
    onCheckerDiagnostic(diagnostic);
  }
  function reportCheckerDiagnostics(diagnostics: readonly Diagnostic[]) {
    diagnostics.forEach((x) => reportCheckerDiagnostic(x));
  }

  function initializeTypeSpecIntrinsics() {
    // a utility function to log strings or numbers
    mutate(typespecNamespaceBinding!.exports)!.set("log", {
      flags: SymbolFlags.Function,
      name: "log",
      value(p: Program, ...strs: string[]): Type {
        program.trace("projection.log", strs.join(" "));
        return voidType;
      },
      declarations: [],
    });

    // Until we have an `unit` type for `null`
    mutate(typespecNamespaceBinding!.exports).set("null", nullSym);
    mutate(nullSym).type = nullType;
    getSymbolLinks(nullSym).type = nullType;
  }

  function getStdType<T extends keyof StdTypes>(name: T): StdTypes[T] {
    const type = stdTypes[name];
    if (type !== undefined) {
      return type as any;
    }

    const sym = typespecNamespaceBinding?.exports?.get(name);
    if (sym && sym.flags & SymbolFlags.Model) {
      checkModelStatement(sym!.declarations[0] as any, undefined);
    } else {
      checkScalar(sym!.declarations[0] as any, undefined);
    }

    const loadedType = stdTypes[name];
    compilerAssert(
      loadedType,
      `TypeSpec std type "${name}" should have been initalized before using array syntax.`
    );
    return loadedType as any;
  }

  function mergeSourceFile(file: TypeSpecScriptNode | JsSourceFileNode) {
    mergeSymbolTable(file.symbol.exports!, mutate(globalNamespaceNode.symbol.exports!));
  }

  function setUsingsForFile(file: TypeSpecScriptNode) {
    const usedUsing = new Set<Sym>();

    for (const using of file.usings) {
      const parentNs = using.parent!;
      const sym = resolveTypeReferenceSym(using.name, undefined);
      if (!sym) {
        continue;
      }

      if (!(sym.flags & SymbolFlags.Namespace)) {
        reportCheckerDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: using }));
        continue;
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
  }

  function applyAugmentDecorators(node: TypeSpecScriptNode | NamespaceStatementNode) {
    if (!node.statements || !isArray(node.statements)) {
      return;
    }

    const augmentDecorators = node.statements.filter(
      (x): x is AugmentDecoratorStatementNode => x.kind === SyntaxKind.AugmentDecoratorStatement
    );

    for (const decNode of augmentDecorators) {
      const ref = resolveTypeReferenceSym(decNode.targetType, undefined);
      if (ref) {
        let args: readonly TemplateArgumentNode[] = [];
        if (ref.declarations[0].kind === SyntaxKind.AliasStatement) {
          const aliasNode = ref.declarations[0] as AliasStatementNode;
          if (aliasNode.value.kind === SyntaxKind.TypeReference) {
            args = aliasNode.value.arguments;
          }
        } else {
          args = decNode.targetType.arguments;
        }
        if (ref.flags & SymbolFlags.Namespace) {
          const links = getSymbolLinks(getMergedSymbol(ref));
          const type: Type & DecoratedType = links.type! as any;
          const decApp = checkDecorator(type, decNode, undefined);
          if (decApp) {
            type.decorators.push(decApp);
            applyDecoratorToType(program, decApp, type);
          }
        } else if (args.length > 0 || ref.flags & SymbolFlags.LateBound) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "augment-decorator-target",
              messageId: "noInstance",
              target: decNode.target,
            })
          );
        } else {
          let list = augmentDecoratorsForSym.get(ref);
          if (list === undefined) {
            list = [];
            augmentDecoratorsForSym.set(ref, list);
          }
          list.unshift(decNode);
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

  /**
   * Check a member symbol.
   * @param sym Symbol binding a member node.
   * @param mapper Type mapper.
   * @returns Checked type for the given member symbol.
   */
  function checkMemberSym(sym: Sym, mapper: TypeMapper | undefined): Type {
    const symbolLinks = getSymbolLinks(sym);
    const memberContainer = getTypeForNode(sym.parent!.declarations[0], mapper);
    const type = symbolLinks.declaredType ?? symbolLinks.type;
    if (type) {
      return type;
    } else {
      return checkMember(
        sym.declarations[0] as MemberNode,
        mapper,
        memberContainer as MemberContainerType
      )!;
    }
  }

  /**
   * Check a member node
   * @param node Member node to check
   * @param mapper Type mapper
   * @param containerType Member node container type(Interface, Model, Union, etc.)
   * @returns Checked member
   */
  function checkMember(
    node: MemberNode,
    mapper: TypeMapper | undefined,
    containerType: MemberContainerType
  ): Type {
    switch (node.kind) {
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node, mapper);
      case SyntaxKind.EnumMember:
        return checkEnumMember(node, mapper, containerType as Enum);
      case SyntaxKind.OperationStatement:
        return checkOperation(node, mapper, containerType as Interface);
      case SyntaxKind.UnionVariant:
        return checkUnionVariant(node, mapper);
      case SyntaxKind.ScalarConstructor:
        return checkScalarConstructor(node, mapper, containerType as Scalar);
    }
  }

  function getTypeForNode(node: Node, mapper?: TypeMapper): Type {
    const typeOrValue = getTypeOrValueForNode(node, mapper, undefined);
    if (typeOrValue === null) {
      return errorType;
    }
    if (isValue(typeOrValue)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "value-in-type",
          target: node,
        })
      );
      return errorType;
    }
    return typeOrValue;
  }

  function getValueForNode(node: Node, mapper?: TypeMapper, constraint?: Type): Value | null {
    let entity = getTypeOrValueForNodeInternal(node, mapper);
    if (entity === null || isValue(entity)) {
      return entity;
    }
    entity = tryUsingValueOfType(entity, mapper, constraint);
    if (entity === null || isValue(entity)) {
      return entity;
    }
    reportCheckerDiagnostic(
      createDiagnostic({
        code: "expect-value",
        format: { name: getTypeName(entity) },
        target: node,
      })
    );
    return null;
  }

  function tryUsingValueOfType(
    type: Type,
    mapper: TypeMapper | undefined,
    constraint: Type | undefined
  ): Type | Value | null {
    switch (type.kind) {
      case "String":
      case "StringTemplate":
        return checkStringValue(type, mapper, constraint);
      case "Number":
        return checkNumericValue(type, constraint);
      case "Boolean":
        return checkBooleanValue(type, constraint);
      case "EnumMember":
        return checkEnumValue(type, constraint);
      case "Intrinsic":
        switch (type.name) {
          case "null":
            return checkNullValue(type as any, constraint);
        }
        return type;
      default:
        return type;
    }
  }
  /**
   * Gets a type or value depending on the node and current constraint.
   * For nodes that can be both type or values(e.g. string), the value will be returned if the constraint expect a value of that type even if the constrain also allows the type.
   * This means that if the constraint is `string | valueof string` passing `"abc"` will send the value `"abc"` and not the type `"abc"`.
   */
  function getTypeOrValueForNode(
    node: Node,
    mapper?: TypeMapper,
    constraint?: Type | ValueType | ParamConstraintUnion | undefined
  ): Type | Value | null {
    const entity = getTypeOrValueForNodeInternal(node, mapper, constraint);
    if (entity === null || isValue(entity)) {
      return entity;
    }

    const valueConstraint = extractValueOfConstraints(constraint);
    if (valueConstraint) {
      return tryUsingValueOfType(entity, mapper, valueConstraint);
    }

    return entity;
  }

  /** Extact the type constraint a value should match. */
  function extractValueOfConstraints(
    constraint: Type | ValueType | ParamConstraintUnion | undefined
  ): Type | undefined {
    if (constraint === undefined || isType(constraint)) {
      return undefined;
    }
    if (constraint.kind === "Value") {
      return constraint.target;
    } else {
      const valueOfOptions = constraint.options
        .filter((x): x is ValueType => x.kind === "Value")
        .map((x) => x.target);
      return createUnion(valueOfOptions);
    }
  }

  /** Do not call to be used inside getTypeOrValueForNode */
  function getTypeOrValueForNodeInternal(
    node: Node,
    mapper?: TypeMapper,
    constraint?: Type | ValueType | ParamConstraintUnion | undefined
  ): Type | Value | null {
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
      case SyntaxKind.EnumMember:
        return checkEnumMember(node, mapper);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(node, mapper);
      case SyntaxKind.UnionStatement:
        return checkUnion(node, mapper);
      case SyntaxKind.UnionVariant:
        return checkUnionVariant(node, mapper);
      case SyntaxKind.NamespaceStatement:
      case SyntaxKind.JsNamespaceDeclaration:
        return checkNamespace(node);
      case SyntaxKind.OperationStatement:
        return checkOperation(node, mapper);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(node);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(node, mapper);
      case SyntaxKind.StringTemplateExpression:
        return checkStringTemplateExpresion(node, mapper);
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
        return checkTypeOrValueReference(node, mapper);
      case SyntaxKind.TemplateArgument:
        return checkTemplateArgument(node, mapper);
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
      case SyntaxKind.ObjectLiteral:
        return checkObjectValue(node, mapper);
      case SyntaxKind.TupleLiteral:
        return checkTupleValue(node, mapper);
      case SyntaxKind.ConstStatement:
        return checkConst(node);
      case SyntaxKind.CallExpression:
        return checkCallExpression(node, mapper);
      default:
        return errorType;
    }
  }

  /**
   * Return a fully qualified id of node
   */
  function getNodeSymId(
    node:
      | ModelStatementNode
      | ScalarStatementNode
      | AliasStatementNode
      | ConstStatementNode
      | InterfaceStatementNode
      | OperationStatementNode
      | TemplateParameterDeclarationNode
      | UnionStatementNode
  ): number {
    const symbol =
      node.kind === SyntaxKind.OperationStatement &&
      node.parent?.kind === SyntaxKind.InterfaceStatement
        ? getSymbolForMember(node)
        : node.symbol;
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    return symbol?.id!;
  }

  /**
   * Check if the given namespace is the standard library `TypeSpec` namespace.
   */
  function isTypeSpecNamespace(
    namespace: Namespace
  ): namespace is Namespace & { name: "TypeSpec"; namespace: Namespace } {
    return (
      namespace.name === "TypeSpec" &&
      (namespace.namespace === globalNamespaceType ||
        namespace.namespace?.projectionBase === globalNamespaceType)
    );
  }

  /**
   * Check if the given type is defined right in the TypeSpec namespace.
   */
  function isInTypeSpecNamespace(type: Type & { namespace?: Namespace }): boolean {
    return Boolean(type.namespace && isTypeSpecNamespace(type.namespace));
  }

  function checkTemplateParameterDeclaration(
    node: TemplateParameterDeclarationNode,
    mapper: undefined
  ): TemplateParameter;
  function checkTemplateParameterDeclaration(
    node: TemplateParameterDeclarationNode,
    mapper: TypeMapper
  ): Type | Value;
  function checkTemplateParameterDeclaration(
    node: TemplateParameterDeclarationNode,
    mapper: TypeMapper | undefined
  ): Type | Value;
  function checkTemplateParameterDeclaration(
    node: TemplateParameterDeclarationNode,
    mapper: TypeMapper | undefined
  ): Type | Value {
    const parentNode = node.parent!;
    const grandParentNode = parentNode.parent;
    const links = getSymbolLinks(node.symbol);

    if (pendingResolutions.has(getNodeSymId(node), ResolutionKind.Constraint)) {
      if (mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-constraint",
            format: { typeName: node.id.sv },
            target: node.constraint!,
          })
        );
      }
      return errorType;
    }

    let type: TemplateParameter | undefined = links.declaredType as TemplateParameter;
    if (type === undefined) {
      if (grandParentNode) {
        if (grandParentNode.locals?.has(node.id.sv)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "shadow",
              format: { name: node.id.sv },
              target: node,
            })
          );
        }
      }
      const index = parentNode.templateParameters.findIndex((v) => v === node);
      type = links.declaredType = createAndFinishType({
        kind: "TemplateParameter",
        node: node,
      });

      if (node.constraint) {
        pendingResolutions.start(getNodeSymId(node), ResolutionKind.Constraint);
        type.constraint = getParamConstraintEntityForNode(node.constraint);
        pendingResolutions.finish(getNodeSymId(node), ResolutionKind.Constraint);
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
    if (isType(declaredType.default) && isErrorType(declaredType.default)) {
      return declaredType.default;
    }

    return getTypeForNode(node.default!, mapper);
  }

  function checkTemplateParameterDefault(
    nodeDefault: Expression,
    templateParameters: readonly TemplateParameterDeclarationNode[],
    index: number,
    constraint: Entity | undefined
  ): Type | Value {
    function visit(node: Node) {
      const type = getTypeOrValueForNode(node);
      let hasError = false;
      if (type !== null && "kind" in type && type.kind === "TemplateParameter") {
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

    if (!("kind" in type && isErrorType(type)) && constraint) {
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
    return type;
  }

  /**
   * Check and resolve a type for the given type reference node.
   * @param node Node.
   * @param mapper Type mapper for template instantiation context.
   * @param instantiateTemplate If templated type should be instantiated if they haven't yet.
   * @returns Resolved type.
   */
  function checkTypeOrValueReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    instantiateTemplate = true
  ): Type | Value {
    const sym = resolveTypeReferenceSym(node, mapper);
    if (!sym) {
      return errorType;
    }

    return checkTypeOrValueReferenceSymbol(sym, node, mapper, instantiateTemplate) ?? errorType;
  }

  function checkTemplateArgument(
    node: TemplateArgumentNode,
    mapper: TypeMapper | undefined
  ): Type | Value | null {
    return getTypeOrValueForNode(node.argument, mapper);
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

  function copyDeprecation(sourceType: Type, destType: Type): void {
    const deprecationDetails = getDeprecationDetails(program, sourceType);
    if (deprecationDetails) {
      markDeprecated(program, destType, deprecationDetails);
    }
  }

  function checkDeprecated(type: Type, node: Node | undefined, target: DiagnosticTarget) {
    if (node) {
      const deprecationDetails = getDeprecationDetails(program, node);
      if (deprecationDetails) {
        reportDeprecation(program, target, deprecationDetails.message, reportCheckerDiagnostic);
        return;
      }
    }

    const deprecationDetails = getDeprecationDetails(program, type);
    if (deprecationDetails) {
      reportDeprecation(program, target, deprecationDetails.message, reportCheckerDiagnostic);
    }
  }

  function isTypeReferenceContextDeprecated(node: Node): boolean {
    function checkDeprecatedNode(node: Node) {
      // Perform a simple check if the parent node is deprecated.  We do this
      // out of band because `checkDirectives` usually gets called on the parent
      // type after child types have already been checked (including their
      // deprecations).
      if (!nodeDeprecationMap.has(node)) {
        nodeDeprecationMap.set(
          node,
          (node.directives ?? []).findIndex((d) => d.target.sv === "deprecated") >= 0
        );
      }

      return nodeDeprecationMap.get(node)!;
    }

    // Walk the parent hierarchy up to a node which might have a
    // deprecation which would mitigate the deprecation warning of the original
    // type reference. This is done to prevent multiple deprecation notices from
    // being raised when a parent context is already being deprecated.
    switch (node.kind) {
      case SyntaxKind.ModelStatement:
        return checkDeprecatedNode(node);
      case SyntaxKind.OperationStatement:
        return (
          checkDeprecatedNode(node) ||
          (node.parent!.kind === SyntaxKind.InterfaceStatement &&
            isTypeReferenceContextDeprecated(node.parent!))
        );
      case SyntaxKind.InterfaceStatement:
        return checkDeprecatedNode(node);
      case SyntaxKind.IntersectionExpression:
      case SyntaxKind.UnionExpression:
      case SyntaxKind.ModelProperty:
      case SyntaxKind.OperationSignatureDeclaration:
      case SyntaxKind.OperationSignatureReference:
        return isTypeReferenceContextDeprecated(node.parent!);
      default:
        return false;
    }
  }

  function checkTemplateInstantiationArgs(
    node: Node,
    args: readonly TemplateArgumentNode[],
    decls: readonly TemplateParameterDeclarationNode[],
    mapper: TypeMapper | undefined
  ): Map<TemplateParameter, Type | Value> {
    const params = new Map<string, TemplateParameter>();
    const positional: TemplateParameter[] = [];
    interface TemplateParameterInit {
      decl: TemplateParameterDeclarationNode;
      // Deferred initializer so that we evaluate the param arguments in definition order.
      checkArgument: (() => [Node, Type | Value]) | null;
    }
    const initMap = new Map<TemplateParameter, TemplateParameterInit>(
      decls.map(function (decl) {
        const declaredType = getTypeOrValueForNode(decl)! as TemplateParameter;

        positional.push(declaredType);
        params.set(decl.id.sv, declaredType);

        return [
          declaredType,
          {
            decl,
            checkArgument: null,
          },
        ];
      })
    );

    let named = false;

    for (const [arg, idx] of args.map((v, i) => [v, i] as const)) {
      function deferredCheck(): [Node, Type | Value] {
        return [arg, getTypeOrValueForNode(arg.argument, mapper) ?? errorType];
      }

      if (arg.name) {
        named = true;

        const param = params.get(arg.name.sv);

        if (!param) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "unknownName",
              format: {
                name: arg.name.sv,
              },
              target: arg,
            })
          );
          continue;
        }

        if (initMap.get(param)!.checkArgument !== null) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "specifiedAgain",
              format: {
                name: arg.name.sv,
              },
              target: arg,
            })
          );
          continue;
        }

        initMap.get(param)!.checkArgument = deferredCheck;
      } else {
        if (named) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "positionalAfterNamed",
              target: arg,
            })
          );
          // we just throw this arg away. any missing args will be filled with ErrorType
        }

        if (idx >= positional.length) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "tooMany",
              target: node,
            })
          );
          continue;
        }

        const param = positional[idx];

        initMap.get(param)!.checkArgument ??= deferredCheck;
      }
    }

    const finalMap = initMap as unknown as Map<TemplateParameter, Type | Value>;
    const mapperParams: TemplateParameter[] = [];
    const mapperArgs: (Type | Value)[] = [];
    for (const [param, { decl, checkArgument: init }] of [...initMap]) {
      function commit(param: TemplateParameter, type: Type | Value): void {
        finalMap.set(param, type);
        mapperParams.push(param);
        mapperArgs.push(type);
      }

      if (init === null) {
        const argumentMapper = createTypeMapper(mapperParams, mapperArgs);
        const defaultValue = getResolvedTypeParameterDefault(param, decl, argumentMapper);
        if (defaultValue) {
          commit(param, defaultValue);
        } else {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "missing",
              format: {
                name: decl.id.sv,
              },
              target: node,
            })
          );

          // TODO-TIM check if we expose this below
          commit(
            param,
            param.constraint?.kind === "Value" || param.constraint?.kind === "ParamConstraintUnion"
              ? unknownType
              : param.constraint ?? unknownType
          );
        }

        continue;
      }

      const [argNode, type] = init();

      if (param.constraint) {
        const constraint =
          param.constraint.kind === "TemplateParameter"
            ? finalMap.get(param.constraint)!
            : param.constraint;

        if (!checkTypeAssignable(type, constraint, argNode)) {
          // TODO-TIM check if we expose this below
          const effectiveType =
            param.constraint?.kind === "Value" || param.constraint.kind === "ParamConstraintUnion"
              ? unknownType
              : param.constraint;

          commit(param, effectiveType);
          continue;
        }
      } else if ("kind" in type && isErrorType(type)) {
        // If we got an error type we don't want to keep passing it through so we reduce to unknown
        // Similar to the above where if the type is not assignable to the constraint we reduce to the constraint
        commit(param, unknownType);
        continue;
      }

      commit(param, type);
    }
    return finalMap;
  }

  function checkValueReferenceSymbol(
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined
  ): Value | null {
    // TODO: use common checkTypeOrValueReferenceSymbol
    if (sym.flags & SymbolFlags.Const) {
      return getValueForNode(sym.declarations[0], mapper);
    }
    reportCheckerDiagnostic(
      createDiagnostic({
        code: "expect-value",
        format: { name: sym.name },
        target: node,
      })
    );
    return null;
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
    // TODO: do we even need this
    if (sym.flags & SymbolFlags.Const) {
      reportCheckerDiagnostic(createDiagnostic({ code: "value-in-type", target: node }));
      return errorType;
    }

    const result = checkTypeOrValueReferenceSymbol(sym, node, mapper, instantiateTemplates);
    if (result === null || isValue(result)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "value-in-type", target: node }));
      return errorType;
    }
    return result;
  }

  function checkTypeOrValueReferenceSymbol(
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    instantiateTemplates = true
  ): Type | Value | null {
    if (sym.flags & SymbolFlags.Const) {
      return getValueForNode(sym.declarations[0], mapper);
    }

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

    const argumentNodes = node.kind === SyntaxKind.TypeReference ? node.arguments : [];
    const symbolLinks = getSymbolLinks(sym);
    let baseType;
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
      if (!isTemplatedNode(decl)) {
        if (argumentNodes.length > 0) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "notTemplate",
              target: node,
            })
          );
        }

        if (sym.flags & SymbolFlags.LateBound) {
          compilerAssert(sym.type, "Expected late bound symbol to have type");
          return sym.type;
        } else if (symbolLinks.declaredType) {
          baseType = symbolLinks.declaredType;
        } else if (sym.flags & SymbolFlags.Member) {
          baseType = checkMemberSym(sym, mapper);
        } else {
          baseType = checkDeclaredType(sym, decl, mapper);
        }
      } else {
        const declaredType = getOrCheckDeclaredType(sym, decl, mapper);

        const templateParameters = decl.templateParameters;
        const instantiation = checkTemplateInstantiationArgs(
          node,
          argumentNodes,
          templateParameters,
          mapper
        );

        baseType = getOrInstantiateTemplate(
          decl,
          [...instantiation.keys()],
          [...instantiation.values()],
          declaredType.templateMapper,
          instantiateTemplates
        );
      }
    } else {
      // some other kind of reference
      if (argumentNodes.length > 0) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-template-args",
            messageId: "notTemplate",
            target: node,
          })
        );
      }

      if (sym.flags & SymbolFlags.LateBound) {
        compilerAssert(sym.type, `Expected late bound symbol to have type`);
        return sym.type;
      } else if (sym.flags & SymbolFlags.TemplateParameter) {
        const mapped = checkTemplateParameterDeclaration(
          sym.declarations[0] as TemplateParameterDeclarationNode,
          mapper
        );
        baseType = mapped as any;
      } else if (symbolLinks.type) {
        // Have a cached type for non-declarations
        baseType = symbolLinks.type;
      } else if (symbolLinks.declaredType) {
        baseType = symbolLinks.declaredType;
      } else {
        if (sym.flags & SymbolFlags.Member) {
          baseType = checkMemberSym(sym, mapper);
        } else {
          // don't have a cached type for this symbol, so go grab it and cache it
          baseType = getTypeForNode(sym.declarations[0], mapper);
          symbolLinks.type = baseType;
        }
      }
    }

    // Check for deprecations here, first on symbol, then on type.  However,
    // don't raise deprecation when the usage site is also a deprecated
    // declaration.
    const declarationNode = sym?.declarations[0];
    if (declarationNode && mapper === undefined) {
      if (!isTypeReferenceContextDeprecated(node.parent!)) {
        checkDeprecated(baseType, declarationNode, node);
      }
    }

    return baseType;
  }

  /**
   * Get or check the declared type of a templatable node.
   * @param node Declaration node
   * @param sym Node Symbol
   * @param mapper Type mapper for template resolution
   * @returns The declared type for the given node.
   */
  function getOrCheckDeclaredType(
    sym: Sym,
    decl: TemplateableNode,
    mapper: TypeMapper | undefined
  ): TemplatedType {
    const symbolLinks = getSymbolLinks(sym);
    if (symbolLinks.declaredType) {
      return symbolLinks.declaredType as TemplatedType;
    }

    if (sym.flags & SymbolFlags.LateBound) {
      compilerAssert(sym.type, "Expected late bound symbol to have type");
      return sym.type as TemplatedType;
    }

    if (sym.flags & SymbolFlags.Member) {
      return checkMemberSym(sym, mapper) as TemplatedType;
    } else {
      return checkDeclaredType(sym, decl, mapper) as TemplatedType;
    }
  }

  /**
   * Check the declared type of a templatable node.
   * @param node Declaration node
   * @param sym Node Symbol
   * @param mapper Type mapper for template resolution
   * @returns The declared type for the given node.
   */
  function checkDeclaredType(
    sym: Sym,
    node: TemplateableNode,
    mapper: TypeMapper | undefined
  ): Type | Value {
    const type =
      sym.flags & SymbolFlags.Model
        ? checkModelStatement(node as ModelStatementNode, mapper)
        : sym.flags & SymbolFlags.Scalar
          ? checkScalar(node as ScalarStatementNode, mapper)
          : sym.flags & SymbolFlags.Alias
            ? checkAlias(node as AliasStatementNode, mapper)
            : sym.flags & SymbolFlags.Interface
              ? checkInterface(node as InterfaceStatementNode, mapper)
              : sym.flags & SymbolFlags.Operation
                ? checkOperation(node as OperationStatementNode, mapper)
                : checkUnion(node as UnionStatementNode, mapper);

    return type;
  }

  function getOrInstantiateTemplate(
    templateNode: TemplateableNode,
    params: TemplateParameter[],
    args: (Type | Value)[],
    parentMapper: TypeMapper | undefined,
    instantiateTempalates = true
  ): Type {
    const symbolLinks =
      templateNode.kind === SyntaxKind.OperationStatement &&
      templateNode.parent!.kind === SyntaxKind.InterfaceStatement
        ? getSymbolLinksForMember(templateNode as MemberNode)
        : getSymbolLinks(templateNode.symbol);

    compilerAssert(
      symbolLinks,
      `Unexpected checker error. symbolLinks was not defined for ${SyntaxKind[templateNode.kind]}`
    );

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
    const mapper = createTypeMapper(params, args, parentMapper);
    const cached = symbolLinks.instantiations?.get(mapper.args);
    if (cached) {
      return cached;
    }
    if (instantiateTempalates) {
      return instantiateTemplate(symbolLinks.instantiations, templateNode, params, mapper);
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
    mapper: TypeMapper
  ): Type {
    const type = getTypeForNode(templateNode, mapper);
    if (!instantiations.get(mapper.args)) {
      instantiations.set(mapper.args, type);
    }
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    return type;
  }

  /** Check a union expresion used in a parameter constraint, those allow the use of `valueof` as a variant. */
  function checkUnionExpressionAsParamConstraint(
    node: UnionExpressionNode,
    mapper: TypeMapper | undefined
  ): Union | ParamConstraintUnion {
    const hasValueOf = node.options.some((x) => x.kind === SyntaxKind.ValueOfExpression);
    if (!hasValueOf) {
      return checkUnionExpression(node, mapper);
    }

    return {
      kind: "ParamConstraintUnion",
      node,
      options: node.options.map((x) => getTypeOrValueOfTypeForNode(x, mapper)),
    };
  }

  function checkUnionExpression(node: UnionExpressionNode, mapper: TypeMapper | undefined): Union {
    const unionType: Union = createAndFinishType({
      kind: "Union",
      node,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: true,
      variants: createRekeyableMap(),
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

  function checkValueOfExpression(
    node: ValueOfExpressionNode,
    mapper: TypeMapper | undefined
  ): ValueType {
    const target = getTypeForNode(node.target, mapper);

    return {
      kind: "Value",
      target,
    };
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
    if (
      node.rest &&
      node.type &&
      !(
        node.type.kind === SyntaxKind.ArrayExpression ||
        (node.type.kind === SyntaxKind.ValueOfExpression &&
          node.type.target.kind === SyntaxKind.ArrayExpression)
      )
    ) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "rest-parameter-array", target: node.type })
      );
    }
    const type = node.type ? getParamConstraintEntityForNode(node.type) : unknownType;

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

  function getTypeOrValueOfTypeForNode(node: Node, mapper?: TypeMapper): Type | ValueType {
    switch (node.kind) {
      case SyntaxKind.ValueOfExpression:
        return checkValueOfExpression(node, mapper);
      default:
        return getTypeForNode(node, mapper);
    }
  }

  function getParamConstraintEntityForNode(
    node: Node,
    mapper?: TypeMapper
  ): Type | ParamConstraintUnion | ValueType {
    switch (node.kind) {
      case SyntaxKind.UnionExpression:
        return checkUnionExpressionAsParamConstraint(node, mapper);
      default:
        return getTypeOrValueOfTypeForNode(node, mapper);
    }
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
    const properties = createRekeyableMap<string, ModelProperty>();

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
    const modelOptions: [Node, Model][] = options.filter((entry): entry is [Node, Model] => {
      const [optionNode, option] = entry;
      if (option.kind === "TemplateParameter") {
        return false;
      }
      if (option.kind !== "Model") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "intersect-non-model", target: optionNode })
        );
        return false;
      }
      return true;
    });
    for (const [optionNode, option] of modelOptions) {
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
    }
    for (const [_, option] of modelOptions) {
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
        for (const indexer of indexers.filter((x) => x !== option.indexer)) {
          checkPropertyCompatibleWithIndexer(indexer, prop, node);
        }
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
    linkMapper(intersection, mapper);
    return finishType(intersection);
  }

  function checkArrayExpression(node: ArrayExpressionNode, mapper: TypeMapper | undefined): Model {
    const elementType = getTypeForNode(node.elementType, mapper);
    const arrayType = getStdType("Array");
    const arrayNode: ModelStatementNode = arrayType.node as any;
    const param: TemplateParameter = getTypeForNode(arrayNode.templateParameters[0]) as any;
    return getOrInstantiateTemplate(arrayNode, [param], [elementType], undefined) as Model;
  }

  function checkNamespace(node: NamespaceStatementNode | JsNamespaceDeclarationNode) {
    const links = getSymbolLinks(getMergedSymbol(node.symbol));
    let type = links.type as Namespace;
    if (!type) {
      type = initializeTypeForNamespace(node);
    }

    if (node.kind === SyntaxKind.NamespaceStatement) {
      if (isArray(node.statements)) {
        node.statements.forEach((x) => getTypeForNode(x));
      } else if (node.statements) {
        const subNs = checkNamespace(node.statements);
        type.namespaces.set(subNs.name, subNs);
      }
    }
    return type;
  }

  function initializeTypeForNamespace(node: NamespaceStatementNode | JsNamespaceDeclarationNode) {
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
        node: node,
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
        // namespaces created from TypeSpec scripts don't have decorators
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
      | JsNamespaceDeclarationNode
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
      node.symbol.parent.declarations[0].kind === SyntaxKind.TypeSpecScript ||
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
        (x): x is NamespaceStatementNode =>
          x.kind === SyntaxKind.NamespaceStatement || x.kind === SyntaxKind.JsNamespaceDeclaration
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
    const inInterface = node.parent?.kind === SyntaxKind.InterfaceStatement;
    const symbol = inInterface ? getSymbolForMember(node) : node.symbol;
    const links = symbol && getSymbolLinks(symbol);
    if (links) {
      if (links.declaredType && mapper === undefined) {
        // we're not instantiating this operation and we've already checked it
        return links.declaredType as Operation;
      }
    }

    if (mapper === undefined && inInterface) {
      compilerAssert(parentInterface, "Operation in interface should already have been checked.");
    }
    checkTemplateDeclaration(node, mapper);

    // If we are instantating operation inside of interface
    if (isTemplatedNode(node) && mapper !== undefined && parentInterface) {
      mapper = { ...mapper, partial: true };
    }

    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    let decorators: DecoratorApplication[] = [];

    // Is this a definition or reference?
    let parameters: Model, returnType: Type, sourceOperation: Operation | undefined;
    if (node.signature.kind === SyntaxKind.OperationSignatureReference) {
      // Attempt to resolve the operation
      const baseOperation = checkOperationIs(node, node.signature.baseOperation, mapper);
      if (!baseOperation) {
        return errorType;
      }
      sourceOperation = baseOperation;
      const parameterModelSym = getOrCreateAugmentedSymbolTable(symbol!.metatypeMembers!).get(
        "parameters"
      )!;
      // Reference the same return type and create the parameters type
      const clone = initializeClone(baseOperation.parameters, {
        properties: createRekeyableMap(),
      });

      clone.properties = createRekeyableMap(
        Array.from(baseOperation.parameters.properties.entries()).map(([key, prop]) => [
          key,
          cloneTypeForSymbol(getMemberSymbol(parameterModelSym, prop.name)!, prop, {
            model: clone,
            sourceProperty: prop,
          }),
        ])
      );
      parameters = finishType(clone);
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
      sourceOperation,
      interface: parentInterface,
    });
    if (links) {
      linkType(links, operationType, mapper);
    }

    decorators.push(...checkDecorators(operationType, node, mapper));

    operationType.parameters.namespace = namespace;

    const parent = node.parent!;
    linkMapper(operationType, mapper);

    if (parent.kind === SyntaxKind.InterfaceStatement) {
      if (
        shouldCreateTypeForTemplate(parent, mapper) &&
        shouldCreateTypeForTemplate(node, mapper)
      ) {
        finishType(operationType);
      }
    } else {
      if (shouldCreateTypeForTemplate(node, mapper)) {
        finishType(operationType);
      }

      if (mapper === undefined) {
        namespace?.operations.set(name, operationType);
      }
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
      pendingResolutions.start(opSymId, ResolutionKind.BaseType);
    }

    const target = resolveTypeReferenceSym(opReference, mapper);
    if (target === undefined) {
      return undefined;
    }

    // Did we encounter a circular operation reference?
    if (
      pendingResolutions.has(getNodeSymId(target.declarations[0] as any), ResolutionKind.BaseType)
    ) {
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
      pendingResolutions.finish(opSymId, ResolutionKind.BaseType);
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
    options: SymbolResolutionOptions
  ): Sym | undefined {
    if (!table) {
      return undefined;
    }
    table = augmentedSymbolTables.get(table) ?? table;
    let sym;
    if (options.resolveDecorators) {
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
    const duplicateNames = symbols.map((s) =>
      getFullyQualifiedSymbolName(s, { useGlobalPrefixAtTopLevel: true })
    );
    reportCheckerDiagnostic(
      createDiagnostic({
        code: "ambiguous-symbol",
        format: { name: node.sv, duplicateNames: duplicateNames.join(", ") },
        target: node,
      })
    );
  }

  function resolveIdentifier(id: IdentifierNode, mapper?: TypeMapper): Sym | undefined {
    let sym: Sym | undefined;
    const { node, kind } = getIdentifierContext(id);

    switch (kind) {
      case IdentifierKind.Declaration:
        if (node.symbol && (!isTemplatedNode(node) || mapper === undefined)) {
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
        sym = resolveIdentifierInTable(
          id,
          container.exports ?? container.members,
          defaultSymbolResolutionOptions
        );
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
      case IdentifierKind.TemplateArgument:
        const templates = getTemplateDeclarationsForArgument(node as TemplateArgumentNode, mapper);

        const firstMatchingParameter = templates
          .flatMap((t) => t.templateParameters)
          .find((p) => p.id.sv === id.sv);

        if (firstMatchingParameter) {
          sym = getMergedSymbol(firstMatchingParameter.symbol);
        }

        break;
      default:
        const _assertNever: never = kind;
        compilerAssert(false, "Unreachable");
    }

    return sym?.symbolSource ?? sym;
  }

  function getTemplateDeclarationsForArgument(
    node: TemplateArgumentNode,
    mapper: TypeMapper | undefined
  ) {
    const resolved = resolveTypeReferenceSym(node.parent as TypeReferenceNode, mapper, false);
    return (resolved?.declarations.filter((n) => isTemplatedNode(n)) ?? []) as TemplateableNode[];
  }

  function resolveCompletions(identifier: IdentifierNode): Map<string, TypeSpecCompletionItem> {
    const completions = new Map<string, TypeSpecCompletionItem>();
    const { kind, node: ancestor } = getIdentifierContext(identifier);

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
      case IdentifierKind.TemplateArgument: {
        const templates = getTemplateDeclarationsForArgument(
          ancestor as TemplateArgumentNode,
          undefined
        );

        for (const template of templates) {
          for (const param of template.templateParameters) {
            addCompletion(param.id.sv, param.symbol);
          }
        }

        return completions;
      }
      default:
        const _assertNever: never = kind;
        compilerAssert(false, "Unreachable");
    }

    if (identifier.parent && identifier.parent.kind === SyntaxKind.MemberExpression) {
      let base = resolveTypeReferenceSym(identifier.parent.base, undefined, false);
      if (base) {
        if (base.flags & SymbolFlags.Alias) {
          base = getAliasedSymbol(base, undefined, defaultSymbolResolutionOptions);
        }
        if (base) {
          if (isTemplatedNode(base.declarations[0])) {
            const type = base.type ?? getTypeForNode(base.declarations[0], undefined);
            if (isTemplateInstance(type)) {
              lateBindMemberContainer(type);
              lateBindMembers(type, base);
            }
          }
          addCompletions(base.exports ?? base.members);
        }
      }
    } else {
      // We will only add template arguments if the template isn't already named
      // to avoid completing the name of the argument again.
      if (
        kind === IdentifierKind.TypeReference &&
        exprIsBareIdentifier(ancestor as TypeReferenceNode) &&
        ancestor.parent?.kind === SyntaxKind.TemplateArgument &&
        ancestor.parent.name === undefined
      ) {
        const templates = getTemplateDeclarationsForArgument(
          ancestor.parent as TemplateArgumentNode,
          undefined
        );

        for (const template of templates) {
          for (const param of template.templateParameters) {
            addCompletion(param.id.sv, param.symbol, { suffix: " = " });
          }
        }
      }

      let scope: Node | undefined = identifier.parent;
      while (scope && scope.kind !== SyntaxKind.TypeSpecScript) {
        if (scope.symbol && scope.symbol.exports) {
          const mergedSymbol = getMergedSymbol(scope.symbol)!;
          addCompletions(mergedSymbol.exports);
        }
        if ("locals" in scope) {
          addCompletions(scope.locals);
        }
        scope = scope.parent;
      }

      if (scope && scope.kind === SyntaxKind.TypeSpecScript) {
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

    function addCompletion(key: string, sym: Sym, options: { suffix?: string } = {}) {
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
        completions.set(key, { ...options, sym });
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
        case IdentifierKind.TemplateArgument:
          return !!(sym.flags & SymbolFlags.TemplateParameter);
        default:
          compilerAssert(false, "We should have bailed up-front on other kinds.");
      }
    }
  }

  function resolveIdentifierInScope(
    node: IdentifierNode,
    mapper: TypeMapper | undefined,
    options: SymbolResolutionOptions
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

    while (scope && scope.kind !== SyntaxKind.TypeSpecScript) {
      if (scope.symbol && "exports" in scope.symbol) {
        const mergedSymbol = getMergedSymbol(scope.symbol);
        binding = resolveIdentifierInTable(node, mergedSymbol.exports, options);
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals, options);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.TypeSpecScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol);
        binding = resolveIdentifierInTable(node, mergedSymbol.exports, options);

        if (binding) return binding;
      }

      // check "global scope" declarations
      const globalBinding = resolveIdentifierInTable(
        node,
        globalNamespaceNode.symbol.exports,
        options
      );

      // check using types
      const usingBinding = resolveIdentifierInTable(node, scope.locals, options);

      if (globalBinding && usingBinding) {
        reportAmbiguousIdentifier(node, [globalBinding, usingBinding]);
        return globalBinding;
      } else if (globalBinding) {
        return globalBinding;
      } else if (usingBinding) {
        return usingBinding.flags & SymbolFlags.DuplicateUsing ? undefined : usingBinding;
      }
    }

    if (mapper === undefined) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "unknown-identifier",
          format: { id: node.sv },
          target: node,
          codefixes: getCodefixesForUnknownIdentifier(node),
        })
      );
    }
    return undefined;
  }

  function getCodefixesForUnknownIdentifier(node: IdentifierNode): CodeFix[] | undefined {
    switch (node.sv) {
      case "number":
        return [createChangeIdentifierCodeFix(node, "float64")];
      default:
        return undefined;
    }
  }

  function resolveTypeReferenceSym(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    options?: Partial<SymbolResolutionOptions> | boolean
  ): Sym | undefined {
    const resolvedOptions: SymbolResolutionOptions =
      typeof options === "boolean"
        ? { ...defaultSymbolResolutionOptions, resolveDecorators: options }
        : { ...defaultSymbolResolutionOptions, ...(options ?? {}) };
    if (mapper === undefined && resolvedOptions.checkTemplateTypes && referenceSymCache.has(node)) {
      return referenceSymCache.get(node);
    }
    const sym = resolveTypeReferenceSymInternal(node, mapper, resolvedOptions);
    if (resolvedOptions.checkTemplateTypes) {
      referenceSymCache.set(node, sym);
    }
    return sym;
  }

  function resolveTypeReferenceSymInternal(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined,
    options: SymbolResolutionOptions
  ): Sym | undefined {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReferenceSym(node.target, mapper, options);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      let base = resolveTypeReferenceSym(node.base, mapper);
      if (!base) {
        return undefined;
      }

      // when resolving a type reference based on an alias, unwrap the alias.
      if (base.flags & SymbolFlags.Alias) {
        base = getAliasedSymbol(base, mapper, options);
        if (!base) {
          return undefined;
        }
      }

      if (node.selector === ".") {
        return resolveMemberInContainer(node, base, mapper, options);
      } else {
        return resolveMetaProperty(node, base);
      }
    }

    if (node.kind === SyntaxKind.Identifier) {
      const sym = resolveIdentifierInScope(node, mapper, options);
      if (!sym) return undefined;

      return sym.flags & SymbolFlags.Using ? sym.symbolSource : sym;
    }

    compilerAssert(false, `Unknown type reference kind "${SyntaxKind[(node as any).kind]}"`, node);
  }

  function resolveMemberInContainer(
    node: MemberExpressionNode,
    base: Sym,
    mapper: TypeMapper | undefined,
    options: SymbolResolutionOptions
  ) {
    if (base.flags & SymbolFlags.Namespace) {
      const symbol = resolveIdentifierInTable(node.id, base.exports, options);
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
      if (options.checkTemplateTypes && isTemplatedNode(base.declarations[0])) {
        const type =
          base.flags & SymbolFlags.LateBound
            ? base.type!
            : getTypeForNode(base.declarations[0], mapper);
        if (isTemplateInstance(type)) {
          lateBindMembers(type, base);
        }
      }
      const sym = resolveIdentifierInTable(node.id, base.members!, options);
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
            nodeName: base.declarations[0] ? SyntaxKind[base.declarations[0].kind] : "Unknown node",
          },
          target: node,
        })
      );

      return undefined;
    }
  }

  function resolveMetaProperty(node: MemberExpressionNode, base: Sym) {
    const resolved = resolveIdentifierInTable(node.id, base.metatypeMembers, {
      resolveDecorators: false,
      checkTemplateTypes: false,
    });
    if (!resolved) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: "metaProperty",
          format: { kind: getMemberKindName(base.declarations[0]), id: node.id.sv },
          target: node,
        })
      );
    }

    return resolved;
  }

  function getMemberKindName(node: Node) {
    switch (node.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
        return "Model";
      case SyntaxKind.ModelProperty:
        return "ModelProperty";
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
  function getAliasedSymbol(
    aliasSymbol: Sym,
    mapper: TypeMapper | undefined,
    options: SymbolResolutionOptions
  ): Sym | undefined {
    let current = aliasSymbol;
    while (current.flags & SymbolFlags.Alias) {
      const node = current.declarations[0];
      const targetNode = node.kind === SyntaxKind.AliasStatement ? node.value : node;
      const sym = resolveTypeReferenceSymInternal(targetNode as any, mapper, options);
      if (sym === undefined) {
        return undefined;
      }
      current = sym;
    }
    const sym = current;
    const node = aliasSymbol.declarations[0];

    const resolvedTargetNode = sym.declarations[0];
    if (!options.checkTemplateTypes || !isTemplatedNode(resolvedTargetNode)) {
      return sym;
    }

    const aliasType = getTypeForNode(node as AliasStatementNode, mapper);
    if (isErrorType(aliasType)) {
      return undefined;
    }
    switch (aliasType.kind) {
      case "Model":
      case "Interface":
      case "Union":
        if (isTemplateInstance(aliasType)) {
          // this is an alias for some instantiation, so late-bind the instantiation
          lateBindMemberContainer(aliasType);
          return aliasType.symbol!;
        }
      // fallthrough
      default:
        // get the symbol from the node aliased type's node, or just return the base
        // if it doesn't have a symbol (which will likely result in an error later on)
        return getMergedSymbol(aliasType.node!.symbol) ?? aliasSymbol;
    }
  }

  function checkStringTemplateExpresion(
    node: StringTemplateExpressionNode,
    mapper: TypeMapper | undefined
  ): StringTemplate {
    const spans: StringTemplateSpan[] = [createTemplateSpanLiteral(node.head)];
    for (const span of node.spans) {
      spans.push(createTemplateSpanValue(span.expression, mapper));
      spans.push(createTemplateSpanLiteral(span.literal));
    }
    const type = createType({
      kind: "StringTemplate",
      node,
      spans,
    });

    return type;
  }

  function createTemplateSpanLiteral(
    node: StringTemplateHeadNode | StringTemplateMiddleNode | StringTemplateTailNode
  ): StringTemplateSpanLiteral {
    return createType({
      kind: "StringTemplateSpan",
      node: node,
      isInterpolated: false,
      type: getLiteralType(node),
    });
  }

  function createTemplateSpanValue(
    node: Expression,
    mapper: TypeMapper | undefined
  ): StringTemplateSpanValue {
    return createType({
      kind: "StringTemplateSpan",
      node: node,
      isInterpolated: true,
      type: getTypeForNode(node, mapper),
    });
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
      bindMetaTypes(file);
    }
    for (const file of program.sourceFiles.values()) {
      for (const ns of file.namespaces) {
        const exports = mergedSymbols.get(ns.symbol)?.exports ?? ns.symbol.exports;
        program.reportDuplicateSymbols(exports);
        initializeTypeForNamespace(ns);
      }
    }

    for (const file of program.sourceFiles.values()) {
      applyAugmentDecoratorsInScope(file);
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

  function applyAugmentDecoratorsInScope(scope: TypeSpecScriptNode | NamespaceStatementNode) {
    applyAugmentDecorators(scope);
    if (scope.statements === undefined) {
      return;
    }

    if (isArray(scope.statements)) {
      for (const statement of scope.statements) {
        if (statement.kind === SyntaxKind.NamespaceStatement) {
          applyAugmentDecoratorsInScope(statement);
        }
      }
    } else {
      applyAugmentDecoratorsInScope(scope.statements);
    }
  }

  function checkSourceFile(file: TypeSpecScriptNode) {
    for (const statement of file.statements) {
      getTypeOrValueForNode(statement, undefined);
    }
  }

  /**
   * Check that the given node template parameters are valid if applicable.
   * @param node Node with template parameters
   * @param mapper Type mapper, set if instantiating the template, undefined otherwise.
   */
  function checkTemplateDeclaration(node: TemplateableNode, mapper: TypeMapper | undefined) {
    // If mapper is undefined it means we are checking the declaration of the template.
    if (mapper === undefined) {
      for (const templateParameter of node.templateParameters) {
        checkTemplateParameterDeclaration(templateParameter, undefined);
      }
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
    checkTemplateDeclaration(node, mapper);

    const decorators: DecoratorApplication[] = [];
    const type: Model = createType({
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties: createRekeyableMap<string, ModelProperty>(),
      namespace: getParentNamespaceType(node),
      decorators,
      derivedModels: [],
    });
    linkType(links, type, mapper);
    const isBase = checkModelIs(node, node.is, mapper);

    if (isBase) {
      type.sourceModel = isBase;
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
        linkIndirectMember(node, newProp, mapper);
        type.properties.set(prop.name, newProp);
      }
    }

    if (isBase) {
      type.baseModel = isBase.baseModel;
    } else if (node.extends) {
      type.baseModel = checkClassHeritage(node, node.extends, mapper);
      if (type.baseModel) {
        copyDeprecation(type.baseModel, type);
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

    linkMapper(type, mapper);

    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(type);
    }

    const indexer = getIndexer(program, type);
    if (type.name === "Array" && isInTypeSpecNamespace(type)) {
      stdTypes.Array = type;
    } else if (type.name === "Record" && isInTypeSpecNamespace(type)) {
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
    return mapper.args.every((t) => isValue(t) || t.kind !== "TemplateParameter");
  }

  function checkModelExpression(node: ModelExpressionNode, mapper: TypeMapper | undefined) {
    const properties = createRekeyableMap<string, ModelProperty>();
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

  /** Find the indexer that applies to this model. Either defined on itself or from a base model */
  function findIndexer(model: Model): ModelIndexer | undefined {
    let current: Model | undefined = model;

    while (current) {
      if (current.indexer) {
        return current.indexer;
      }
      current = current.baseModel;
    }
    return undefined;
  }

  function checkPropertyCompatibleWithModelIndexer(
    parentModel: Model,
    property: ModelProperty,
    diagnosticTarget: Node
  ) {
    const indexer = findIndexer(parentModel);
    if (indexer === undefined) {
      return;
    }
    return checkPropertyCompatibleWithIndexer(indexer, property, diagnosticTarget);
  }

  function checkPropertyCompatibleWithIndexer(
    indexer: ModelIndexer,
    property: ModelProperty,
    diagnosticTarget: Node
  ) {
    if (indexer.key.name === "integer") {
      reportCheckerDiagnostics([
        createDiagnostic({
          code: "no-array-properties",
          target: diagnosticTarget,
        }),
      ]);
      return;
    }

    const [valid, diagnostics] = isTypeAssignableTo(property.type, indexer.value, diagnosticTarget);
    if (!valid)
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "incompatible-indexer",
          format: { message: diagnostics.map((x) => `  ${x.message}`).join("\n") },
          target:
            diagnosticTarget.kind === SyntaxKind.ModelProperty
              ? diagnosticTarget.value
              : diagnosticTarget,
        })
      );
  }

  function checkModelProperties(
    node: ModelExpressionNode | ModelStatementNode,
    properties: Map<string, ModelProperty>,
    parentModel: Model,
    mapper: TypeMapper | undefined
  ) {
    let spreadIndexers: ModelIndexer[] | undefined;
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const newProp = checkModelProperty(prop, mapper);
        newProp.model = parentModel;
        checkPropertyCompatibleWithModelIndexer(parentModel, newProp, prop);
        defineProperty(properties, newProp);
      } else {
        // spread property
        const [newProperties, additionalIndexer] = checkSpreadProperty(
          node.symbol,
          prop.target,
          parentModel,
          mapper
        );
        if (additionalIndexer) {
          if (spreadIndexers) {
            spreadIndexers.push(additionalIndexer);
          } else {
            spreadIndexers = [additionalIndexer];
          }
        }
        for (const newProp of newProperties) {
          linkIndirectMember(node, newProp, mapper);
          checkPropertyCompatibleWithModelIndexer(parentModel, newProp, prop);
          defineProperty(properties, newProp, prop);
        }
      }
    }

    if (spreadIndexers) {
      const value =
        spreadIndexers.length === 1
          ? spreadIndexers[0].value
          : createUnion(spreadIndexers.map((i) => i.value));
      parentModel.indexer = {
        key: spreadIndexers[0].key,
        value: value,
      };
    }
  }

  function checkObjectValue(node: ObjectLiteralNode, mapper: TypeMapper | undefined): ObjectValue {
    return {
      valueKind: "ObjectValue",
      node: node,
      properties: checkObjectLiteralProperties(node, mapper),
      type: null as any, // TODO: fix
    };
  }

  function checkObjectLiteralProperties(
    node: ObjectLiteralNode,
    mapper: TypeMapper | undefined
  ): Map<string, ObjectValuePropertyDescriptor> {
    const properties = new Map<string, ObjectValuePropertyDescriptor>();

    for (const prop of node.properties!) {
      if ("id" in prop) {
        const value = getValueForNode(prop.value, mapper);
        if (value !== null) {
          properties.set(prop.id.sv, { name: prop.id.sv, value: value });
        }
      } else {
        const targetType = checkObjectSpreadProperty(prop.target, mapper);
        if (targetType) {
          for (const [name, value] of targetType.properties) {
            properties.set(name, value);
          }
        }
      }
    }
    return properties;
  }

  function checkObjectSpreadProperty(
    targetNode: TypeReferenceNode,
    mapper: TypeMapper | undefined
  ): ObjectValue | null {
    const value = getValueForNode(targetNode, mapper);
    if (value === null) {
      return null;
    }
    if (value.valueKind !== "ObjectValue") {
      reportCheckerDiagnostic(createDiagnostic({ code: "spread-object", target: targetNode }));
      return null;
    }

    return value;
  }

  function checkTupleValue(
    node: TupleLiteralNode,
    mapper: TypeMapper | undefined
  ): ArrayValue | null {
    let hasError = false;
    const values = node.values.map((itemNode) => {
      const value = getValueForNode(itemNode, mapper);
      if (value === null) {
        hasError = true;
      }
      return value;
    });
    if (hasError) {
      return null;
    }
    return {
      valueKind: "ArrayValue",
      node: node,
      values: values as any,
      type: null as any, // TODO: fix
    };
  }

  function findTypesMatching(base: Type, constraint: Type): Type[] {
    if (constraint.kind === base.kind) {
      if (ignoreDiagnostics(isTypeAssignableTo(base, constraint, base))) {
        return [constraint];
      }
      return [];
    } else if (constraint.kind === "Union") {
      const matches: Type[] = [];
      for (const variant of constraint.variants.values()) {
        const subMatches = findTypesMatching(base, variant.type);
        for (const match of subMatches) {
          matches.push(match);
        }
      }
      return matches;
    } else {
      return [];
    }
  }

  function inferScalarForPrimitiveValue(
    base: Scalar,
    type: Type | undefined,
    literalType: Type
  ): Scalar | undefined {
    if (type === undefined) {
      return undefined;
    }
    switch (type.kind) {
      case "Scalar":
        if (areScalarsRelated(type, base)) {
          return type;
        }
        return undefined;
      case "Union":
        let found = undefined;
        for (const variant of type.variants.values()) {
          const scalar = inferScalarForPrimitiveValue(base, variant.type, literalType);
          if (scalar) {
            if (found) {
              reportCheckerDiagnostic(
                createDiagnostic({
                  code: "ambiguous-scalar-type",
                  format: {
                    value: getTypeName(literalType),
                    types: [found, scalar].map((x) => x.name).join(", "),
                    example: found.name,
                  },
                  target: literalType,
                })
              );
              return undefined;
            } else {
              found = scalar;
            }
          }
        }
        return found;
      default:
        return undefined;
    }
  }

  function checkStringValue(
    literalType: StringLiteral | StringTemplate,
    mapper: TypeMapper | undefined,
    type: Type | undefined
  ): StringValue {
    let value: string;
    if (literalType.kind === "StringTemplate") {
      const [result, diagnostics] = stringTemplateToString(literalType);
      value = result;
      reportCheckerDiagnostics(diagnostics);
    } else {
      value = literalType.value;
    }
    const scalar = inferScalarForPrimitiveValue(getStdType("string"), type, literalType);
    return {
      valueKind: "StringValue",
      value,
      type: type ?? literalType,
      scalar,
    };
  }

  function checkNumericValue(literalType: NumericLiteral, type: Type | undefined): NumericValue {
    const scalar = inferScalarForPrimitiveValue(getStdType("numeric"), type, literalType);
    return {
      valueKind: "NumericValue",
      value: Numeric(literalType.valueAsString),
      type: literalType,
      scalar,
    };
  }

  function checkBooleanValue(literalType: BooleanLiteral, type: Type | undefined): BooleanValue {
    const scalar = inferScalarForPrimitiveValue(getStdType("boolean"), type, literalType);
    return {
      valueKind: "BooleanValue",
      value: literalType.value,
      type: type ?? literalType,
      scalar,
    };
  }

  function checkNullValue(literalType: NullType, type: Type | undefined): NullValue | null {
    if (
      type !== undefined &&
      !ignoreDiagnostics(isTypeAssignableTo(literalType, type, literalType))
    ) {
      return null;
    }
    return {
      valueKind: "NullValue",
      type: type ?? literalType,
      value: null,
    };
  }

  function checkEnumValue(literalType: EnumMember, type: Type | undefined): EnumValue | null {
    if (type !== undefined && !findTypesMatching(literalType, type)) {
      return null;
    }
    return {
      valueKind: "EnumValue",
      type: type ?? literalType,
      value: literalType,
    };
  }

  /**
   * Check and resolve a type for the given type reference node.
   * @param node Node.
   * @param mapper Type mapper for template instantiation context.
   * @param instantiateTemplate If templated type should be instantiated if they haven't yet.
   * @returns Resolved type.
   */
  function checkValueReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    mapper: TypeMapper | undefined
  ): Value | null {
    const sym = resolveTypeReferenceSym(node, mapper);
    if (!sym) {
      return null;
    }

    const value = checkValueReferenceSymbol(sym, node, mapper);
    return value;
  }

  function checkCallExpressionTarget(
    node: CallExpressionNode,
    mapper: TypeMapper | undefined
  ): ScalarConstructor | Scalar | null {
    const target = checkTypeReference(node.target, mapper);
    if (target.kind === "Scalar" || target.kind === "ScalarConstructor") {
      return target;
    } else {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "non-callable",
          format: { type: target.kind },
          target: node.target,
        })
      );
      return null;
    }
  }

  /** Check the arguments of the call expression are a single value of the given syntax. */
  function checkPrimitiveArg<T extends NumericValue | BooleanValue | StringValue>(
    node: CallExpressionNode,
    scalar: Scalar,
    valueKind: T["valueKind"]
  ): T | null {
    if (node.arguments.length !== 1) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-primitive-init",
          target: node.target,
        })
      );
      return null;
    }
    const argNode = node.arguments[0];
    const value = getValueForNode(argNode, undefined);
    if (value === null) {
      return null; // error should already have been reported above.
    }
    if (value.valueKind !== valueKind) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-primitive-init",
          messageId: "invalidArg",
          format: { actual: value.valueKind, expected: valueKind },
          target: argNode,
        })
      );
      return null;
    }
    if (!checkValueOfType(value, scalar, argNode)) {
      return null;
    }
    return { ...value, scalar, type: scalar } as any;
  }

  function createScalarValue(
    node: CallExpressionNode,
    mapper: TypeMapper | undefined,
    declaration: ScalarConstructor
  ): ScalarValue | null {
    let hasError = false;

    const minArgs = declaration.parameters.filter((x) => !x.optional && !x.rest).length ?? 0;
    const maxArgs = declaration.parameters[declaration.parameters.length - 1]?.rest
      ? undefined
      : declaration.parameters.length;

    if (
      node.arguments.length < minArgs ||
      (maxArgs !== undefined && node.arguments.length > maxArgs)
    ) {
      // In the case we have too little args then this decorator is not applicable.
      // If there is too many args then we can still run the decorator as long as the args are valid.
      if (node.arguments.length < minArgs) {
        hasError = true;
      }

      if (maxArgs === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            messageId: "atLeast",
            format: { actual: node.arguments.length.toString(), expected: minArgs.toString() },
            target: node,
          })
        );
      } else {
        const expected = minArgs === maxArgs ? minArgs.toString() : `${minArgs}-${maxArgs}`;
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            format: { actual: node.arguments.length.toString(), expected },
            target: node,
          })
        );
      }
    }

    const resolvedArgs: Value[] = [];

    for (const [index, parameter] of declaration.parameters.entries()) {
      if (parameter.rest) {
        const restType =
          parameter.type.kind === "ParamConstraintUnion" || parameter.type.kind === "Value" // TODO: change if we change this to not be a FunctionParameter
            ? undefined
            : getIndexType(parameter.type);
        if (restType) {
          for (let i = index; i < node.arguments.length; i++) {
            const argNode = node.arguments[i];
            if (argNode) {
              const arg = getValueForNode(argNode, mapper, restType);
              if (arg === null) {
                hasError = true;
                continue;
              }
              if (checkValueOfType(arg, restType, argNode)) {
                resolvedArgs.push(arg);
              } else {
                hasError = true;
              }
            }
          }
        }
        break;
      }
      const argNode = node.arguments[index];
      if (argNode) {
        const arg = getValueForNode(argNode, mapper, parameter.type as any); // TODO: change if we change this to not be a FunctionParameter
        if (arg === null) {
          hasError = true;
          continue;
        }
        if (checkValueOfType(arg, parameter.type as any, argNode)) {
          resolvedArgs.push(arg);
        } else {
          hasError = true;
        }
      }
    }
    if (hasError) {
      return null;
    }
    return {
      valueKind: "ScalarValue",
      value: {
        name: declaration.name,
        args: resolvedArgs,
      },
      scalar: declaration.scalar,
      type: declaration.scalar,
    };
  }

  // TODO: should those be called eval?
  function checkCallExpression(
    node: CallExpressionNode,
    mapper: TypeMapper | undefined
  ): Value | null {
    const target = checkCallExpressionTarget(node, mapper);
    if (target === null) {
      return null;
    }
    if (target.kind === "ScalarConstructor") {
      return createScalarValue(node, mapper, target);
    }

    if (areScalarsRelated(target, getStdType("string"))) {
      return checkPrimitiveArg(node, target, "StringValue");
    } else if (areScalarsRelated(target, getStdType("numeric"))) {
      return checkPrimitiveArg(node, target, "NumericValue");
    } else if (areScalarsRelated(target, getStdType("boolean"))) {
      return checkPrimitiveArg(node, target, "BooleanValue");
    } else {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "named-init-required",
          format: { typeKind: target.kind },
          target: node.target,
        })
      );
      return null;
    }
  }

  function createUnion(options: Type[]): Union {
    const variants = createRekeyableMap<string | symbol, UnionVariant>();
    const union: Union = createAndFinishType({
      kind: "Union",
      node: undefined!,
      options,
      decorators: [],
      variants,
      expression: true,
    });

    for (const option of options) {
      const name = Symbol("indexer-union-variant");
      variants.set(
        name,
        createAndFinishType({
          kind: "UnionVariant",
          node: undefined!,
          type: option,
          name,
          union,
          decorators: [],
        })
      );
    }
    return union;
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
      const parentType = getTypeName(overriddenProp.type);
      const newPropType = getTypeName(newProp.type);

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
    const bound = new Set<Sym>();
    if (node.symbol) {
      bindMembers(node, node.symbol);
    }
    visitChildren(node, (child) => {
      bindAllMembers(child);
    });

    function bindMembers(node: Node, containerSym: Sym) {
      if (bound.has(containerSym)) {
        return;
      }
      bound.add(containerSym);
      let containerMembers: Mutable<SymbolTable>;

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
              const name = prop.id.sv;
              bindMember(name, prop, SymbolFlags.ModelProperty);
            }
          }
          break;
        case SyntaxKind.ScalarStatement:
          if (node.extends && node.extends.kind === SyntaxKind.TypeReference) {
            resolveAndCopyMembers(node.extends);
          }
          for (const member of node.members) {
            const name = member.id.sv;
            bindMember(name, member, SymbolFlags.ScalarMember);
          }
          break;
        case SyntaxKind.ModelExpression:
          for (const prop of node.properties) {
            if (prop.kind === SyntaxKind.ModelSpreadProperty) {
              resolveAndCopyMembers(prop.target);
            } else {
              const name = prop.id.sv;
              bindMember(name, prop, SymbolFlags.ModelProperty);
            }
          }
          break;
        case SyntaxKind.EnumStatement:
          for (const member of node.members.values()) {
            if (member.kind === SyntaxKind.EnumSpreadMember) {
              resolveAndCopyMembers(member.target);
            } else {
              const name = member.id.sv;
              bindMember(name, member, SymbolFlags.EnumMember);
            }
          }
          break;
        case SyntaxKind.InterfaceStatement:
          for (const member of node.operations.values()) {
            bindMember(member.id.sv, member, SymbolFlags.InterfaceMember | SymbolFlags.Operation);
          }
          if (node.extends) {
            for (const ext of node.extends) {
              resolveAndCopyMembers(ext);
            }
          }
          break;
        case SyntaxKind.UnionStatement:
          for (const variant of node.options.values()) {
            if (!variant.id) {
              continue;
            }
            const name = variant.id.sv;
            bindMember(name, variant, SymbolFlags.UnionVariant);
          }
          break;
      }

      function resolveAndCopyMembers(node: TypeReferenceNode) {
        let ref = resolveTypeReferenceSym(node, undefined);
        if (ref && ref.flags & SymbolFlags.Alias) {
          ref = resolveAliasedSymbol(ref);
        }
        if (ref && ref.members) {
          bindMembers(ref.declarations[0], ref);
          copyMembers(ref.members);
        }
      }

      function resolveAliasedSymbol(ref: Sym): Sym | undefined {
        const node = ref.declarations[0] as AliasStatementNode;
        switch (node.value.kind) {
          case SyntaxKind.MemberExpression:
          case SyntaxKind.TypeReference:
            const resolvedSym = resolveTypeReferenceSym(node.value, undefined);
            if (resolvedSym && resolvedSym.flags & SymbolFlags.Alias) {
              return resolveAliasedSymbol(resolvedSym);
            }
            return resolvedSym;
          default:
            return undefined;
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
  }

  function copyMembersToContainer(targetContainerSym: Sym, table: SymbolTable) {
    const members = augmentedSymbolTables.get(table) ?? table;
    compilerAssert(targetContainerSym.members, "containerSym.members is undefined");
    const containerMembers = getOrCreateAugmentedSymbolTable(targetContainerSym.members);

    for (const member of members.values()) {
      bindMemberToContainer(
        targetContainerSym,
        containerMembers,
        member.name,
        member.declarations[0],
        member.flags
      );
    }
  }

  function bindMemberToContainer(
    containerSym: Sym,
    containerMembers: Mutable<SymbolTable>,
    name: string,
    node: Node,
    kind: SymbolFlags
  ) {
    const sym = createSymbol(node, name, kind, containerSym);
    compilerAssert(containerSym.members, "containerSym.members is undefined");
    containerMembers.set(name, sym);
  }

  function bindMetaTypes(node: Node) {
    const visited = new Set();
    function visit(node: Node, symbol?: Sym) {
      if (visited.has(node)) {
        return;
      }
      visited.add(node);
      switch (node.kind) {
        case SyntaxKind.ModelProperty: {
          const sym = getSymbolForMember(node);
          if (sym) {
            const table = getOrCreateAugmentedSymbolTable(sym.metatypeMembers!);

            table.set(
              "type",
              node.value.kind === SyntaxKind.TypeReference
                ? createSymbol(node.value, "", SymbolFlags.Alias)
                : node.value.symbol
            );
          }
          break;
        }

        case SyntaxKind.OperationStatement: {
          const sym = symbol ?? node.symbol ?? getSymbolForMember(node);
          const table = getOrCreateAugmentedSymbolTable(sym.metatypeMembers!);
          if (node.signature.kind === SyntaxKind.OperationSignatureDeclaration) {
            table.set("parameters", node.signature.parameters.symbol);
            table.set("returnType", node.signature.returnType.symbol);
          } else {
            const sig = resolveTypeReferenceSym(node.signature.baseOperation, undefined, {
              checkTemplateTypes: false,
            });
            if (sig) {
              visit(sig.declarations[0], sig);
              const sigTable = getOrCreateAugmentedSymbolTable(sig.metatypeMembers!);
              const sigParameterSym = sigTable.get("parameters")!;
              if (sigParameterSym !== undefined) {
                const parametersSym = createSymbol(
                  sigParameterSym.declarations[0],
                  "parameters",
                  SymbolFlags.Model & SymbolFlags.MemberContainer
                );
                copyMembersToContainer(parametersSym, sigParameterSym.members!);
                table.set("parameters", parametersSym);
                table.set("returnType", sigTable.get("returnType")!);
              }
            }
          }

          break;
        }
      }
      visitChildren(node, (child) => {
        bindMetaTypes(child);
      });
    }
    visit(node);
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
      case "Scalar":
        for (const member of type.constructors.values()) {
          lateBindMember(member, SymbolFlags.Member);
        }
        break;
      case "Enum":
        for (const member of type.members.values()) {
          lateBindMember(member, SymbolFlags.EnumMember);
        }
        break;
      case "Interface":
        for (const member of type.operations.values()) {
          lateBindMember(member, SymbolFlags.InterfaceMember | SymbolFlags.Operation);
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
      const sym = createSymbol(
        member.node,
        member.name,
        kind | SymbolFlags.LateBound,
        containerSym
      );
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
    pendingResolutions.start(modelSymId, ResolutionKind.BaseType);

    const target = resolveTypeReferenceSym(heritageRef, mapper);
    if (target === undefined) {
      return undefined;
    }

    if (
      pendingResolutions.has(getNodeSymId(target.declarations[0] as any), ResolutionKind.BaseType)
    ) {
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
    pendingResolutions.finish(modelSymId, ResolutionKind.BaseType);
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
    pendingResolutions.start(modelSymId, ResolutionKind.BaseType);
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
      if (
        pendingResolutions.has(getNodeSymId(target.declarations[0] as any), ResolutionKind.BaseType)
      ) {
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

    pendingResolutions.finish(modelSymId, ResolutionKind.BaseType);

    if (isType.kind !== "Model") {
      reportCheckerDiagnostic(createDiagnostic({ code: "is-model", target: isExpr }));
      return;
    }

    if (isType.name === "") {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "is-model", messageId: "modelExpression", target: isExpr })
      );
      return undefined;
    }

    return isType;
  }

  function checkSpreadProperty(
    parentModelSym: Sym,
    targetNode: TypeReferenceNode,
    parentModel: Model,
    mapper: TypeMapper | undefined
  ): [ModelProperty[], ModelIndexer | undefined] {
    const targetType = getTypeForNode(targetNode, mapper);

    if (targetType.kind === "TemplateParameter" || isErrorType(targetType)) {
      return [[], undefined];
    }
    if (targetType.kind !== "Model") {
      reportCheckerDiagnostic(createDiagnostic({ code: "spread-model", target: targetNode }));
      return [[], undefined];
    }
    if (isArrayModelType(program, targetType)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "spread-model", target: targetNode }));
      return [[], undefined];
    }

    if (parentModel === targetType) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "spread-model",
          messageId: "selfSpread",
          target: targetNode,
        })
      );
    }

    const props: ModelProperty[] = [];
    // copy each property
    for (const prop of walkPropertiesInherited(targetType)) {
      const memberSym = getMemberSymbol(parentModelSym, prop.name);
      props.push(
        cloneTypeForSymbol(memberSym!, prop, {
          sourceProperty: prop,
          model: parentModel,
        })
      );
    }

    return [props, targetType.indexer];
  }

  /**
   * Link an indirect model property(included via spread or model is) to its model member symbols.
   * @param containerNode Model Node
   * @param member New Property
   * @param mapper Type Mapper.
   */
  function linkIndirectMember(
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
    );
    if (memberSym) {
      const links = getSymbolLinks(memberSym);
      linkMemberType(links, member, mapper);
    }
  }

  function checkModelProperty(
    prop: ModelPropertyNode,
    mapper: TypeMapper | undefined
  ): ModelProperty {
    const symId = getSymbolId(getSymbolForMember(prop)!);
    const links = getSymbolLinksForMember(prop);

    if (links && links.declaredType && mapper === undefined) {
      return links.declaredType as ModelProperty;
    }
    const name = prop.id.sv;

    const type: ModelProperty = createType({
      kind: "ModelProperty",
      name,
      node: prop,
      optional: prop.optional,
      type: undefined!,
      decorators: [],
    });

    if (pendingResolutions.has(symId, ResolutionKind.Type) && mapper === undefined) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "circular-prop",
          format: { propName: name },
          target: prop,
        })
      );
      type.type = errorType;
    } else {
      pendingResolutions.start(symId, ResolutionKind.Type);
      type.type = getTypeForNode(prop.value, mapper);
      type.default = prop.default && (checkDefault(prop.default, type.type) as any); // TODO: fix;
      if (links) {
        linkType(links, type, mapper);
      }
    }

    type.decorators = checkDecorators(type, prop, mapper);
    const parentTemplate = getParentTemplateNode(prop);
    linkMapper(type, mapper);

    if (!parentTemplate || shouldCreateTypeForTemplate(parentTemplate, mapper)) {
      if (
        prop.parent?.parent?.kind === SyntaxKind.OperationSignatureDeclaration &&
        prop.parent.parent.parent?.kind === SyntaxKind.OperationStatement
      ) {
        const doc = extractParamDoc(prop.parent.parent.parent, type.name);
        if (doc) {
          type.decorators.unshift(createDocFromCommentDecorator("self", doc));
        }
      }
      finishType(type);
    }

    pendingResolutions.finish(symId, ResolutionKind.Type);

    return type;
  }

  function createDocFromCommentDecorator(key: "self" | "returns" | "errors", doc: string) {
    return {
      decorator: $docFromComment,
      args: [
        { value: createLiteralType(key), jsValue: key },
        { value: createLiteralType(doc), jsValue: doc },
      ],
    };
  }

  function isDefaultValue(type: Type | Value): boolean {
    if (isType(type)) {
      if (type.kind === "UnionVariant") {
        return isValue(type.type);
      }
      if (type.kind === "Tuple") {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "deprecated",
            codefixes: [createTupleToLiteralCodeFix(type.node)],
            format: {
              message:
                "Using a tuple as a default value is deprecated. Use a tuple literal instead. `#[]`",
            },
            target: type.node,
          })
        );
        return true;
      }
    }

    return isValue(type);
  }

  function checkDefault(defaultNode: Node, type: Type): Type | Value {
    const defaultType = getTypeOrValueForNode(defaultNode, undefined);
    if (defaultType === null || isErrorType(type)) {
      return errorType;
    }
    if (!isDefaultValue(defaultType)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "unsupported-default",
          // TODO: fix this
          format: { type: (defaultType as any).kind },
          target: defaultNode,
        })
      );
      return errorType;
    }
    const [related, diagnostics] = isValue(defaultType)
      ? isValueOfType(defaultType, type, defaultNode)
      : isTypeAssignableTo(defaultType, type, defaultNode);
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
        symbolLinks.declaredType.kind === "Decorator",
        "Expected to find a decorator type."
      );
      if (!checkDecoratorTarget(targetType, symbolLinks.declaredType, decNode)) {
        hasError = true;
      }
    }
    const [argsHaveError, args] = checkDecoratorArguments(
      decNode,
      mapper,
      symbolLinks.declaredType
    );

    if (hasError || argsHaveError) {
      return undefined;
    }
    return {
      definition: symbolLinks.declaredType,
      decorator: sym.value ?? ((...args: any[]) => {}),
      node: decNode,
      args,
    };
  }

  /** Check the decorator target is valid */

  function checkDecoratorTarget(targetType: Type, declaration: Decorator, decoratorNode: Node) {
    const [targetValid] = isTypeAssignableTo(targetType, declaration.target.type, decoratorNode);
    if (!targetValid) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "decorator-wrong-target",
          messageId: "withExpected",
          format: {
            decorator: declaration.name,
            to: getTypeName(targetType),
            expected: getEntityName(declaration.target.type),
          },
          target: decoratorNode,
        })
      );
    }
    return targetValid;
  }

  function checkDecoratorArguments(
    node: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    mapper: TypeMapper | undefined,
    declaration: Decorator | undefined
  ): [boolean, DecoratorArgument[]] {
    // if we don't have a declaration we can just return the types or values if
    if (declaration === undefined) {
      return [
        false,
        node.arguments.map((argNode): DecoratorArgument => {
          const type = getTypeOrValueForNode(argNode, mapper) ?? errorType;
          return {
            value: type,
            jsValue: type,
            node: argNode,
          };
        }),
      ];
    }

    let hasError = false;

    const minArgs = declaration.parameters.filter((x) => !x.optional && !x.rest).length ?? 0;
    const maxArgs = declaration.parameters[declaration.parameters.length - 1]?.rest
      ? undefined
      : declaration.parameters.length;

    if (
      node.arguments.length < minArgs ||
      (maxArgs !== undefined && node.arguments.length > maxArgs)
    ) {
      // In the case we have too little args then this decorator is not applicable.
      // If there is too many args then we can still run the decorator as long as the args are valid.
      if (node.arguments.length < minArgs) {
        hasError = true;
      }

      if (maxArgs === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            messageId: "atLeast",
            format: { actual: node.arguments.length.toString(), expected: minArgs.toString() },
            target: node,
          })
        );
      } else {
        const expected = minArgs === maxArgs ? minArgs.toString() : `${minArgs}-${maxArgs}`;
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            format: { actual: node.arguments.length.toString(), expected },
            target: node,
          })
        );
      }
    }

    const resolvedArgs: DecoratorArgument[] = [];

    for (const [index, parameter] of declaration.parameters.entries()) {
      if (parameter.rest) {
        const restType =
          parameter.type.kind === "ParamConstraintUnion"
            ? undefined
            : getIndexType(
                parameter.type.kind === "Value" ? parameter.type.target : parameter.type
              );
        if (restType) {
          for (let i = index; i < node.arguments.length; i++) {
            const argNode = node.arguments[i];
            if (argNode) {
              const arg = getTypeOrValueForNode(argNode, mapper, parameter.type);
              if (
                arg !== null &&
                !(isType(arg) && isErrorType(arg)) &&
                checkArgumentAssignable(
                  arg,
                  parameter.type.kind === "Value" ? { kind: "Value", target: restType } : restType,
                  argNode
                )
              ) {
                resolvedArgs.push({
                  value: arg,
                  node: argNode,
                  jsValue: resolveDecoratorArgJsValue(arg, parameter.type.kind === "Value"),
                });
              } else {
                hasError = true;
              }
            }
          }
        }
        break;
      }
      const argNode = node.arguments[index];
      if (argNode) {
        const arg = getTypeOrValueForNode(argNode, mapper, parameter.type);
        if (
          arg !== null &&
          !(isType(arg) && isErrorType(arg)) &&
          checkArgumentAssignable(arg, parameter.type, argNode)
        ) {
          resolvedArgs.push({
            value: arg,
            node: argNode,
            jsValue: resolveDecoratorArgJsValue(arg, parameter.type.kind === "Value"),
          });
        } else {
          hasError = true;
        }
      }
    }
    return [hasError, resolvedArgs];
  }

  function getIndexType(type: Type): Type | undefined {
    return type.kind === "Model" ? type.indexer?.value : undefined;
  }

  function resolveDecoratorArgJsValue(value: Type | Value, valueOf: boolean) {
    if (valueOf) {
      if (isValue(value) || value.kind === "Model" || value.kind === "Tuple") {
        const [res, diagnostics] = marshallTypeForJSWithLegacyCast(value);
        reportCheckerDiagnostics(diagnostics);
        return res ?? value;
      } else {
        return value;
      }
    }
    return value;
  }

  function checkArgumentAssignable(
    argumentType: Type | Value,
    parameterType: Entity,
    diagnosticTarget: DiagnosticTarget
  ): boolean {
    const [valid] = isTypeAssignableTo(argumentType, parameterType, diagnosticTarget);
    if (!valid) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-argument",
          format: {
            value: getEntityName(argumentType),
            expected: getEntityName(parameterType),
          },
          target: diagnosticTarget,
        })
      );
    }
    return valid;
  }

  function checkAugmentDecorators(sym: Sym, targetType: Type, mapper: TypeMapper | undefined) {
    const augmentDecoratorNodes = augmentDecoratorsForSym.get(sym) ?? [];
    const decorators: DecoratorApplication[] = [];

    for (const decNode of augmentDecoratorNodes) {
      const decorator = checkDecorator(targetType, decNode, mapper);
      if (decorator) {
        decorators.unshift(decorator);
      }
    }
    return decorators;
  }
  function checkDecorators(
    targetType: Type,
    node: Node & { decorators: readonly DecoratorExpressionNode[] },
    mapper: TypeMapper | undefined
  ) {
    const sym = isMemberNode(node) ? getSymbolForMember(node) ?? node.symbol : node.symbol;
    const decorators: DecoratorApplication[] = [];

    const augmentDecoratorNodes = augmentDecoratorsForSym.get(sym) ?? [];
    const decoratorNodes = [
      ...augmentDecoratorNodes, // the first decorator will be executed at last, so augmented decorator should be placed at first.
      ...node.decorators,
    ];
    for (const decNode of decoratorNodes) {
      const decorator = checkDecorator(targetType, decNode, mapper);
      if (decorator) {
        decorators.unshift(decorator);
      }
    }

    // Doc comment should always be the first decorator in case an explicit @doc must override it.
    const docComment = extractMainDoc(targetType);
    if (docComment) {
      decorators.unshift(createDocFromCommentDecorator("self", docComment));
    }
    if (targetType.kind === "Operation") {
      const returnTypesDocs = extractReturnsDocs(targetType);
      if (returnTypesDocs.returns) {
        decorators.unshift(createDocFromCommentDecorator("returns", returnTypesDocs.returns));
      }
      if (returnTypesDocs.errors) {
        decorators.unshift(createDocFromCommentDecorator("errors", returnTypesDocs.errors));
      }
    }
    return decorators;
  }

  function checkScalar(node: ScalarStatementNode, mapper: TypeMapper | undefined): Scalar {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }
    checkTemplateDeclaration(node, mapper);

    const decorators: DecoratorApplication[] = [];

    const type: Scalar = createType({
      kind: "Scalar",
      name: node.id.sv,
      node: node,
      constructors: new Map(),
      namespace: getParentNamespaceType(node),
      decorators,
      derivedScalars: [],
    });
    checkScalarConstructors(type, node, type.constructors, mapper);
    linkType(links, type, mapper);

    if (node.extends) {
      type.baseScalar = checkScalarExtends(node, node.extends, mapper);
      if (type.baseScalar) {
        copyDeprecation(type.baseScalar, type);
        type.baseScalar.derivedScalars.push(type);
      }
    }
    decorators.push(...checkDecorators(type, node, mapper));

    if (mapper === undefined) {
      type.namespace?.scalars.set(type.name, type);
    }
    linkMapper(type, mapper);
    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(type);
    }
    if (isInTypeSpecNamespace(type)) {
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
    pendingResolutions.start(symId, ResolutionKind.BaseType);

    const target = resolveTypeReferenceSym(extendsRef, mapper);
    if (target === undefined) {
      return undefined;
    }

    if (
      pendingResolutions.has(getNodeSymId(target.declarations[0] as any), ResolutionKind.BaseType)
    ) {
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
    pendingResolutions.finish(symId, ResolutionKind.BaseType);
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

  function checkScalarConstructors(
    parentScalar: Scalar,
    node: ScalarStatementNode,
    constructors: Map<string, ScalarConstructor>,
    mapper: TypeMapper | undefined
  ) {
    for (const member of node.members) {
      const constructor = checkScalarConstructor(member, mapper, parentScalar);
      if (constructors.has(constructor.name as string)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "constructor-duplicate",
            format: { name: constructor.name.toString() },
            target: member,
          })
        );
        continue;
      }
      constructors.set(constructor.name, constructor);
    }
  }

  function checkScalarConstructor(
    node: ScalarConstructorNode,
    mapper: TypeMapper | undefined,
    parentScalar: Scalar
  ): ScalarConstructor {
    const name = node.id.sv;
    const links = getSymbolLinksForMember(node);
    if (links && links.declaredType && mapper === undefined) {
      // we're not instantiating this union variant and we've already checked it
      return links.declaredType as ScalarConstructor;
    }

    const member: ScalarConstructor = createType({
      kind: "ScalarConstructor",
      scalar: parentScalar,
      name,
      node,
      parameters: node.parameters.map((x) => checkFunctionParameter(x, mapper)),
    });
    linkMapper(member, mapper);
    if (shouldCreateTypeForTemplate(node.parent!, mapper)) {
      finishType(member);
    }
    if (links) {
      linkType(links, member, mapper);
    }

    return finishType(member);
  }

  function checkAlias(node: AliasStatementNode, mapper: TypeMapper | undefined): Type {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      return links.declaredType;
    }
    checkTemplateDeclaration(node, mapper);

    const aliasSymId = getNodeSymId(node);
    if (pendingResolutions.has(aliasSymId, ResolutionKind.Type)) {
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

    pendingResolutions.start(aliasSymId, ResolutionKind.Type);
    const type = getTypeForNode(node.value, mapper);
    if (!isValue(type)) {
      linkType(links, type, mapper);
    }
    pendingResolutions.finish(aliasSymId, ResolutionKind.Type);

    return type;
  }

  function checkConst(node: ConstStatementNode): Value | null {
    const links = getSymbolLinks(node.symbol);
    if (links.value !== undefined) {
      return links.value;
    }

    const type = node.type ? getTypeForNode(node.type, undefined) : undefined;

    const symId = getSymbolId(node.symbol);
    if (pendingResolutions.has(symId, ResolutionKind.Value)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "circular-const",
          format: { name: node.id.sv },
          target: node,
        })
      );
      return null;
    }

    pendingResolutions.start(symId, ResolutionKind.Value);
    const value = getValueForNode(node.value, undefined, type);
    pendingResolutions.finish(symId, ResolutionKind.Value);
    if (value === null || (type && !checkValueOfType(value, type, node.id))) {
      links.value = null;
      return links.value;
    }
    links.value = type ? { ...value, type } : { ...value };
    return links.value;
  }

  function checkEnum(node: EnumStatementNode, mapper: TypeMapper | undefined): Type {
    const links = getSymbolLinks(node.symbol);
    if (!links.type) {
      const enumType: Enum = (links.type = createType({
        kind: "Enum",
        name: node.id.sv,
        node,
        members: createRekeyableMap<string, EnumMember>(),
        decorators: [],
      }));

      const memberNames = new Set<string>();

      for (const member of node.members) {
        if (member.kind === SyntaxKind.EnumMember) {
          const memberType = checkEnumMember(member, mapper, enumType);
          if (memberNames.has(memberType.name)) {
            reportCheckerDiagnostic(
              createDiagnostic({
                code: "enum-member-duplicate",
                format: { name: memberType.name },
                target: node,
              })
            );
            continue;
          }
          memberNames.add(memberType.name);
          enumType.members.set(memberType.name, memberType);
        } else {
          const members = checkEnumSpreadMember(
            node.symbol,
            enumType,
            member.target,
            mapper,
            memberNames
          );
          for (const memberType of members) {
            linkIndirectMember(node, memberType, mapper);
            enumType.members.set(memberType.name, memberType);
          }
        }
      }

      const namespace = getParentNamespaceType(node);
      enumType.namespace = namespace;
      enumType.namespace?.enums.set(enumType.name!, enumType);
      enumType.decorators = checkDecorators(enumType, node, mapper);
      linkMapper(enumType, mapper);
      finishType(enumType);
    }

    return links.type;
  }

  function checkInterface(node: InterfaceStatementNode, mapper: TypeMapper | undefined): Interface {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as Interface;
    }
    checkTemplateDeclaration(node, mapper);

    const interfaceType: Interface = createType({
      kind: "Interface",
      decorators: [],
      node,
      namespace: getParentNamespaceType(node),
      sourceInterfaces: [],
      operations: createRekeyableMap(),
      name: node.id.sv,
    });

    linkType(links, interfaceType, mapper);

    interfaceType.decorators = checkDecorators(interfaceType, node, mapper);

    const ownMembers = checkInterfaceMembers(node, mapper, interfaceType);

    for (const extendsNode of node.extends) {
      const extendsType = getTypeForNode(extendsNode, mapper);
      if (extendsType.kind !== "Interface") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "extends-interface", target: extendsNode })
        );
        continue;
      }

      for (const member of extendsType.operations.values()) {
        if (interfaceType.operations.has(member.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "extends-interface-duplicate",
              format: { name: member.name },
              target: extendsNode,
            })
          );
        }

        const newMember = cloneTypeForSymbol(getMemberSymbol(node.symbol, member.name)!, member, {
          interface: interfaceType,
        });
        // Don't link it it is overritten
        if (!ownMembers.has(member.name)) {
          linkIndirectMember(node, newMember, mapper);
        }

        // Clone deprecation information
        copyDeprecation(member, newMember);

        interfaceType.operations.set(newMember.name, newMember);
      }
      interfaceType.sourceInterfaces.push(extendsType);
    }

    for (const [key, value] of ownMembers) {
      interfaceType.operations.set(key, value);
    }

    linkMapper(interfaceType, mapper);
    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(interfaceType);
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
  ): Map<string, Operation> {
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
      }
    }
    return ownMembers;
  }

  function checkUnion(node: UnionStatementNode, mapper: TypeMapper | undefined) {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && mapper === undefined) {
      // we're not instantiating this union and we've already checked it
      return links.declaredType as Union;
    }
    checkTemplateDeclaration(node, mapper);

    const variants = createRekeyableMap<string, UnionVariant>();
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
    linkType(links, unionType, mapper);

    unionType.decorators = checkDecorators(unionType, node, mapper);

    checkUnionVariants(unionType, node, variants, mapper);

    linkMapper(unionType, mapper);
    if (shouldCreateTypeForTemplate(node, mapper)) {
      finishType(unionType);
    }

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
    const links = getSymbolLinksForMember(variantNode);
    if (links && links.declaredType && mapper === undefined) {
      // we're not instantiating this union variant and we've already checked it
      return links.declaredType as UnionVariant;
    }

    const name = variantNode.id ? variantNode.id.sv : Symbol("name");
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

    linkMapper(variantType, mapper);
    if (shouldCreateTypeForTemplate(variantNode.parent!, mapper)) {
      finishType(variantType);
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

  function getMemberSymbol(parentSym: Sym, name: string): Sym | undefined {
    return parentSym ? getOrCreateAugmentedSymbolTable(parentSym.members!).get(name) : undefined;
  }

  function getSymbolForMember(node: MemberNode): Sym | undefined {
    if (!node.id) {
      return undefined;
    }
    const name = node.id.sv;
    const parentSym = node.parent?.symbol;
    return parentSym ? getOrCreateAugmentedSymbolTable(parentSym.members!).get(name) : undefined;
  }

  function getSymbolLinksForMember(node: MemberNode): SymbolLinks | undefined {
    const sym = getSymbolForMember(node);
    return sym ? (sym.declarations[0] === node ? getSymbolLinks(sym) : undefined) : undefined;
  }

  function checkEnumMember(
    node: EnumMemberNode,
    mapper: TypeMapper | undefined,
    parentEnum?: Enum
  ): EnumMember {
    const name = node.id.sv;
    const links = getSymbolLinksForMember(node);
    if (links?.type) {
      return links.type as EnumMember;
    }
    compilerAssert(parentEnum, "Enum member should already have been checked.");
    const value = node.value ? node.value.value : undefined;

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
    parentEnumSym: Sym,
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
          const memberSym = getMemberSymbol(parentEnumSym, member.name);
          const clonedMember = cloneTypeForSymbol(memberSym!, member, {
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

  function checkDirectives(node: Node, type: Type): void {
    let hasDeprecation: boolean = false;
    for (const directive of node.directives ?? []) {
      if (directive.target.sv === "deprecated") {
        const message = directive.arguments[0];
        if (message === undefined) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-deprecation-argument",
              messageId: "missing",
              target: directive,
            })
          );
          continue;
        }
        let messageStr;
        if (message.kind !== SyntaxKind.StringLiteral) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-deprecation-argument",
              format: { kind: SyntaxKind[message.kind] },
              target: directive.arguments[0],
            })
          );
          messageStr = "<missing message>";
        } else {
          messageStr = message.value;
        }

        if (hasDeprecation === true) {
          reportCheckerDiagnostic(
            createDiagnostic({ code: "duplicate-deprecation", target: node })
          );
        } else {
          hasDeprecation = true;
          markDeprecated(program, type, {
            message: messageStr,
          });
        }
      }
    }
  }

  // the types here aren't ideal and could probably be refactored.

  function createAndFinishType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T
  ): T & TypePrototype & { isFinished: boolean } {
    createType(typeDef);
    return finishType(typeDef as any) as any;
  }

  /**
   * Given the own-properties of a type, returns a fully-initialized type.
   * So far, that amounts to setting the prototype to typePrototype which
   * contains the `projections` getter.
   */
  function createType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T
  ): T & TypePrototype & { isFinished: boolean } {
    Object.setPrototypeOf(typeDef, typePrototype);
    (typeDef as any).isFinished = false;

    // If the type has an associated syntax node, check any directives that
    // might be attached.
    const createdType = typeDef as any;
    if (createdType.node) {
      checkDirectives(createdType.node, createdType);
    }

    return createdType;
  }

  function finishType<T extends Type>(typeDef: T): T {
    return finishTypeForProgramAndChecker(program, typePrototype, typeDef);
  }

  function getLiteralType(
    node:
      | StringLiteralNode
      | StringTemplateHeadNode
      | StringTemplateMiddleNode
      | StringTemplateTailNode
  ): StringLiteral;
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

  function initializeClone<T extends Type>(type: T, additionalProps: Partial<T>): T {
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
          newModel.properties = createRekeyableMap(
            Array.from(type.properties.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { model: newModel }),
            ])
          );
        }
        clone = newModel;
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
          newUnion.variants = createRekeyableMap(
            Array.from(type.variants.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { union: newUnion }),
            ])
          );
        }
        clone = newUnion;
        break;

      case "Interface":
        const newInterface = createType<Interface>({
          ...type,
          decorators: [...type.decorators],
          operations: undefined!,
          ...additionalProps,
        });
        if (!("operations" in additionalProps)) {
          newInterface.operations = createRekeyableMap(
            Array.from(type.operations.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { interface: newInterface }),
            ])
          );
        }
        clone = newInterface;
        break;

      case "Enum":
        const newEnum = createType<Enum>({
          ...type,
          decorators: [...type.decorators],
          members: undefined!,
          ...additionalProps,
        });
        if (!("members" in additionalProps)) {
          newEnum.members = createRekeyableMap(
            Array.from(type.members.entries()).map(([key, prop]) => [
              key,
              cloneType(prop, { enum: newEnum }),
            ])
          );
        }
        clone = newEnum;
        break;

      default:
        clone = createType({
          ...type,
          ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          ...additionalProps,
        });
        break;
    }

    return clone as T;
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
    const clone = finishType(initializeClone(type, additionalProps));
    const projection = projectionsByType.get(type);
    if (projection) {
      projectionsByType.set(clone, projection);
    }

    compilerAssert(clone.kind === type.kind, "cloneType must not change type kind");
    return clone;
  }

  /**
   * Clone a type linking to the given symbol.
   * @param sym Symbol which to associate the clone
   * @param type Type to clone
   * @param additionalProps Additional properties to set/override on the clone
   * @returns cloned type
   */
  function cloneTypeForSymbol<T extends Type>(
    sym: Sym,
    type: T,
    additionalProps: Partial<T> = {}
  ): T {
    let clone = initializeClone(type, additionalProps);
    if ("decorators" in clone) {
      for (const dec of checkAugmentDecorators(sym, clone, undefined)) {
        clone.decorators.push(dec);
      }
    }
    clone = finishType(clone);
    compilerAssert(clone.kind === type.kind, "cloneType must not change type kind");
    return clone;
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
      case SyntaxKind.ProjectionModelPropertySelector:
        projectionsByTypeKind.get("ModelProperty")!.push(node);
        type.nodeByKind.set("ModelProperty", node);
        break;
      case SyntaxKind.ProjectionScalarSelector:
        projectionsByTypeKind.get("Scalar")!.push(node);
        type.nodeByKind.set("Scalar", node);
        break;
      case SyntaxKind.ProjectionOperationSelector:
        projectionsByTypeKind.get("Operation")!.push(node);
        type.nodeByKind.set("Operation", node);
        break;
      case SyntaxKind.ProjectionUnionSelector:
        projectionsByTypeKind.get("Union")!.push(node);
        type.nodeByKind.set("Union", node);
        break;
      case SyntaxKind.ProjectionUnionVariantSelector:
        projectionsByTypeKind.get("UnionVariant")!.push(node);
        type.nodeByKind.set("UnionVariant", node);
        break;
      case SyntaxKind.ProjectionInterfaceSelector:
        projectionsByTypeKind.get("Interface")!.push(node);
        type.nodeByKind.set("Interface", node);
        break;
      case SyntaxKind.ProjectionEnumSelector:
        projectionsByTypeKind.get("Enum")!.push(node);
        type.nodeByKind.set("Enum", node);
        break;
      case SyntaxKind.ProjectionEnumMemberSelector:
        projectionsByTypeKind.get("EnumMember")!.push(node);
        type.nodeByKind.set("EnumMember", node);
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
      properties: createRekeyableMap(),
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
      name: node.id.sv,
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

  function evalProjection(node: ProjectionNode, target: Type, args: Type[]): Type {
    if (node.direction === "<error>") {
      throw new ProjectionError("Cannot evaluate projection with invalid direction.");
    }

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

  function createLiteralType(
    value: string,
    node?:
      | StringLiteralNode
      | StringTemplateHeadNode
      | StringTemplateMiddleNode
      | StringTemplateTailNode
  ): StringLiteral;
  function createLiteralType(value: number, node?: NumericLiteralNode): NumericLiteral;
  function createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean,
    node?: LiteralNode
  ): StringLiteral | NumericLiteral | BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean,
    node?: LiteralNode
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
        let valueAsString: string;
        if (node) {
          compilerAssert(
            node.kind === SyntaxKind.NumericLiteral,
            "Must pass numeric literal node or undefined when creating a numeric literal type"
          );
          valueAsString = node.valueAsString;
        } else {
          valueAsString = String(value);
        }
        type = createType({
          kind: "Number",
          value,
          valueAsString,
          numericValue: Numeric(valueAsString),
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
      ref.value!({ program }, ...args.map(tryMarshallTypeForJS));
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
        const retval = ref.value!(program, ...args.map(tryMarshallTypeForJS));
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
        `Can't marshal value "${value}" returned from JS function "${options.functionName}" into typespec`
      );
    } else {
      throw new ProjectionError(`Can't marshal value "${value}" into typespec`);
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
    return evalProjection(
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
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ): boolean {
    const [related, diagnostics] = isTypeAssignableTo(source, target, diagnosticTarget);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
    }
    return related;
  }

  function checkValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): boolean {
    const [related, diagnostics] = isValueOfType(source, target, diagnosticTarget);
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
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]] {
    const [related, diagnostics] = isTypeAssignableToInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    return [related === Related.true, diagnostics];
  }

  /**
   * Check if the given Value type is of the given type.
   * @param source Value
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function isValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]] {
    const [related, diagnostics] = isValueOfTypeInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    return [related === Related.true, diagnostics];
  }

  function isTypeAssignableToInternal(
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    const cached = relationCache.get([source, target]);
    if (cached !== undefined) {
      return [cached, []];
    }
    const [result, diagnostics] = isTypeAssignableToWorker(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    relationCache.set([source, target], result);
    return [result, diagnostics];
  }

  function isTypeAssignableToWorker(
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    // BACKCOMPAT: Added May 2023 sprint, to be removed by June 2023 sprint
    if (
      "kind" in source &&
      "kind" in target &&
      source.kind === "TemplateParameter" &&
      source.constraint &&
      target.kind === "Value"
    ) {
      const [assignable] = isTypeAssignableToInternal(
        source.constraint,
        target.target,
        diagnosticTarget,
        relationCache
      );
      if (assignable) {
        const constraint = getEntityName(source.constraint);
        reportDeprecated(
          program,
          `Template constrainted to '${constraint}' will not be assignable to '${getEntityName(
            target
          )}' in the future. Update the constraint to be 'valueof ${constraint}'`,
          diagnosticTarget
        );
        return [Related.true, []];
      }
    }

    while (
      "kind" in source &&
      source.kind === "TemplateParameter" &&
      source.constraint !== source
    ) {
      source = source.constraint ?? unknownType;
    }

    if (source === target) return [Related.true, []];
    if ("kind" in target && target.kind === "Value") {
      return isAssignableToValueType(source, target, diagnosticTarget, relationCache);
    }
    if (isValue(target)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
    if (target.kind === "ParamConstraintUnion") {
      return isAssignableToParameterConstraintUnion(
        source,
        target,
        diagnosticTarget,
        relationCache
      );
    }

    if (isValue(source) || source.kind === "Value" || source.kind === "ParamConstraintUnion") {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
    const isSimpleTypeRelated = isSimpleTypeAssignableTo(source, target);
    if (isSimpleTypeRelated === true) {
      return [Related.true, []];
    } else if (isSimpleTypeRelated === false) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    if (source.kind === "Union") {
      for (const variant of source.variants.values()) {
        const [variantAssignable] = isTypeAssignableToInternal(
          variant.type,
          target,
          diagnosticTarget,
          relationCache
        );
        if (!variantAssignable) {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      }
      return [Related.true, []];
    }

    if (
      target.kind === "Model" &&
      source.kind === "Model" &&
      target.name !== "object" &&
      target.indexer === undefined &&
      source.indexer &&
      source.indexer.key.name === "integer"
    ) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "missing-index",
            format: {
              indexType: getTypeName(source.indexer.key),
              sourceType: getTypeName(target),
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    } else if (target.kind === "Model" && target.indexer !== undefined && source.kind === "Model") {
      return isIndexerValid(
        source,
        target as Model & { indexer: ModelIndexer },
        diagnosticTarget,
        relationCache
      );
    } else if (target.kind === "Model" && source.kind === "Model") {
      return isModelRelatedTo(source, target, diagnosticTarget, relationCache);
    } else if (
      target.kind === "Model" &&
      isArrayModelType(program, target) &&
      source.kind === "Tuple"
    ) {
      for (const item of source.values) {
        const [related, diagnostics] = isTypeAssignableToInternal(
          item,
          target.indexer.value!,
          diagnosticTarget,
          relationCache
        );
        if (!related) {
          return [Related.false, diagnostics];
        }
      }
      return [Related.true, []];
    } else if (target.kind === "Tuple" && source.kind === "Tuple") {
      return isTupleAssignableToTuple(source, target, diagnosticTarget, relationCache);
    } else if (target.kind === "Union") {
      return isAssignableToUnion(source, target, diagnosticTarget, relationCache);
    } else if (target.kind === "Enum") {
      return isAssignableToEnum(source, target, diagnosticTarget);
    }

    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isAssignableToValueType(
    source: Entity,
    target: ValueType,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    const isSourceAType = "kind" in source;
    if (isSourceAType && source.kind === "Value") {
      return isTypeAssignableToInternal(
        source.target,
        target.target,
        diagnosticTarget,
        relationCache
      );
    }

    // LEGACY BEHAVIOR - Goal here is to all models instead of object literal and tuple instead of tuple literals to get a smooth migration of decorators
    if (
      isSourceAType &&
      source.kind === "Tuple" &&
      isTypeAssignableToInternal(source, target.target, diagnosticTarget, relationCache)[0] ===
        Related.true
    ) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "deprecated",
          codefixes: [createTupleToLiteralCodeFix(source.node)],
          format: {
            message:
              "Using a tuple as a value is deprecated. Use a tuple literal instead(with #[]).",
          },
          target: source.node,
        })
      );
      return [Related.true, []];
    } else if (
      isSourceAType &&
      source.kind === "Model" &&
      source.node?.kind === SyntaxKind.ModelExpression &&
      isTypeAssignableToInternal(source, target.target, diagnosticTarget, relationCache)[0] ===
        Related.true
    ) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "deprecated",
          codefixes: [createModelToLiteralCodeFix(source.node)],
          format: {
            message:
              "Using a model as a value is deprecated. Use an object literal instead(with #{}).",
          },
          target: source,
        })
      );
      return [Related.true, []];
    }

    if (!isValue(source)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    return isValueOfTypeInternal(source, target.target, diagnosticTarget, relationCache);
  }

  function isAssignableToParameterConstraintUnion(
    source: Entity,
    target: ParamConstraintUnion,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if ("kind" in source && source.kind === "ParamConstraintUnion") {
      for (const option of source.options) {
        const [variantAssignable] = isAssignableToParameterConstraintUnion(
          option,
          target,
          diagnosticTarget,
          relationCache
        );
        if (!variantAssignable) {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      }
      return [Related.true, []];
    }

    for (const option of target.options) {
      const [related] = isTypeAssignableToInternal(source, option, diagnosticTarget, relationCache);
      if (related) {
        return [Related.true, []];
      }
    }
    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  /** Check if the value is assignable to the given type. */
  function isValueOfTypeInternal(
    source: Value,
    target: Type,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    return isTypeAssignableToInternal(source.type, target, diagnosticTarget, relationCache);
    // TODO: cleanup
    // if (isUnknownType(target)) return [Related.true, []];
    // if (source.valueKind === "NullValue") {
    //   return isTypeAssignableToInternal(source, target, diagnosticTarget, relationCache);
    // }
    // if (target.kind === "Union") {
    //   for (const option of target.variants.values()) {
    //     const [related] = isValueOfTypeInternal(
    //       source,
    //       option.type,
    //       diagnosticTarget,
    //       relationCache
    //     );
    //     if (related) {
    //       return [Related.true, []];
    //     }
    //   }
    // }

    // switch (source.valueKind) {
    //   case "ObjectValue":
    //     if (target.kind === "Model" && !isArrayModelType(program, target)) {
    //       return isObjectLiteralOfModelType(source, target, diagnosticTarget, relationCache);
    //     }
    //     break;
    //   case "ArrayValue":
    //     if (target.kind === "Model" && isArrayModelType(program, target)) {
    //       return isTupleLiteralOfArrayType(source, target, diagnosticTarget, relationCache);
    //     } else if (target.kind === "Tuple") {
    //       return isTupleAssignableToTuple(source, target, diagnosticTarget, relationCache);
    //     }
    //     break;
    //   case "StringValue":
    //   case "NumericValue":
    //   case "BooleanValue":
    //   case "EnumMemberValue":
    //     return isTypeAssignableToInternal(source, target, diagnosticTarget, relationCache);
    // }

    // return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isReflectionType(type: Type): type is Model & { name: ReflectionTypeName } {
    return (
      type.kind === "Model" &&
      type.namespace?.name === "Reflection" &&
      type.namespace?.namespace?.name === "TypeSpec"
    );
  }

  function isRelatedToScalar(source: Type, target: Scalar): boolean | undefined {
    switch (source.kind) {
      case "Number":
        return isNumericLiteralRelatedTo(source, target);
      case "String":
      case "StringTemplate":
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
    if (isNeverType(source)) return true;
    if (isVoidType(target)) return false;
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

  function isNumericLiteralRelatedTo(source: NumericLiteral, target: Scalar) {
    return isNumericAssignableToNumericScalar(source.numericValue, target);
  }

  function isNumericAssignableToNumericScalar(source: Numeric, target: Scalar) {
    // if the target does not derive from numeric, then it can't be assigned a numeric literal
    if (!areScalarsRelated(target, getStdType("numeric"))) {
      return false;
    }

    // With respect to literal assignability a custom numeric scalar is
    // equivalent to its nearest TypeSpec.* base. Adjust target accordingly.
    while (!target.namespace || !isTypeSpecNamespace(target.namespace)) {
      compilerAssert(
        target.baseScalar,
        "Should not be possible to be derived from TypeSpec.numeric and not have a base when not in TypeSpec namespace."
      );
      target = target.baseScalar;
    }

    if (target.name === "numeric") return true;
    if (target.name === "decimal") return true;
    if (target.name === "decimal128") return true;

    const isInt = source.isInteger;
    if (target.name === "integer") return isInt;
    if (target.name === "float") return true;

    if (!(target.name in numericRanges)) return false;
    const [low, high, options] = numericRanges[target.name];
    return source.gte(low) && source.lte(high) && (!options.int || isInt);
  }

  function isModelRelatedTo(
    source: Model,
    target: Model,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, Diagnostic[]] {
    relationCache.set([source, target], Related.maybe);
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
        const [related, propDiagnostics] = isTypeAssignableToInternal(
          sourceProperty.type,
          prop.type,
          diagnosticTarget,
          relationCache
        );
        if (!related) {
          diagnostics.push(...propDiagnostics);
        }
      }
    }
    return [diagnostics.length === 0 ? Related.true : Related.false, diagnostics];
  }

  function isObjectLiteralOfModelType(
    source: ObjectValue,
    target: Model,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    relationCache.set([source, target], Related.maybe);
    const diagnostics: Diagnostic[] = [];
    const remainingProperties = new Map(source.properties);
    for (const prop of walkPropertiesInherited(target)) {
      const sourceProperty = source.properties.get(prop.name);
      if (sourceProperty === undefined) {
        if (!prop.optional) {
          diagnostics.push(
            createDiagnostic({
              code: "missing-property",
              format: {
                propertyName: prop.name,
                sourceType: getEntityName(source),
                targetType: getEntityName(target),
              },
              target: source,
            })
          );
        }
      } else {
        remainingProperties.delete(prop.name);
        const [related, propDiagnostics] = isValueOfTypeInternal(
          sourceProperty.value,
          prop.type,
          diagnosticTarget,
          relationCache
        );
        if (!related) {
          diagnostics.push(...propDiagnostics);
        }
      }
    }

    if (target.indexer) {
      const [_, indexerDiagnostics] = arePropertiesAssignableToIndexer(
        remainingProperties as any, // TODO: fix
        target.indexer.value,
        diagnosticTarget,
        relationCache
      );
      diagnostics.push(...indexerDiagnostics);
    } else {
      for (const [propName] of remainingProperties) {
        diagnostics.push(
          createDiagnostic({
            code: "unexpected-property",
            format: {
              propertyName: propName,
              type: getEntityName(target),
            },
            target: getObjectLiteralPropertyNode(source, propName),
          })
        );
      }
    }
    return [diagnostics.length === 0 ? Related.true : Related.false, diagnostics];
  }
  function getObjectLiteralPropertyNode(
    object: ObjectValue,
    propertyName: string
  ): DiagnosticTarget {
    return (
      object.node.properties.find(
        (x) => x.kind === SyntaxKind.ObjectLiteralProperty && x.id.sv === propertyName
      ) ?? object.node
    );
  }

  function isTupleLiteralOfArrayType(
    source: ArrayValue,
    target: ArrayModelType,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    relationCache.set([source, target], Related.maybe);
    for (const value of source.values) {
      const [related, diagnostics] = isValueOfTypeInternal(
        value,
        target.indexer.value,
        diagnosticTarget,
        relationCache
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }

    return [Related.true, []];
  }

  function getProperty(model: Model, name: string): ModelProperty | undefined {
    return (
      model.properties.get(name) ??
      (model.baseModel !== undefined ? getProperty(model.baseModel, name) : undefined)
    );
  }

  function arePropertiesAssignableToIndexer(
    properties: Map<string, Type | Value>,
    indexerConstaint: Type,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    for (const prop of properties.values()) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        prop,
        indexerConstaint,
        diagnosticTarget,
        relationCache
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }

    return [Related.true, []];
  }

  function isIndexerValid(
    source: Model,
    target: Model & { indexer: ModelIndexer },
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    // Model expressions should be able to be assigned.
    if (source.name === "" && target.indexer.key.name !== "integer") {
      return isIndexConstraintValid(source, target.indexer.value, diagnosticTarget, relationCache);
    } else {
      if (source.indexer === undefined || source.indexer.key !== target.indexer.key) {
        return [
          Related.false,
          [
            createDiagnostic({
              code: "missing-index",
              format: {
                indexType: getTypeName(target.indexer.key),
                sourceType: getTypeName(source),
              },
              target: diagnosticTarget,
            }),
          ],
        ];
      }
      return isTypeAssignableToInternal(
        source.indexer.value!,
        target.indexer.value,
        diagnosticTarget,
        relationCache
      );
    }
  }
  /**
   * @param constraintType Type of the constraints(All properties must have this type).
   * @param type Type of the model that should be respecting the constraint.
   * @param diagnosticTarget Diagnostic target unless something better can be inferred.
   */
  function isIndexConstraintValid(
    type: Model,
    constraintType: Type,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    for (const prop of type.properties.values()) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        prop.type,
        constraintType,
        diagnosticTarget,
        relationCache
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }

    if (type.baseModel) {
      const [related, diagnostics] = isIndexConstraintValid(
        type.baseModel,
        constraintType,
        diagnosticTarget,
        relationCache
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }
    return [Related.true, []];
  }

  function isTupleAssignableToTuple(
    source: Tuple | ArrayValue,
    target: Tuple,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if (source.values.length !== target.values.length) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "unassignable",
            messageId: "withDetails",
            format: {
              sourceType: getEntityName(source),
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
      const [related, diagnostics] = isTypeAssignableToInternal(
        sourceItem,
        targetItem,
        diagnosticTarget,
        relationCache
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }
    return [Related.true, []];
  }

  function isAssignableToUnion(
    source: Type,
    target: Union,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, Diagnostic[]] {
    if (source.kind === "UnionVariant" && source.union === target) {
      return [Related.true, []];
    }
    for (const option of target.variants.values()) {
      const [related] = isTypeAssignableToInternal(
        source,
        option.type,
        diagnosticTarget,
        relationCache
      );
      if (related) {
        return [Related.true, []];
      }
    }
    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isAssignableToEnum(
    source: Type,
    target: Enum,
    diagnosticTarget: DiagnosticTarget
  ): [Related, Diagnostic[]] {
    switch (source.kind) {
      case "Enum":
        if (source === target) {
          return [Related.true, []];
        } else {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      case "EnumMember":
        if (source.enum === target) {
          return [Related.true, []];
        } else {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      default:
        return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
  }

  function createUnassignableDiagnostic(
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ) {
    return createDiagnostic({
      code: "unassignable",
      format: { targetType: getEntityName(target), value: getEntityName(source) },
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
      !isTypeSpecNamespace(type.namespace)
    )
      return false;
    if (type.kind === "Scalar") return stdType === undefined || stdType === type.name;
    if (stdType === "Array" && type === stdTypes["Array"]) return true;
    if (stdType === "Record" && type === stdTypes["Record"]) return true;
    if (type.kind === "Model") return stdType === undefined || stdType === type.name;
    return false;
  }
}

function isAnonymous(type: Type) {
  return !("name" in type) || typeof type.name !== "string" || !type.name;
}

const numericRanges: Record<string, [min: Numeric, max: Numeric, options: { int: boolean }]> = {
  int64: [Numeric("-9223372036854775808"), Numeric("9223372036854775807"), { int: true }],
  int32: [Numeric("-2147483648"), Numeric("2147483647"), { int: true }],
  int16: [Numeric("-32768"), Numeric("32767"), { int: true }],
  int8: [Numeric("-128"), Numeric("127"), { int: true }],
  uint64: [Numeric("0"), Numeric("18446744073709551615"), { int: true }],
  uint32: [Numeric("0"), Numeric("4294967295"), { int: true }],
  uint16: [Numeric("0"), Numeric("65535"), { int: true }],
  uint8: [Numeric("0"), Numeric("255"), { int: true }],
  safeint: [
    Numeric(Number.MIN_SAFE_INTEGER.toString()),
    Numeric(Number.MAX_SAFE_INTEGER.toString()),
    { int: true },
  ],
  float32: [Numeric("-3.4e38"), Numeric("3.4e38"), { int: false }],
  float64: [Numeric(`${-Number.MAX_VALUE}`), Numeric(Number.MAX_VALUE.toString()), { int: false }],
};

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

function createTypeMapper(
  parameters: TemplateParameter[],
  args: (Type | Value)[],
  parentMapper?: TypeMapper
): TypeMapper {
  const map = new Map<TemplateParameter, Type | Value>(parentMapper?.map ?? []);

  for (const [index, param] of parameters.entries()) {
    map.set(param, args[index]);
  }

  return {
    partial: false,
    args: [...(parentMapper?.args ?? []), ...args],
    getMappedType: (type: TemplateParameter) => {
      return map.get(type) ?? type;
    },
    map,
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

  const properties = createRekeyableMap<string, ModelProperty>();
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

export function finishTypeForProgram<T extends Type>(program: Program, typeDef: T): T {
  return finishTypeForProgramAndChecker(program, program.checker.typePrototype, typeDef);
}

function linkMapper<T extends Type>(typeDef: T, mapper?: TypeMapper) {
  if (mapper) {
    compilerAssert(
      !(typeDef as any).templateArguments,
      "Mapper provided but template arguments already set."
    );
    (typeDef as any).templateMapper = mapper;
    (typeDef as any).templateArguments = mapper.args;
  }
}

function extractMainDoc(type: Type): string | undefined {
  if (type.node?.docs === undefined) {
    return undefined;
  }
  let mainDoc: string = "";
  for (const doc of type.node.docs) {
    mainDoc += getDocContent(doc.content);
  }
  const trimmed = mainDoc.trim();
  return trimmed === "" ? undefined : trimmed;
}

function extractReturnsDocs(type: Type): {
  returns: string | undefined;
  errors: string | undefined;
} {
  const result: { returns: string | undefined; errors: string | undefined } = {
    returns: undefined,
    errors: undefined,
  };
  if (type.node?.docs === undefined) {
    return result;
  }
  for (const doc of type.node.docs) {
    for (const tag of doc.tags) {
      if (tag.kind === SyntaxKind.DocReturnsTag) {
        result.returns = getDocContent(tag.content);
      }
      if (tag.kind === SyntaxKind.DocErrorsTag) {
        result.errors = getDocContent(tag.content);
      }
    }
  }
  return result;
}

function extractParamDoc(node: OperationStatementNode, paramName: string): string | undefined {
  if (node.docs === undefined) {
    return undefined;
  }
  for (const doc of node.docs) {
    for (const tag of doc.tags) {
      if (tag.kind === SyntaxKind.DocParamTag && tag.paramName.sv === paramName) {
        return getDocContent(tag.content);
      }
    }
  }
  return undefined;
}

function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added."
    );
    docs.push(node.text);
  }
  return docs.join("");
}

function finishTypeForProgramAndChecker<T extends Type>(
  program: Program,
  typePrototype: TypePrototype,
  typeDef: T
): T {
  if ("decorators" in typeDef) {
    for (const decApp of typeDef.decorators) {
      applyDecoratorToType(program, decApp, typeDef);
    }
  }

  Object.setPrototypeOf(typeDef, typePrototype);
  typeDef.isFinished = true;
  return typeDef;
}

function reportDeprecation(
  program: Program,
  target: DiagnosticTarget,
  message: string,
  reportFunc: (d: Diagnostic) => void
): void {
  if (program.compilerOptions.ignoreDeprecated !== true) {
    reportFunc(
      createDiagnostic({
        code: "deprecated",
        format: {
          message,
        },
        target,
      })
    );
  }
}

function applyDecoratorToType(program: Program, decApp: DecoratorApplication, target: Type) {
  compilerAssert("decorators" in target, "Cannot apply decorator to non-decoratable type", target);

  for (const arg of decApp.args) {
    if (isType(arg.value) && isErrorType(arg.value)) {
      // If one of the decorator argument is an error don't run it.
      return;
    }
  }

  // Is the decorator definition deprecated?
  if (decApp.definition) {
    const deprecation = getDeprecationDetails(program, decApp.definition);
    if (deprecation !== undefined) {
      reportDeprecation(
        program,
        decApp.node ?? target,
        deprecation.message,
        program.reportDiagnostic
      );
    }
  }

  // peel `fn` off to avoid setting `this`.
  try {
    const args = decApp.args.map((x) => x.jsValue);
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

function isTemplatedNode(node: Node): node is TemplateableNode {
  return "templateParameters" in node && node.templateParameters.length > 0;
}

/**
 * Mapping from the reflection models to Type["kind"] value
 */
const ReflectionNameToKind = {
  Enum: "Enum",
  EnumMember: "EnumMember",
  Interface: "Interface",
  Model: "Model",
  ModelProperty: "ModelProperty",
  Namespace: "Namespace",
  Operation: "Operation",
  Scalar: "Scalar",
  TemplateParameter: "TemplateParameter",
  Tuple: "Tuple",
  Union: "Union",
  UnionVariant: "UnionVariant",
} as const;

const _assertReflectionNameToKind: Record<string, Type["kind"]> = ReflectionNameToKind;

enum ResolutionKind {
  Value,
  Type,
  BaseType,
  Constraint,
}

class PendingResolutions {
  #data = new Map<number, Set<ResolutionKind>>();

  start(symId: number, kind: ResolutionKind) {
    let existing = this.#data.get(symId);
    if (existing === undefined) {
      existing = new Set();
      this.#data.set(symId, existing);
    }
    existing.add(kind);
  }

  has(symId: number, kind: ResolutionKind): boolean {
    return this.#data.get(symId)?.has(kind) ?? false;
  }

  finish(symId: number, kind: ResolutionKind) {
    const existing = this.#data.get(symId);
    if (existing === undefined) {
      return;
    }
    existing?.delete(kind);
    if (existing.size === 0) {
      this.#data.delete(symId);
    }
  }
}

enum Related {
  false = 0,
  true = 1,
  maybe = 2,
}

interface SymbolResolutionOptions {
  /**
   * Should resolving the symbol lookup for decorators as well.
   * @default false
   */
  resolveDecorators: boolean;

  /**
   * Should the symbol resolution instantiate templates and do a late bind of symbols.
   * @default true
   */
  checkTemplateTypes: boolean;
}

const defaultSymbolResolutionOptions: SymbolResolutionOptions = {
  resolveDecorators: false,
  checkTemplateTypes: true,
};
