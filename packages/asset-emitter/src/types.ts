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
} from "@typespec/compiler";
import { Placeholder } from "./placeholder.js";
import type { TypeEmitter } from "./type-emitter.js";

/** Emitter-specific options combined with the output settings supplied at creation. */
type AssetEmitterOptions<TOptions extends object> = {
  /** Whether the compiler requested a dry run; available to output implementations. */
  noEmit: boolean;
  /** Base directory used to resolve paths passed to `createSourceFile`. */
  emitterOutputDir: string;
} & TOptions;

/** Context additions for a single reference and the types reached through it. */
export interface EmitTypeReferenceOptions {
  /** Values merged over the current reference context for this reference only. */
  readonly referenceContext?: Record<string, any>;
}

/**
 * Coordinates a TypeEmitter's traversal, cached results, contexts, and output files.
 * Use this object from callbacks rather than calling other callbacks directly so
 * context establishment, circular references, and declaration registration are preserved.
 */
export interface AssetEmitter<T, TOptions extends object = Record<string, unknown>> {
  /**
   * Get the current emitter context as set by the TypeEmitter's various
   * context methods. Returns a shallow merge with reference-context keys taking
   * precedence; assigning properties on this returned object does not update context.
   *
   * @returns The current emitter context
   */
  getContext(): Context;
  /** Get the options supplied when creating this emitter, including its output directory. */
  getOptions(): AssetEmitterOptions<TOptions>;
  /** Get the compiler program whose types this emitter traverses. */
  getProgram(): Program;
  /**
   * Emit a target as a reference: declarations go through the reference callback,
   * while inline results pass through. Circular references return placeholder-backed
   * code that is filled when the target completes.
   */
  emitTypeReference(type: Type, context?: EmitTypeReferenceOptions): EmitEntity<T>;
  /** Ask `declarationName` for a name; undefined means no suitable name was found. */
  emitDeclarationName(type: TypeSpecDeclaration): string | undefined;
  /**
   * Dispatch to the callback for this type and reuse a result for the same type,
   * callback, and context. Unlike `emitTypeReference`, returns the emitted
   * declaration itself rather than a reference to it. A supplied reference context
   * is made available at the target; lexical context is established by context hooks.
   */
  emitType(type: Type, context?: Partial<ContextState>): EmitEntity<T>;
  /**
   * Traverse the global namespace's contents, skipping uninstantiated model,
   * operation, interface, and union templates. Does not write output files.
   */
  emitProgram(options?: {
    /** Invoke the namespace callback on the global namespace instead of traversing its contents here. */
    emitGlobalNamespace?: boolean;
    /** Include the TypeSpec namespace in the default traversal; false when omitted. */
    emitTypeSpecNamespace?: boolean;
  }): void;
  /** Invoke the model-properties callback, preserving the enclosing model context. */
  emitModelProperties(model: Model): EmitEntity<T>;
  /** Emit a property as a member, rather than as a reference to its type. */
  emitModelProperty(prop: ModelProperty): EmitEntity<T>;
  /** Invoke the parameter-list callback with the operation's parameter model. */
  emitOperationParameters(operation: Operation): EmitEntity<T>;
  /** Invoke the return-type callback with the operation's return type. */
  emitOperationReturnType(operation: Operation): EmitEntity<T>;
  /** Invoke the callback that collects an interface's operations. */
  emitInterfaceOperations(iface: Interface): EmitEntity<T>;
  /** Emit an operation as an interface member; its declaration name must be defined. */
  emitInterfaceOperation(operation: Operation): EmitEntity<T>;
  /** Invoke the callback that collects an enum's members. */
  emitEnumMembers(en: Enum): EmitEntity<T>;
  /** Invoke the callback that collects a union's variants. */
  emitUnionVariants(union: Union): EmitEntity<T>;
  /** Invoke the callback that collects a tuple's ordered values. */
  emitTupleLiteralValues(tuple: Tuple): EmitEntity<T>;
  /** Serialize a source file through `sourceFile` without writing it to the compiler host. */
  emitSourceFile(sourceFile: SourceFile<T>): Promise<EmittedSourceFile>;
  /**
   * Create a source file.
   * Absolute roots and parent-directory segments are removed and path segments
   * are sanitized so the result stays within the emitter output directory.
   *
   * @param name the path of the file, resolved relative to the emitter's output directory.
   */
  createSourceFile(name: string): SourceFile<T>;
  /** Create a root scope associated with a source file. */
  createScope(sourceFile: SourceFile<T>, name: string): SourceFileScope<T>;
  /** Create a nested scope and append it to its parent's child scopes. */
  createScope(namespace: any, name: string, parentScope: Scope<T>): NamespaceScope<T>;
  /** Create a root scope without a parent, or a namespace scope when a parent is supplied. */
  createScope(block: any, name: string, parentScope?: Scope<T> | null): Scope<T>;
  /** Factories for explicit callback results, including deferred values. */
  result: {
    /** Create a declaration in the current context's `scope`, which must be set. */
    declaration(name: string, value: T | Placeholder<T>): Declaration<T>;
    /** Wrap inline output without registering a declaration in a scope. */
    rawCode(value: T | Placeholder<T>): RawCode<T>;
    /** Indicate that a callback contributes no output. */
    none(): NoEmit;
  };
  /** Invoke `writeOutput` with all source files created by this emitter. */
  writeOutput(): Promise<void>;

