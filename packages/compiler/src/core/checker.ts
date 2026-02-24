import { Realm } from "../experimental/realm.js";
import { docFromCommentDecorator, getIndexer } from "../lib/intrinsic/decorators.js";
import { $ } from "../typekit/index.js";
import { DuplicateTracker } from "../utils/duplicate-tracker.js";
import { MultiKeyMap, Mutable, createRekeyableMap, isArray, mutate } from "../utils/misc.js";
import { createSymbol, getSymNode } from "./binder.js";
import { createChangeIdentifierCodeFix } from "./compiler-code-fixes/change-identifier.codefix.js";
import {
  createModelToObjectValueCodeFix,
  createTupleToArrayValueCodeFix,
} from "./compiler-code-fixes/convert-to-value.codefix.js";
import { getDeprecationDetails, markDeprecated } from "./deprecation.js";
import { compilerAssert, ignoreDiagnostics, reportDeprecated } from "./diagnostics.js";
import { validateInheritanceDiscriminatedUnions } from "./helpers/discriminator-utils.js";
import { explainStringTemplateNotSerializable } from "./helpers/string-template-utils.js";
import { typeReferenceToString } from "./helpers/syntax-utils.js";
import { getEntityName, getTypeName } from "./helpers/type-name-utils.js";
import { marshallTypeForJS } from "./js-marshaller.js";
import { createDiagnostic } from "./messages.js";
import { NameResolver } from "./name-resolver.js";
import { Numeric } from "./numeric.js";
import {
  exprIsBareIdentifier,
  getFirstAncestor,
  getIdentifierContext,
  hasParseError,
  visitChildren,
} from "./parser.js";
import type { Program } from "./program.js";
import { createTypeRelationChecker } from "./type-relation-checker.js";
import {
  getFullyQualifiedSymbolName,
  getParentTemplateNode,
  isArrayModelType,
  isErrorType,
  isNullType,
  isTemplateInstance,
  isType,
  isValue,
} from "./type-utils.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  ArrayLiteralNode,
  ArrayValue,
  AugmentDecoratorStatementNode,
  BooleanLiteral,
  BooleanLiteralNode,
  BooleanValue,
  CallExpressionNode,
  CodeFix,
  ConstStatementNode,
  DecoratedExpressionNode,
  Decorator,
  DecoratorApplication,
  DecoratorArgument,
  DecoratorContext,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  DecoratorValidatorCallbacks,
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
  IdentifierKind,
  IdentifierNode,
  IndeterminateEntity,
  Interface,
  InterfaceStatementNode,
  IntersectionExpressionNode,
  IntrinsicScalarName,
  JsNamespaceDeclarationNode,
  LiteralNode,
  LiteralType,
  MemberContainerNode,
  MemberContainerType,
  MemberExpressionNode,
  MemberNode,
  MemberType,
  MixedFunctionParameter,
  MixedParameterConstraint,
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
  NullType,
  NullValue,
  NumericLiteral,
  NumericLiteralNode,
  NumericValue,
  ObjectLiteralNode,
  ObjectLiteralPropertyNode,
  ObjectValue,
  ObjectValuePropertyDescriptor,
  Operation,
  OperationStatementNode,
  ResolutionResultFlags,
  Scalar,
  ScalarConstructor,
  ScalarConstructorNode,
  ScalarStatementNode,
  ScalarValue,
  SignatureFunctionParameter,
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
  TemplateParameter,
  TemplateParameterDeclarationNode,
  TemplateableNode,
  TemplatedType,
  TemplatedTypeBase,
  Tuple,
  TupleExpressionNode,
  Type,
  TypeInstantiationMap,
  TypeMapper,
  TypeOfExpressionNode,
  TypeReferenceNode,
  TypeSpecScriptNode,
  Union,
  UnionExpressionNode,
  UnionStatementNode,
  UnionVariant,
  UnionVariantNode,
  UnknownType,
  UsingStatementNode,
  ValidatorFn,
  Value,
  ValueWithTemplate,
  VoidType,
} from "./types.js";

export type CreateTypeProps = Omit<Type, "isFinished" | "entityKind" | keyof TypePrototype>;

enum CheckFlags {
  /** No flags set. */
  None = 0,
  /** Currently checking within an uninstantiated template declaration. */
  InTemplateDeclaration = 1 << 0,
}

class CheckContext<Mapper extends TypeMapper | undefined = TypeMapper | undefined> {
  /** The type mapper associated with this context, if any. */
  mapper: Mapper;
  /** The flags enabled in this context. */
  flags: CheckFlags;

  #templateParametersObserved: Set<TemplateParameter> | undefined;

  /**
   * Creates a new CheckContext from a type mapper.
   * @param mapper - the type mapper
   */
  static from(mapper: TypeMapper): CheckContext<TypeMapper>;
  /**
   * Creates a new CheckContext with no mapper.
   */
  static from(mapper: undefined): CheckContext<undefined>;
  /**
   * Creates a new CheckContext from an optional TypeMapper.
   * @param mapper
   */
  static from(mapper: TypeMapper | undefined): CheckContext;
  /**
   * Copies an existing CheckContext.
   * @param context
   */
  static from<C extends CheckContext>(context: C): C;
  /**
   * Coerces a CheckContext from either a CheckContext or TypeMapper.
   */
  static from(contextOrMapper: CheckContext | TypeMapper | undefined): CheckContext;
  static from(contextOrMapper: CheckContext | TypeMapper | undefined): CheckContext {
    if (contextOrMapper instanceof CheckContext) {
      return contextOrMapper;
    }

    return new CheckContext(contextOrMapper, CheckFlags.None);
  }

  /**
   * The default CheckContext to use at API entrypoints.
   */
  static DEFAULT = new CheckContext(undefined, CheckFlags.None);

  private constructor(
    mapper: Mapper,
    flags: CheckFlags,
    templateParametersObserved?: Set<TemplateParameter>,
  ) {
    this.mapper = mapper;
    this.flags = flags;
    this.#templateParametersObserved = templateParametersObserved;
    Object.freeze(this);
  }

  /**
   * Returns a new context with the given flags _added_ to the existing flags.
   *
   * @param flags - the flags to enable
   * @returns a new CheckContext with the given flags enabled.
   */
  withFlags(flags: CheckFlags): CheckContext<Mapper> {
    return new CheckContext(this.mapper, this.flags | flags, this.#templateParametersObserved);
  }

  /**
   * Returns a new context with the given flags disabled.
   *
   * @param flags - the flags to disable
   * @returns a new CheckContext with the given flags disabled.
   */
  maskFlags(flags: CheckFlags): CheckContext<Mapper> {
    return new CheckContext(this.mapper, this.flags & ~flags, this.#templateParametersObserved);
  }

  /**
   * Returns true if ALL of the given flags are enabled in this context.
   */
  hasFlags(flags: CheckFlags): boolean {
    return (this.flags & flags) === flags;
  }

  /**
   * Returns a new context with the given mapper.
   *
   * @param mapper - the new type mapper, or undefined to clear the mapper
   * @returns a new CheckContext with the given mapper.
   */
  withMapper<NewMapper extends TypeMapper | undefined>(mapper: NewMapper): CheckContext<NewMapper> {
    return new CheckContext(mapper, this.flags, this.#templateParametersObserved);
  }

  /**
   * Observes a template parameter within the current observation scope, if any.
   *
   * @param param - the TemplateParameter type instance to observe
   */
  observeTemplateParameter(param: TemplateParameter): void {
    this.#templateParametersObserved?.add(param);
  }

  /**
   * Returns a new CheckContext with a new (empty) template parameter observation scope.
   *
   * Call this when you need to observe template parameters used within a specific context.
   *
   * @returns a new CheckContext with an empty template parameter observation scope.
   */
  enterTemplateObserverScope(): CheckContext<Mapper> {
    return new CheckContext(this.mapper, this.flags, new Set<TemplateParameter>());
  }

  /**
   * Creates a new CheckContext with no template parameter observation enabled.
   *
   * Call this when the checker is moving from one declaration to another, where usage of template parameters
   * from the next scope should not impact the usage from the previous scope.
   *
   * @returns a new CheckContext with no template parameter observation.
   */
  exitTemplateObserverScope(): CheckContext<Mapper> {
    return new CheckContext(this.mapper, this.flags, undefined);
  }

  /**
   * @returns true if the observer scope in this context has seen any template parameter usage.
   */
  hasObservedTemplateParameters(): boolean {
    return this.#templateParametersObserved !== undefined
      ? this.#templateParametersObserved.size > 0
      : false;
  }
}

export interface Checker {
  /** @internal */
  typePrototype: TypePrototype;
  /**
   * Using this API involves working with the TypeSpec Ast and may change at any time.
   * See https://typespec.io/docs/handbook/breaking-change-policy/
   */
  getTypeForNode(node: Node): Type;

  /** @internal */
  checkProgram(): void;
  /** @internal */
  checkSourceFile(file: TypeSpecScriptNode): void;
  /** @internal */
  getGlobalNamespaceType(): Namespace;
  /** @internal */
  getLiteralType(node: StringLiteralNode): StringLiteral;
  /** @internal */
  getLiteralType(node: NumericLiteralNode): NumericLiteral;
  /** @internal */
  getLiteralType(node: BooleanLiteralNode): BooleanLiteral;
  /** @internal */
  getLiteralType(node: LiteralNode): LiteralType;
  cloneType<T extends Type>(type: T, additionalProps?: { [P in keyof T]?: T[P] }): T;
  /** @internal */
  resolveRelatedSymbols(node: IdentifierNode): Sym[] | undefined;
  /** @internal */
  resolveCompletions(node: IdentifierNode): Map<string, TypeSpecCompletionItem>;
  createType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T,
  ): T & TypePrototype & { isFinished: boolean; readonly entityKind: "Type" };
  createAndFinishType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T,
  ): T & TypePrototype;
  finishType<T extends Type>(typeDef: T): T;
  createLiteralType(value: string, node?: StringLiteralNode): StringLiteral;
  createLiteralType(value: number | Numeric, node?: NumericLiteralNode): NumericLiteral;
  createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteral;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode,
  ): StringLiteral | NumericLiteral | BooleanLiteral;
  createLiteralType(
    value: string | number | boolean,
    node?: StringLiteralNode | NumericLiteralNode | BooleanLiteralNode,
  ): StringLiteral | NumericLiteral | BooleanLiteral;

  /**
   * Check if the source type can be assigned to the target type.
   * @param source Source type, should be assignable to the target.
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   * @returns [related, list of diagnostics]
   * @internal
   */
  isTypeAssignableTo(
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget,
  ): [boolean, readonly Diagnostic[]];

  /**
   * Check if the value is assignable to the given type
   * @param source Source value, should be assignable to the target type.
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   * @returns [related, list of diagnostics]
   * @internal
   */
  isValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: DiagnosticTarget,
  ): [boolean, readonly Diagnostic[]];

  /**
   * Check if the given type is one of the built-in standard TypeSpec Types.
   * @param type Type to check
   * @param stdType If provided check is that standard type
   */
  isStdType(
    type: Scalar,
    stdType?: IntrinsicScalarName,
  ): type is Scalar & { name: IntrinsicScalarName };
  isStdType(type: Type, stdType?: StdTypeName): type is Type & { name: StdTypeName };

  /**
   * Std type
   * @param name Name
   */
  getStdType<T extends keyof StdTypes>(name: T): StdTypes[T];

  /**
   * Return the exact type of a value.
   *
   * ```tsp
   * const a: string = "hello";
   * ```
   * calling `getValueExactType` on the value of a would give the string literal "hello".
   * @param value
   */
  getValueExactType(value: Value): Type | undefined;
  /**
   * Check and resolve a type for the given type reference node.
   * @param node Node.
   * @returns Resolved type and diagnostics if there was an error.
   * @internal use program.resolveTypeReference
   */
  resolveTypeReference(node: TypeReferenceNode): [Type | undefined, readonly Diagnostic[]];
  /**
   * Check and resolve a type or value for the given type reference node.
   * @param node Node.
   * @returns Resolved type and diagnostics if there was an error.
   * @internal
   */
  resolveTypeOrValueReference(node: TypeReferenceNode): [Entity | undefined, readonly Diagnostic[]];

  /** @internal */
  getValueForNode(node: Node): Value | null;

  /** @internal */
  getTypeOrValueForNode(node: Node): Type | Value | null;

  /** @internal */
  getTemplateParameterUsageMap(): Map<TemplateParameterDeclarationNode, boolean>;
  /** @internal */
  readonly errorType: ErrorType;
  /** @internal */
  readonly voidType: VoidType;
  /** @internal */
  readonly neverType: NeverType;
  /** @internal */
  readonly nullType: NullType;
  /** @internal */
  readonly anyType: UnknownType;

  /** @internal */
  stats: CheckerStats;
}

export interface CheckerStats {
  /** Number of types created */
  createdTypes: number;
  /** Number of types finished */
  finishedTypes: number;
}

interface TypePrototype {}

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

