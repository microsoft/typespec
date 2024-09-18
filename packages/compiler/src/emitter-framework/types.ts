import type {
  Enum,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Operation,
  Program,
  Scalar,
  Tuple,
  Type,
  Union,
} from "../core/index.js";
import { Placeholder } from "./placeholder.js";
import type { TypeEmitter } from "./type-emitter.js";

type AssetEmitterOptions<TOptions extends object> = {
  noEmit: boolean;
  emitterOutputDir: string;
} & TOptions;

export interface EmitTypeReferenceOptions {
  readonly referenceContext?: Record<string, any>;
}

export interface AssetEmitter<T, TOptions extends object = Record<string, unknown>> {
  /**
   * Get the current emitter context as set by the TypeEmitter's various
   * context methods.
   *
   * @returns The current emitter context
   */
  getContext(): Context;
  getOptions(): AssetEmitterOptions<TOptions>;
  getProgram(): Program;
  emitTypeReference(type: Type, context?: EmitTypeReferenceOptions): EmitEntity<T>;
  emitDeclarationName(type: TypeSpecDeclaration): string | undefined;
  emitType(type: Type, context?: Partial<ContextState>): EmitEntity<T>;
  emitProgram(options?: { emitGlobalNamespace?: boolean; emitTypeSpecNamespace?: boolean }): void;
  emitModelProperties(model: Model): EmitEntity<T>;
  emitModelProperty(prop: ModelProperty): EmitEntity<T>;
  emitOperationParameters(operation: Operation): EmitEntity<T>;
  emitOperationReturnType(operation: Operation): EmitEntity<T>;
  emitInterfaceOperations(iface: Interface): EmitEntity<T>;
  emitInterfaceOperation(operation: Operation): EmitEntity<T>;
  emitEnumMembers(en: Enum): EmitEntity<T>;
  emitUnionVariants(union: Union): EmitEntity<T>;
  emitTupleLiteralValues(tuple: Tuple): EmitEntity<T>;
  emitSourceFile(sourceFile: SourceFile<T>): Promise<EmittedSourceFile>;
  /**
   * Create a source file.
   *
   * @param name the path of the file, resolved relative to the emitter's output directory.
   */
  createSourceFile(name: string): SourceFile<T>;
  createScope(sourceFile: SourceFile<T>, name: string): SourceFileScope<T>;
  createScope(namespace: any, name: string, parentScope: Scope<T>): NamespaceScope<T>;
  createScope(block: any, name: string, parentScope?: Scope<T> | null): Scope<T>;
  result: {
    declaration(name: string, value: T | Placeholder<T>): Declaration<T>;
    rawCode(value: T | Placeholder<T>): RawCode<T>;
    none(): NoEmit;
  };
  writeOutput(): Promise<void>;

  /** Get source files that have been scoped. */
  getSourceFiles(): SourceFile<T>[];
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

export interface EmittedSourceFile {
  contents: string;
  path: string;
}

export type EmitEntity<T> = Declaration<T> | RawCode<T> | NoEmit | CircularEmit;

export class EmitterResult {}
export class Declaration<T> extends EmitterResult {
  public kind = "declaration" as const;
  public meta: Record<string, any> = {};

  constructor(
    public name: string,
    public scope: Scope<T>,
    public value: T | Placeholder<T>,
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
  constructor(public emitEntityKey: [string, Type, ContextState]) {
    super();
  }
}

export interface AssetTag {
  language: AssetTagFactory;
  create(key: string): AssetTagFactory;
}

export interface AssetTagInstance {}

export type AssetTagFactory = {
  (value: string): AssetTagInstance;
};

export type TypeSpecDeclaration =
  | Model
  | Interface
  | Union
  | Operation
  | Enum
  | Scalar
  | IntrinsicType;

export interface ContextState {
  lexicalContext: Record<string, any>;
  referenceContext: Record<string, any>;
}

export type Context = Record<string, any>;
export type ESRecord = Record<string, any> & { _record: true };

type EndingWith<Names, Name extends string> = Names extends `${infer _X}${Name}` ? Names : never;

export type TypeEmitterMethod = keyof Omit<
  TypeEmitter<any, any>,
  | "sourceFile"
  | "declarationName"
  | "reference"
  | "circularReference"
  | "emitValue"
  | "writeOutput"
  | EndingWith<keyof TypeEmitter<any, any>, "Context">
>;

export interface LexicalTypeStackEntry {
  method: TypeEmitterMethod;
  args: any[];
}

export interface EmitterState {
  lexicalTypeStack: LexicalTypeStackEntry[];
  context: ContextState;
}