  /** Get source files that have been scoped. */
  getSourceFiles(): SourceFile<T>[];
}

/** Mutable output-scope tree used to collect declarations and resolve references. */
export interface ScopeBase<T> {
  /** Discriminant distinguishing a source-file root from a nested namespace. */
  kind: string;
  /** Output-language scope name used when constructing qualified references. */
  name: string;
  /** Enclosing output scope, or null at a source-file root. */
  parentScope: Scope<T> | null;
  /** Nested scopes in creation order; populated by `createScope`. */
  childScopes: Scope<T>[];
  /** Declarations registered as their emit callbacks complete, not TypeSpec source order. */
  declarations: Declaration<T>[];
}

/** Root of the output scope tree for one source file. */
export interface SourceFileScope<T> extends ScopeBase<T> {
  /** Identifies a file root rather than a nested namespace. */
  kind: "sourceFile";
  /** File whose declarations and nested scopes are rooted here. */
  sourceFile: SourceFile<T>;
}

/** Output-language namespace nested within another output scope. */
export interface NamespaceScope<T> extends ScopeBase<T> {
  /** Identifies a scope with an enclosing output scope. */
  kind: "namespace";
  /** Enclosing scope used to compute paths between declarations. */
  parentScope: Scope<T>;
  /** Emitter-owned value representing this namespace; not necessarily a TypeSpec namespace. */
  namespace: any;
}

/** A source-file root or a namespace within an output scope tree. */
export type Scope<T> = SourceFileScope<T> | NamespaceScope<T>;

/** A textual reference expression supplied by an emitter. */
export interface TypeReference {
  /** Output-language expression that refers to the target. */
  expression: string;
}

/** Mutable file model populated during traversal and serialized by `sourceFile`. */
export interface SourceFile<T> {
  /** Output path resolved against the emitter output directory by `createSourceFile`. */
  path: string;
  /** Root output scope, initially created with an empty name. */
  globalScope: Scope<T>;
  /** Emitter-managed import groups; the default source-file serializer does not render them. */
  imports: Map<string, string[]>;
  /** Emitter-owned metadata, initialized to an empty object. */
  meta: Record<string, any>;
}

/** Serialized file returned by the source-file callback, ready to be written. */
export interface EmittedSourceFile {
  /** Complete text to write, including any formatting performed by the emitter. */
  contents: string;
  /** Destination path, which may differ from the input source file's path. */
  path: string;
}

/** Normalized traversal result: a declaration, inline value, omission, or pending cycle. */
export type EmitEntity<T> = Declaration<T> | RawCode<T> | NoEmit | CircularEmit;

/** Base marker used to distinguish explicit emit results from unwrapped output values. */
export class EmitterResult {}
/** Named output owned by a scope and available as a reference target. */
export class Declaration<T> extends EmitterResult {
  /** Identifies a named, scoped result. */
  public kind = "declaration" as const;
  /** Emitter-owned metadata shared with consumers of this declaration. */
  public meta: Record<string, any> = {};