export function createChecker(program: Program, resolver: NameResolver): Checker {
  const waitingForResolution = new Map<Type, [Type, () => void][]>();
  const stats: CheckerStats = {
    createdTypes: 0,
    finishedTypes: 0,
  };

  const stdTypes: Partial<StdTypes> = {};
  const indeterminateEntities = new WeakMap<Type, IndeterminateEntity>();
  const docFromCommentForSym = new Map<Sym, string>();
  const referenceSymCache = new WeakMap<
    TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    Sym | undefined
  >();
  const valueExactTypes = new WeakMap<ValueWithTemplate, Type>();
  let onCheckerDiagnostic: (diagnostic: Diagnostic) => void = (x: Diagnostic) => {
    program.reportDiagnostic(x);
  };

  const typePrototype: TypePrototype = {};
  const globalNamespaceType = createGlobalNamespaceType();

  // Caches the deprecation test of nodes in the program
  const nodeDeprecationMap = new Map<Node, boolean>();
  const errorType: ErrorType = createAndFinishType({ kind: "Intrinsic", name: "ErrorType" });
  const voidType = createAndFinishType({ kind: "Intrinsic", name: "void" } as const);
  const neverType = createAndFinishType({ kind: "Intrinsic", name: "never" } as const);
  const unknownType = createAndFinishType({ kind: "Intrinsic", name: "unknown" } as const);
  const nullType = createAndFinishType({ kind: "Intrinsic", name: "null" } as const);

  /**
   * Set keeping track of node pending type resolution.
   * Key is the SymId of a node. It can be retrieved with getNodeSymId(node)
   */
  const pendingResolutions = new PendingResolutions();
  const postCheckValidators: ValidatorFn[] = [];

  const typespecNamespaceBinding = resolver.symbols.global.exports!.get("TypeSpec");
  if (typespecNamespaceBinding) {
    initializeTypeSpecIntrinsics();
  }

  /**
   * Tracking the template parameters used or not.
   */
  const templateParameterUsageMap = new Map<TemplateParameterDeclarationNode, boolean>();

  const checker: Checker = {
    getTypeForNode,
    checkProgram,
    checkSourceFile,
    getLiteralType,
    getGlobalNamespaceType,
    cloneType,
    resolveRelatedSymbols,
    resolveCompletions,
    neverType,
    errorType,
    nullType,
    anyType: unknownType,
    voidType,
    typePrototype,
    createType,
    createAndFinishType,
    createLiteralType,
    finishType,
    isStdType,
    getStdType,
    resolveTypeReference,
    resolveTypeOrValueReference,
    getValueForNode,
    getTypeOrValueForNode,
    getValueExactType,
    getTemplateParameterUsageMap,
    isTypeAssignableTo: undefined!,
    isValueOfType: undefined!,
    stats,
  };
  const relation = createTypeRelationChecker(program, checker);
  checker.isTypeAssignableTo = relation.isTypeAssignableTo;
  checker.isValueOfType = relation.isValueOfType;

  return checker;

  function getTemplateParameterUsageMap(): Map<TemplateParameterDeclarationNode, boolean> {
    return templateParameterUsageMap;
  }

  function wrapInstantiationDiagnostic(
    diagnostic: Diagnostic,
    templateMapper?: TypeMapper,
  ): Diagnostic {
    if (templateMapper === undefined || typeof diagnostic.target !== "object") return diagnostic;
    return {
      ...diagnostic,
      target: {
        node: diagnostic.target as any,
        templateMapper,
      },
    };
  }

  function reportCheckerDiagnostic(diagnostic: Diagnostic, mapper?: TypeMapper) {
    onCheckerDiagnostic(wrapInstantiationDiagnostic(diagnostic, mapper));
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
        program.trace("log", strs.join(" "));
        return voidType;
      },
      declarations: [],
      node: undefined as any, // TODO: is this correct?
    });

    // Until we have an `unit` type for `null`
    mutate(resolver.symbols.null).type = nullType;
    getSymbolLinks(resolver.symbols.null).type = nullType;
  }

  function getStdType<T extends keyof StdTypes>(name: T): StdTypes[T] {
    const type = stdTypes[name];
    if (type !== undefined) {
      return type as any;
    }

    const sym = typespecNamespaceBinding?.exports?.get(name);
    compilerAssert(sym, `Unexpected missing symbol to std type "${name}"`);
    if (sym.flags & SymbolFlags.Model) {
      checkModelStatement(CheckContext.DEFAULT, sym!.declarations[0] as any);
    } else {
      checkScalar(CheckContext.DEFAULT, sym.declarations[0] as any);
    }

    const loadedType = stdTypes[name];
    compilerAssert(
      loadedType,
      `TypeSpec std type "${name}" should have been initalized before using array syntax.`,
    );
    return loadedType as any;
  }

  /**
   * Create the link for the given type to the symbol links.
   * If currently instantiating a template it will link to the instantiations.
   * Else will link to the declaredType.
   * @param links Symbol link
   * @param type Type
   * @param mapper Type mapper if in an template instantiation
   */
  function linkType(ctx: CheckContext, links: SymbolLinks, type: Type) {
    if (ctx.mapper === undefined) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
    } else if (links.instantiations) {
      links.instantiations.set(ctx.mapper.args, type);
    }
  }

  function linkMemberType(ctx: CheckContext, links: SymbolLinks, type: Type) {
    if (ctx.mapper === undefined) {
      links.declaredType = type;
    }
  }

  /**
   * Check a member symbol.
   * @param sym Symbol binding a member node.
   * @param mapper Type mapper.
   * @returns Checked type for the given member symbol.
   */
  function checkMemberSym(ctx: CheckContext, sym: Sym): Type {
    const symbolLinks = getSymbolLinks(sym);
    const memberContainer = getTypeForNode(getSymNode(sym.parent!), ctx);
    const type = symbolLinks.declaredType ?? symbolLinks.type;

    if (type) {
      return type;
    } else {
      return checkMember(
        ctx,
        getSymNode(sym) as MemberNode,
        memberContainer as MemberContainerType,
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
    ctx: CheckContext,
    node: MemberNode,
    containerType: MemberContainerType,
  ): Type {
    switch (node.kind) {
      case SyntaxKind.ModelProperty:
        return checkModelProperty(ctx, node);
      case SyntaxKind.EnumMember:
        return checkEnumMember(ctx, node, containerType as Enum);
      case SyntaxKind.OperationStatement:
        return checkOperation(ctx, node, containerType as Interface);
      case SyntaxKind.UnionVariant:
        return checkUnionVariant(ctx, node);
      case SyntaxKind.ScalarConstructor:
        return checkScalarConstructor(ctx, node, containerType as Scalar);
    }
  }

  function getTypeForTypeOrIndeterminate(entity: Type | IndeterminateEntity): Type {
    if (entity.entityKind === "Indeterminate") {
      return entity.type;
    }
    return entity;
  }

  function getTypeForNode(node: Node, mapperOrContext?: TypeMapper | CheckContext): Type {
    const ctx = CheckContext.from(mapperOrContext);
    const entity = checkNode(ctx, node);
    if (entity === null) {
      return errorType;
    }
    if (entity.entityKind === "Indeterminate") {
      return entity.type;
    }
    if (isValue(entity)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "value-in-type",
          target: node,
        }),
      );
      return errorType;
    }
    if (entity.kind === "TemplateParameter") {
      if (entity.constraint?.valueType) {
        // means this template constraint will accept values
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "value-in-type",
            messageId: "referenceTemplate",
            target: node,
          }),
        );
      }
    }
    return entity;
  }

  function getValueForNode(
    node: Node,
    mapperOrContext?: TypeMapper | CheckContext,
    constraint?: CheckValueConstraint,
  ): Value | null {
    const ctx = CheckContext.from(mapperOrContext);
    const initial = checkNode(ctx, node, constraint);
    if (initial === null) {
      return null;
    }
    let entity: Type | Value | null;
    if (initial.entityKind === "Indeterminate") {
      entity = getValueFromIndeterminate(initial.type, constraint, node);
    } else {
      entity = initial;
    }
    if (entity === null) {
      return null;
    }
    if (isValue(entity)) {
      return constraint ? inferScalarsFromConstraints(entity, constraint.type) : entity;
    }
    // If a template parameter that can be a value is used in a template declaration then we allow it but we return null because we don't have an actual value.
    if (
      entity.kind === "TemplateParameter" &&
      entity.constraint?.valueType &&
      entity.constraint.type === undefined &&
      ctx.mapper === undefined
    ) {
      // We must also observe that the template parameter is used here.
      // ctx.observeTemplateParameter(entity);
      return createValue(
        {
          entityKind: "Value",
          valueKind: "TemplateValue",
          type: entity.constraint.valueType,
        },
        entity.constraint.valueType,
      ) as any;
    }
    reportExpectedValue(node, entity);
    return null;
  }

  function reportExpectedValue(target: Node, type: Type) {
    if (type.kind === "Model" && type.name === "" && target.kind === SyntaxKind.ModelExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "expect-value",
          messageId: "model",
          format: { name: getTypeName(type) },
          codefixes: [createModelToObjectValueCodeFix(target)],
          target,
        }),
      );
    } else if (type.kind === "Tuple" && target.kind === SyntaxKind.TupleExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "expect-value",
          messageId: "tuple",
          format: { name: getTypeName(type) },
          codefixes: [createTupleToArrayValueCodeFix(target)],
          target,
        }),
      );
    } else {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "expect-value",
          format: { name: getTypeName(type) },
          target,
        }),
      );
    }
  }

  /** In certain context for types that can also be value if the constraint allows it we try to use it as a value instead of a type. */
  function getValueFromIndeterminate(
    type: Type,
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): Type | Value | null {
    switch (type.kind) {
      case "String":
      case "StringTemplate":
        return checkStringValue(type, constraint, node);
      case "Number":
        return checkNumericValue(type, constraint, node);
      case "Boolean":
        return checkBooleanValue(type, constraint, node);
      case "EnumMember":
        return checkEnumValue(type, constraint, node);
      case "UnionVariant":
        return getValueFromIndeterminate(type.type, constraint, node);
      case "Intrinsic":
        switch (type.name) {
          case "null":
            return checkNullValue(type as any, constraint, node);
        }
        return type;
      default:
        return type;
    }
  }

  /**
   * Try to intercept types used as values, either return null and emit a diagnostic with a codefix or return the type as is to be dealt with the normal way.
   */
  function interceptTypesUsedAsValue(type: Type): Type | null {
    switch (type.kind) {
      case "Tuple":
        return interceptTupleUsedAsValue(type);
      case "Model":
        return interceptModelExpressionUsedAsValue(type);
      default:
        return type;
    }
  }

  // Legacy behavior to smooth transition to object values.
  function interceptModelExpressionUsedAsValue(model: Model): Model | null {
    if (model.node?.kind !== SyntaxKind.ModelExpression) {
      return model; // we only want to convert model expressions
    }

    reportCheckerDiagnostic(
      createDiagnostic({
        code: "expect-value",
        codefixes: [createModelToObjectValueCodeFix(model.node)],
        messageId: "modelExpression",
        target: model.node,
      }),
    );

    return null;
  }

  // Intercept tuple used as value and report diagnostic with a codefix
  function interceptTupleUsedAsValue(tuple: Tuple): Tuple | null {
    if (tuple.node?.kind !== SyntaxKind.TupleExpression) {
      return tuple; // we won't convert dynamic tuples to array values
    }

    reportCheckerDiagnostic(
      createDiagnostic({
        code: "expect-value",
        codefixes: [createTupleToArrayValueCodeFix(tuple.node)],
        messageId: "tuple",
        target: tuple.node,
      }),
    );
    return null;
  }

  interface CheckConstraint {
    kind: "argument" | "assignment";
    constraint: MixedParameterConstraint;
  }
  interface CheckValueConstraint {
    kind: "argument" | "assignment";
    type: Type;
  }

  /** If the constraint only expect a value we can try to intercept types passed to it and call `interceptTypeUsedAsValue` to get a better error */
  function shouldTryInterceptTypeUsedAsValue(
    constraint: MixedParameterConstraint | undefined,
  ): constraint is MixedParameterConstraint &
    Required<Pick<MixedParameterConstraint, "valueType">> {
    return Boolean(constraint?.valueType && !constraint.type);
  }

  /**
   * Gets a type or value depending on the node and current constraint.
   * For nodes that can be both type or values(e.g. string), the value will be returned if the constraint expect a value of that type even if the constrain also allows the type.
   * This means that if the constraint is `string | valueof string` passing `"abc"` will send the value `"abc"` and not the type `"abc"`.
   */
  function getTypeOrValueForNode(
    node: Node,
    mapper?: TypeMapper,
    constraint?: CheckConstraint | undefined,
  ): Type | Value | null {
    const ctx = CheckContext.from(mapper);
    const valueConstraint = extractValueOfConstraints(constraint);
    const entity = checkNode(ctx, node, valueConstraint);
    if (entity === null) {
      return entity;
    } else if (isType(entity)) {
      if (shouldTryInterceptTypeUsedAsValue(constraint?.constraint)) {
        return interceptTypesUsedAsValue(entity);
      } else {
        return entity;
      }
    } else if (isValue(entity)) {
      return entity;
    }
    compilerAssert(entity.entityKind === "Indeterminate", "Expected indeterminate entity");

    if (valueConstraint) {
      const valueDiagnostics: Diagnostic[] = [];
      const oldDiagnosticHook = onCheckerDiagnostic;
      onCheckerDiagnostic = (x: Diagnostic) => valueDiagnostics.push(x);
      const result = getValueFromIndeterminate(entity.type, valueConstraint, node);
      onCheckerDiagnostic = oldDiagnosticHook;
      if (result) {
        // If there were diagnostic reported but we still got a value this means that the value might be invalid.
        reportCheckerDiagnostics(valueDiagnostics);
        return result;
      }
    }

    return entity.type;
  }

  /** Extact the type constraint a value should match. */
  function extractValueOfConstraints(
    constraint: CheckConstraint | undefined,
  ): CheckValueConstraint | undefined {
    if (constraint?.constraint.valueType) {
      return { kind: constraint.kind, type: constraint.constraint.valueType };
    } else {
      return undefined;
    }
  }

  /**
   * Gets a type, value or indeterminate depending on the node and current constraint.
   * For nodes that can be both type or values(e.g. string literals), an indeterminate entity will be returned.
   * It is the job of of the consumer to decide if it should be a type or a value depending on the context.
   */
  function checkNode(
    ctx: CheckContext,
    node: Node,
    valueConstraint?: CheckValueConstraint | undefined,
  ): Type | Value | IndeterminateEntity | null {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(ctx, node);
      case SyntaxKind.ModelStatement:
        return checkModel(ctx, node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(ctx, node);
      case SyntaxKind.ScalarStatement:
        return checkScalar(ctx, node);
      case SyntaxKind.AliasStatement:
        return checkAlias(ctx, node);
      case SyntaxKind.EnumStatement:
        return checkEnum(ctx, node);
      case SyntaxKind.EnumMember:
        return checkEnumMember(ctx, node);
      case SyntaxKind.InterfaceStatement:
        return checkInterface(ctx, node);
      case SyntaxKind.UnionStatement:
        return checkUnion(ctx, node);
      case SyntaxKind.UnionVariant:
        return checkUnionVariant(ctx, node);
      case SyntaxKind.NamespaceStatement:
      case SyntaxKind.JsNamespaceDeclaration:
        return checkNamespace(ctx, node);
      case SyntaxKind.OperationStatement:
        return checkOperation(ctx, node);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(node);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(ctx, node);
      case SyntaxKind.StringTemplateExpression:
        return checkStringTemplateExpresion(ctx, node);
      case SyntaxKind.ArrayExpression:
        return checkArrayExpression(ctx, node);
      case SyntaxKind.UnionExpression:
        return checkUnionExpression(ctx, node);
      case SyntaxKind.IntersectionExpression:
        return checkIntersectionExpression(ctx, node);
      case SyntaxKind.DecoratorDeclarationStatement:
        return checkDecoratorDeclaration(ctx, node);
      case SyntaxKind.FunctionDeclarationStatement:
        return checkFunctionDeclaration(ctx, node);
      case SyntaxKind.TypeReference:
        return checkTypeOrValueReference(ctx, node);
      case SyntaxKind.TemplateArgument:
        return checkTemplateArgument(ctx, node);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(ctx, node);
      case SyntaxKind.VoidKeyword:
        return voidType;
      case SyntaxKind.NeverKeyword:
        return neverType;
      case SyntaxKind.UnknownKeyword:
        return unknownType;
      case SyntaxKind.ObjectLiteral:
        return checkObjectValue(ctx, node, valueConstraint);
      case SyntaxKind.ArrayLiteral:
        return checkArrayValue(ctx, node, valueConstraint);
      case SyntaxKind.ConstStatement:
        return checkConst(node);
      case SyntaxKind.CallExpression:
        return checkCallExpression(ctx, node);
      case SyntaxKind.TypeOfExpression:
        return checkTypeOfExpression(ctx, node);
      case SyntaxKind.DecoratedExpression:
        return checkDecoratedExpression(ctx, node);
      case SyntaxKind.AugmentDecoratorStatement:
        return checkAugmentDecorator(ctx, node);
      case SyntaxKind.UsingStatement:
        return checkUsings(ctx, node);
      default:
        return errorType;
    }
  }

  /**
   * Return a fully qualified id of node
   */
  function getNodeSym(
    node:
      | ModelStatementNode
      | ModelExpressionNode
      | ScalarStatementNode
      | AliasStatementNode
      | ConstStatementNode
      | InterfaceStatementNode
      | OperationStatementNode
      | TemplateParameterDeclarationNode
      | UnionStatementNode,
  ): Sym {
    const symbol =
      node.kind === SyntaxKind.OperationStatement &&
      node.parent?.kind === SyntaxKind.InterfaceStatement
        ? getSymbolForMember(node)
        : node.symbol;
    return symbol!;
  }

  /**
   * Check if the given namespace is the standard library `TypeSpec` namespace.
   */
  function isTypeSpecNamespace(
    namespace: Namespace,
  ): namespace is Namespace & { name: "TypeSpec"; namespace: Namespace } {
    return namespace.name === "TypeSpec" && namespace.namespace === globalNamespaceType;
  }

  /**
   * Check if the given type is defined right in the TypeSpec namespace.
   */
  function isInTypeSpecNamespace(type: Type & { namespace?: Namespace }): boolean {
    return Boolean(type.namespace && isTypeSpecNamespace(type.namespace));
  }

  function checkTemplateParameterDeclaration(
    ctx: CheckContext<undefined>,
    node: TemplateParameterDeclarationNode,
  ): TemplateParameter;
  function checkTemplateParameterDeclaration(
    ctx: CheckContext,
    node: TemplateParameterDeclarationNode,
  ): Type | Value | IndeterminateEntity;
  function checkTemplateParameterDeclaration(
    ctx: CheckContext,
    node: TemplateParameterDeclarationNode,
  ): Type | Value | IndeterminateEntity {
    const parentNode = node.parent!;
    const grandParentNode = parentNode.parent;
    const links = getSymbolLinks(node.symbol);

    if (!templateParameterUsageMap.has(node)) {
      templateParameterUsageMap.set(node, false);
    }

    if (pendingResolutions.has(getNodeSym(node), ResolutionKind.Constraint)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-constraint",
            format: { typeName: node.id.sv },
            target: node.constraint!,
          }),
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
            }),
          );
        }
      }
      const index = parentNode.templateParameters.findIndex((v) => v === node);
      type = links.declaredType = createAndFinishType({
        kind: "TemplateParameter",
        node: node,
      });

      if (node.constraint) {
        pendingResolutions.start(getNodeSym(node), ResolutionKind.Constraint);
        type.constraint = getParamConstraintEntityForNode(ctx, node.constraint);
        pendingResolutions.finish(getNodeSym(node), ResolutionKind.Constraint);
      }
      if (node.default) {
        // Set this to unknownType in case the default points back to the template itself causing failures
        type.default = unknownType;
        type.default = checkTemplateParameterDefault(
          ctx,
          node.default,
          parentNode.templateParameters,
          index,
          type.constraint,
        );
      }
    }
    return ctx.mapper ? ctx.mapper.getMappedType(type) : type;
  }

  function getResolvedTypeParameterDefault(
    ctx: CheckContext<TypeMapper>,
    declaredType: TemplateParameter,
    node: TemplateParameterDeclarationNode,
  ): Type | Value | IndeterminateEntity | null | undefined {
    if (declaredType.default === undefined) {
      return undefined;
    }
    if (
      (isType(declaredType.default) && isErrorType(declaredType.default)) ||
      declaredType.default === null
    ) {
      return declaredType.default;
    }

    return checkNode(ctx, node.default!);
  }

  function checkTemplateParameterDefault(
    ctx: CheckContext,
    nodeDefault: Expression,
    templateParameters: readonly TemplateParameterDeclarationNode[],
    index: number,
    constraint: Entity | undefined,
  ): Type | Value | IndeterminateEntity {
    function visit(node: Node) {
      const entity = checkNode(ctx, node);
      let hasError = false;
      if (entity !== null && "kind" in entity && entity.kind === "TemplateParameter") {
        for (let i = index; i < templateParameters.length; i++) {
          if (entity.node?.symbol === templateParameters[i].symbol) {
            reportCheckerDiagnostic(
              createDiagnostic({ code: "invalid-template-default", target: node }),
            );
            return undefined;
          }
        }
        return entity;
      }

      visitChildren(node, (x) => {
        const visited = visit(x);
        if (visited === undefined) {
          hasError = true;
        }
      });

      return hasError ? undefined : entity;
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
    ctx: CheckContext,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    instantiateTemplate = true,
  ): Type {
    const sym = resolveTypeReferenceSym(ctx, node);
    if (!sym) {
      return errorType;
    }

    const type = checkTypeReferenceSymbol(ctx, sym, node, instantiateTemplate);
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
    ctx: CheckContext,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    instantiateTemplate = true,
  ): Type | Value | IndeterminateEntity {
    const sym = resolveTypeReferenceSym(ctx, node);
    if (!sym) {
      return errorType;
    }

    return checkTypeOrValueReferenceSymbol(ctx, sym, node, instantiateTemplate) ?? errorType;
  }

  function checkTemplateArgument(
    ctx: CheckContext,
    node: TemplateArgumentNode,
  ): Type | Value | IndeterminateEntity | null {
    return checkNode(ctx, node.argument);
  }

  function resolveTypeOrValueReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
  ): [Entity | undefined, readonly Diagnostic[]] {
    const oldDiagnosticHook = onCheckerDiagnostic;
    const diagnostics: Diagnostic[] = [];
    onCheckerDiagnostic = (x: Diagnostic) => diagnostics.push(x);
    const entity = checkTypeOrValueReference(CheckContext.DEFAULT, node, false);
    onCheckerDiagnostic = oldDiagnosticHook;
    return [entity === errorType ? undefined : entity, diagnostics];
  }

  function resolveTypeReference(
    node: TypeReferenceNode,
  ): [Type | undefined, readonly Diagnostic[]] {
    const oldDiagnosticHook = onCheckerDiagnostic;
    const diagnostics: Diagnostic[] = [];
    onCheckerDiagnostic = (x: Diagnostic) => diagnostics.push(x);
    const type = checkTypeReference(CheckContext.DEFAULT, node, false);
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
        reportDeprecated(program, deprecationDetails.message, target, reportCheckerDiagnostic);
        return;
      }
    }

    const deprecationDetails = getDeprecationDetails(program, type);
    if (deprecationDetails) {
      reportDeprecated(program, deprecationDetails.message, target, reportCheckerDiagnostic);
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
          (node.directives ?? []).findIndex((d) => d.target.sv === "deprecated") >= 0,
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
    ctx: CheckContext,
    node: Node,
    args: readonly TemplateArgumentNode[],
    decls: readonly TemplateParameterDeclarationNode[],
    parentMapper?: TypeMapper,
  ): Map<TemplateParameter, Type | Value | IndeterminateEntity> {
    const params = new Map<string, TemplateParameter>();
    const positional: TemplateParameter[] = [];
    interface TemplateParameterInit {
      decl: TemplateParameterDeclarationNode;
      // Deferred initializer so that we evaluate the param arguments in definition order.
      checkArgument: (() => [Node, Type | Value | IndeterminateEntity | null]) | null;
    }
    const initMap = new Map<TemplateParameter, TemplateParameterInit>(
      decls.map((decl) => {
        const declaredType = checkTemplateParameterDeclaration(CheckContext.DEFAULT, decl);

        positional.push(declaredType);
        params.set(decl.id.sv, declaredType);

        return [
          declaredType,
          {
            decl,
            checkArgument: null,
          },
        ];
      }),
    );

    let named = false;

    for (const [arg, idx] of args.map((v, i) => [v, i] as const)) {
      function deferredCheck(): [Node, Type | Value | IndeterminateEntity | null] {
        return [arg, checkNode(ctx, arg.argument)];
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
            }),
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
            }),
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
            }),
          );
          // we just throw this arg away. any missing args will be filled with ErrorType
        }

        if (idx >= positional.length) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "tooMany",
              target: node,
            }),
          );
          continue;
        }

        const param = positional[idx];

        initMap.get(param)!.checkArgument ??= deferredCheck;
      }
    }

    const finalMap = initMap as unknown as Map<
      TemplateParameter,
      Type | Value | IndeterminateEntity
    >;
    const mapperParams: TemplateParameter[] = [];
    const mapperArgs: (Type | Value | IndeterminateEntity)[] = [];
    for (const [param, { decl, checkArgument: init }] of [...initMap]) {
      function commit(param: TemplateParameter, type: Type | Value | IndeterminateEntity): void {
        finalMap.set(param, type);
        mapperParams.push(param);
        mapperArgs.push(type);
      }

      if (init === null) {
        const argumentMapper = createTypeMapper(
          mapperParams,
          mapperArgs,
          { node, mapper: ctx.mapper },
          parentMapper,
        );
        const defaultValue = getResolvedTypeParameterDefault(
          ctx.withMapper(argumentMapper),
          param,
          decl,
        );
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
            }),
          );

          // TODO-TIM check if we expose this below
          commit(param, param.constraint?.type ?? unknownType);
        }

        continue;
      }

      const [argNode, type] = init();
      if (type === null) {
        commit(param, unknownType);
        continue;
      }
      if (param.constraint) {
        const constraint =
          param.constraint.type?.kind === "TemplateParameter"
            ? finalMap.get(param.constraint.type)!
            : param.constraint;

        if (isType(type) && shouldTryInterceptTypeUsedAsValue(param.constraint)) {
          const converted = interceptTypesUsedAsValue(type);
          // If we manage to convert it means this might be convertable so we skip type checking.
          // However we still return the original entity
          if (converted !== type) {
            commit(param, type);
            continue;
          }
        }

        if (param.constraint && !checkArgumentAssignable(type, constraint, argNode)) {
          const effectiveType = param.constraint.type ?? unknownType;

          commit(param, effectiveType);
          continue;
        }
      } else if (isErrorType(type)) {
        // If we got an error type we don't want to keep passing it through so we reduce to unknown
        // Similar to the above where if the type is not assignable to the constraint we reduce to the constraint
        commit(param, unknownType);
        continue;
      } else if (isValue(type)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "value-in-type",
            messageId: "noTemplateConstraint",
            target: argNode,
          }),
        );

        commit(param, unknownType);
        continue;
      }

      commit(param, type);
    }
    return finalMap;
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
    ctx: CheckContext,
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    instantiateTemplates = true,
  ): Type {
    const result = checkTypeOrValueReferenceSymbol(ctx, sym, node, instantiateTemplates);
    if (result === null || isValue(result)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "value-in-type", target: node }));
      return errorType;
    }
    if (result.entityKind === "Indeterminate") {
      return result.type;
    }
    return result;
  }

  function checkTypeOrValueReferenceSymbol(
    ctx: CheckContext,
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    instantiateTemplates = true,
  ): Type | Value | IndeterminateEntity | null {
    const entity = checkTypeOrValueReferenceSymbolWorker(ctx, sym, node, instantiateTemplates);

    if (entity !== null && isType(entity) && entity.kind === "TemplateParameter") {
      ctx.observeTemplateParameter(entity);
      templateParameterUsageMap.set(entity.node!, true);
    }
    return entity;
  }

  function checkTypeOrValueReferenceSymbolWorker(
    ctx: CheckContext,
    sym: Sym,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    instantiateTemplates = true,
  ): Type | Value | IndeterminateEntity | null {
    if (sym.flags & SymbolFlags.Const) {
      return getValueForNode(sym.declarations[0], ctx.mapper);
    }

    if (sym.flags & SymbolFlags.Decorator) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "decorator", target: sym }),
      );

      return errorType;
    }

    if (sym.flags & SymbolFlags.Function) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "invalid-type-ref", messageId: "function", target: sym }),
      );

      return errorType;
    }

    const argumentNodes = node.kind === SyntaxKind.TypeReference ? node.arguments : [];
    const symbolLinks = getSymbolLinks(sym);
    let baseType: Type | IndeterminateEntity;
    if (
      sym.flags & SymbolFlags.Declaration &&
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
        // Not a templated node, and we are moving through a typeref to a new declaration.
        // Therefore, we are no longer in a template declaration if we were before, and we are
        // visiting a new declaration, so we exit the active template observer scope, if any.
        const innerCtx = ctx
          .maskFlags(CheckFlags.InTemplateDeclaration)
          .exitTemplateObserverScope();
        if (argumentNodes.length > 0) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-template-args",
              messageId: "notTemplate",
              target: node,
            }),
          );
        }

        if (sym.flags & SymbolFlags.LateBound) {
          compilerAssert(sym.type, "Expected late bound symbol to have type");
          return sym.type;
        } else if (symbolLinks.declaredType) {
          baseType = symbolLinks.declaredType;
        } else if (sym.flags & SymbolFlags.Member) {
          baseType = checkMemberSym(innerCtx, sym);
        } else {
          //
          baseType = checkDeclaredTypeOrIndeterminate(innerCtx, sym, decl);
        }
      } else {
        // Checking the declaration to ensure we have the template itself, so we don't need the mapper.
        const declaredType = getOrCheckDeclaredType(ctx.withMapper(undefined), sym, decl);

        const templateParameters = decl.templateParameters;
        const instantiationArgsCtx = ctx.enterTemplateObserverScope();
        const instantiation = checkTemplateInstantiationArgs(
          instantiationArgsCtx,
          node,
          argumentNodes,
          templateParameters,
          declaredType.templateMapper,
        );

        // If we didn't see any template parameters during argument checking, then this type reference is "pure"
        // and we can mask the InTemplateDeclaration flag downstream. In either case, we are going to a new declaration
        // so we exit the active template observer scope, if any.
        const innerCtx = (
          instantiationArgsCtx.hasObservedTemplateParameters()
            ? ctx
            : ctx.maskFlags(CheckFlags.InTemplateDeclaration)
        ).exitTemplateObserverScope();

        baseType = getOrInstantiateTemplate(
          innerCtx,
          decl,
          [...instantiation.keys()],
          [...instantiation.values()],
          { node, mapper: ctx.mapper },
          declaredType.templateMapper,
          instantiateTemplates,
        );
      }
    } else {
      const symNode = getSymNode(sym);
      // some other kind of reference
      if (argumentNodes.length > 0) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-template-args",
            messageId: "notTemplate",
            target: node,
          }),
        );
      }

      if (sym.flags & SymbolFlags.LateBound) {
        compilerAssert(sym.type, `Expected late bound symbol to have type`);
        return sym.type;
      } else if (sym.flags & SymbolFlags.TemplateParameter) {
        const mapped = checkTemplateParameterDeclaration(
          ctx,
          symNode as TemplateParameterDeclarationNode,
        );
        baseType = mapped as any;
      } else if (symbolLinks.type) {
        // Have a cached type for non-declarations
        baseType = symbolLinks.type;
      } else if (symbolLinks.declaredType) {
        baseType = symbolLinks.declaredType;
      } else {
        if (sym.flags & SymbolFlags.Member) {
          baseType = checkMemberSym(ctx, sym);
        } else {
          // don't have a cached type for this symbol, so go grab it and cache it
          baseType = getTypeForNode(symNode, ctx);
          symbolLinks.type = baseType;
        }
      }
    }

    // Check for deprecations here, first on symbol, then on type.  However,
    // don't raise deprecation when the usage site is also a deprecated
    // declaration.
    const declarationNode = getSymNode(sym);
    if (declarationNode && ctx.mapper === undefined && isType(baseType)) {
      if (!isTypeReferenceContextDeprecated(node.parent!)) {
        checkDeprecated(baseType, declarationNode, node);
      }
    }

    // Elements that could be used as type or values depending on the context
    if (
      (isType(baseType) && (baseType.kind === "EnumMember" || baseType.kind === "UnionVariant")) ||
      isNullType(baseType)
    ) {
      return createIndeterminateEntity(baseType);
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
    ctx: CheckContext,
    sym: Sym,
    decl: TemplateableNode,
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
      return checkMemberSym(ctx, sym) as TemplatedType;
    } else {
      return checkDeclaredType(ctx, sym, decl) as TemplatedType;
    }
  }

  /**
   * Check the declared type of a templatable node.
   * @param node Declaration node
   * @param sym Node Symbol
   * @param mapper Type mapper for template resolution
   * @returns The declared type for the given node.
   */
  function checkDeclaredTypeOrIndeterminate(
    ctx: CheckContext,
    sym: Sym,
    node: TemplateableNode,
  ): Type | IndeterminateEntity {
    const type =
      sym.flags & SymbolFlags.Model
        ? checkModelStatement(ctx, node as ModelStatementNode)
        : sym.flags & SymbolFlags.Scalar
          ? checkScalar(ctx, node as ScalarStatementNode)
          : sym.flags & SymbolFlags.Alias
            ? checkAlias(ctx, node as AliasStatementNode)
            : sym.flags & SymbolFlags.Interface
              ? checkInterface(ctx, node as InterfaceStatementNode)
              : sym.flags & SymbolFlags.Operation
                ? checkOperation(ctx, node as OperationStatementNode)
                : checkUnion(ctx, node as UnionStatementNode);

    return type;
  }

  function checkDeclaredType(ctx: CheckContext, sym: Sym, node: TemplateableNode): Type {
    return getTypeForTypeOrIndeterminate(checkDeclaredTypeOrIndeterminate(ctx, sym, node));
  }

  function getOrInstantiateTemplate(
    ctx: CheckContext,
    templateNode: TemplateableNode,
    params: TemplateParameter[],
    args: (Type | Value | IndeterminateEntity)[],
    source: TypeMapper["source"],
    parentMapper: TypeMapper | undefined,
    instantiateTempalates = true,
  ): Type {
    const symbolLinks =
      templateNode.kind === SyntaxKind.OperationStatement &&
      templateNode.parent!.kind === SyntaxKind.InterfaceStatement
        ? getSymbolLinksForMember(templateNode as MemberNode)
        : getSymbolLinks(templateNode.symbol);

    compilerAssert(
      symbolLinks,
      `Unexpected checker error. symbolLinks was not defined for ${SyntaxKind[templateNode.kind]}`,
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
          }`,
        );
      }
    }
    const mapper = createTypeMapper(params, args, source, parentMapper);
    const cached = symbolLinks.instantiations?.get(mapper.args);
    if (cached) {
      return cached;
    }
    if (instantiateTempalates) {
      return instantiateTemplate(
        ctx.withMapper(mapper),
        symbolLinks.instantiations,
        templateNode,
        params,
      );
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
    ctx: CheckContext<TypeMapper>,
    instantiations: TypeInstantiationMap,
    templateNode: TemplateableNode,
    params: TemplateParameter[],
  ): Type {
    const type = getTypeForNode(templateNode, ctx);
    if (!instantiations.get(ctx.mapper.args)) {
      instantiations.set(ctx.mapper.args, type);
    }
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    return type;
  }

  /** Check a union expresion used in a parameter constraint, those allow the use of `valueof` as a variant. */
  function checkMixedParameterConstraintUnion(
    ctx: CheckContext,
    node: UnionExpressionNode,
  ): MixedParameterConstraint {
    const values: Type[] = [];
    const types: Type[] = [];
    for (const option of node.options) {
      const [kind, type] = getTypeOrValueOfTypeForNode(ctx, option);
      if (kind === "value") {
        values.push(type);
      } else {
        types.push(type);
      }
    }
    return {
      entityKind: "MixedParameterConstraint",
      node,
      valueType:
        values.length === 0
          ? undefined
          : values.length === 1
            ? values[0]
            : createConstraintUnion(node, values),
      type:
        types.length === 0
          ? undefined
          : types.length === 1
            ? types[0]
            : createConstraintUnion(node, types),
    };
  }

  function createConstraintUnion(node: UnionExpressionNode, options: Type[]): Union {
    const variants = createRekeyableMap<string | symbol, UnionVariant>();
    const union: Union = createAndFinishType({
      kind: "Union",
      node,
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
          node: undefined,
          type: option,
          name,
          union,
          decorators: [],
        }),
      );
    }
    return union;
  }

  function checkUnionExpression(ctx: CheckContext, node: UnionExpressionNode): Union {
    const unionType: Union = createAndFinishType({
      kind: "Union",
      node,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
      expression: true,
      namespace: getParentNamespaceType(node),
      variants: createRekeyableMap(),
      decorators: [],
    });

    for (const o of node.options) {
      const type = getTypeForNode(o, ctx);

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

    linkMapper(unionType, ctx.mapper);

    return unionType;
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(ctx: CheckContext, node: IntersectionExpressionNode) {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }

    const intersection: Model = initModel(node);
    const options = node.options.map((o): [Expression, Type] => [o, getTypeForNode(o, ctx)]);

    ensureResolved(
      options.map(([, type]) => type),
      intersection,
      () => {
        const type = mergeModelTypes(ctx, node.symbol, node, options, intersection);
        linkType(ctx, links, type);
        finishType(intersection);
      },
    );
    return intersection;
  }

  function ensureResolved<T>(
    types: readonly (Type | undefined)[],
    awaitingType: Type,
    callback: () => T,
  ): void {
    const waitingFor = new Set<Type>();
    for (const type of types) {
      if (type === undefined) continue;
      if (type.creating) {
        waitingFor.add(type);
      }
    }

    function check() {
      if (waitingFor.size === 0) {
        callback();
      }
    }
    for (const type of waitingFor) {
      waitingForResolution.set(type, [
        ...(waitingForResolution.get(type) || []),
        [
          awaitingType,
          () => {
            waitingFor.delete(type);
            check();
          },
        ],
      ]);
    }

    check();
  }

  function checkDecoratorDeclaration(
    ctx: CheckContext,
    node: DecoratorDeclarationStatementNode,
  ): Decorator {
    const symbol = getMergedSymbol(node.symbol);
    const links = getSymbolLinks(symbol);
    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this operation and we've already checked it
      return links.declaredType as Decorator;
    }

    const namespace = getParentNamespaceType(node);
    compilerAssert(
      namespace,
      `Decorator ${node.id.sv} should have resolved a namespace or found the global namespace.`,
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
      target: checkFunctionParameter(ctx, node.target, true),
      parameters: node.parameters.map((param) => checkFunctionParameter(ctx, param, true)),
      implementation: implementation ?? (() => {}),
    });

    namespace.decoratorDeclarations.set(name, decoratorType);

    linkType(ctx, links, decoratorType);

    return decoratorType;
  }

  function checkFunctionDeclaration(ctx: CheckContext, node: FunctionDeclarationStatementNode) {
    reportCheckerDiagnostic(createDiagnostic({ code: "function-unsupported", target: node }));
    return errorType;
  }

  function checkFunctionParameter(
    ctx: CheckContext,
    node: FunctionParameterNode,
    mixed: true,
  ): MixedFunctionParameter;
  function checkFunctionParameter(
    ctx: CheckContext,
    node: FunctionParameterNode,
    mixed: false,
  ): SignatureFunctionParameter;
  function checkFunctionParameter(
    ctx: CheckContext,
    node: FunctionParameterNode,
    mixed: boolean,
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
        createDiagnostic({ code: "rest-parameter-array", target: node.type }),
      );
    }

    const base = {
      kind: "FunctionParameter",
      node,
      name: node.id.sv,
      optional: node.optional,
      rest: node.rest,
      implementation: node.symbol.value!,
    } as const;
    let parameterType: FunctionParameter;

    if (mixed) {
      const type = node.type
        ? getParamConstraintEntityForNode(ctx, node.type)
        : ({
            entityKind: "MixedParameterConstraint",
            type: unknownType,
          } satisfies MixedParameterConstraint);
      parameterType = createType({
        ...base,
        type,
        mixed: true,
        implementation: node.symbol.value!,
      });
    } else {
      parameterType = createType({
        ...base,
        mixed: false,
        type: node.type ? getTypeForNode(node.type) : unknownType,
        implementation: node.symbol.value!,
      });
    }

    linkType(ctx, links, parameterType);

    return parameterType;
  }

  function getTypeOrValueOfTypeForNode(ctx: CheckContext, node: Node): ["type" | "value", Type] {
    switch (node.kind) {
      case SyntaxKind.ValueOfExpression:
        const target = getTypeForNode(node.target, ctx);
        return ["value", target];
      default:
        return ["type", getTypeForNode(node, ctx)];
    }
  }

  function getParamConstraintEntityForNode(
    ctx: CheckContext,
    node: Expression,
  ): MixedParameterConstraint {
    switch (node.kind) {
      case SyntaxKind.UnionExpression:
        return checkMixedParameterConstraintUnion(ctx, node);
      default:
        const [kind, entity] = getTypeOrValueOfTypeForNode(ctx, node);
        return {
          entityKind: "MixedParameterConstraint",
          node: node,
          type: kind === "value" ? undefined : entity,
          valueType: kind === "value" ? entity : undefined,
        };
    }
  }

  function mergeModelTypes(
    ctx: CheckContext,
    parentModelSym: Sym | undefined,
    node: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode,
    options: [Node, Type][],
    intersection: Model,
  ) {
    const properties = intersection.properties;

    const indexers: ModelIndexer[] = [];
    const modelOptions: [Node, Model][] = options.filter((entry): entry is [Node, Model] => {
      const [optionNode, option] = entry;
      if (option.kind === "TemplateParameter") {
        return false;
      }
      if (option.kind !== "Model") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "intersect-non-model", target: optionNode }),
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
            }),
          );
        } else {
          indexers.push(option.indexer);
        }
      }
    }
    for (const [optionNode, option] of modelOptions) {
      intersection.sourceModels.push({ usage: "intersection", model: option, node: optionNode });
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "intersect-duplicate-property",
              format: { propName: prop.name },
              target: node,
            }),
          );
          continue;
        }

        const memberSym = parentModelSym && getMemberSymbol(parentModelSym, prop.name);
        const overrides: Partial<ModelProperty> = {
          sourceProperty: prop,
          model: intersection,
        };
        const newPropType = memberSym
          ? cloneTypeForSymbol(memberSym, prop, overrides)
          : cloneType(prop, overrides);
        properties.set(prop.name, newPropType);
        linkIndirectMember(ctx, node, newPropType);

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
          ctx,
          undefined,
          node,
          indexers.map((x) => [x.value.node!, x.value]),
          initModel(node),
        ),
      };
    }
    linkMapper(intersection, ctx.mapper);
    return finishType(intersection);
  }

  function checkArrayExpression(ctx: CheckContext, node: ArrayExpressionNode): Model {
    const elementCtx = ctx.enterTemplateObserverScope();
    const elementType = getTypeForNode(node.elementType, elementCtx);

    const instantiationCtx = elementCtx.hasObservedTemplateParameters()
      ? ctx
      : ctx.maskFlags(CheckFlags.InTemplateDeclaration);

    const arrayType = getStdType("Array");
    const arrayNode: ModelStatementNode = arrayType.node as any;
    const param: TemplateParameter = getTypeForNode(arrayNode.templateParameters[0]) as any;
    return getOrInstantiateTemplate(
      instantiationCtx,
      arrayNode,
      [param],
      [elementType],
      { node, mapper: ctx.mapper },
      undefined,
    ) as Model;
  }

  function checkNamespace(
    ctx: CheckContext,
    node: NamespaceStatementNode | JsNamespaceDeclarationNode,
  ) {
    const links = getSymbolLinks(getMergedSymbol(node.symbol));
    let type = links.type as Namespace;
    if (!type) {
      type = initializeTypeForNamespace(node);
    }

    if (node.kind === SyntaxKind.NamespaceStatement) {
      if (isArray(node.statements)) {
        node.statements.forEach((x) => checkNode(ctx, x));
      } else if (node.statements) {
        const subNs = checkNamespace(ctx, node.statements);
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
        type.decorators = type.decorators.concat(
          checkDecorators(CheckContext.DEFAULT, type, sourceNode),
        );
      }
      finishType(type);

      namespace?.namespaces.set(name, type);
    }

    return symbolLinks.type as Namespace;
  }

  function getParentNamespaceType(
    node:
      | AliasStatementNode
      | ModelStatementNode
      | ScalarStatementNode
      | NamespaceStatementNode
      | JsNamespaceDeclarationNode
      | UnionExpressionNode
      | OperationStatementNode
      | EnumStatementNode
      | InterfaceStatementNode
      | IntersectionExpressionNode
      | UnionStatementNode
      | ModelExpressionNode
      | DecoratorDeclarationStatementNode
      | FunctionDeclarationStatementNode,
  ): Namespace | undefined {
    if (node === globalNamespaceType.node) return undefined;

    if (
      node.kind === SyntaxKind.ModelExpression ||
      node.kind === SyntaxKind.IntersectionExpression ||
      node.kind === SyntaxKind.UnionExpression
    ) {
      let parent: Node | undefined = node.parent;
      while (parent !== undefined) {
        if (
          parent.kind === SyntaxKind.AliasStatement ||
          parent.kind === SyntaxKind.ModelStatement ||
          parent.kind === SyntaxKind.ScalarStatement ||
          parent.kind === SyntaxKind.OperationStatement ||
          parent.kind === SyntaxKind.EnumStatement ||
          parent.kind === SyntaxKind.InterfaceStatement ||
          parent.kind === SyntaxKind.UnionStatement ||
          parent.kind === SyntaxKind.ModelExpression ||
          parent.kind === SyntaxKind.IntersectionExpression ||
          parent.kind === SyntaxKind.UnionExpression
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
          x.kind === SyntaxKind.NamespaceStatement || x.kind === SyntaxKind.JsNamespaceDeclaration,
      );
      compilerAssert(namespaceNode, "Can't find namespace declaration node.", node);
      symbolLinks.type = initializeTypeForNamespace(namespaceNode);
    }

    return symbolLinks.type as Namespace;
  }

  function checkOperation(
    ctx: CheckContext,
    node: OperationStatementNode,
    parentInterface?: Interface,
  ): Operation {
    const inInterface = node.parent?.kind === SyntaxKind.InterfaceStatement;
    const symbol = inInterface ? getSymbolForMember(node) : node.symbol;
    const links = symbol && getSymbolLinks(symbol);

    if (links) {
      if (links.declaredType && ctx.mapper === undefined) {
        // we're not instantiating this operation and we've already checked it
        return links.declaredType as Operation;
      }
    }

    if (ctx.mapper === undefined && inInterface) {
      compilerAssert(
        parentInterface,
        "Operation in interface should already have been checked.",
        node.parent,
      );
    }
    checkTemplateDeclaration(ctx, node);

    // If we are instantating operation inside of interface
    if (isTemplatedNode(node) && ctx.mapper !== undefined && parentInterface) {
      ctx = ctx.withMapper({ ...ctx.mapper, partial: true });
    }

    if ((ctx.mapper === undefined || ctx.mapper.partial) && node.templateParameters.length > 0) {
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;

    const { resolvedSymbol: parameterModelSym } = resolver.resolveMetaMemberByName(
      symbol!,
      "parameters",
    );

    if (parameterModelSym?.members) {
      const members = resolver.getAugmentedSymbolTable(parameterModelSym.members);
      const paramDocs = extractParamDocs(node);
      for (const [name, memberSym] of members) {
        const doc = paramDocs.get(name);
        if (doc) {
          docFromCommentForSym.set(memberSym, doc);
        }
      }
    }

    const operationType: Operation = createType({
      kind: "Operation",
      name,
      namespace,
      parameters: null as any,
      returnType: voidType,
      node,
      decorators: [],
      interface: parentInterface,
    });
    if (links) {
      linkType(ctx, links, operationType);
    }

    const parent = node.parent!;

    function finishOperation() {
      operationType.parameters.namespace = namespace;

      operationType.decorators.push(...checkDecorators(ctx, operationType, node));

      return finishType(operationType, {
        skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration),
      });
    }
    // Is this a definition or reference?
    if (node.signature.kind === SyntaxKind.OperationSignatureReference) {
      // Attempt to resolve the operation
      const baseOperation = checkOperationIs(ctx, node, node.signature.baseOperation);
      if (baseOperation) {
        ensureResolved([baseOperation], operationType, () => {
          operationType.sourceOperation = baseOperation;
          // Reference the same return type and create the parameters type
          const clone = initializeClone(baseOperation.parameters, {
            properties: createRekeyableMap(),
          });

          clone.properties = createRekeyableMap(
            Array.from(baseOperation.parameters.properties.entries()).map(([key, prop]) => [
              key,
              cloneTypeForSymbol(getMemberSymbol(parameterModelSym!, prop.name)!, prop, {
                model: clone,
                sourceProperty: prop,
              }),
            ]),
          );
          operationType.parameters = finishType(clone);
          operationType.returnType = baseOperation.returnType;

          // Copy decorators from the base operation, inserting the base decorators first
          operationType.decorators.push(...baseOperation.decorators);
          finishOperation();
        });
      } else {
        // If we can't resolve the signature we return an empty model.
        operationType.parameters = initModel();
        operationType.returnType = voidType;
        finishOperation();
      }
    } else {
      operationType.parameters = getTypeForNode(node.signature.parameters, ctx) as Model;
      operationType.returnType = getTypeForNode(node.signature.returnType, ctx);
      ensureResolved([operationType.parameters], operationType, () => {
        finishOperation();
      });
    }

    linkMapper(operationType, ctx.mapper);
    if (parent.kind !== SyntaxKind.InterfaceStatement && ctx.mapper === undefined) {
      namespace?.operations.set(name, operationType);
    }

    return operationType;
  }

  function checkOperationIs(
    ctx: CheckContext,
    operation: OperationStatementNode,
    opReference: TypeReferenceNode | undefined,
  ): Operation | undefined {
    if (!opReference) return undefined;
    // Ensure that we don't end up with a circular reference to the same operation
    const opSymId = getNodeSym(operation);
    if (opSymId) {
      pendingResolutions.start(opSymId, ResolutionKind.BaseType);
    }

    const target = resolver.getNodeLinks(opReference).resolvedSymbol;

    // Did we encounter a circular operation reference?
    if (target && pendingResolutions.has(target, ResolutionKind.BaseType)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-op-signature",
            format: { typeName: target.name },
            target: opReference,
          }),
        );
      }

      return undefined;
    }

    // Resolve the base operation type
    const baseOperation = getTypeForNode(opReference, ctx);
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

  function getGlobalNamespaceNode(): NamespaceStatementNode {
    return resolver.symbols.global.declarations[0] as any;
  }

  function checkTupleExpression(ctx: CheckContext, node: TupleExpressionNode): Tuple {
    return createAndFinishType({
      kind: "Tuple",
      node: node,
      values: node.values.map((v) => getTypeForNode(v, ctx)),
    });
  }

  function getSymbolLinks(s: Sym): SymbolLinks {
    return resolver.getSymbolLinks(s);
  }

  function resolveRelatedSymbols(id: IdentifierNode, mapper?: TypeMapper): Sym[] | undefined {
    const ctx = CheckContext.from(mapper);
    let sym: Sym | undefined;
    const { node, kind } = getIdentifierContext(id);

    switch (kind) {
      case IdentifierKind.ModelExpressionProperty:
      case IdentifierKind.ObjectLiteralProperty:
        const model = getReferencedModel(node as ModelPropertyNode | ObjectLiteralPropertyNode);
        return model
          .map((m) => getMemberSymbol(m.node!.symbol, id.sv))
          .filter((m): m is Sym => m !== undefined);
      case IdentifierKind.ModelStatementProperty:
      case IdentifierKind.Declaration:
        const links = resolver.getNodeLinks(id);
        return links.resolvedSymbol === undefined ? undefined : [links.resolvedSymbol];
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
        sym = resolveTypeReferenceSym(ctx, ref, resolveDecorator);
        break;
      case IdentifierKind.TemplateArgument:
        const templates = getTemplateDeclarationsForArgument(ctx, node as TemplateArgumentNode);

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

    if (sym) {
      if (sym.symbolSource) {
        return [sym.symbolSource];
      } else {
        return [sym];
      }
    }
    return undefined; //sym?.symbolSource ?? sym;
  }

  function getTemplateDeclarationsForArgument(ctx: CheckContext, node: TemplateArgumentNode) {
    const ref = node.parent as TypeReferenceNode;
    let resolved = resolveTypeReferenceSym(ctx, ref, false);
    // if the reference type can't be resolved and has parse error,
    // it likely means the reference type hasn't been completed yet. i.e. Foo<string,
    // so try to resolve it by it's target directly to see if we can find its sym
    if (!resolved && hasParseError(ref) && ref.target !== undefined) {
      resolved = resolveTypeReferenceSym(ctx, ref.target, false);
    }
    return (resolved?.declarations.filter((n) => isTemplatedNode(n)) ?? []) as TemplateableNode[];
  }

  function getReferencedModel(
    propertyNode: ObjectLiteralPropertyNode | ModelPropertyNode,
  ): Model[] {
    type ModelOrArrayValueNode = ArrayLiteralNode | ObjectLiteralNode;
    type ModelOrArrayTypeNode = ModelExpressionNode | TupleExpressionNode;
    type ModelOrArrayNode = ModelOrArrayValueNode | ModelOrArrayTypeNode;
    type PathSeg = { propertyName?: string; tupleIndex?: number };
    const isModelOrArrayValue = (n: Node | undefined) =>
      n?.kind === SyntaxKind.ArrayLiteral || n?.kind === SyntaxKind.ObjectLiteral;
    const isModelOrArrayType = (n: Node | undefined) =>
      n?.kind === SyntaxKind.ModelExpression || n?.kind === SyntaxKind.TupleExpression;
    const isModelOrArray = (n: Node | undefined) => isModelOrArrayValue(n) || isModelOrArrayType(n);

    const path: PathSeg[] = [];
    let preNode: Node | undefined;
    const foundNode = getFirstAncestor(propertyNode, (n) => {
      pushToModelPath(n, preNode, path);
      preNode = n;
      return (
        (isModelOrArray(n) &&
          (n.parent?.kind === SyntaxKind.TemplateParameterDeclaration ||
            n.parent?.kind === SyntaxKind.TemplateArgument ||
            n.parent?.kind === SyntaxKind.DecoratorExpression)) ||
        (isModelOrArrayValue(n) &&
          (n.parent?.kind === SyntaxKind.CallExpression ||
            n.parent?.kind === SyntaxKind.ConstStatement))
      );
    });

    let refType: Type | undefined;
    switch (foundNode?.parent?.kind) {
      case SyntaxKind.TemplateParameterDeclaration:
      case SyntaxKind.TemplateArgument:
        refType = getReferencedTypeFromTemplateDeclaration(foundNode as ModelOrArrayNode);
        break;
      case SyntaxKind.DecoratorExpression:
        refType = getReferencedTypeFromDecoratorArgument(foundNode as ModelOrArrayNode);
        break;
      case SyntaxKind.CallExpression:
        refType = getReferencedTypeFromScalarConstructor(foundNode as ModelOrArrayValueNode);
        break;
      case SyntaxKind.ConstStatement:
        refType = getReferencedTypeFromConstAssignment(foundNode as ModelOrArrayValueNode);
        break;
    }

    return getNestedModel(refType, path);

    function pushToModelPath(node: Node, preNode: Node | undefined, path: PathSeg[]) {
      if (node.kind === SyntaxKind.ArrayLiteral || node.kind === SyntaxKind.TupleExpression) {
        const index = node.values.findIndex((n) => n === preNode);
        if (index >= 0) {
          path.unshift({ tupleIndex: index });
        } else {
          compilerAssert(false, "not expected, can't find child from the parent?");
        }
      }
      if (
        node.kind === SyntaxKind.ModelProperty ||
        node.kind === SyntaxKind.ObjectLiteralProperty
      ) {
        path.unshift({ propertyName: node.id.sv });
      }
    }

    function getNestedModel(modelOrTupleOrUnion: Type | undefined, path: PathSeg[]): Model[] {
      let cur = modelOrTupleOrUnion;

      if (cur && cur.kind !== "Model" && cur.kind !== "Tuple" && cur.kind !== "Union") {
        return [];
      }

      if (path.length === 0) {
        // Handle union and model type nesting when path is empty
        switch (cur?.kind) {
          case "Model":
            return [cur];
          case "Union":
            const models: Model[] = [];
            for (const variant of cur.variants.values()) {
              if (
                variant.type.kind === "Model" ||
                variant.type.kind === "Tuple" ||
                variant.type.kind === "Union"
              ) {
                models.push(...(getNestedModel(variant.type, path) ?? []));
              }
            }
            return models;
          default:
            return [];
        }
      }

      const seg = path[0];
      switch (cur?.kind) {
        case "Tuple":
          if (
            seg.tupleIndex !== undefined &&
            seg.tupleIndex >= 0 &&
            seg.tupleIndex < cur.values.length
          ) {
            return getNestedModel(cur.values[seg.tupleIndex], path.slice(1));
          } else {
            return [];
          }

        case "Model":
          if (cur.name === "Array" && seg.tupleIndex !== undefined) {
            cur = cur.templateMapper?.args[0] as Model;
          } else if (cur.name !== "Array" && seg.propertyName) {
            cur = cur.properties.get(seg.propertyName)?.type;
          } else {
            return [];
          }
          return getNestedModel(cur, path.slice(1));

        case "Union":
          // When seg.property name exists, it means that it is in the union model or tuple,
          // and the corresponding model or tuple needs to be found recursively.
          const models: Model[] = [];
          for (const variant of cur.variants.values()) {
            if (
              variant.type.kind === "Model" ||
              variant.type.kind === "Tuple" ||
              variant.type.kind === "Union"
            ) {
              models.push(...(getNestedModel(variant.type, path) ?? []));
            }
          }
          return models;
        default:
          return [];
      }
    }

    function getReferencedTypeFromTemplateDeclaration(node: ModelOrArrayNode): Type | undefined {
      let templateParmaeterDeclNode: TemplateParameterDeclarationNode | undefined = undefined;
      if (
        node?.parent?.kind === SyntaxKind.TemplateArgument &&
        node?.parent?.parent?.kind === SyntaxKind.TypeReference
      ) {
        const argNode = node.parent;
        const refNode = node.parent.parent;
        const decl = getTemplateDeclarationsForArgument(
          // We should be giving the argument so the mapper here should be undefined
          CheckContext.DEFAULT,
          argNode,
        );

        const index = refNode.arguments.findIndex((n) => n === argNode);
        if (decl.length > 0 && decl[0].templateParameters.length > index) {
          templateParmaeterDeclNode = decl[0].templateParameters[index];
        }
      } else if (node.parent?.kind === SyntaxKind.TemplateParameterDeclaration) {
        templateParmaeterDeclNode = node?.parent;
      }

      if (
        templateParmaeterDeclNode?.kind !== SyntaxKind.TemplateParameterDeclaration ||
        !templateParmaeterDeclNode.constraint
      ) {
        return undefined;
      }

      let constraintType: Type | undefined;
      if (
        isModelOrArrayValue(node) &&
        templateParmaeterDeclNode.constraint.kind === SyntaxKind.ValueOfExpression
      ) {
        constraintType = program.checker.getTypeForNode(
          templateParmaeterDeclNode.constraint.target,
        );
      } else if (
        isModelOrArrayType(node) &&
        templateParmaeterDeclNode.constraint.kind !== SyntaxKind.ValueOfExpression
      ) {
        constraintType = program.checker.getTypeForNode(templateParmaeterDeclNode.constraint);
      }

      return constraintType;
    }

    function getReferencedTypeFromScalarConstructor(
      argNode: ModelOrArrayValueNode,
    ): Type | undefined {
      const callExpNode = argNode?.parent;
      if (callExpNode?.kind !== SyntaxKind.CallExpression) {
        return undefined;
      }

      const ctorType = checkCallExpressionTarget(CheckContext.DEFAULT, callExpNode);

      if (ctorType?.kind !== "ScalarConstructor") {
        return undefined;
      }

      const argIndex = callExpNode.arguments.findIndex((n) => n === argNode);
      if (argIndex < 0 || argIndex >= ctorType.parameters.length) {
        return undefined;
      }
      const arg = ctorType.parameters[argIndex];

      return arg.type;
    }

    function getReferencedTypeFromConstAssignment(
      valueNode: ModelOrArrayValueNode,
    ): Type | undefined {
      const constNode = valueNode?.parent;
      if (
        !constNode ||
        constNode.kind !== SyntaxKind.ConstStatement ||
        !constNode.type ||
        constNode.value !== valueNode
      ) {
        return undefined;
      }

      return program.checker.getTypeForNode(constNode.type);
    }

    function getReferencedTypeFromDecoratorArgument(
      decArgNode: ModelOrArrayNode,
    ): Type | undefined {
      const decNode = decArgNode?.parent;
      if (decNode?.kind !== SyntaxKind.DecoratorExpression) {
        return undefined;
      }

      const decSym = program.checker.resolveRelatedSymbols(
        decNode.target.kind === SyntaxKind.MemberExpression ? decNode.target.id : decNode.target,
      );
      if (!decSym || decSym.length <= 0) {
        return undefined;
      }

      const decDecl: DecoratorDeclarationStatementNode | undefined = decSym[0].declarations.find(
        (x): x is DecoratorDeclarationStatementNode =>
          x.kind === SyntaxKind.DecoratorDeclarationStatement,
      );
      if (!decDecl) {
        return undefined;
      }

      const decType = program.checker.getTypeForNode(decDecl);
      compilerAssert(decType.kind === "Decorator", "Expected type to be a Decorator.");

      const argIndex = decNode.arguments.findIndex((n) => n === decArgNode);
      if (argIndex < 0 || argIndex >= decType.parameters.length) {
        return undefined;
      }
      const decArg = decType.parameters[argIndex];

      let type: Type | undefined;
      if (isModelOrArrayValue(decArgNode)) {
        type = decArg.type.valueType;
      } else if (isModelOrArrayType(decArgNode)) {
        type = decArg.type.type ?? decArg.type.valueType;
      } else {
        compilerAssert(
          false,
          "not expected node type to get reference model from decorator argument",
        );
      }
      return type;
    }
  }

  function resolveCompletions(identifier: IdentifierNode): Map<string, TypeSpecCompletionItem> {
    const completions = new Map<string, TypeSpecCompletionItem>();
    const { kind, node: ancestor } = getIdentifierContext(identifier);

    switch (kind) {
      case IdentifierKind.Using:
      case IdentifierKind.Decorator:
      case IdentifierKind.Function:
      case IdentifierKind.TypeReference:
      case IdentifierKind.ModelExpressionProperty:
      case IdentifierKind.ModelStatementProperty:
      case IdentifierKind.ObjectLiteralProperty:
        break; // supported
      case IdentifierKind.Other:
        return completions; // not implemented
      case IdentifierKind.Declaration:
        return completions; // cannot complete, name can be chosen arbitrarily
      case IdentifierKind.TemplateArgument: {
        const templates = getTemplateDeclarationsForArgument(
          CheckContext.DEFAULT,
          ancestor as TemplateArgumentNode,
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

    if (kind === IdentifierKind.ModelStatementProperty) {
      const model = ancestor.parent as ModelStatementNode;
      const modelType = program.checker.getTypeForNode(model) as Model;
      const baseType = modelType.baseModel;
      const baseNode = baseType?.node;
      if (!baseNode) {
        return completions;
      }
      for (const prop of baseType.properties.values()) {
        if (identifier.sv === prop.name || !modelType.properties.has(prop.name)) {
          const sym = getMemberSymbol(baseNode.symbol, prop.name);
          if (sym) {
            addCompletion(prop.name, sym);
          }
        }
      }
    } else if (
      kind === IdentifierKind.ModelExpressionProperty ||
      kind === IdentifierKind.ObjectLiteralProperty
    ) {
      const model = getReferencedModel(ancestor as ModelPropertyNode | ObjectLiteralPropertyNode);
      if (model.length <= 0) {
        return completions;
      }
      const curModelNode = ancestor.parent as ModelExpressionNode | ObjectLiteralNode;
      for (const curModel of model) {
        for (const prop of walkPropertiesInherited(curModel)) {
          if (
            identifier.sv === prop.name ||
            !curModelNode.properties.find(
              (p) =>
                (p.kind === SyntaxKind.ModelProperty ||
                  p.kind === SyntaxKind.ObjectLiteralProperty) &&
                p.id.sv === prop.name,
            )
          ) {
            const sym = getMemberSymbol(curModel.node!.symbol, prop.name);
            if (sym) {
              addCompletion(prop.name, sym);
            }
          }
        }
      }
    } else if (identifier.parent && identifier.parent.kind === SyntaxKind.MemberExpression) {
      let base = resolver.getNodeLinks(identifier.parent.base).resolvedSymbol;

      if (base) {
        if (base.flags & SymbolFlags.Alias) {
          base = getAliasedSymbol(CheckContext.DEFAULT, base);
        }

        if (base) {
          if (identifier.parent.selector === "::") {
            if (base?.node === undefined && base?.declarations && base.declarations.length > 0) {
              // Process meta properties separately, such as `::parameters`, `::returnType`
              const nodeModels = base?.declarations[0];
              if (nodeModels.kind === SyntaxKind.OperationStatement) {
                const operation = nodeModels as OperationStatementNode;
                addCompletion("parameters", operation.symbol);
                addCompletion("returnType", operation.symbol);
              }
            } else if (base?.node?.kind === SyntaxKind.ModelProperty) {
              // Process meta properties separately, such as `::type`
              const metaProperty = base.node as ModelPropertyNode;
              addCompletion("type", metaProperty.symbol);
            }
          } else {
            addCompletions(base.exports ?? base.members);
          }
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
          CheckContext.DEFAULT,
          ancestor.parent as TemplateArgumentNode,
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
        addCompletions(resolver.symbols.global.exports);

        // check "global scope" usings
        addCompletions(scope.locals);
      }
    }

    return completions;

    function addCompletions(table: SymbolTable | undefined) {
      if (!table) {
        return;
      }

      table = resolver.getAugmentedSymbolTable(table);
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
        case IdentifierKind.ModelExpressionProperty:
        case IdentifierKind.ModelStatementProperty:
        case IdentifierKind.ObjectLiteralProperty:
          return !!(sym.flags & SymbolFlags.Member);
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

  function getCodefixesForUnknownIdentifier(node: IdentifierNode): CodeFix[] | undefined {
    switch (node.sv) {
      case "number":
        return [createChangeIdentifierCodeFix(node, "float64")];
      default:
        return undefined;
    }
  }

  function resolveTypeReferenceSym(
    ctx: CheckContext,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    options?: Partial<SymbolResolutionOptions> | boolean,
  ): Sym | undefined {
    const resolvedOptions: SymbolResolutionOptions =
      typeof options === "boolean"
        ? { ...defaultSymbolResolutionOptions, resolveDecorators: options }
        : { ...defaultSymbolResolutionOptions, ...(options ?? {}) };
    if (
      ctx.mapper === undefined &&
      !resolvedOptions.resolveDeclarationOfTemplate &&
      referenceSymCache.has(node)
    ) {
      return referenceSymCache.get(node);
    }
    const sym = resolveTypeReferenceSymInternal(ctx, node, resolvedOptions);
    if (!resolvedOptions.resolveDeclarationOfTemplate) {
      referenceSymCache.set(node, sym);
    }
    return sym;
  }

  function resolveTypeReferenceSymInternal(
    ctx: CheckContext,
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    options: SymbolResolutionOptions,
  ): Sym | undefined {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReferenceSym(ctx, node.target, options);
    } else if (node.kind === SyntaxKind.Identifier) {
      const links = resolver.getNodeLinks(node);
      if (ctx.mapper === undefined && links.resolutionResult) {
        if (
          ctx.mapper === undefined && // do not report error when instantiating
          links.resolutionResult & (ResolutionResultFlags.NotFound | ResolutionResultFlags.Unknown)
        ) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "invalid-ref",
              messageId: options.resolveDecorators ? "decorator" : "identifier",
              format: { id: printTypeReferenceNode(node) },
              target: node,
              codefixes: getCodefixesForUnknownIdentifier(node),
            }),
          );
        } else if (links.resolutionResult & ResolutionResultFlags.Ambiguous) {
          reportAmbiguousIdentifier(node, links.ambiguousSymbols!);
        }
      }

      const sym = links.resolvedSymbol;
      return sym?.symbolSource ?? sym;
    } else if (node.kind === SyntaxKind.MemberExpression) {
      let base = resolveTypeReferenceSym(ctx, node.base, {
        ...options,
        resolveDecorators: false, // when resolving decorator the base cannot also be one
      });

      if (!base) {
        return undefined;
      }

      // when resolving a type reference based on an alias, unwrap the alias.
      if (base.flags & SymbolFlags.Alias) {
        if (!options.resolveDeclarationOfTemplate && isTemplatedNode(getSymNode(base))) {
          // This is a bare identifier reference to a templated alias, so we need to actually check this type.
          const ty = checkTypeReferenceSymbol(
            ctx.withMapper(undefined),
            base,
            node.base,
            /* instantiateTemplates */ true,
          );
          base = lateBindContainer(ty, base);

          if (base?.members) {
            switch (ty.kind) {
              case "Model":
              case "Union":
              case "Interface":
              case "Enum":
              case "Scalar":
                lateBindMembers(ty);
            }
          }

          if (!base) return undefined;
        } else {
          const aliasedSym = getAliasedSymbol(ctx, base);
          if (!aliasedSym) {
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
              }),
            );
            return undefined;
          }
          base = aliasedSym;
        }
      } else if (!options.resolveDeclarationOfTemplate && isTemplatedNode(getSymNode(base))) {
        const baseSym = getContainerTemplateSymbol(ctx, base, node.base);
        if (!baseSym) {
          return undefined;
        }
        base = baseSym;
      }
      return resolveMemberInContainer(base, node, options);
    }

    compilerAssert(false, `Unknown type reference kind "${SyntaxKind[(node as any).kind]}"`, node);
  }

  function reportAmbiguousIdentifier(node: IdentifierNode, symbols: Sym[]) {
    const duplicateNames = symbols.map((s) =>
      getFullyQualifiedSymbolName(s, { useGlobalPrefixAtTopLevel: true }),
    );
    program.reportDiagnostic(
      createDiagnostic({
        code: "ambiguous-symbol",
        format: { name: node.sv, duplicateNames: duplicateNames.join(", ") },
        target: node,
      }),
    );
  }

  function resolveMemberInContainer(
    base: Sym,
    node: MemberExpressionNode,
    options: SymbolResolutionOptions,
  ) {
    const { finalSymbol: sym, resolvedSymbol: nextSym } = resolver.resolveMemberExpressionForSym(
      base,
      node,
      options,
    );
    const symbol = nextSym ?? sym;
    if (symbol) {
      return symbol;
    }

    if (base.flags & SymbolFlags.Namespace) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: "underNamespace",
          format: {
            namespace: getFullyQualifiedSymbolName(base),
            id: node.id.sv,
          },
          target: node,
        }),
      );
    } else if (base.flags & SymbolFlags.Decorator) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: "inDecorator",
          format: { id: node.id.sv },
          target: node,
        }),
      );
    } else if (base.flags & SymbolFlags.Function) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: "node",
          format: { id: node.id.sv, nodeName: "function" },
          target: node,
        }),
      );
    } else if (base.flags & SymbolFlags.MemberContainer) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: node.selector === "." ? "member" : "metaProperty",
          format: { kind: getMemberKindName(getSymNode(base)), id: node.id.sv },
          target: node,
        }),
      );
    } else {
      const symNode = getSymNode(base);
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-ref",
          messageId: "node",
          format: {
            id: node.id.sv,
            nodeName: symNode ? SyntaxKind[symNode.kind] : "Unknown node",
          },
          target: node,
        }),
      );
    }
    return undefined;
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
  function getAliasedSymbol(ctx: CheckContext, aliasSymbol: Sym): Sym | undefined {
    const node = getSymNode(aliasSymbol);
    const links = resolver.getSymbolLinks(aliasSymbol);
    if (!links.aliasResolutionIsTemplate) {
      return links.aliasedSymbol ?? resolver.getNodeLinks(node).resolvedSymbol;
    }

    // Otherwise for templates we need to get the type and retrieve the late bound symbol.
    const aliasType = getTypeForNode(node as AliasStatementNode, ctx);
    return lateBindContainer(aliasType, aliasSymbol);
  }

  /** Check case where a template type member is referenced like
   * ```
   * model Foo<T> {t: T}
   * model Test { t: Foo.t } // check `Foo` is correctly used as template
   * ```
   */
  function getContainerTemplateSymbol(
    ctx: CheckContext,
    sym: Sym,
    node: MemberExpressionNode | IdentifierNode,
  ): Sym | undefined {
    if (pendingResolutions.has(sym, ResolutionKind.Type)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-alias-type",
            format: { typeName: sym.name },
            target: node,
          }),
        );
      }
      return undefined;
    }

    pendingResolutions.start(sym, ResolutionKind.Type);
    const type = checkTypeReferenceSymbol(ctx, sym, node);
    pendingResolutions.finish(sym, ResolutionKind.Type);

    return lateBindContainer(type, sym);
  }

  function lateBindContainer(type: Type, sym: Sym) {
    if (isErrorType(type)) {
      return undefined;
    }
    switch (type.kind) {
      case "Model":
      case "Interface":
      case "Union":
        if (isTemplateInstance(type)) {
          // this is an alias for some instantiation, so late-bind the instantiation
          lateBindMemberContainer(type);
          return type.symbol!;
        }
      // fallthrough
      default:
        // get the symbol from the node aliased type's node, or just return the base
        // if it doesn't have a symbol (which will likely result in an error later on)
        return getMergedSymbol(type.node!.symbol) ?? sym;
    }
  }

  function checkStringTemplateExpresion(
    ctx: CheckContext,
    node: StringTemplateExpressionNode,
  ): IndeterminateEntity | StringValue | null {
    let hasType = false;
    let hasValue = false;
    const spanTypeOrValues = node.spans.map(
      (span) => [span, checkNode(ctx, span.expression)] as const,
    );
    for (const [_, typeOrValue] of spanTypeOrValues) {
      if (typeOrValue !== null) {
        if (isValue(typeOrValue)) {
          hasValue = true;
        } else if ("kind" in typeOrValue && typeOrValue.kind === "TemplateParameter") {
          if (typeOrValue.constraint) {
            if (typeOrValue.constraint.valueType) {
              hasValue = true;
            }
            if (typeOrValue.constraint.type) {
              hasType = true;
            }
          } else {
            hasType = true;
          }
        } else {
          hasType = true;
        }
      }
    }

    if (hasType && hasValue) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "mixed-string-template",
          target: node,
        }),
      );
      return null;
    }

    if (hasValue) {
      let str = node.head.value;
      for (const [span, typeOrValue] of spanTypeOrValues) {
        if (
          typeOrValue !== null &&
          (!("kind" in typeOrValue) || typeOrValue.kind !== "TemplateParameter")
        ) {
          compilerAssert(typeOrValue !== null && isValue(typeOrValue), "Expected value.");
          str += stringifyValueForTemplate(typeOrValue);
        }
        str += span.literal.value;
      }
      return checkStringValue(createLiteralType(str), undefined, node);
    } else {
      let hasNonStringElement = false;
      let stringValue = node.head.value;

      const spans: StringTemplateSpan[] = [createTemplateSpanLiteral(node.head)];

      for (const [span, typeOrValue] of spanTypeOrValues) {
        compilerAssert(typeOrValue !== null && !isValue(typeOrValue), "Expected type.");

        const type = typeOrValue.entityKind === "Indeterminate" ? typeOrValue.type : typeOrValue;
        const spanValue = createTemplateSpanValue(span.expression, type);
        spans.push(spanValue);
        const spanValueAsString = stringifyTypeForTemplate(type);
        if (spanValueAsString !== undefined) {
          stringValue += spanValueAsString;
        } else {
          hasNonStringElement = true;
        }

        spans.push(createTemplateSpanLiteral(span.literal));
        stringValue += span.literal.value;
      }
      return createIndeterminateEntity(
        createType({
          kind: "StringTemplate",
          node,
          spans,
          stringValue: hasNonStringElement ? undefined : stringValue,
        }),
      );
    }
  }

  function createIndeterminateEntity(type: IndeterminateEntity["type"]): IndeterminateEntity {
    const existing = indeterminateEntities.get(type);
    if (existing) {
      return existing;
    }
    const entity: IndeterminateEntity = {
      entityKind: "Indeterminate",
      type,
    };

    indeterminateEntities.set(type, entity);
    return entity;
  }
  function stringifyTypeForTemplate(type: Type): string | undefined {
    switch (type.kind) {
      case "String":
      case "Number":
      case "Boolean":
        return String(type.value);
      case "StringTemplate":
        if (type.stringValue !== undefined) {
          return type.stringValue;
        }
        return undefined;
      default:
        return undefined;
    }
  }
  function stringifyValueForTemplate(value: Value): string {
    switch (value.valueKind) {
      case "StringValue":
      case "NumericValue":
      case "BooleanValue":
        return value.value.toString();
      default:
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "non-literal-string-template",
            target: value,
          }),
        );
        return `[${value.valueKind}]`;
    }
  }

  function createTemplateSpanLiteral(
    node: StringTemplateHeadNode | StringTemplateMiddleNode | StringTemplateTailNode,
  ): StringTemplateSpanLiteral {
    return createType({
      kind: "StringTemplateSpan",
      node: node,
      isInterpolated: false,
      type: getLiteralType(node),
    });
  }

  function createTemplateSpanValue(node: Expression, type: Type): StringTemplateSpanValue {
    return createType({
      kind: "StringTemplateSpan",
      node: node,
      isInterpolated: true,
      type: type,
    });
  }

  function checkStringLiteral(str: StringLiteralNode): IndeterminateEntity {
    return createIndeterminateEntity(getLiteralType(str));
  }

  function checkNumericLiteral(num: NumericLiteralNode): IndeterminateEntity {
    return createIndeterminateEntity(getLiteralType(num));
  }

  function checkBooleanLiteral(bool: BooleanLiteralNode): IndeterminateEntity {
    return createIndeterminateEntity(getLiteralType(bool));
  }

  function checkProgram() {
    checkDuplicateSymbols();
    for (const file of program.sourceFiles.values()) {
      checkDuplicateUsings(file);
      for (const ns of file.namespaces) {
        initializeTypeForNamespace(ns);
      }
    }

    for (const file of program.sourceFiles.values()) {
      checkSourceFile(file);
    }

    internalDecoratorValidation();
    assertNoPendingResolutions();
    runPostValidators(postCheckValidators);
  }

  function assertNoPendingResolutions() {
    if (waitingForResolution.size === 0) {
      return;
    }

    const message = [
      "Unexpected pending resolutions found",
      ...[...waitingForResolution.entries()].flatMap(([type, items]) => {
        const base = `  (${type.kind}) ${getTypeName(type)} => `;
        return items.map(
          ([item], index) => `${index === 0 ? base : " ".repeat(base.length)}${getTypeName(item)}`,
        );
      }),
    ].join("\n");
    compilerAssert(false, message);
  }

  function checkDuplicateSymbols() {
    program.reportDuplicateSymbols(resolver.symbols.global.exports);
    for (const file of program.sourceFiles.values()) {
      for (const ns of file.namespaces) {
        const exports = getMergedSymbol(ns.symbol).exports ?? ns.symbol.exports;
        program.reportDuplicateSymbols(exports);
      }
    }
  }

  /** Report error with duplicate using in the same scope. */
  function checkDuplicateUsings(file: TypeSpecScriptNode) {
    const duplicateTrackers = new Map<Sym, DuplicateTracker<Sym, UsingStatementNode>>();
    function getTracker(sym: Sym): DuplicateTracker<Sym, UsingStatementNode> {
      const existing = duplicateTrackers.get(sym);

      if (existing) return existing;

      const newTacker = new DuplicateTracker<Sym, UsingStatementNode>();
      duplicateTrackers.set(sym, newTacker);
      return newTacker;
    }

    for (const using of file.usings) {
      const ns = using.parent!;
      const sym = getMergedSymbol(ns.symbol);
      const tracker = getTracker(sym);
      const targetSym = resolver.getNodeLinks(using.name).resolvedSymbol;
      if (!targetSym) continue;

      tracker.track(targetSym, using);
    }

    for (const tracker of duplicateTrackers.values()) {
      for (const [_, nodes] of tracker.entries()) {
        for (const node of nodes) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "duplicate-using",
              format: { usingName: typeReferenceToString(node.name) },
              target: node,
            }),
          );
        }
      }
    }
  }
  /**
   * Post checking validation for internal decorators.
   */
  function internalDecoratorValidation() {
    validateInheritanceDiscriminatedUnions(program);
  }

  function checkSourceFile(file: TypeSpecScriptNode) {
    for (const statement of file.statements) {
      checkNode(CheckContext.DEFAULT, statement, undefined);
    }
  }

  /**
   * Check that the given node template parameters are valid if applicable.
   * @param node Node with template parameters
   * @param mapper Type mapper, set if instantiating the template, undefined otherwise.
   */
  function checkTemplateDeclaration(ctx: CheckContext, node: TemplateableNode) {
    // If mapper is undefined it means we are checking the declaration of the template.
    if (ctx.mapper === undefined) {
      for (const templateParameter of node.templateParameters) {
        checkTemplateParameterDeclaration(ctx, templateParameter);
      }
    }
  }

  function checkModel(ctx: CheckContext, node: ModelExpressionNode | ModelStatementNode): Model {
    if (node.kind === SyntaxKind.ModelStatement) {
      return checkModelStatement(ctx, node);
    } else {
      return checkModelExpression(ctx, node);
    }
  }

  function checkModelStatement(ctx: CheckContext, node: ModelStatementNode): Model {
    const links = getSymbolLinks(node.symbol);

    if (ctx.mapper === undefined && node.templateParameters.length > 0) {
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }
    checkTemplateDeclaration(ctx, node);

    const decorators: DecoratorApplication[] = [];
    const type: Model = createType({
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties: createRekeyableMap<string, ModelProperty>(),
      namespace: getParentNamespaceType(node),
      decorators,
      sourceModels: [],
      derivedModels: [],
    });
    linkType(ctx, links, type);

    if (node.symbol.members) {
      const members = resolver.getAugmentedSymbolTable(node.symbol.members);
      const propDocs = extractPropDocs(node);
      for (const [name, memberSym] of members) {
        const doc = propDocs.get(name);
        if (doc) {
          docFromCommentForSym.set(memberSym, doc);
        }
      }
    }

    const isBase = checkModelIs(ctx, node, node.is);
    ensureResolved(
      [
        isBase,
        ...node.properties
          .filter((x) => x.kind === SyntaxKind.ModelSpreadProperty)
          .map((x) => checkSpreadTarget(ctx, node, x.target)),
      ],
      type,
      () => {
        if (isBase) {
          type.sourceModel = isBase;
          type.sourceModels.push({ usage: "is", model: isBase, node: node.is });
          decorators.push(...isBase.decorators);
          if (isBase.indexer) {
            type.indexer = isBase.indexer;
          }

          for (const prop of isBase.properties.values()) {
            const memberSym = getMemberSymbol(node.symbol, prop.name)!;
            const newProp = cloneTypeForSymbol(memberSym, prop, {
              sourceProperty: prop,
              model: type,
            });
            linkIndirectMember(ctx, node, newProp);
            type.properties.set(prop.name, newProp);
          }
        }

        if (isBase) {
          type.baseModel = isBase.baseModel;
        } else if (node.extends) {
          type.baseModel = checkClassHeritage(ctx, node, node.extends);
          if (type.baseModel) {
            copyDeprecation(type.baseModel, type);
          }
        }

        if (type.baseModel) {
          type.baseModel.derivedModels.push(type);
        }

        // Hold on to the model type that's being defined so that it
        // can be referenced
        if (ctx.mapper === undefined) {
          type.namespace?.models.set(type.name, type);
        }

        // Evaluate the properties after
        checkModelProperties(ctx, node, type.properties, type);

        decorators.push(...checkDecorators(ctx, type, node));

        linkMapper(type, ctx.mapper);
        finishType(type, { skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration) });

        lateBindMemberContainer(type);
        lateBindMembers(type);

        const indexer = getIndexer(program, type);
        if (type.name === "Array" && isInTypeSpecNamespace(type)) {
          stdTypes.Array = type;
        } else if (type.name === "Record" && isInTypeSpecNamespace(type)) {
          stdTypes.Record = type;
        }
        if (indexer) {
          type.indexer = indexer;
        }
      },
    );

    return type;
  }

  function checkModelExpression(ctx: CheckContext, node: ModelExpressionNode) {
    const links = getSymbolLinks(node.symbol);

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }

    const type = initModel(node);
    const properties = type.properties;
    linkType(ctx, links, type);
    linkMapper(type, ctx.mapper);

    ensureResolved(
      node.properties
        .filter((x) => x.kind === SyntaxKind.ModelSpreadProperty)
        .map((x) => checkSpreadTarget(ctx, node, x.target)),
      type,
      () => {
        checkModelProperties(ctx, node, properties, type);
        finishType(type, { skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration) });
      },
    );
    return type;
  }

  function checkDecoratedExpression(
    ctx: CheckContext,
    node: DecoratedExpressionNode,
  ): Type | Value | IndeterminateEntity | null {
    const targetResult = checkNode(ctx, node.target);
    if (targetResult === null) {
      return null;
    }

    // Apply decorators to the resolved type
    if (typeof targetResult === "object" && "entityKind" in targetResult) {
      if (targetResult.entityKind === "Type" && "decorators" in targetResult) {
        const type = targetResult as Type & { decorators: DecoratorApplication[] };
        for (const decNode of node.decorators) {
          const decorator = checkDecoratorApplication(ctx, type, decNode);
          if (decorator) {
            type.decorators.unshift(decorator);
            applyDecoratorToType(program, decorator, type);
          }
        }
      }
    }

    return targetResult;
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
    diagnosticTarget: Node,
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
    diagnosticTarget: Node,
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

    const [valid, diagnostics] = relation.isTypeAssignableTo(
      property.type,
      indexer.value,
      diagnosticTarget,
    );
    if (!valid)
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "incompatible-indexer",
          format: { message: diagnostics.map((x) => `  ${x.message}`).join("\n") },
          target:
            diagnosticTarget.kind === SyntaxKind.ModelProperty
              ? diagnosticTarget.value
              : diagnosticTarget,
        }),
      );
  }

  function checkModelProperties(
    ctx: CheckContext,
    node: ModelExpressionNode | ModelStatementNode,
    properties: Map<string, ModelProperty>,
    parentModel: Model,
  ) {
    let spreadIndexers: ModelIndexer[] | undefined;
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const newProp = checkModelProperty(ctx, prop);
        newProp.model = parentModel;
        checkPropertyCompatibleWithModelIndexer(parentModel, newProp, prop);
        defineProperty(properties, newProp);
      } else {
        // spread property
        const [newProperties, additionalIndexer] = checkSpreadProperty(
          ctx,
          node.symbol,
          prop.target,
          parentModel,
        );

        if (additionalIndexer) {
          if (spreadIndexers) {
            spreadIndexers.push(additionalIndexer);
          } else {
            spreadIndexers = [additionalIndexer];
          }
        }
        for (const newProp of newProperties) {
          linkIndirectMember(ctx, node, newProp);
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

  function checkObjectValue(
    ctx: CheckContext,
    node: ObjectLiteralNode,
    constraint: CheckValueConstraint | undefined,
  ): ObjectValue | null {
    const properties = checkObjectLiteralProperties(ctx, node);
    if (properties === null) {
      return null;
    }
    const preciseType = createTypeForObjectValue(node, properties);
    if (constraint && !checkTypeOfValueMatchConstraint(preciseType, constraint, node)) {
      return null;
    }
    return createValue(
      {
        entityKind: "Value",
        valueKind: "ObjectValue",
        node: node,
        properties,
        type: constraint ? constraint.type : preciseType,
      },
      preciseType,
    );
  }

  function createTypeForObjectValue(
    node: ObjectLiteralNode,
    properties: Map<string, ObjectValuePropertyDescriptor>,
  ): Model {
    const model = createType({
      kind: "Model",
      name: "",
      node,
      properties: createRekeyableMap<string, ModelProperty>(),
      decorators: [],
      derivedModels: [],
      sourceModels: [],
    });

    for (const prop of properties.values()) {
      model.properties.set(prop.name, createModelPropertyForObjectPropertyDescriptor(prop, model));
    }
    return finishType(model);
  }

  function createModelPropertyForObjectPropertyDescriptor(
    prop: ObjectValuePropertyDescriptor,
    parentModel: Model,
  ): ModelProperty {
    return createAndFinishType({
      kind: "ModelProperty",
      node: prop.node,
      model: parentModel,
      optional: false,
      name: prop.name,
      type: prop.value.type,
      decorators: [],
    });
  }

  function checkObjectLiteralProperties(
    ctx: CheckContext,
    node: ObjectLiteralNode,
  ): Map<string, ObjectValuePropertyDescriptor> | null {
    const properties = new Map<string, ObjectValuePropertyDescriptor>();
    let hasError = false;
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const value = getValueForNode(prop.value, ctx.mapper);
        if (value === null) {
          hasError = true;
        } else {
          properties.set(prop.id.sv, { name: prop.id.sv, value: value, node: prop });
        }
      } else {
        const targetType = checkObjectSpreadProperty(ctx, prop.target);
        if (targetType) {
          for (const [name, value] of targetType.properties) {
            properties.set(name, { ...value });
          }
        }
      }
    }
    return hasError ? null : properties;
  }

  function checkObjectSpreadProperty(
    ctx: CheckContext,
    targetNode: TypeReferenceNode,
  ): ObjectValue | null {
    const value = getValueForNode(targetNode, ctx.mapper);
    if (value === null) {
      return null;
    }
    if (value.valueKind !== "ObjectValue") {
      reportCheckerDiagnostic(createDiagnostic({ code: "spread-object", target: targetNode }));
      return null;
    }

    return value;
  }

  function checkArrayValue(
    ctx: CheckContext,
    node: ArrayLiteralNode,
    constraint: CheckValueConstraint | undefined,
  ): ArrayValue | null {
    let hasError = false;
    const values = node.values.map((itemNode) => {
      const value = getValueForNode(itemNode, ctx.mapper);
      if (value === null) {
        hasError = true;
      }
      return value;
    });
    if (hasError) {
      return null;
    }

    const preciseType = createTypeForArrayValue(node, values as any);
    if (constraint && !checkTypeOfValueMatchConstraint(preciseType, constraint, node)) {
      return null;
    }

    return createValue(
      {
        entityKind: "Value",
        valueKind: "ArrayValue",
        node: node,
        values: values as any,
        type: constraint ? constraint.type : preciseType,
      },
      preciseType,
    );
  }

  function createValue<T extends ValueWithTemplate>(value: T, preciseType: Type): T {
    valueExactTypes.set(value, preciseType);
    return value;
  }
  function copyValue<T extends Value>(value: T, overrides?: Partial<T>): T {
    const newValue = { ...value, ...overrides };
    const preciseType = valueExactTypes.get(value);
    if (preciseType) {
      valueExactTypes.set(newValue, preciseType);
    }
    return newValue;
  }

  function createTypeForArrayValue(node: ArrayLiteralNode, values: Value[]): Tuple {
    return createAndFinishType({
      kind: "Tuple",
      node,
      values: values.map((x) => x.type),
    });
  }

  function inferScalarForPrimitiveValue(
    type: Type | undefined,
    literalType: Type,
  ): Scalar | undefined {
    if (type === undefined) {
      return undefined;
    }
    switch (type.kind) {
      case "Scalar":
        if (ignoreDiagnostics(checker.isTypeAssignableTo(literalType, type, literalType))) {
          return type;
        }
        return undefined;
      case "Union":
        let found = undefined;
        for (const variant of type.variants.values()) {
          const scalar = inferScalarForPrimitiveValue(variant.type, literalType);
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
                }),
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
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): StringValue | null {
    if (constraint && !checkTypeOfValueMatchConstraint(literalType, constraint, node)) {
      return null;
    }
    let value: string;
    if (literalType.kind === "StringTemplate") {
      if (literalType.stringValue) {
        value = literalType.stringValue;
      } else {
        reportCheckerDiagnostics(explainStringTemplateNotSerializable(literalType));
        return null;
      }
    } else {
      value = literalType.value;
    }
    const scalar = inferScalarForPrimitiveValue(constraint?.type, literalType);
    return createValue(
      {
        entityKind: "Value",
        valueKind: "StringValue",
        value,
        type: constraint ? constraint.type : literalType,
        scalar,
      },
      literalType,
    );
  }

  function checkNumericValue(
    literalType: NumericLiteral,
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): NumericValue | null {
    if (constraint && !checkTypeOfValueMatchConstraint(literalType, constraint, node)) {
      return null;
    }
    const scalar = inferScalarForPrimitiveValue(constraint?.type, literalType);
    return createValue(
      {
        entityKind: "Value",
        valueKind: "NumericValue",
        value: Numeric(literalType.valueAsString),
        type: constraint ? constraint.type : literalType,
        scalar,
      },
      literalType,
    );
  }

  function checkBooleanValue(
    literalType: BooleanLiteral,
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): BooleanValue | null {
    if (constraint && !checkTypeOfValueMatchConstraint(literalType, constraint, node)) {
      return null;
    }
    const scalar = inferScalarForPrimitiveValue(constraint?.type, literalType);
    return createValue(
      {
        entityKind: "Value",
        valueKind: "BooleanValue",
        value: literalType.value,
        type: constraint ? constraint.type : literalType,
        scalar,
      },
      literalType,
    );
  }

  function checkNullValue(
    literalType: NullType,
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): NullValue | null {
    if (constraint && !checkTypeOfValueMatchConstraint(literalType, constraint, node)) {
      return null;
    }

    return createValue(
      {
        entityKind: "Value",

        valueKind: "NullValue",
        type: constraint ? constraint.type : literalType,
        value: null,
      },
      literalType,
    );
  }

  function checkEnumValue(
    literalType: EnumMember,
    constraint: CheckValueConstraint | undefined,
    node: Node,
  ): EnumValue | null {
    if (constraint && !checkTypeOfValueMatchConstraint(literalType, constraint, node)) {
      return null;
    }
    return createValue(
      {
        entityKind: "Value",

        valueKind: "EnumValue",
        type: constraint ? constraint.type : literalType,
        value: literalType,
      },
      literalType,
    );
  }

  function checkCallExpressionTarget(
    ctx: CheckContext,
    node: CallExpressionNode,
  ): ScalarConstructor | Scalar | null {
    const target = checkTypeReference(ctx, node.target);

    if (target.kind === "Scalar" || target.kind === "ScalarConstructor") {
      return target;
    } else {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "non-callable",
          format: { type: target.kind },
          target: node.target,
        }),
      );
      return null;
    }
  }

  /** Check the arguments of the call expression are a single value of the given syntax. */
  function checkPrimitiveArg<T extends NumericValue | BooleanValue | StringValue>(
    node: CallExpressionNode,
    scalar: Scalar,
    valueKind: T["valueKind"],
  ): T | null {
    if (node.arguments.length !== 1) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-primitive-init",
          target: node.target,
        }),
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
        }),
      );
      return null;
    }
    if (!checkValueOfType(value, scalar, argNode)) {
      return null;
    }
    return copyValue(value, { scalar, type: scalar }) as any;
  }

  function createScalarValue(
    ctx: CheckContext,
    node: CallExpressionNode,
    declaration: ScalarConstructor,
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
          }),
        );
      } else {
        const expected = minArgs === maxArgs ? minArgs.toString() : `${minArgs}-${maxArgs}`;
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            format: { actual: node.arguments.length.toString(), expected },
            target: node,
          }),
        );
      }
    }

    const resolvedArgs: Value[] = [];

    for (const [index, parameter] of declaration.parameters.entries()) {
      if (parameter.rest) {
        const restType = getIndexType(parameter.type);
        if (restType) {
          for (let i = index; i < node.arguments.length; i++) {
            const argNode = node.arguments[i];
            if (argNode) {
              const arg = getValueForNode(argNode, ctx.mapper, {
                kind: "argument",
                type: restType,
              });
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
        const arg = getValueForNode(argNode, ctx.mapper, {
          kind: "argument",
          type: parameter.type,
        });
        if (arg === null) {
          hasError = true;
          continue;
        }
        if (checkValueOfType(arg, parameter.type, argNode)) {
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
      entityKind: "Value",
      valueKind: "ScalarValue",
      value: {
        name: declaration.name,
        args: resolvedArgs,
      },
      scalar: declaration.scalar,
      type: declaration.scalar,
    };
  }

  function checkCallExpression(ctx: CheckContext, node: CallExpressionNode): Value | null {
    const target = checkCallExpressionTarget(ctx, node);
    if (target === null) {
      return null;
    }
    if (target.kind === "ScalarConstructor") {
      return createScalarValue(ctx, node, target);
    }

    if (relation.areScalarsRelated(target, getStdType("string"))) {
      return checkPrimitiveArg(node, target, "StringValue");
    } else if (relation.areScalarsRelated(target, getStdType("numeric"))) {
      return checkPrimitiveArg(node, target, "NumericValue");
    } else if (relation.areScalarsRelated(target, getStdType("boolean"))) {
      return checkPrimitiveArg(node, target, "BooleanValue");
    } else {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "named-init-required",
          format: { typeKind: target.kind },
          target: node.target,
        }),
      );
      return null;
    }
  }

  function checkTypeOfExpression(ctx: CheckContext, node: TypeOfExpressionNode): Type {
    const entity = checkNode(ctx, node.target, undefined);
    if (entity === null) {
      // Shouldn't need to emit error as we assume null value already emitted error when produced
      return errorType;
    }
    if (entity.entityKind === "Indeterminate") {
      return entity.type;
    }

    if (isType(entity)) {
      if (entity.kind === "TemplateParameter") {
        if (entity.constraint === undefined || entity.constraint.type !== undefined) {
          // means this template constraint will accept values
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "expect-value",
              messageId: "templateConstraint",
              format: { name: getTypeName(entity) },
              target: node.target,
            }),
          );
          return errorType;
        } else if (entity.constraint.valueType) {
          return entity.constraint.valueType;
        }
      }
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "expect-value",
          format: { name: getTypeName(entity) },
          target: node.target,
        }),
      );
      return entity;
    }
    return entity.type;
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
        }),
      );
    }
    return union;
  }

  function defineProperty(
    properties: Map<string, ModelProperty>,
    newProp: ModelProperty,
    diagnosticTarget?: DiagnosticTarget,
  ) {
    if (properties.has(newProp.name)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "duplicate-property",
          format: { propName: newProp.name },
          target: diagnosticTarget ?? newProp,
        }),
      );
      return;
    }

    const overriddenProp = getOverriddenProperty(newProp);
    if (overriddenProp) {
      const [isAssignable, _] = relation.isTypeAssignableTo(
        newProp.type,
        overriddenProp.type,
        newProp,
      );
      const parentType = getTypeName(overriddenProp.type);
      const newPropType = getTypeName(newProp.type);

      let invalid = false;

      if (!isAssignable) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "override-property-mismatch",
            format: { propName: newProp.name, propType: newPropType, parentType: parentType },
            target: diagnosticTarget ?? newProp,
          }),
        );
        invalid = true;
      }

      if (!overriddenProp.optional && newProp.optional) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "override-property-mismatch",
            messageId: "disallowedOptionalOverride",
            format: { propName: overriddenProp.name },
            target: diagnosticTarget ?? newProp,
          }),
        );
        invalid = true;
      }

      if (invalid) return;
    }

    properties.set(newProp.name, newProp);
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
          SymbolFlags.Interface | SymbolFlags.LateBound,
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
  function lateBindMembers(type: Interface | Model | Union | Enum | Scalar) {
    compilerAssert(type.symbol, "Type must have a symbol to late bind members");
    const containerSym = type.symbol;
    compilerAssert(containerSym.members, "Container symbol didn't have members at late-bind");
    const containerMembers: Mutable<SymbolTable> = resolver.getAugmentedSymbolTable(
      containerSym.members,
    );

    switch (type.kind) {
      case "Model":
        for (const prop of walkPropertiesInherited(type)) {
          lateBindMember(prop, SymbolFlags.Member | SymbolFlags.Declaration);
        }
        break;
      case "Scalar":
        for (const member of type.constructors.values()) {
          lateBindMember(member, SymbolFlags.Member | SymbolFlags.Declaration);
        }
        break;
      case "Enum":
        for (const member of type.members.values()) {
          lateBindMember(member, SymbolFlags.Member | SymbolFlags.Declaration);
        }
        break;
      case "Interface":
        for (const member of type.operations.values()) {
          lateBindMember(
            member,
            SymbolFlags.Member | SymbolFlags.Operation | SymbolFlags.Declaration,
          );
        }
        break;
      case "Union":
        for (const variant of type.variants.values()) {
          lateBindMember(variant, SymbolFlags.Member | SymbolFlags.Declaration);
        }
        break;
    }

    function lateBindMember(
      member: Type & { node?: Node; name: string | symbol },
      kind: SymbolFlags,
    ) {
      if (!member.node || typeof member.name !== "string") {
        // don't bind anything for union expressions
        return;
      }
      const sym = createSymbol(
        member.node,
        member.name,
        kind | SymbolFlags.LateBound,
        containerSym,
      );
      mutate(sym).type = member;
      compilerAssert(containerSym.members, "containerSym.members is undefined");
      containerMembers.set(member.name, sym);
    }
  }
  function checkClassHeritage(
    ctx: CheckContext,
    model: ModelStatementNode,
    heritageRef: Expression,
  ): Model | undefined {
    // Unwrap decorated expression to check the target
    const innerRef =
      heritageRef.kind === SyntaxKind.DecoratedExpression ? heritageRef.target : heritageRef;
    if (innerRef.kind === SyntaxKind.ModelExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "extend-model",
          messageId: "modelExpression",
          target: heritageRef,
        }),
      );
      return undefined;
    }
    if (
      innerRef.kind !== SyntaxKind.TypeReference &&
      innerRef.kind !== SyntaxKind.ArrayExpression
    ) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "extend-model",
          target: heritageRef,
        }),
      );
      return undefined;
    }
    const modelSymId = getNodeSym(model);
    pendingResolutions.start(modelSymId, ResolutionKind.BaseType);

    const target = resolver.getNodeLinks(innerRef).resolvedSymbol;
    if (target && pendingResolutions.has(target, ResolutionKind.BaseType)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-base-type",
            format: { typeName: target.name },
            target: target,
          }),
        );
      }
      return undefined;
    }
    const heritageType = getTypeForNode(innerRef, ctx);
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
        }),
      );
    }

    // Apply decorators from the decorated expression to the resolved type
    if (heritageRef.kind === SyntaxKind.DecoratedExpression) {
      for (const decNode of heritageRef.decorators) {
        const decorator = checkDecoratorApplication(ctx, heritageType, decNode);
        if (decorator) {
          heritageType.decorators.unshift(decorator);
          applyDecoratorToType(program, decorator, heritageType);
        }
      }
    }

    return heritageType;
  }

  function checkModelIs(
    ctx: CheckContext,
    model: ModelStatementNode,
    isExpr: Expression | undefined,
  ): Model | undefined {
    if (!isExpr) return undefined;

    const modelSymId = getNodeSym(model);
    pendingResolutions.start(modelSymId, ResolutionKind.BaseType);
    let isType;
    // Unwrap decorated expression to check the target
    const innerExpr = isExpr.kind === SyntaxKind.DecoratedExpression ? isExpr.target : isExpr;
    if (innerExpr.kind === SyntaxKind.ModelExpression) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "is-model",
          messageId: "modelExpression",
          target: isExpr,
        }),
      );
      return undefined;
    } else if (innerExpr.kind === SyntaxKind.ArrayExpression) {
      isType = checkArrayExpression(ctx, innerExpr);
    } else if (innerExpr.kind === SyntaxKind.TypeReference) {
      const target = resolver.getNodeLinks(innerExpr).resolvedSymbol;
      if (target && pendingResolutions.has(target, ResolutionKind.BaseType)) {
        if (ctx.mapper === undefined) {
          reportCheckerDiagnostic(
            createDiagnostic({
              code: "circular-base-type",
              format: { typeName: target.name },
              target: target,
            }),
          );
        }
        return undefined;
      }
      isType = getTypeForNode(innerExpr, ctx);
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
        createDiagnostic({ code: "is-model", messageId: "modelExpression", target: isExpr }),
      );
      return undefined;
    }

    // Apply decorators from the decorated expression to the resolved type
    if (isExpr.kind === SyntaxKind.DecoratedExpression) {
      for (const decNode of isExpr.decorators) {
        const decorator = checkDecoratorApplication(ctx, isType, decNode);
        if (decorator) {
          isType.decorators.unshift(decorator);
          applyDecoratorToType(program, decorator, isType);
        }
      }
    }

    return isType;
  }

  /** Get the type for the spread target */
  function checkSpreadTarget(
    ctx: CheckContext,
    model: ModelStatementNode | ModelExpressionNode,
    target: TypeReferenceNode,
  ): Type | undefined {
    const modelSymId = getNodeSym(model);

    const targetSym = resolver.getNodeLinks(target).resolvedSymbol;
    if (targetSym === modelSymId) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "spread-model",
            messageId: "selfSpread",
            target: target,
          }),
        );
      }
      return undefined;
    }
    const type = getTypeForNode(target, ctx);
    return type;
  }

  function checkSpreadProperty(
    ctx: CheckContext,
    parentModelSym: Sym,
    targetNode: TypeReferenceNode,
    parentModel: Model,
  ): [ModelProperty[], ModelIndexer | undefined] {
    const targetType = getTypeForNode(targetNode, ctx);

    if (targetType.kind === "TemplateParameter" || isErrorType(targetType)) {
      return [[], undefined];
    }
    if (targetType.kind !== "Model") {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "spread-model", target: targetNode }),
        ctx.mapper,
      );
      return [[], undefined];
    }
    if (isArrayModelType(targetType)) {
      reportCheckerDiagnostic(
        createDiagnostic({ code: "spread-model", target: targetNode }),
        ctx.mapper,
      );
      return [[], undefined];
    }

    parentModel.sourceModels.push({ usage: "spread", model: targetType, node: targetNode });

    const props: ModelProperty[] = [];
    // copy each property
    for (const prop of walkPropertiesInherited(targetType)) {
      const memberSym = getMemberSymbol(parentModelSym, prop.name);
      props.push(
        cloneTypeForSymbol(memberSym!, prop, {
          sourceProperty: prop,
          model: parentModel,
        }),
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
    ctx: CheckContext,
    containerNode: MemberContainerNode,
    member: MemberType,
  ) {
    if (ctx.mapper !== undefined) {
      return;
    }
    compilerAssert(typeof member.name === "string", "Cannot link unmapped unions");
    if (containerNode.symbol === undefined) {
      return;
    }

    const memberSym = getMemberSymbol(containerNode.symbol, member.name);
    if (memberSym) {
      const links = resolver.getSymbolLinks(memberSym);
      linkMemberType(ctx, links, member);
    }
  }

  function checkModelProperty(ctx: CheckContext, prop: ModelPropertyNode): ModelProperty {
    const sym = getSymbolForMember(prop)!;
    const links = getSymbolLinksForMember(prop);

    if (links && links.declaredType && ctx.mapper === undefined) {
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

    if (pendingResolutions.has(sym, ResolutionKind.Type) && ctx.mapper === undefined) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "circular-prop",
          format: { propName: name },
          target: prop,
        }),
      );
      type.type = errorType;
    } else {
      pendingResolutions.start(sym, ResolutionKind.Type);
      type.type = getTypeForNode(prop.value, ctx);
      if (prop.default) {
        const defaultValue = checkDefaultValue(ctx, prop.default, type.type);
        if (defaultValue !== null) {
          type.defaultValue = defaultValue;
        }
      }
      if (links) {
        linkType(ctx, links, type);
      }
    }

    type.decorators = checkDecorators(ctx, type, prop);
    const parentTemplate = getParentTemplateNode(prop);
    linkMapper(type, ctx.mapper);

    const shouldRunDecorators = !ctx.hasFlags(CheckFlags.InTemplateDeclaration);
    if (!parentTemplate || shouldRunDecorators) {
      const docComment = docFromCommentForSym.get(sym);
      if (docComment) {
        type.decorators.unshift(createDocFromCommentDecorator("self", docComment));
      }
    }

    pendingResolutions.finish(sym, ResolutionKind.Type);
    return finishType(type, { skipDecorators: !shouldRunDecorators });
  }

  function createDocFromCommentDecorator(key: "self" | "returns" | "errors", doc: string) {
    return {
      decorator: docFromCommentDecorator,
      args: [
        { value: createLiteralType(key), jsValue: key },
        { value: createLiteralType(doc), jsValue: doc },
      ],
    };
  }

  function checkDefaultValue(ctx: CheckContext, defaultNode: Node, type: Type): Value | null {
    if (isErrorType(type)) {
      // if the prop type is an error we don't need to validate again.
      return null;
    }
    const defaultValue = getValueForNode(defaultNode, ctx.mapper, {
      kind: "assignment",
      type,
    });
    if (defaultValue === null) {
      return null;
    }
    const [related, diagnostics] = relation.isValueOfType(defaultValue, type, defaultNode);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
      return null;
    } else if ((defaultValue.valueKind as any) === "TemplateValue") {
      // Right now we don't want to expose `TemplateValue` in the type graph.
      // And as interating with the template declaration is not a supported feature we can just drop it.
      return null;
    } else {
      return { ...defaultValue, type };
    }
  }

  function checkDecoratorApplication(
    ctx: CheckContext,
    targetType: Type,
    decNode: DecoratorExpressionNode | AugmentDecoratorStatementNode,
  ): DecoratorApplication | undefined {
    const sym = resolveTypeReferenceSym(ctx.withMapper(undefined), decNode.target, true);
    if (!sym) {
      // Error should already have been reported above
      return undefined;
    }
    if (!(sym.flags & SymbolFlags.Decorator)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-decorator",
          format: { id: sym.name },
          target: decNode,
        }),
      );
      return undefined;
    }

    const symbolLinks = getSymbolLinks(sym);

    let hasError = false;
    if (symbolLinks.declaredType === undefined) {
      const decoratorDeclNode: DecoratorDeclarationStatementNode | undefined =
        sym.declarations.find(
          (x): x is DecoratorDeclarationStatementNode =>
            x.kind === SyntaxKind.DecoratorDeclarationStatement,
        );
      if (decoratorDeclNode) {
        checkDecoratorDeclaration(ctx.withMapper(undefined), decoratorDeclNode);
      }
    }
    if (symbolLinks.declaredType) {
      compilerAssert(
        symbolLinks.declaredType.kind === "Decorator",
        `Expected to find a decorator type but got ${symbolLinks.declaredType.kind}`,
      );
      if (!checkDecoratorTarget(targetType, symbolLinks.declaredType, decNode)) {
        hasError = true;
      }
    }
    const [argsHaveError, args] = checkDecoratorArguments(ctx, decNode, symbolLinks.declaredType);

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
    const [targetValid] = relation.isTypeAssignableTo(
      targetType,
      declaration.target.type,
      decoratorNode,
    );
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
        }),
      );
    }
    return targetValid;
  }

  function checkDecoratorArguments(
    ctx: CheckContext,
    node: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    declaration: Decorator | undefined,
  ): [boolean, DecoratorArgument[]] {
    // if we don't have a declaration we can just return the types or values if
    if (declaration === undefined) {
      return [
        false,
        node.arguments.map((argNode): DecoratorArgument => {
          let type = checkNode(ctx, argNode) ?? errorType;
          if (type.entityKind === "Indeterminate") {
            type = type.type;
          }
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
          }),
        );
      } else {
        const expected = minArgs === maxArgs ? minArgs.toString() : `${minArgs}-${maxArgs}`;
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument-count",
            format: { actual: node.arguments.length.toString(), expected },
            target: node,
          }),
        );
      }
    }

    const resolvedArgs: DecoratorArgument[] = [];
    function resolveArg(
      argNode: Expression,
      perParamType: MixedParameterConstraint,
    ): DecoratorArgument | undefined {
      const arg = getTypeOrValueForNode(argNode, ctx.mapper, {
        kind: "argument",
        constraint: perParamType,
      });

      if (
        arg !== null &&
        !(isType(arg) && isErrorType(arg)) &&
        checkArgumentAssignable(arg, perParamType, argNode)
      ) {
        return {
          value: arg,
          node: argNode,
          jsValue: resolveDecoratorArgJsValue(
            arg,
            extractValueOfConstraints({
              kind: "argument",
              constraint: perParamType,
            }),
          ),
        };
      } else {
        return undefined;
      }
    }
    for (const [index, parameter] of declaration.parameters.entries()) {
      if (parameter.rest) {
        const restType = extractRestParamConstraint(parameter.type);

        if (restType) {
          for (let i = index; i < node.arguments.length; i++) {
            const argNode = node.arguments[i];
            if (argNode) {
              const arg = resolveArg(argNode, restType);
              if (arg) {
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
        const arg = resolveArg(argNode, parameter.type);
        if (arg) {
          resolvedArgs.push(arg);
        } else {
          hasError = true;
        }
      }
    }
    return [hasError, resolvedArgs];
  }

  /** For a rest param of constraint T[] or valueof T[] return the T or valueof T */
  function extractRestParamConstraint(
    constraint: MixedParameterConstraint,
  ): MixedParameterConstraint | undefined {
    let valueType: Type | undefined;
    let type: Type | undefined;
    if (constraint.valueType) {
      if (constraint.valueType.kind === "Model" && isArrayModelType(constraint.valueType)) {
        valueType = constraint.valueType.indexer.value;
      } else {
        return undefined;
      }
    }
    if (constraint.type) {
      if (constraint.type.kind === "Model" && isArrayModelType(constraint.type)) {
        type = constraint.type.indexer.value;
      } else {
        return undefined;
      }
    }

    return {
      entityKind: "MixedParameterConstraint",
      type,
      valueType,
    };
  }

  function getIndexType(type: Type): Type | undefined {
    return type.kind === "Model" ? type.indexer?.value : undefined;
  }

  function resolveDecoratorArgJsValue(
    value: Type | Value,
    valueConstraint: CheckValueConstraint | undefined,
  ) {
    if (valueConstraint !== undefined) {
      if (isValue(value)) {
        return marshallTypeForJS(value, valueConstraint.type);
      } else {
        return value;
      }
    }
    return value;
  }

  function checkArgumentAssignable(
    argumentType: Type | Value | IndeterminateEntity,
    parameterType: Entity,
    diagnosticTarget: Entity | Node,
  ): boolean {
    const [valid] = relation.isTypeAssignableTo(argumentType, parameterType, diagnosticTarget);
    if (!valid) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "invalid-argument",
          format: {
            value: getEntityName(argumentType),
            expected: getEntityName(parameterType),
          },
          target: diagnosticTarget,
        }),
      );
    }
    return valid;
  }

  function checkAugmentDecorators(
    ctx: CheckContext,
    sym: Sym,
    targetType: Type,
  ): DecoratorApplication[] {
    const augmentDecoratorNodes = resolver.getAugmentDecoratorsForSym(sym);
    const decorators: DecoratorApplication[] = [];

    for (const decNode of augmentDecoratorNodes) {
      const decorator = checkDecoratorApplication(ctx, targetType, decNode);
      if (decorator) {
        decorators.unshift(decorator);
      }
    }
    return decorators;
  }

  /**
   * Check that augment decorator are targeting valid symbols.
   */
  function checkAugmentDecorator(ctx: CheckContext, node: AugmentDecoratorStatementNode) {
    // This will validate the target type is pointing to a valid ref.
    resolveTypeReferenceSym(ctx.withMapper(undefined), node.targetType, {
      resolveDeclarationOfTemplate: true,
    });

    const links = resolver.getNodeLinks(node.targetType);
    if (links.isTemplateInstantiation) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "augment-decorator-target",
          messageId: "noInstance",
          target: node.targetType,
        }),
      );
    } else if (
      links.finalSymbol?.flags &&
      ~links.finalSymbol.flags & SymbolFlags.Declaration &&
      ~links.finalSymbol.flags & SymbolFlags.Member
    ) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "augment-decorator-target",
          messageId:
            links.finalSymbol.flags & SymbolFlags.Model
              ? "noModelExpression"
              : links.finalSymbol.flags & SymbolFlags.Union
                ? "noUnionExpression"
                : "default",
          target: node.targetType,
        }),
      );
    } else if (links.finalSymbol?.flags && links.finalSymbol.flags & SymbolFlags.Alias) {
      const aliasNode: AliasStatementNode = getSymNode(links.finalSymbol) as AliasStatementNode;

      program.reportDiagnostic(
        createDiagnostic({
          code: "augment-decorator-target",
          messageId:
            aliasNode.value.kind === SyntaxKind.UnionExpression ? "noUnionExpression" : "default",
          target: node.targetType,
        }),
      );
    }

    // If this was used to get a type this is invalid, only used for validation.
    return errorType;
  }

  /**
   * Check that using statements are targeting valid symbols.
   */
  function checkUsings(ctx: CheckContext, node: UsingStatementNode) {
    const usedSym = resolveTypeReferenceSym(ctx.withMapper(undefined), node.name);
    if (usedSym) {
      if (~usedSym.flags & SymbolFlags.Namespace) {
        reportCheckerDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: node.name }));
      }
    }
    // If this was used to get a type this is invalid, only used for validation.
    return errorType;
  }
  function checkDecorators(
    ctx: CheckContext,
    targetType: Type,
    node: Node & { decorators: readonly DecoratorExpressionNode[] },
  ) {
    const sym = isMemberNode(node)
      ? (getSymbolForMember(node) ?? node.symbol)
      : getMergedSymbol(node.symbol);
    const decorators: DecoratorApplication[] = [];

    const augmentDecoratorNodes = resolver.getAugmentDecoratorsForSym(sym);
    const decoratorNodes = [
      ...augmentDecoratorNodes, // the first decorator will be executed at last, so augmented decorator should be placed at first.
      ...node.decorators,
    ];
    for (const decNode of decoratorNodes) {
      const decorator = checkDecoratorApplication(ctx, targetType, decNode);
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
    } else if (targetType.kind === "ModelProperty") {
    }
    return decorators;
  }

  function checkScalar(ctx: CheckContext, node: ScalarStatementNode): Scalar {
    const links = getSymbolLinks(node.symbol);

    if (ctx.mapper === undefined && node.templateParameters.length > 0) {
      // This is a templated declaration and we are not instantiating it, so we need to update the flags.
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType as any;
    }
    checkTemplateDeclaration(ctx, node);

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
    linkType(ctx, links, type);

    if (node.extends) {
      type.baseScalar = checkScalarExtends(ctx, node, node.extends);
      if (type.baseScalar) {
        copyDeprecation(type.baseScalar, type);
        type.baseScalar.derivedScalars.push(type);
      }
    }
    checkScalarConstructors(ctx, type, node, type.constructors);
    decorators.push(...checkDecorators(ctx, type, node));

    if (ctx.mapper === undefined) {
      type.namespace?.scalars.set(type.name, type);
    }
    linkMapper(type, ctx.mapper);
    if (isInTypeSpecNamespace(type)) {
      stdTypes[type.name as any as keyof StdTypes] = type as any;
    }

    return finishType(type, { skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration) });
  }

  function checkScalarExtends(
    ctx: CheckContext,
    scalar: ScalarStatementNode,
    extendsRef: TypeReferenceNode,
  ): Scalar | undefined {
    const symId = getNodeSym(scalar);
    pendingResolutions.start(symId, ResolutionKind.BaseType);

    const target = resolver.getNodeLinks(extendsRef).resolvedSymbol;

    if (target && pendingResolutions.has(target, ResolutionKind.BaseType)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-base-type",
            format: { typeName: (target.declarations[0] as any).id.sv },
            target: target,
          }),
        );
      }
      return undefined;
    }
    const extendsType = getTypeForNode(extendsRef, ctx);
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
    ctx: CheckContext,
    parentScalar: Scalar,
    node: ScalarStatementNode,
    constructors: Map<string, ScalarConstructor>,
  ) {
    if (parentScalar.baseScalar) {
      for (const member of parentScalar.baseScalar.constructors.values()) {
        const newConstructor: ScalarConstructor = cloneTypeForSymbol(
          getMemberSymbol(node.symbol, member.name)!,
          {
            ...member,
            scalar: parentScalar,
          },
        );
        linkIndirectMember(ctx, node, newConstructor);
        constructors.set(member.name, newConstructor);
      }
    }
    for (const member of node.members) {
      const constructor = checkScalarConstructor(ctx, member, parentScalar);
      if (constructors.has(constructor.name as string)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "constructor-duplicate",
            format: { name: constructor.name.toString() },
            target: member,
          }),
        );
        continue;
      }
      constructors.set(constructor.name, constructor);
    }
  }

  function checkScalarConstructor(
    ctx: CheckContext,
    node: ScalarConstructorNode,
    parentScalar: Scalar,
  ): ScalarConstructor {
    const name = node.id.sv;
    const links = getSymbolLinksForMember(node);
    if (links && links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this scalar constructor and we've already checked it
      return links.declaredType as ScalarConstructor;
    }

    const member: ScalarConstructor = createType({
      kind: "ScalarConstructor",
      scalar: parentScalar,
      name,
      node,
      parameters: node.parameters.map((x) => checkFunctionParameter(ctx, x, false)),
    });
    linkMapper(member, ctx.mapper);
    if (links) {
      linkType(ctx, links, member);
    }

    return finishType(member, {
      skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration),
    });
  }

  function checkAlias(ctx: CheckContext, node: AliasStatementNode): Type | IndeterminateEntity {
    const links = getSymbolLinks(node.symbol);

    if (ctx.mapper === undefined && node.templateParameters.length > 0) {
      // This is a templated declaration and we are not instantiating it, so we need to update the flags.
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    if (links.declaredType && ctx.mapper === undefined) {
      return links.declaredType;
    }
    checkTemplateDeclaration(ctx, node);

    const aliasSymId = getNodeSym(node);
    if (pendingResolutions.has(aliasSymId, ResolutionKind.Type)) {
      if (ctx.mapper === undefined) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "circular-alias-type",
            format: { typeName: node.id.sv },
            target: node,
          }),
        );
      }
      links.declaredType = errorType;
      return errorType;
    }

    pendingResolutions.start(aliasSymId, ResolutionKind.Type);
    const type = checkNode(ctx, node.value);
    if (type === null) {
      links.declaredType = errorType;
      return errorType;
    }
    if (isValue(type)) {
      reportCheckerDiagnostic(createDiagnostic({ code: "value-in-type", target: node.value }));
      links.declaredType = errorType;
      return errorType;
    }
    linkType(ctx, links, type as any);
    pendingResolutions.finish(aliasSymId, ResolutionKind.Type);

    return type;
  }

  function checkConst(node: ConstStatementNode): Value | null {
    const links = getSymbolLinks(node.symbol);
    if (links.value !== undefined) {
      return links.value;
    }

    const type = node.type ? getTypeForNode(node.type, undefined) : undefined;

    if (pendingResolutions.has(node.symbol, ResolutionKind.Value)) {
      reportCheckerDiagnostic(
        createDiagnostic({
          code: "circular-const",
          format: { name: node.id.sv },
          target: node,
        }),
      );
      return null;
    }

    pendingResolutions.start(node.symbol, ResolutionKind.Value);
    const value = getValueForNode(node.value, undefined, type && { kind: "assignment", type });
    pendingResolutions.finish(node.symbol, ResolutionKind.Value);
    if (value === null || (type && !checkValueOfType(value, type, node.id))) {
      links.value = null;
      return links.value;
    }
    links.value = type ? copyValue(value, { type }) : copyValue(value);
    return links.value;
  }

  function inferScalarsFromConstraints<T extends Value>(value: T, type: Type): T {
    switch (value.valueKind) {
      case "BooleanValue":
      case "StringValue":
      case "NumericValue":
        if (value.scalar === undefined) {
          const scalar = inferScalarForPrimitiveValue(type, value.type);
          return copyValue(value as any, { scalar });
        }
        return value;
      case "ArrayValue":
      case "ObjectValue":
      case "EnumValue":
      case "NullValue":
      case "ScalarValue":
        return value;
    }
  }

  function checkEnum(ctx: CheckContext, node: EnumStatementNode): Type {
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
          const memberType = checkEnumMember(ctx, member, enumType);
          if (memberNames.has(memberType.name)) {
            reportCheckerDiagnostic(
              createDiagnostic({
                code: "enum-member-duplicate",
                format: { name: memberType.name },
                target: node,
              }),
            );
            continue;
          }
          memberNames.add(memberType.name);
          enumType.members.set(memberType.name, memberType);
        } else {
          const members = checkEnumSpreadMember(
            ctx,
            node.symbol,
            enumType,
            member.target,
            memberNames,
          );
          for (const memberType of members) {
            linkIndirectMember(ctx, node, memberType);
            enumType.members.set(memberType.name, memberType);
          }
        }
      }

      const namespace = getParentNamespaceType(node);
      enumType.namespace = namespace;
      enumType.namespace?.enums.set(enumType.name!, enumType);
      enumType.decorators = checkDecorators(ctx, enumType, node);
      linkMapper(enumType, ctx.mapper);
      finishType(enumType);
    }

    return links.type;
  }

  function checkInterface(ctx: CheckContext, node: InterfaceStatementNode): Interface {
    const links = getSymbolLinks(node.symbol);

    if (ctx.mapper === undefined && node.templateParameters.length > 0) {
      // This is a templated declaration and we are not instantiating it, so we need to update the flags.
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as Interface;
    }
    checkTemplateDeclaration(ctx, node);

    const interfaceType: Interface = createType({
      kind: "Interface",
      decorators: [],
      node,
      namespace: getParentNamespaceType(node),
      sourceInterfaces: [],
      operations: createRekeyableMap(),
      name: node.id.sv,
    });

    linkType(ctx, links, interfaceType);

    interfaceType.decorators = checkDecorators(ctx, interfaceType, node);

    const ownMembers = checkInterfaceMembers(ctx, node, interfaceType);

    for (const extendsNode of node.extends) {
      const extendsType = getTypeForNode(extendsNode, ctx);
      if (extendsType.kind !== "Interface") {
        reportCheckerDiagnostic(
          createDiagnostic({ code: "extends-interface", target: extendsNode }),
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
            }),
          );
        }

        const newMember = cloneTypeForSymbol(getMemberSymbol(node.symbol, member.name)!, member, {
          interface: interfaceType,
        });
        // Don't link it it is overritten
        if (!ownMembers.has(member.name)) {
          linkIndirectMember(ctx, node, newMember);
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

    linkMapper(interfaceType, ctx.mapper);

    if (ctx.mapper === undefined) {
      interfaceType.namespace?.interfaces.set(interfaceType.name, interfaceType);
    }

    lateBindMemberContainer(interfaceType);
    lateBindMembers(interfaceType);
    return finishType(interfaceType, {
      skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration),
    });
  }

  function checkInterfaceMembers(
    ctx: CheckContext,
    node: InterfaceStatementNode,
    interfaceType: Interface,
  ): Map<string, Operation> {
    const ownMembers = new Map<string, Operation>();

    // Preregister each operation sym links instantiation to make sure there is no race condition when instantiating templated interface
    for (const opNode of node.operations) {
      const symbol = getSymbolForMember(opNode);
      const links = symbol && getSymbolLinks(symbol);
      if (links) {
        links.instantiations = new TypeInstantiationMap();
      }
    }
    for (const opNode of node.operations) {
      const opType = checkOperation(ctx, opNode, interfaceType);
      if (ownMembers.has(opType.name)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "interface-duplicate",
            format: { name: opType.name },
            target: opNode,
          }),
        );
        continue;
      }
      ownMembers.set(opType.name, opType);
    }
    return ownMembers;
  }

  function checkUnion(ctx: CheckContext, node: UnionStatementNode) {
    const links = getSymbolLinks(node.symbol);

    if (ctx.mapper === undefined && node.templateParameters.length > 0) {
      ctx = ctx.withFlags(CheckFlags.InTemplateDeclaration);
    }

    if (links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this union and we've already checked it
      return links.declaredType as Union;
    }
    checkTemplateDeclaration(ctx, node);

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
    linkType(ctx, links, unionType);

    unionType.decorators = checkDecorators(ctx, unionType, node);

    checkUnionVariants(ctx, unionType, node, variants);

    linkMapper(unionType, ctx.mapper);

    if (ctx.mapper === undefined) {
      unionType.namespace?.unions.set(unionType.name!, unionType);
    }

    lateBindMemberContainer(unionType);
    lateBindMembers(unionType);
    return finishType(unionType, {
      skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration),
    });
  }

  function checkUnionVariants(
    ctx: CheckContext,
    parentUnion: Union,
    node: UnionStatementNode,
    variants: Map<string, UnionVariant>,
  ) {
    for (const variantNode of node.options) {
      const variantType = checkUnionVariant(ctx, variantNode);
      variantType.union = parentUnion;
      if (variants.has(variantType.name as string)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "union-duplicate",
            format: { name: variantType.name.toString() },
            target: variantNode,
          }),
        );
        continue;
      }
      variants.set(variantType.name as string, variantType);
    }
  }

  function checkUnionVariant(ctx: CheckContext, variantNode: UnionVariantNode): UnionVariant {
    const links = getSymbolLinksForMember(variantNode);
    if (links && links.declaredType && ctx.mapper === undefined) {
      // we're not instantiating this union variant and we've already checked it
      return links.declaredType as UnionVariant;
    }

    const name = variantNode.id ? variantNode.id.sv : Symbol("name");
    const type = getTypeForNode(variantNode.value, ctx);
    const variantType: UnionVariant = createType({
      kind: "UnionVariant",
      name,
      node: variantNode,
      decorators: [],
      type,
      union: undefined as any,
    });
    variantType.decorators = checkDecorators(ctx, variantType, variantNode);

    linkMapper(variantType, ctx.mapper);
    if (links) {
      linkType(ctx, links, variantType);
    }
    return finishType(variantType, {
      skipDecorators: ctx.hasFlags(CheckFlags.InTemplateDeclaration),
    });
  }

  function isMemberNode(node: Node): node is MemberNode {
    return node.symbol && !!(node.symbol.flags & SymbolFlags.Member);
  }

  function getMemberSymbol(parentSym: Sym, name: string): Sym | undefined {
    return parentSym ? resolver.getAugmentedSymbolTable(parentSym.members!).get(name) : undefined;
  }

  function getSymbolForMember(node: MemberNode): Sym | undefined {
    if (!node.id) {
      return undefined;
    }
    const name = node.id.sv;
    const parentSym = node.parent?.symbol;
    return parentSym ? getMemberSymbol(parentSym, name) : undefined;
  }

  function getSymbolLinksForMember(node: MemberNode): SymbolLinks | undefined {
    const sym = getSymbolForMember(node);
    return sym ? (getSymNode(sym) === node ? getSymbolLinks(sym) : undefined) : undefined;
  }

  function checkEnumMember(ctx: CheckContext, node: EnumMemberNode, parentEnum?: Enum): EnumMember {
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

    member.decorators = checkDecorators(ctx, member, node);
    return finishType(member);
  }

  function checkEnumSpreadMember(
    ctx: CheckContext,
    parentEnumSym: Sym,
    parentEnum: Enum,
    targetNode: TypeReferenceNode,
    existingMemberNames: Set<string>,
  ): EnumMember[] {
    const members: EnumMember[] = [];
    const targetType = getTypeForNode(targetNode, ctx);

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
            }),
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
            }),
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
            }),
          );
          messageStr = "<missing message>";
        } else {
          messageStr = message.value;
        }

        if (hasDeprecation === true) {
          reportCheckerDiagnostic(
            createDiagnostic({ code: "duplicate-deprecation", target: node }),
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
    typeDef: T,
  ): T & TypePrototype & { isFinished: boolean; readonly entityKind: "Type" } {
    createType(typeDef);
    return finishType(typeDef as any);
  }

  /** Initialize model type for the given node */
  function initModel(node?: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode) {
    return createType({
      kind: "Model",
      node,
      name: "",
      namespace: node && getParentNamespaceType(node),
      properties: createRekeyableMap<string, ModelProperty>(),
      decorators: [],
      derivedModels: [],
      sourceModels: [],
    });
  }

  /**
   * Given the own-properties of a type, returns a fully-initialized type.
   */
  function createType<T extends Type extends any ? CreateTypeProps : never>(
    typeDef: T,
  ): T & TypePrototype & { isFinished: boolean; entityKind: "Type" } {
    stats.createdTypes++;
    Object.setPrototypeOf(typeDef, typePrototype);
    (typeDef as any).isFinished = false;
    typeDef.creating = true;
    // If the type has an associated syntax node, check any directives that
    // might be attached.
    const createdType = typeDef as any;
    createdType.entityKind = "Type";
    if (createdType.node) {
      checkDirectives(createdType.node, createdType);
    }
    return createdType;
  }

  interface FinishTypeOptions {
    /** If should run decorators. Default to false. */
    skipDecorators?: boolean;
  }

  function finishType<T extends Type>(typeDef: T, options: FinishTypeOptions = {}): T {
    stats.finishedTypes++;

    if (!options.skipDecorators) {
      let postSelfValidators: ValidatorFn[] = [];
      if ("decorators" in typeDef) {
        postSelfValidators = applyDecoratorsToType(typeDef);
      }
      typeDef.isFinished = true;
      Object.setPrototypeOf(typeDef, typePrototype);
      runPostValidators(postSelfValidators);
    }

    markAsChecked(typeDef);
    return typeDef;
  }

  function applyDecoratorsToType(
    typeDef: Type & { decorators: DecoratorApplication[] },
  ): ValidatorFn[] {
    const postSelfValidators: ValidatorFn[] = [];
    for (const decApp of typeDef.decorators) {
      const validators = applyDecoratorToType(program, decApp, typeDef);
      if (validators?.onTargetFinish) {
        postSelfValidators.push(validators.onTargetFinish);
      }
      if (validators?.onGraphFinish) {
        postCheckValidators.push(validators.onGraphFinish);
      }
    }
    return postSelfValidators;
  }

  /** Run a list of post validator */
  function runPostValidators(validators: ValidatorFn[]) {
    for (const validator of validators) {
      program.reportDiagnostics(validator());
    }
  }

  function markAsChecked<T extends Type>(type: T) {
    if (!type.creating) return;
    delete type.creating;
    const pending = waitingForResolution.get(type);
    if (pending) {
      pending.forEach(([_, resolution]) => resolution());
    }
    waitingForResolution.delete(type);
  }

  function getLiteralType(
    node:
      | StringLiteralNode
      | StringTemplateHeadNode
      | StringTemplateMiddleNode
      | StringTemplateTailNode,
  ): StringLiteral;
  function getLiteralType(node: NumericLiteralNode): NumericLiteral;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteral;
  function getLiteralType(node: LiteralNode): LiteralType;
  function getLiteralType(node: LiteralNode): LiteralType {
    return createLiteralType(node.value, node);
  }

  function getMergedSymbol(sym: Sym): Sym {
    // if (!sym) return sym;
    // return mergedSymbols.get(sym) || sym;
    return resolver.getMergedSymbol(sym);
  }

  function createGlobalNamespaceType(): Namespace {
    const sym = resolver.symbols.global;
    const type: Namespace = createType({
      kind: "Namespace",
      name: "",
      node: getGlobalNamespaceNode(),
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
    getSymbolLinks(sym).type = type;
    type.decorators = checkAugmentDecorators(CheckContext.DEFAULT, sym, type);
    return finishType(type);
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
            ]),
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
            ]),
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
            ]),
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
            ]),
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
    const clone = initializeClone(type, additionalProps);
    compilerAssert(clone.kind === type.kind, "cloneType must not change type kind");
    return finishType(clone, { skipDecorators: !type.isFinished });
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
    additionalProps: Partial<T> = {},
  ): T {
    let clone = initializeClone(type, additionalProps);
    if ("decorators" in clone) {
      const docComment = docFromCommentForSym.get(sym);
      if (docComment) {
        clone.decorators.push(createDocFromCommentDecorator("self", docComment));
      }
      for (const dec of checkAugmentDecorators(CheckContext.DEFAULT, sym, clone)) {
        clone.decorators.push(dec);
      }
    }
    if (type.isFinished) {
      clone = finishType(clone);
    }
    compilerAssert(clone.kind === type.kind, "cloneType must not change type kind");
    return clone;
  }

  function createLiteralType(
    value: string,
    node?:
      | StringLiteralNode
      | StringTemplateHeadNode
      | StringTemplateMiddleNode
      | StringTemplateTailNode,
  ): StringLiteral;
  function createLiteralType(value: number | Numeric, node?: NumericLiteralNode): NumericLiteral;
  function createLiteralType(value: boolean, node?: BooleanLiteralNode): BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean,
    node?: LiteralNode,
  ): StringLiteral | NumericLiteral | BooleanLiteral;
  function createLiteralType(
    value: string | number | boolean | Numeric,
    node?: LiteralNode,
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
            "Must pass numeric literal node or undefined when creating a numeric literal type",
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
      default:
        type = createType({
          kind: "Number",
          value: value.asNumber() ?? 0,
          valueAsString: value.toString(),
          numericValue: value,
        });
    }
    program.literalTypes.set(value, type);
    return finishType(type);
  }

  /**
   * Check if the source type can be assigned to the target type and emit diagnostics
   * @param source Type of a value
   * @param constraint
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function checkTypeOfValueMatchConstraint(
    source: Entity,
    constraint: CheckValueConstraint,
    diagnosticTarget: Entity | Node,
  ): boolean {
    const [related, diagnostics] = relation.isTypeAssignableTo(
      source,
      constraint.type,
      diagnosticTarget,
    );
    if (!related) {
      if (constraint.kind === "argument") {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "invalid-argument",
            format: {
              value: getEntityName(source),
              expected: getEntityName(constraint.type),
            },
            target: diagnosticTarget,
          }),
        );
      } else {
        reportCheckerDiagnostics(diagnostics);
      }
    }
    return related;
  }

  /**
   * Check if the source type can be assigned to the target type and emit diagnostics
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function checkTypeAssignable(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: Entity | Node,
  ): boolean {
    const [related, diagnostics] = relation.isTypeAssignableTo(source, target, diagnosticTarget);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
    }
    return related;
  }

  function checkValueOfType(source: Value, target: Type, diagnosticTarget: Entity | Node): boolean {
    const [related, diagnostics] = relation.isValueOfType(source, target, diagnosticTarget);
    if (!related) {
      reportCheckerDiagnostics(diagnostics);
    }
    return related;
  }

  function isStdType(
    type: Scalar,
    stdType?: IntrinsicScalarName,
  ): type is Scalar & { name: IntrinsicScalarName };
  function isStdType(type: Type, stdType?: StdTypeName): type is Type & { name: StdTypeName } {
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

  function getValueExactType(value: Value): Type | undefined {
    return valueExactTypes.get(value);
  }
}

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
  args: (Type | Value | IndeterminateEntity)[],
  source: TypeMapper["source"],
  parentMapper?: TypeMapper,
): TypeMapper {
  const map = new Map<TemplateParameter, Type | Value | IndeterminateEntity>(
    parentMapper?.map ?? [],
  );

  for (const [index, param] of parameters.entries()) {
    map.set(param, args[index]);
  }

  return {
    partial: false,
    args: [...(parentMapper?.args ?? []), ...args],
    getMappedType: (type: TemplateParameter) => {
      return map.get(type) ?? type;
    },
    source,
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
  filter?: (property: ModelProperty) => boolean,
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
  program: Program,
  model: Model,
  filter: (property: ModelProperty) => boolean,
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

  const realm = Realm.realmForType.get(model);
  const typekit = realm ? $(realm) : $(program);
  const newModel: Model = typekit.model.create({
    name: "",
    indexer: undefined,
    properties: {},
    decorators: [],
    derivedModels: [],
    sourceModels: [{ usage: "spread", model }],
  });

  for (const property of walkPropertiesInherited(model)) {
    if (filter(property)) {
      const newProperty = typekit.type.clone(property);
      Object.assign(newProperty, {
        sourceProperty: property,
        model: newModel,
      });
      newModel.properties.set(property.name, newProperty);
      typekit.type.finishType(newProperty);
    }
  }

  return program.checker.finishType(newModel);
}

/**
 * Gets the property from the nearest base type that is overridden by the
 * given property, if any.
 */
export function getOverriddenProperty(property: ModelProperty): ModelProperty | undefined {
  compilerAssert(
    property.model,
    "Parent model must be set before overridden property can be found.",
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

function linkMapper<T extends Type & TemplatedTypeBase>(typeDef: T, mapper?: TypeMapper) {
  if (mapper) {
    compilerAssert(!typeDef.templateMapper, "Mapper provided but template arguments already set.");
    typeDef.templateMapper = mapper;
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

function extractParamDocs(node: OperationStatementNode): Map<string, string> {
  if (node.docs === undefined) {
    return new Map();
  }
  const paramDocs = new Map();
  for (const doc of node.docs) {
    for (const tag of doc.tags) {
      if (tag.kind === SyntaxKind.DocParamTag) {
        paramDocs.set(tag.paramName.sv, getDocContent(tag.content));
      }
    }
  }
  return paramDocs;
}

function extractPropDocs(node: ModelStatementNode): Map<string, string> {
  if (node.docs === undefined) {
    return new Map();
  }
  const propDocs = new Map();
  for (const doc of node.docs) {
    for (const tag of doc.tags) {
      if (tag.kind === SyntaxKind.DocPropTag) {
        propDocs.set(tag.propName.sv, getDocContent(tag.content));
      }
    }
  }
  return propDocs;
}

function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added.",
    );
    docs.push(node.text);
  }
  return docs.join("");
}

function applyDecoratorToType(
  program: Program,
  decApp: DecoratorApplication,
  target: Type,
): DecoratorValidatorCallbacks | void {
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
      reportDeprecated(program, deprecation.message, decApp.node ?? target);
    }
  }

  // peel `fn` off to avoid setting `this`.
  try {
    const args = decApp.args.map((x) => x.jsValue);
    const fn = decApp.decorator;
    const context = createDecoratorContext(program, decApp);
    return fn(context, target, ...args);
  } catch (error: any) {
    // do not fail the language server for exceptions in decorators
    if (program.compilerOptions.designTimeBuild) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "decorator-fail",
          format: { decoratorName: decApp.decorator.name, error: error.stack },
          target: decApp.node ?? target,
        }),
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

enum ResolutionKind {
  Value,
  Type,
  BaseType,
  Constraint,
}

class PendingResolutions {
  #data = new Map<Sym, Set<ResolutionKind>>();

  start(symId: Sym, kind: ResolutionKind) {
    let existing = this.#data.get(symId);
    if (existing === undefined) {
      existing = new Set();
      this.#data.set(symId, existing);
    }
    existing.add(kind);
  }

  has(symId: Sym, kind: ResolutionKind): boolean {
    return this.#data.get(symId)?.has(kind) ?? false;
  }

  finish(symId: Sym, kind: ResolutionKind) {
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

interface SymbolResolutionOptions {
  /**
   * Should resolving the symbol lookup for decorators as well.
   * @default false
   */
  resolveDecorators: boolean;

  /**
   * When resolving a symbol should it resolve to the declaration or template instance for ambiguous cases
   * ```tsp
   * model Foo<T = string> {}
   * ```
   *
   * Does `Foo` reference to the `Foo<T>` or `Foo<string>` instance. By default it is the instance. Only case looking for declaration are augment decorator target
   *
   * @default false
   */
  resolveDeclarationOfTemplate: boolean;
}

const defaultSymbolResolutionOptions: SymbolResolutionOptions = {
  resolveDecorators: false,
  resolveDeclarationOfTemplate: false,
};

function printTypeReferenceNode(
  node: TypeReferenceNode | IdentifierNode | MemberExpressionNode,
): string {
  switch (node.kind) {
    case SyntaxKind.MemberExpression:
      return `${printTypeReferenceNode(node.base)}.${printTypeReferenceNode(node.id)}`;
    case SyntaxKind.TypeReference:
      return printTypeReferenceNode(node.target);
    case SyntaxKind.Identifier:
      return node.sv;
  }
}
