import { Program } from "../../core/index.js";
import type {
  ArrayModelType,
  BaseType,
  BooleanLiteral,
  Diagnostic,
  Enum,
  EnumMember,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "../../core/types.js";
import { Placeholder } from "../../emitter-framework/placeholder.js";
import { ReferenceCycle } from "../../emitter-framework/reference-cycle.js";
import { EmitterOutput } from "../../emitter-framework/type-emitter.js";

/**
 * Represent a type that is not handled by an emitter. This is different from the actual `UnknownType` type that represent the `unknown` keyword being used as a type.
 *
 */
export interface UnhandledType extends BaseType {
  readonly kind: string;
}

export interface EmittedSourceFile {
  contents: string;
  path: string;
}

export interface EmitterHooksProps<Output, Context extends object> {
  /** Resolved context. */
  readonly context: Readonly<Context>;
  readonly emitter: AssetEmitter<Output, Context>;
}

export interface OnUnhandledTypeProps<Output, Context extends object>
  extends EmitterHooksProps<Output, Context> {
  readonly type: UnhandledType;
}

export interface EmitterInit<Output, Context extends object>
  extends TypeHook<Output, Context>,
    TypeInternalHook<Output, Context>,
    TypeContextHook<Output, Context>,
    MiscHooks<Output, Context> {
  /**
   * Required implementation for an emitter.
   * In the case a type is received by the emitter and it not handled this callback will be called.
   * The goal of this callback is to be able to have an emitter resilient to typespec evolution as well as helping during the development of the emitter where you might not have implemented all the types yet.
   *
   * ```ts
   *
   * const emitter = createEmitter({
   *  onUnhandledType: (type) => {
   *    return [{}, createDiagnostic({code: "unknown-type", format: {name: type.kind}})];
   *   }),
   * });
   * ```
   */
  readonly onUnhandledType: (
    param: OnUnhandledTypeProps<Output, Context>
  ) => [Output, readonly Diagnostic[]];
}

export interface NamespaceProps {
  readonly type: Namespace;
}
export interface ModelDeclarationProps {
  readonly type: Model;
  readonly name: string;
}
export interface ModelLiteralProps {
  readonly type: Model & { name: "" };
}
export interface ModelInstantiationProps {
  readonly type: Model;
}
export interface ArrayDeclarationProps {
  readonly type: ArrayModelType;
  readonly elementType: Type;
}
export interface ArrayLiteralProps {
  readonly type: ArrayModelType;
  readonly elementType: Type;
}
export interface ModelPropertyLiteralProps {
  readonly type: ModelProperty;
}
export interface ModelPropertyReferenceProps {
  readonly type: ModelProperty;
}
export interface BooleanLiteralProps {
  readonly type: BooleanLiteral;
}
export interface StringLiteralProps {
  readonly type: StringLiteral;
}
export interface NumericLiteralProps {
  readonly type: NumericLiteral;
}
export interface EnumDeclarationProps {
  readonly type: Enum;
}
export interface EnumMemberProps {
  readonly type: EnumMember;
}
export interface EnumMemberReferenceProps {
  readonly type: EnumMember;
}
export interface UnionDeclarationProps {
  readonly type: Union;
}
export interface UnionLiteralProps {
  readonly type: Union;
}
export interface UnionVariantProps {
  readonly type: UnionVariant;
}
export interface ScalarDeclarationProps {
  readonly type: Scalar;
}
export interface ScalarInstantiationProps {
  readonly type: Scalar;
}
export interface TupleLiteralProps {
  readonly type: Tuple;
}
export interface IntrinsicProps {
  readonly type: IntrinsicType;
}
export interface InterfaceOperationDeclarationProps {
  readonly type: Operation;
  readonly name: string;
}
export interface OperationDeclarationProps {
  readonly type: Operation;
}
export interface OperationParametersProps {
  readonly type: Operation;
  readonly parameters: Model;
}
export interface OperationReturnTypeProps {
  readonly type: Operation;
  readonly returnType: Type;
}
export interface InterfaceDeclarationProps {
  readonly type: Interface;
}
export interface InterfaceDeclarationOperationsProps {
  readonly type: Interface;
}
export interface ModelPropertiesProps {
  readonly type: Model;
}

export interface EnumMembersProps {
  readonly type: Enum;
}
export interface TupleLiteralValuesProps {
  readonly type: Tuple;
}
export interface UnionVariantsProps {
  readonly type: Union;
}

export interface ProgramProps {
  readonly program: Program;
}

export interface ReferenceProps<Output, Context extends object>
  extends EmitterHooksProps<Output, Context> {
  readonly target: Declaration<Output>;
  readonly pathUp: Scope<Output>[];
  readonly pathDown: Scope<Output>[];
  readonly commonScope: Scope<Output> | null;
}
export interface CircularReferenceProps<Output, Context extends object>
  extends EmitterHooksProps<Output, Context> {
  readonly target: EmitEntity<Output>;
  readonly scope: Scope<Output> | undefined;
  readonly cycle: ReferenceCycle;
  readonly reference: (
    props: ReferenceProps<Output, Context>
  ) => object | EmitEntity<Record<string, unknown>>;
}

export interface DeclarationNameProps<Output, Context extends object>
  extends EmitterHooksProps<Output, Context> {
  readonly type: TypeSpecDeclaration;
}
export interface SourceFileProps<Output, Context extends object> {
  readonly sourceFile: SourceFile<Output>;
  readonly emitter: AssetEmitter<Output, Context>;
}
export interface WriteOutputProps<Output, Context extends object> {
  readonly sourceFiles: SourceFile<Output>[];
  readonly emitter: AssetEmitter<Output, Context>;
}

// TODO: better name?
// TODO: also merge CommonHooksProps automatically?
export interface MiscHooks<Output, Context extends object> {
  readonly declarationName?: (props: DeclarationNameProps<Output, Context>) => string | undefined;
  readonly sourceFile?: (
    props: SourceFileProps<Output, Context>
  ) => Promise<EmittedSourceFile> | EmittedSourceFile;
  readonly writeOutput?: (props: WriteOutputProps<Output, Context>) => void;

  readonly reference?: (props: ReferenceProps<Output, Context>) => object | EmitEntity<Output>; // TODO: check return type.

  readonly circularReference?: (
    props: CircularReferenceProps<Output, Context>
  ) => Output | EmitEntity<Output>; // TODO: check return type.
}

export interface BaseTypeHooksParams {
  readonly namespace: NamespaceProps;
  readonly modelDeclaration: ModelDeclarationProps;
  readonly modelLiteral: ModelLiteralProps;
  readonly modelInstantiation: ModelInstantiationProps;
  readonly arrayDeclaration: ArrayDeclarationProps;
  readonly arrayLiteral: ArrayDeclarationProps;
  readonly modelPropertyLiteral: ModelPropertyLiteralProps;
  readonly modelPropertyReference: ModelPropertyReferenceProps;
  readonly booleanLiteral: BooleanLiteralProps;
  readonly stringLiteral: StringLiteralProps;
  readonly numericLiteral: NumericLiteralProps;
  readonly enum: EnumDeclarationProps;
  // TODO: should this be enumMemberLiteral?
  readonly enumMember: EnumMemberProps;
  readonly enumMemberReference: EnumMemberReferenceProps;
  readonly unionDeclaration: UnionDeclarationProps;
  readonly unionLiteral: UnionLiteralProps;
  // TODO: should this be unionVariantLiteral? like modelPropertyLiteral
  readonly unionVariant: UnionVariantProps;
  readonly scalarDeclaration: ScalarDeclarationProps;
  readonly scalarInstantiation: ScalarInstantiationProps;
  readonly tupleLiteral: TupleLiteralProps;
  readonly intrinsic: IntrinsicProps;
  readonly operation: OperationDeclarationProps;
  readonly interface: InterfaceDeclarationProps;
  readonly interfaceOperationDeclaration: InterfaceOperationDeclarationProps;
}

/** Helpers for emitting the internals of complex types. */
export interface TypeInternalsHooksParams {
  readonly operationParameters: OperationParametersProps;
  readonly operationReturnType: OperationReturnTypeProps;
  readonly interfaceDeclarationOperations: InterfaceDeclarationOperationsProps;
  readonly modelProperties: ModelPropertiesProps;
  readonly enumMembers: EnumMembersProps;
  readonly tupleLiteralValues: TupleLiteralValuesProps;
  readonly unionVariants: UnionVariantsProps;
}

export type TypeHooksParams = BaseTypeHooksParams & TypeInternalsHooksParams;

export type TypeHookMethod = keyof TypeHooksParams;

export type TypeHook<Output, Context extends object> = {
  readonly [key in keyof BaseTypeHooksParams]: (
    props: BaseTypeHooksParams[key] & EmitterHooksProps<Output, Context>
  ) => EmitterOutput<Output>;
};

export type TypeInternalHook<Output, Context extends object> = {
  readonly [key in keyof TypeInternalsHooksParams]: (
    props: TypeInternalsHooksParams[key] & EmitterHooksProps<Output, Context>
  ) => EmitterOutput<Output>;
};

export type TypeContextHook<Output, Context extends object> = {
  readonly [key in keyof BaseTypeHooksParams as `${TypeHookMethod}Context`]: (
    props: BaseTypeHooksParams[key] & EmitterHooksProps<Output, Context>
  ) => Context;
} & {
  readonly programContext?: (
    props: ProgramProps & { emitter: AssetEmitter<Output, Context> }
  ) => Context;
};

export interface LexicalTypeStackEntry {
  method: TypeHookMethod;
  args: any;
}

export interface EmitterState<Context extends object> {
  lexicalTypeStack: LexicalTypeStackEntry[];
  context: ContextState<Context>;
}
export interface ContextState<Context extends object> {
  lexicalContext: Context;
  referenceContext: Context;
}

export interface ScopeBase<T> {
  kind: string;
  name: string;
  parentScope: Scope<T> | null;
  childScopes: Scope<T>[];
  declarations: Declaration<T>[];
}

export interface SourceFileScope<T> extends ScopeBase<T> {
  kind: "sourceFile";
  sourceFile: SourceFile<T>;
}

export interface NamespaceScope<T> extends ScopeBase<T> {
  kind: "namespace";
  parentScope: Scope<T>;
  namespace: any;
}

export type Scope<T> = SourceFileScope<T> | NamespaceScope<T>;

export interface TypeReference {
  expression: string;
}

export interface SourceFile<T> {
  path: string;
  globalScope: Scope<T>;
  imports: Map<string, string[]>;
  meta: Record<string, any>;
}

export type TypeSpecDeclaration =
  | Model
  | Interface
  | Union
  | Operation
  | Enum
  | Scalar
  | IntrinsicType;

export interface EmitTypeReferenceOptions<Context extends object> {
  readonly referenceContext?: Context;
}

export type AssetEmitterOptions<TOptions extends object> = {
  noEmit: boolean;
  emitterOutputDir: string;
} & TOptions;

export interface AssetEmitter<
  Output,
  Context extends object,
  Options extends object = Record<string, unknown>,
> {
  /**
   * Get the current emitter context as set by the TypeEmitter's various
   * context methods.
   *
   * @returns The current emitter context
   */
  getOptions(): AssetEmitterOptions<Options>;
  getProgram(): Program;
  emitTypeReference(type: Type, options?: EmitTypeReferenceOptions<Context>): EmitEntity<Output>;
  emitDeclarationName(type: TypeSpecDeclaration): string | undefined;
  emitType(type: Type, context?: Partial<ContextState<Context>>): EmitEntity<Output>;
  emitProgram(options?: { emitGlobalNamespace?: boolean; emitTypeSpecNamespace?: boolean }): void;
  emitModelProperties(model: Model): EmitEntity<Output>;
  emitModelProperty(prop: ModelProperty): EmitEntity<Output>;
  emitOperationParameters(operation: Operation): EmitEntity<Output>;
  emitOperationReturnType(operation: Operation): EmitEntity<Output>;
  emitInterfaceOperations(iface: Interface): EmitEntity<Output>;
  emitInterfaceOperation(operation: Operation): EmitEntity<Output>;
  emitEnumMembers(en: Enum): EmitEntity<Output>;
  emitUnionVariants(union: Union): EmitEntity<Output>;
  emitTupleLiteralValues(tuple: Tuple): EmitEntity<Output>;
  emitSourceFile(sourceFile: SourceFile<Output>): Promise<EmittedSourceFile>;
  /**
   * Create a source file.
   *
   * @param name the path of the file, resolved relative to the emitter's output directory.
   */
  createSourceFile(name: string): SourceFile<Output>;
  createScope(sourceFile: SourceFile<Output>, name: string): SourceFileScope<Output>;
  createScope(namespace: any, name: string, parentScope: Scope<Output>): NamespaceScope<Output>;
  createScope(block: any, name: string, parentScope?: Scope<Output> | null): Scope<Output>;
  result: {
    declaration(name: string, value: Output | Placeholder<Output>): Declaration<Output>;
    rawCode(value: Output | Placeholder<Output>): RawCode<Output>;
    none(): NoEmit;
  };
  writeOutput(): Promise<void>;

  /** Get source files that have been scoped. */
  getSourceFiles(): SourceFile<Output>[];
}

export type EmitEntity<T> = Declaration<T> | RawCode<T> | NoEmit | CircularEmit;

export class EmitterResult {}
export class Declaration<T> extends EmitterResult {
  public kind = "declaration" as const;
  public meta: Record<string, any> = {};

  constructor(
    public name: string,
    public scope: Scope<T>,
    public value: T | Placeholder<T>
  ) {
    if (value instanceof Placeholder) {
      value.onValue((v) => (this.value = v));
    }

    super();
  }
}

export class RawCode<T> extends EmitterResult {
  public kind = "code" as const;

  constructor(public value: T | Placeholder<T>) {
    if (value instanceof Placeholder) {
      value.onValue((v) => (this.value = v));
    }

    super();
  }
}

export class NoEmit extends EmitterResult {
  public kind = "none" as const;
}

export class CircularEmit extends EmitterResult {
  public kind = "circular" as const;
  constructor(public emitEntityKey: [string, Type, ContextState<any>]) {
    super();
  }
}