  /** Create a declaration; the asset emitter registers returned declarations after the callback completes. */
  constructor(
    /** Output-language name used by reference callbacks. */
    public name: string,
    /** Output scope that owns this declaration. */
    public scope: Scope<T>,
    /** Output value, replaced in place when a supplied placeholder is resolved. */
    public value: T | Placeholder<T>,
  ) {
    if (value instanceof Placeholder) {
      value.onValue((v) => (this.value = v));
    }

    super();
  }
}

/** Inline output that does not register a declaration in an output scope. */
export class RawCode<T> extends EmitterResult {
  /** Identifies an unscoped output value. */
  public kind = "code" as const;

  /**
   * Wrap output and subscribe to a placeholder if supplied, replacing `value`
   * whenever that placeholder publishes a value.
   * @param value - Output value or a placeholder awaiting circular-reference resolution.
   */
  constructor(
    /** Inline value, replaced when a supplied placeholder publishes a value. */
    public value: T | Placeholder<T>,
  ) {
    if (value instanceof Placeholder) {
      value.onValue((v) => (this.value = v));
    }

    super();
  }
}

/** Explicit omission returned by callbacks that contribute no output value. */
export class NoEmit extends EmitterResult {
  /** Identifies a result without an output value. */
  public kind = "none" as const;
}

/** Sentinel returned when traversal reaches a type whose emission is already in progress. */
export class CircularEmit extends EmitterResult {
  /** Identifies an unresolved traversal cycle, not a serializable output value. */
  public kind = "circular" as const;
  /**
   * Identify an in-progress callback so its waiting references can be resolved.
   * @param emitEntityKey - Callback name, TypeSpec type, and interned context identifying the pending result.
   */
  constructor(
    /** Cache identity of the callback that must complete before this cycle resolves. */
    public emitEntityKey: [string, Type, ContextState],
  ) {
    super();
  }
}

/** Callable-tag factories grouped by output language and caller-defined keys. */
export interface AssetTag {
  /** Factory for a language-tagged value. */
  language: AssetTagFactory;
  /** Select a tag factory for a caller-defined key. */
  create(key: string): AssetTagFactory;
}

/** Opaque result of applying an asset tag; no structure is prescribed by this contract. */
export interface AssetTagInstance {}

/** Callable contract for attaching an asset tag to a string value. */
export type AssetTagFactory = {
  /** Tag the supplied value and return an opaque tag instance. */
  (value: string): AssetTagInstance;
};

/** Types accepted by the declaration-naming callback, including intrinsic types. */
export type TypeSpecDeclaration =
  Model | Interface | Union | Operation | Enum | Scalar | IntrinsicType;

/** Separate context channels maintained while traversing lexical contents and references. */
export interface ContextState {
  /** Values inherited by lexical children; recomputed on entering another declaration. */
  lexicalContext: Record<string, any>;
  /** Values carried across references as well as into lexical children. */
  referenceContext: Record<string, any>;
}

/** Emitter-defined context values; reference-context keys override lexical keys when read. */
export type Context = Record<string, any>;
/** Open record distinguished by a required `_record: true` marker. */
export type ESRecord = Record<string, any> & {
  /** Marker distinguishing this record from an untagged open object. */
  _record: true;
};

type EndingWith<Names, Name extends string> = Names extends `${infer _X}${Name}` ? Names : never;

/** Callback names used for cached type traversal, excluding naming, references, output, and context hooks. */
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

/** A traversal callback and its arguments in the current lexical containment chain. */
export interface LexicalTypeStackEntry {
  /** Callback whose context hooks establish this entry's context. */
  method: TypeEmitterMethod;
  /** Callback arguments, beginning with the TypeSpec type being visited. */
  args: any[];
}

/** Traversal snapshot used to restore context when resolving a deferred reference. */
export interface EmitterState {
  /** Lexical callback chain, ordered from outermost container to the current entry. */
  lexicalTypeStack: LexicalTypeStackEntry[];
  /** Lexical and reference values active for this snapshot. */
  context: ContextState;
}
