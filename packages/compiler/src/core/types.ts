import type { JSONSchemaType as AjvJSONSchemaType } from "ajv";
import type { ModuleResolutionResult } from "../module-resolver/index.js";
import type { YamlPathTarget, YamlScript } from "../yaml/types.js";
import type { FileRef } from "./file-ref.js";
import type { Numeric } from "./numeric.js";
import type { Program } from "./program.js";
import type { TokenFlags } from "./scanner.js";

/**
 * JavaScript-facing type mapping for compiler values.
 * Numeric values may use {@link Numeric} to preserve precision, while scalar constructor values
 * retain their compiler representation.
 */
// prettier-ignore
export type MarshalledValue<Value>  = 
Value extends StringValue ? string
  : Value extends NumericValue ? number | Numeric
  : Value extends BooleanValue ? boolean
  : Value extends ObjectValue ? Record<string, unknown>
  : Value extends ArrayValue ? unknown[]
  : Value extends EnumValue ? EnumMember
  : Value extends NullValue ? null
  : Value extends ScalarValue ? Value
  : Value

/** Type or primitive argument accepted by legacy decorator implementations. */
export type DecoratorArgumentValue = Type | number | string | boolean;

/** A checked decorator argument, retaining both its compiler entity and JavaScript representation. */
export interface DecoratorArgument {
  /** Type or value before marshalling for the decorator implementation. */
  value: Type | Value;
  /**
   * Marshalled value for use in Javascript.
   */
  jsValue:
    Type | Value | Record<string, unknown> | unknown[] | string | number | boolean | Numeric | null;
  /** Argument expression, when the application originates in TypeSpec source. */
  node?: Node;
}

/** A decorator application attached to a type, including its checked arguments. */
export interface DecoratorApplication {
  /** TypeSpec declaration, if the decorator has a corresponding declaration. */
  definition?: Decorator;
  /** JavaScript implementation invoked when the decorated type is finished. */
  decorator: DecoratorFunction;
  /** Custom arguments in call order, excluding the decorator context and target. */
  args: DecoratorArgument[];
  /** Source application, or absent for a programmatically constructed application. */
  node?: DecoratorExpressionNode | AugmentDecoratorStatementNode;
}

/**
 * Signature for a decorator JS implementation function.
 * Use `@typespec/tspd` to generate an accurate signature from the `extern dec`
 */
export interface DecoratorFunction {
  /** Apply the decorator to its target and optionally register deferred validation. */
  (
    context: DecoratorContext,
    target: any,
    ...customArgs: any[]
  ): DecoratorValidatorCallbacks | void;
  /** Namespace associated with a JavaScript decorator export. */
  namespace?: string;
}

/** Deferred decorator validation that returns diagnostics without mutating the type graph. */
export type ValidatorFn = () => readonly Diagnostic[];

/** Validation hooks returned by a decorator to run after target or graph construction. */
export interface DecoratorValidatorCallbacks {
  /**
   * Run validation after all decorators are run on the same type. Useful if trying to validate this decorator is compatible with other decorators without relying on the order they are applied.
   * @note This is meant for validation which means the type graph should be treated as readonly in this function.
   */
  readonly onTargetFinish?: ValidatorFn;

  /**
   * Run validation after everything is checked in the type graph. Useful when trying to get an overall view of the program.
   * @note This is meant for validation which means the type graph should be treated as readonly in this function.
   */
  readonly onGraphFinish?: ValidatorFn;
}

/** Common identity and construction state shared by semantic types in the compiler graph. */
export interface BaseType {
  /** Distinguishes semantic types from values and parameter constraints. */
  readonly entityKind: "Type";
  /** Discriminant identifying the concrete semantic type. */
  kind: string;
  /** Node used to construct this type. If the node is undefined it means the type was dynamically built. With typekit for example. */
  node?: Node;
  /**
   * Legacy instantiation metadata. The compiler's type checker does not populate this field,
   * so its absence does not indicate whether this type is a template instance.
   */
  instantiationParameters?: Type[];

  /**
   * If the type is currently being created.
   */
  creating?: true;

  /**
   * Reflect if a type has been finished(Decorators have been called).
   * There is multiple reasons a type might not be finished:
   * - a template declaration will not
   * - a template instance that argument that are still template parameters
   * - a template instance that is only partially instantiated(like a templated operation inside a templated interface)
   */
  isFinished: boolean;
}

/** A semantic type that can carry decorator applications. */
export interface DecoratedType {
  /** Applications used when finishing this type, including copied or synthesized applications. */
  decorators: DecoratorApplication[];
}

/**
 * Union of all the types that implement TemplatedTypeBase
 */
export type TemplatedType = Model | Operation | Interface | Union | Scalar;

/** Substitutes template parameters with arguments while constructing a template instance. */
export interface TypeMapper {
  /** Whether enclosing arguments have been applied but this template is not fully instantiated. */
  partial: boolean;
  /** Return the mapped argument, or the original parameter when no substitution is available. */
  getMappedType(type: TemplateParameter): Type | Value | IndeterminateEntity;
  /** Arguments for this instantiation, with enclosing template arguments first. */
  args: readonly (Type | Value | IndeterminateEntity)[];
  /** @internal Node used to create this type mapper. */
  readonly source: {
    readonly node: Node;
    readonly mapper: TypeMapper | undefined;
  };
  /** @internal */
  map: Map<TemplateParameter, Type | Value | IndeterminateEntity>;
}

/** Instantiation metadata carried by types that support template parameters. */
export interface TemplatedTypeBase {
  /** Argument substitutions for an instantiation; absent on an uninstantiated declaration. */
  templateMapper?: TypeMapper;
  /** Originating template node, when retained separately from the type's source node. */
  templateNode?: Node;
}

/**
 * Represent every single entity that are part of the TypeSpec program. Those are composed of different elements:
 * - Types
 * - Values
 * - Value Constraints
 */
export type Entity = Type | Value | MixedParameterConstraint | IndeterminateEntity;

/** Semantic type graph nodes, including declarations, members, literals, and template placeholders. */
export type Type =
  | BooleanLiteral
  | Decorator
  | FunctionType
  | Enum
  | EnumMember
  | FunctionParameter
  | Interface
  | IntrinsicType
  | Model
  | ModelProperty
  | Namespace
  | NumericLiteral
  | Operation
  | Scalar
  | ScalarConstructor
  | StringLiteral
  | StringTemplate
  | StringTemplateSpan
  | TemplateParameter
  | TemplateParameterAccess
  | Tuple
  | Union
  | UnionVariant;

/** Standard-library types available by name through {@link Checker.getStdType}. */
export type StdTypes = {
  // Models
  /** Generic standard model for integer-indexed collections. */
  Array: Model;
  /** Generic standard model for string-indexed collections. */
  Record: Model;
} & Record<IntrinsicScalarName, Scalar>;
/** Names accepted when looking up a standard-library type. */
export type StdTypeName = keyof StdTypes;

export interface ObjectType extends BaseType {
  kind: "Object";
  properties: Record<string, Type>;
}

/**
 * A parameter constraint with independent type and value alternatives.
 * A `valueof` alternative constrains a value's type rather than accepting the type itself.
 */
export interface MixedParameterConstraint {
  /** Distinguishes this constraint from a type, value, or unresolved literal entity. */
  readonly entityKind: "MixedParameterConstraint";
  /** Source expression defining the constraint, when available. */
  readonly node?: UnionExpressionNode | Expression;

  /** Type constraints */
  readonly type?: Type;

  /** Expecting value */
  readonly valueType?: Type;
}

/** When an entity that could be used as a type or value has not figured out if it is a value or type yet. */
export interface IndeterminateEntity {
  /** Identifies an entity whose type-versus-value interpretation is not yet selected. */
  readonly entityKind: "Indeterminate";
  /** Literal-like type from which a type or value can be selected by the surrounding context. */
  readonly type:
    | StringLiteral
    | StringTemplate
    | NumericLiteral
    | BooleanLiteral
    | EnumMember
    | UnionVariant
    | NullType;
}

/** Compiler-defined special type, rather than a declaration in the standard library. */
export interface IntrinsicType extends BaseType {
  /** Discriminant shared by the compiler's special types. */
  kind: "Intrinsic";
  /** Identifies the special type and its assignability semantics. */
  name: "ErrorType" | "void" | "never" | "unknown" | "null";
}

/** Error-recovery type used when checking cannot produce a valid type. */
export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
}

/** An operation result with no return value. */
export interface VoidType extends IntrinsicType {
  name: "void";
}

/** Bottom type with no possible values, assignable to every type. */
export interface NeverType extends IntrinsicType {
  name: "never";
}

/** Top type accepting any type without imposing a more specific constraint. */
export interface UnknownType extends IntrinsicType {
  name: "unknown";
}
/** Singleton type of the `null` value, distinct from an operation returning `void`. */
export interface NullType extends IntrinsicType {
  name: "null";
}

/** Names of the built-in scalars exposed through the compiler's standard-type lookup. */
export type IntrinsicScalarName =
  | "bytes"
  | "numeric"
  | "integer"
  | "float"
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
  | "decimal"
  | "decimal128"
  | "string"
  | "plainDate"
  | "plainTime"
  | "utcDateTime"
  | "offsetDateTime"
  | "duration"
  | "boolean"
  | "url";

/** An indexer shape that admits no keys and consequently has no value type. */
export type NeverIndexer = {
  /** Bottom type, allowing no indexed keys. */
  readonly key: NeverType;
  /** No value type exists for an indexer without keys. */
  readonly value: undefined;
};

/** Key and element constraints for an indexed model such as an array or record. */
export type ModelIndexer = {
  /** Scalar constraining keys; standard arrays use `integer` and records use `string`. */
  readonly key: Scalar;
  /** Type required for indexed values. */
  readonly value: Type;
};

/** Model narrowed by {@link isArrayModelType} to have an integer-keyed indexer. */
export interface ArrayModelType extends Model {
  // prettier-ignore
  /** Indexer describing the array's element type. */
  indexer: {
    /** Integer key scalar used for array positions. */
    key: Scalar;
    /** Type of each array element. */
    value: Type
  };
}

/** Model narrowed by {@link isRecordModelType} to have a string-keyed indexer. */
export interface RecordModelType extends Model {
  // prettier-ignore
  /** Indexer describing values associated with record keys. */
  indexer: {
    /** String key scalar used for record entries. */
    key: Scalar;
    /** Type of each record entry. */
    value: Type
  };
}

/** Structured type with ordered own properties, optional indexing, and model inheritance. */
export interface Model extends BaseType, DecoratedType, TemplatedTypeBase {
  /** Discriminant for structured model types. */
  kind: "Model";
  /** Declared name, or an empty string for an anonymous model. */
  name: string;
  node?:
    | ModelStatementNode
    | ModelDeclarationExpressionNode
    | ModelExpressionNode
    | IntersectionExpressionNode
    | ObjectLiteralNode;
  /** Namespace containing a named declaration, when associated with one. */
  namespace?: Namespace;
  /** Constraint on indexed entries, if this model supports indexing. */
  indexer?: ModelIndexer;

  /**
   * Whether this model was declared in expression position (e.g. an anonymous
   * `model { ... }` used as a type) rather than as a named statement.
   */
  expression: boolean;

  /**
   * The properties of the model.
   *
   * Properties are ordered in the order that they appear in source.
   * Properties obtained via `model is` appear before properties defined in
   * the model body. Properties obtained via `...` are inserted where the
   * spread appears in source.
   *
   * Properties inherited via `model extends` are not included. Use
   * {@link walkPropertiesInherited} to enumerate all properties in the
   * inheritance hierarchy.
   */
  properties: RekeyableMap<string, ModelProperty>;

  /**
   * Model this model extends. This represent inheritance.
   */
  baseModel?: Model;

  /**
   * Direct children. This is the reverse relation of {@link baseModel}
   */
  derivedModels: Model[];

  /**
   * The model that is referenced via `model is`.
   */
  sourceModel?: Model;

  /**
   * Models that were used to build this model. This include any model referenced in `model is`, `...` or when intersecting models.
   */
  sourceModels: SourceModel[];

  /**
   * Late-bound symbol of this model type.
   * @internal
   */
  symbol?: Sym;
}

/** Records a model-composition input separately from the model's inheritance relationship. */
export interface SourceModel {
  /**
   * How was this model used.
   * - is: `model A is B`
   * - spread: `model A {...B}`
   * - intersection: `alias A = B & C`
   */
  readonly usage: "is" | "spread" | "intersection";
  /** Source model */
  readonly model: Model;

  /** Node where this source model was referenced. */
  readonly node?: Node;
}

/** A named model field, including copied fields introduced by composition. */
export interface ModelProperty extends BaseType, DecoratedType {
  /** Discriminant for model fields and operation parameters. */
  kind: "ModelProperty";
  node?: ModelPropertyNode | ModelSpreadPropertyNode | ObjectLiteralPropertyNode;
  /** Key under which this property appears in its containing model. */
  name: string;
  /** Type of values accepted by the property, independent of optionality. */
  type: Type;
  /** Property copied to create this one through composition, when applicable. */
  sourceProperty?: ModelProperty;
  /** Whether the property may be omitted; this does not add `null` to its type. */
  optional: boolean;
  /** Checked default value, when a default was supplied. */
  defaultValue?: Value;
  /** Containing model, when attached; copied properties belong to the receiving model. */
  model?: Model;
}

//#region Values
/**
 * A checked TypeSpec value, distinct from the {@link Type} describing what values are allowed.
 * Narrow with `valueKind` to inspect primitive payloads, collection contents, or constructor calls.
 */
export type Value =
  | ScalarValue
  | NumericValue
  | StringValue
  | BooleanValue
  | ObjectValue
  | ArrayValue
  | EnumValue
  | NullValue
  | FunctionValue;

/** @internal */
export type ValueWithTemplate = Value | TemplateValue;

/** Common identity and storage-type metadata inherited by checked values. */
interface BaseValue {
  /** Distinguishes a concrete value from a type or parameter constraint. */
  readonly entityKind: "Value";
  /** Discriminant identifying how the value's contents are represented. */
  readonly valueKind: string;
  /**
   * Represent the storage type of a value.
   * @example
   * ```tsp
   * const a = "hello"; // Type here would be "hello"
   * const b: string = a;  // Type here would be string
   * const c: string | int32 = b; // Type here would be string | int32
   * ```
   */
  type: Type;
}

/** An object value with checked named entries, rather than a model type's property declarations. */
export interface ObjectValue extends BaseValue {
  /** Discriminant for object contents stored in a property map. */
  valueKind: "ObjectValue";
  /** Object literal that produced the value, when available. */
  node?: ObjectLiteralNode;
  /** Actual entries keyed by property name; each descriptor contains a value, not a property type. */
  properties: Map<string, ObjectValuePropertyDescriptor>;
}

/** One named entry in an {@link ObjectValue}, with its checked value and optional source. */
export interface ObjectValuePropertyDescriptor {
  /** Property syntax that supplied this entry, when available. */
  node?: ObjectLiteralPropertyNode;
  /** Entry name matching its key in the containing object's property map. */
  name: string;
  /** Checked contents of the entry. */
  value: Value;
}

/** An array value containing checked elements, distinct from an array model or tuple type. */
export interface ArrayValue extends BaseValue {
  /** Discriminant for array contents stored as an element list. */
  valueKind: "ArrayValue";
  /** Array literal that produced the value, when available. */
  node?: ArrayLiteralNode;
  /** Element values in array order. */
  values: Value[];
}

/** A scalar constructor call retained as a scalar, constructor name, and checked arguments. */
export interface ScalarValue extends BaseValue {
  /** Discriminant for a retained constructor call rather than a primitive payload. */
  valueKind: "ScalarValue";
  /** Scalar instantiated by the constructor call. */
  scalar: Scalar;
  // prettier-ignore
  /** Constructor invocation used to create the value. */
  value: {
    /** Constructor name on the scalar. */
    name: string;
    /** Checked arguments in call order. */
    args: Value[]
  };
}

/** A numeric value whose exact contents are preserved independently of JavaScript number precision. */
export interface NumericValue extends BaseValue {
  /** Discriminant for an exact numeric payload. */
  valueKind: "NumericValue";
  /** Selected numeric scalar, or undefined for a literal without an inferred or explicit scalar. */
  scalar: Scalar | undefined;
  /** Exact numeric contents; use Numeric conversion methods when a JavaScript number is needed. */
  value: Numeric;
}
/** A string value, optionally associated with a scalar selected by its context or construction. */
export interface StringValue extends BaseValue {
  /** Discriminant for a JavaScript string payload. */
  valueKind: "StringValue";
  /** Selected string scalar, or undefined when the value has no scalar association. */
  scalar: Scalar | undefined;
  /** String contents, independent of the value's storage type. */
  value: string;
}
/** A boolean value, optionally associated with a scalar selected by its context or construction. */
export interface BooleanValue extends BaseValue {
  /** Discriminant for a JavaScript boolean payload. */
  valueKind: "BooleanValue";
  /** Selected boolean scalar, or undefined when the value has no scalar association. */
  scalar: Scalar | undefined;
  /** Boolean contents, independent of the value's storage type. */
  value: boolean;
}
/** A value referring to an enum member, retaining member identity rather than only its assigned value. */
export interface EnumValue extends BaseValue {
  /** Discriminant for a value backed by an enum member. */
  valueKind: "EnumValue";
  /** Referenced member, including its owning enum and any explicit string or numeric value. */
  value: EnumMember;
}
/** The concrete null value, distinct from the intrinsic type used to describe it. */
export interface NullValue extends BaseValue {
  /** Discriminant for the null payload. */
  valueKind: "NullValue";
  /** Null contents; absence of a value is not represented by this field being undefined. */
  value: null;
}

/**
 * This is an internal type that represent a value while in a template declaration.
 * This type should currently never be exposed on the type graph(unlike TemplateParameter).
 * @internal
 */
export interface TemplateValue extends BaseValue {
  valueKind: "TemplateValue";
}

//#endregion Values

/** A scalar declaration or expression, with optional scalar inheritance and named constructors. */
export interface Scalar extends BaseType, DecoratedType, TemplatedTypeBase {
  /** Discriminant for scalar types rather than scalar values. */
  kind: "Scalar";
  /** Declared name, or an empty string for an anonymous scalar expression. */
  name: string;
  node?: ScalarStatementNode | ScalarDeclarationExpressionNode;
  /**
   * Namespace the scalar was defined in.
   */
  namespace?: Namespace;

  /**
   * Whether this scalar was declared in expression position (anonymous `scalar ...`)
   * rather than as a named statement.
   */
  expression: boolean;

  /**
   * Scalar this scalar extends.
   */
  baseScalar?: Scalar;

  /**
   * Direct children. This is the reverse relation of @see baseScalar
   */
  derivedScalars: Scalar[];

  /** Constructors keyed by name, including inherited constructors rebound to this scalar. */
  constructors: Map<string, ScalarConstructor>;
  /**
   * Late-bound symbol of this scalar type.
   * @internal
   */
  symbol?: Sym;
}

/** A named scalar initializer whose checked call produces a value of its associated scalar. */
export interface ScalarConstructor extends BaseType {
  /** Discriminant for scalar initializer signatures. */
  kind: "ScalarConstructor";
  node?: ScalarConstructorNode;
  /** Initializer name used after the scalar name in a constructor call. */
  name: string;
  /** Scalar constructed by this signature, including when the signature was inherited. */
  scalar: Scalar;
  /** Parameter constraints in declaration order, including optional and rest parameters. */
  parameters: SignatureFunctionParameter[];
}

/** A named collection of operations, including operations copied from extended interfaces. */
export interface Interface extends BaseType, DecoratedType, TemplatedTypeBase {
  /** Discriminant for operation containers. */
  kind: "Interface";
  /** Local declaration name, excluding its namespace path. */
  name: string;
  node?: InterfaceStatementNode;
  /** Containing namespace, when associated with a namespace. */
  namespace?: Namespace;

  /**
   * The interfaces that provide additional operations via `interface extends`.
   *
   * Note that despite the same `extends` keyword in source form, this is a
   * different semantic relationship than the one from {@link Model} to
   * {@link Model.baseModel}. Operations from extended interfaces are copied
   * into {@link Interface.operations}.
   */
  sourceInterfaces: Interface[];

  /**
   * The operations of the interface.
   *
   * Operations are ordered in the order that they appear in the source.
   * Operations obtained via `interface extends` appear before operations
   * declared in the interface body.
   */
  operations: RekeyableMap<string, Operation>;

  /**
   * Late-bound symbol of this interface type.
   * @internal
   */
  symbol?: Sym;
}

/** An ordered set of named members with optional explicit string or numeric values. */
export interface Enum extends BaseType, DecoratedType {
  /** Discriminant for enum types rather than individual members. */
  kind: "Enum";
  /** Declared name, or an empty string for an anonymous enum expression. */
  name: string;
  node?: EnumStatementNode | EnumDeclarationExpressionNode;
  /** Containing namespace, when associated with a namespace. */
  namespace?: Namespace;

  /**
   * Whether this enum was declared in expression position (anonymous `enum { ... }`)
   * rather than as a named statement.
   */
  expression: boolean;

  /**
   * The members of the enum.
   *
   * Members are ordered in the order that they appear in source. Members
   * obtained via `...` are inserted where the spread appears in source.
   */
  members: RekeyableMap<string, EnumMember>;

  /**
   * Late-bound symbol of this enum type.
   * @internal
   */
  symbol?: Sym;
}

/** A named enum entry retaining both its owning enum and any spread source. */
export interface EnumMember extends BaseType, DecoratedType {
  /** Discriminant for a member declaration rather than an enum value wrapper. */
  kind: "EnumMember";
  /** Member name, distinct from any explicitly assigned value. */
  name: string;
  /** Owning enum; spread copies belong to the receiving enum. */
  enum: Enum;
  node?: EnumMemberNode;
  /** Explicitly assigned value, or undefined for a member declared with only a name. */
  value?: string | number;
  /**
   * when spread operators make new enum members,
   * this tracks the enum member we copied from.
   */
  sourceMember?: EnumMember;
}

/** A callable API signature, declared in a namespace or owned by an interface. */
export interface Operation extends BaseType, DecoratedType, TemplatedTypeBase {
  /** Discriminant for API operation signatures rather than TypeSpec function values. */
  kind: "Operation";
  node?: OperationStatementNode;
  /** Local operation name, excluding namespace and interface qualifiers. */
  name: string;
  /** Containing namespace, including for operations declared inside an interface. */
  namespace?: Namespace;
  /** Owning interface, or absent for a namespace-level operation. */
  interface?: Interface;
  /** Model whose properties describe the operation's ordered parameters. */
  parameters: Model;
  /** Result type, including the `void` intrinsic for an operation without a return value. */
  returnType: Type;

  /**
   * The operation that is referenced via `op is`.
   */
  sourceOperation?: Operation;
}

/** A declaration container; nested namespaces link to their parent and the global namespace is unnamed. */
export interface Namespace extends BaseType, DecoratedType {
  /** Discriminant for namespace containers rather than their declarations. */
  kind: "Namespace";
  /** Local namespace segment, or an empty string for the global namespace. */
  name: string;
  /** Parent namespace; absent on the global namespace. */
  namespace?: Namespace;
  node?: NamespaceStatementNode | JsNamespaceDeclarationNode;

  /**
   * The models in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  models: Map<string, Model>;

  /**
   * The scalars in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  scalars: Map<string, Scalar>;

  /**
   * The operations in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  operations: Map<string, Operation>;

  /**
   * The sub-namespaces in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  namespaces: Map<string, Namespace>;

  /**
   * The interfaces in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  interfaces: Map<string, Interface>;

  /**
   * The enums in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  enums: Map<string, Enum>;

  /**
   * The unions in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  unions: Map<string, Union>;

  /**
   * The decorators declared in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  decoratorDeclarations: Map<string, Decorator>;

  /**
   * The functions declared in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  functionDeclarations: Map<string, FunctionValue>;
}

/** Singleton primitive types, distinct from the corresponding checked value objects. */
export type LiteralType = StringLiteral | NumericLiteral | BooleanLiteral;

/** Singleton type accepting exactly one string. */
export interface StringLiteral extends BaseType {
  /** Discriminant for string literal types, not the `string` scalar. */
  kind: "String";
  node?: StringLiteralNode;
  /** String accepted by this singleton type. */
  value: string;
}

/** Singleton numeric type retaining exact numeric contents alongside a JavaScript projection. */
export interface NumericLiteral extends BaseType {
  /** Discriminant for numeric literal types, not numeric scalar declarations. */
  kind: "Number";
  node?: NumericLiteralNode;
  /** JavaScript numeric projection; use numericValue when precision or range matters. */
  value: number;
  /** Exact numeric contents, without JavaScript number rounding. */
  numericValue: Numeric;
  /** Source spelling, or synthesized numeric text for a programmatically created literal. */
  valueAsString: string;
}

/** Singleton type accepting exactly one boolean. */
export interface BooleanLiteral extends BaseType {
  /** Discriminant for boolean literal types, not the `boolean` scalar. */
  kind: "Boolean";
  node?: BooleanLiteralNode;
  /** Boolean accepted by this singleton type. */
  value: boolean;
}

/** A string template type retaining its literal text and interpolated types as separate spans. */
export interface StringTemplate extends BaseType {
  /** Discriminant for a template type rather than a concrete string value. */
  kind: "StringTemplate";
  /** If the template can be render as as string this is the string value */
  stringValue?: string;
  node?: StringTemplateExpressionNode;
  /** Text and interpolated types in source order, including any empty text spans. */
  spans: StringTemplateSpan[];
}

/** One part of a string template, narrowed by isInterpolated rather than by kind. */
export type StringTemplateSpan = StringTemplateSpanLiteral | StringTemplateSpanValue;

/** Literal text between interpolations in a string template. */
export interface StringTemplateSpanLiteral extends BaseType {
  /** Shared span discriminant; use isInterpolated to distinguish text from interpolation. */
  kind: "StringTemplateSpan";
  node?: StringTemplateHeadNode | StringTemplateMiddleNode | StringTemplateTailNode;
  /** Marks source text rather than an interpolated expression, even when the text is empty. */
  isInterpolated: false;
  /** Singleton string type holding this span's text. */
  type: StringLiteral;
}

/** An interpolated type in a string template, including interpolated string literal types. */
export interface StringTemplateSpanValue extends BaseType {
  /** Shared span discriminant; use isInterpolated to distinguish interpolation from text. */
  kind: "StringTemplateSpan";
  node?: Expression;
  /** Marks an interpolation even when its type is a string literal. */
  isInterpolated: true;
  /** Interpolated type, which may not be renderable as a concrete string. */
  type: Type;
}

/** A fixed sequence of element types, distinct from an array value or indexed model. */
export interface Tuple extends BaseType {
  /** Discriminant for tuple types rather than array values. */
  kind: "Tuple";
  node?: TupleExpressionNode | ArrayLiteralNode;
  /** Element types in tuple position order. */
  values: Type[];
}

/** Alternatives described by ordered variants, from either a union declaration or an expression. */
export interface Union extends BaseType, DecoratedType, TemplatedTypeBase {
  /** Discriminant for a union of types rather than a single variant. */
  kind: "Union";
  /** Declared name, when present; expression unions can also retain a declaration-expression name. */
  name?: string;
  node?: UnionExpressionNode | UnionStatementNode | UnionDeclarationExpressionNode;
  /** Containing namespace, when associated with a namespace. */
  namespace?: Namespace;

  /**
   * The variants of the union.
   *
   * Variants are ordered in order that they appear in source.
   */
  variants: RekeyableMap<string | symbol, UnionVariant>;

  /** Whether the union is used in expression position, including both `A | B` and `union { ... }`. */
  expression: boolean;

  /**
   * Type declared with the `extends` clause of a union statement. Union variants are
   * constrained to be assignable to this model, scalar, enum, or union; violations are
   * reported as diagnostics.
   *
   * Validation is deferred for uninstantiated template declarations because their variants
   * can contain unresolved template parameters. Each template instance is validated instead.
   *
   * This is only set for named unions declared with an `extends` clause. It documents a
   * constraint: it does **not** imply a subclassing relationship, it does **not** mean the
   * union is extensible, and it has no interaction with `@discriminator`.
   *
   * Emitters should not require this to be present: a union with the same variants and no
   * `extends` clause should ideally be handled the same way.
   *
   * @experimental
   */
  baseType?: Model | Scalar | Enum | Union;

  /**
   * Late-bound symbol of this interface type.
   * @internal
   */
  symbol?: Sym;
}

/** One alternative of a union, with either a declared name or an anonymous symbol key. */
export interface UnionVariant extends BaseType, DecoratedType {
  /** Discriminant for a union alternative rather than the alternative's value type. */
  kind: "UnionVariant";
  /** Declared variant name, or a unique symbol for an unnamed alternative. */
  name: string | symbol;
  node?: UnionVariantNode | undefined;
  /** Type accepted by this alternative. */
  type: Type;
  /** Owning union; flattened union expressions can reuse variants owned by another union. */
  union: Union;
}

/**
 * This is a type you should never see in the program.
 * If you do you might be missing a `isTemplateDeclaration` check to exclude that type.
 * Working with template declaration is not something that is currently supported.
 *
 * @experimental
 */
export interface TemplateParameter extends BaseType {
  /** Discriminant for an unresolved template parameter rather than a substituted argument. */
  kind: "TemplateParameter";
  /** @internal */
  node: TemplateParameterDeclarationNode;
  /** @internal */
  constraint?: MixedParameterConstraint;
  /** @internal */
  default?: Type | Value | IndeterminateEntity;
}

/**
 * This is a type you should never see in the program.
 * If you do you might be missing a `isTemplateDeclaration` check to exclude that type.
 * Working with template declarations is not something that is currently supported.
 *
 * `TemplateParameterAccess` represents a member or meta-member access rooted in a template
 * parameter inside a template declaration, such as `T.id` or `T::returnType`.
 *
 * @experimental
 */
export interface TemplateParameterAccess extends BaseType {
  /** Discriminant for unresolved member access rooted in a template parameter. */
  kind: "TemplateParameterAccess";
  /** @internal */
  node: MemberExpressionNode;
  /**
   * The base of this template parameter access, which could be another template parameter access for chained accesses like `T.id.name`.
   *
   * @internal
   */
  base: TemplateParameter | TemplateParameterAccess;
  /**
   * Valid source-form access path like `T.id`, `T::returnType`, or `T.\`model\`::type`.
   *
   * @internal
   */
  path: string;
  /**
   * The type or value constraint of this template parameter access.
   *
   * The constraint is used to determine assignability in template declarations.
   *
   * @internal
   */
  constraint?: MixedParameterConstraint;
}

/** A checked TypeSpec decorator declaration, distinct from an application of that decorator. */
export interface Decorator extends BaseType {
  /** Discriminant for decorator declarations rather than decorator applications. */
  kind: "Decorator";
  node?: DecoratorDeclarationStatementNode;
  /** Local decorator name including its leading `@`, without namespace qualifiers. */
  name: `@${string}`;
  /** Declaring namespace, including the global namespace for unqualified declarations. */
  namespace: Namespace;
  /** Constraint on the decorated target, separate from custom arguments. */
  target: MixedFunctionParameter;
  /** Custom parameter constraints in declaration order, excluding the target. */
  parameters: MixedFunctionParameter[];
  /** JavaScript implementation receiving the context, target, and marshalled custom arguments. */
  implementation: (ctx: DecoratorContext, target: Type, ...args: unknown[]) => void;
  /** How this decorator was declared. */
  declarationKind: "extern" | "auto";
}

/**
 * The type of a Function in TypeSpec.
 */
export interface FunctionType extends BaseType {
  /** Discriminant for a function signature constraint rather than a callable function value. */
  kind: "FunctionType";

  /**
   * The parameter constraints of the function.
   */
  parameters: MixedFunctionParameter[];

  /**
   * The return type constraint of the function.
   */
  returnType: MixedParameterConstraint;
}

/**
 * A function (`fn`) declared in the TypeSpec program.
 *
 * By default, function values have very restrictive types, where the parameters have type `never`, and the return type is `unknown`.
 *
 * To call a function, you must assert the type of the parameters. For example, if you have a `FunctionValue` that represents
 * the following TypeSpec function:
 *
 * ```tsp
 * extern fn example(a: valueof string, b: valueof int32): valueof boolean;
 * ```
 *
 * You can assert the parameter types in TypeScript like this:
 *
 * ```ts
 * const exampleFn: FunctionValue = ...; // however you obtain a reference to the function value, it will be strictly typed.
 *
 * const assertedExampleFn = exampleFn as FunctionValue<[a: string, b: number], boolean>;
 *
 * // Now you can call assertedExampleFn with the correct types:
 * ctx.callFunction(assertedExampleFn.implementation, "hello", 10);
 * ```
 */
export interface FunctionValue<
  Parameters extends unknown[] = never[],
  ReturnType = unknown,
> extends BaseValue {
  /** Discriminant for callable function values rather than data values. */
  valueKind: "Function";
  /** Source `fn` declaration, when the function originates in a declaration. */
  node?: FunctionDeclarationStatementNode;
  /**
   * The function's name as declared in the TypeSpec source, if any.
   */
  name?: string;
  /**
   * The namespace in which this function was declared, if any.
   */
  namespace?: Namespace;
  /**
   * The parameters of the function.
   */
  parameters: MixedFunctionParameter[];
  /**
   * The return type constraint of the function.
   */
  returnType: MixedParameterConstraint;
  /**
   * The JavaScript implementation of the function.
   *
   * WARNING: Calling the implementation function directly is dangerous. It assumes that you have marshaled the arguments
   * to JS values correctly and that you will handle the return value appropriately. Constructing the correct context
   * is your responsibility (use the `call` methods of `FunctionContext` or `DecoratorContext` to create the context for you).
   *
   * @param ctx - The FunctionContext providing information about the call site.
   * @param args - The arguments passed to the function.
   * @returns The return value of the function, which is arbitrary.
   */
  implementation: (ctx: FunctionContext, ...args: Parameters) => ReturnType;
}

/** Signature entry shared by function, decorator, and scalar-constructor parameters. */
export interface FunctionParameterBase extends BaseType {
  /** Shared parameter discriminant; mixed selects the constraint representation. */
  kind: "FunctionParameter";
  node?: FunctionParameterNode;
  /**
   * The name of this function parameter, as declared in the TypeSpec source.
   */
  name: string;
  /**
   * Whether this parameter is optional.
   */
  optional: boolean;
  /**
   * Whether this parameter is a rest parameter (i.e., `...args`).
   */
  rest: boolean;
}

/**
 * A function parameter with a mixed parameter constraint that could accept a value.
 */
export interface MixedFunctionParameter extends FunctionParameterBase {
  /** Selects independent type and value alternatives instead of a simple type constraint. */
  mixed: true;
  /** Constraint describing the types or values that may be supplied. */
  type: MixedParameterConstraint;
}

/**
 * A function parameter with a simple type constraint.
 */
export interface SignatureFunctionParameter extends FunctionParameterBase {
  /** Selects a single type constraint instead of mixed type and value alternatives. */
  mixed: false;
  /** Type required for values supplied to this signature parameter. */
  type: Type;
}

/**
 * A function parameter.
 */
export type FunctionParameter = MixedFunctionParameter | SignatureFunctionParameter;

/**
 * Binding identity used for name lookup before and during type checking.
 * Declaration symbols collect contributing nodes in `declarations`; expression and
 * late-bound symbols instead use `node` or `type`.
 */
export interface Sym {
  /** Combined category, visibility, and binding-state bits for this symbol. */
  readonly flags: SymbolFlags;

  /**
   * Nodes which contribute to this declaration, present if SymbolFlags.Declaration is set.
   */
  readonly declarations: readonly Node[];

  /**
   * Node which resulted in this symbol, present if SymbolFlags.Declaration is not set.
   * May be undefined if the symbol was created without a node (e.g. built-in symbols like `null`).
   */
  readonly node: Node | undefined;

  /**
   * The name of the symbol
   */
  readonly name: string;

  /**
   * A unique identifier for this symbol. Used to look up the symbol links.
   */
  readonly id?: number;

  /**
   * The symbol containing this symbol, if any. E.g. for things declared in
   * a namespace, this refers to the namespace.
   */
  readonly parent?: Sym;

  /**
   * Externally visible symbols contained inside this symbol. E.g. all declarations
   * in a namespace, or members of an enum.
   */
  readonly exports?: SymbolTable;

  /**
   * Symbols for members of this symbol which must be referenced off the parent symbol
   * and cannot be referenced by other means (i.e. by unqualified lookup of the symbol
   * name).
   */
  readonly members?: SymbolTable;

  /**
   * Metatype members selected with `::`, such as an operation's `parameters`.
   */
  readonly metatypeMembers?: SymbolTable;

  /**
   * For using symbols, this is the used symbol.
   */
  readonly symbolSource?: Sym;

  /**
   * For late-bound symbols, this is the type referenced by the symbol.
   */
  readonly type?: Type;

  /**
   * For decorator and function symbols, this is the JS function implementation.
   */
  readonly value?: (...args: any[]) => any;
}

export interface SymbolLinks {
  type?: Type;

  /** For types that can be instanitated this is the type of the declaration */
  declaredType?: Type;
  /** For types that can be instanitated those are the types per instantiation */
  instantiations?: TypeInstantiationMap;

  /** For const statements the value of the const */
  value?: Value | null;

  /**
   * When a symbol contains unknown members, symbol lookup during
   * name resolution should always return unknown if it can't definitely
   * find a member.
   */
  hasUnknownMembers?: boolean;

  /**
   * True if we have completed the early binding of member symbols for this model during
   * the name resolution phase.
   */
  membersBound?: boolean;

  /**
   * The symbol aliased by an alias symbol. When present, guaranteed to be a
   * non-alias symbol. Will not be present when the name resolver could not
   * determine a symbol for the alias, e.g. when it is a computed type.
   */
  aliasedSymbol?: Sym;

  /**
   * The result of resolving the aliased reference. When resolved, aliasedSymbol
   * will contain the resolved symbol. Otherwise, aliasedSymbol may be present
   * if the alias is a type literal with a symbol, otherwise it will be
   * undefined.
   */
  aliasResolutionResult?: ResolutionResultFlags;

  // TODO: any better idea?
  aliasResolutionIsTemplate?: boolean;

  /**
   * The symbol for the constraint of a type parameter. Will not be present when
   * the name resolver could not determine a symbol for the constraint, e.g.
   * when it is a computed type.
   */
  constraintSymbol?: Sym;

  /**
   * The result of resolving the type parameter constraint. When resolved,
   * constraintSymbol will contain the resolved symbol. Otherwise,
   * constraintSymbol may be present if the constraint is a type literal with a
   * symbol, otherwise it will be undefined.
   */
  constraintResolutionResult?: ResolutionResultFlags;
}

export interface ResolutionResult {
  resolutionResult: ResolutionResultFlags;
  isTemplateInstantiation?: boolean;
  resolvedSymbol: Sym | undefined;
  finalSymbol: Sym | undefined;
  ambiguousSymbols?: Sym[];
}

export interface NodeLinks {
  /** the result of type checking this node */
  resolvedType?: Type;

  /**The syntax symbol resolved by this node. */
  resolvedSymbol?: Sym;

  /** If the resolvedSymbol is an alias point to the symbol the alias reference(recursively), otherwise is the same as resolvedSymbol */
  finalSymbol?: Sym | undefined;

  /**
   * If the link involve template argument.
   * Note that this only catch if template arguments are used. If referencing the default instance(e.g Foo for Foo<string = "abc">) this will not be set to true.
   * This is by design as the symbol reference has different meaning depending on the context:
   * - For augment decorator it would reference the template declaration
   * - For type references it would reference the default instance.
   */
  isTemplateInstantiation?: boolean;

  /**
   * The result of resolution of this reference node.
   *
   * When the the result is `Resolved`, `resolvedSymbol` contains the result.
   **/
  resolutionResult?: ResolutionResultFlags;

  /** If the resolution result is Ambiguous list of symbols that are */
  ambiguousSymbols?: Sym[];
}

export enum ResolutionResultFlags {
  None = 0,
  Resolved = 1 << 1,
  Unknown = 1 << 2,
  Ambiguous = 1 << 3,
  NotFound = 1 << 4,

  ResolutionFailed = Unknown | Ambiguous | NotFound,
}

/**
 * @hidden bug in typedoc
 */
export interface SymbolTable extends ReadonlyMap<string, Sym> {
  /**
   * Duplicate
   */
  readonly duplicates: ReadonlyMap<Sym, ReadonlySet<Sym>>;
}

export interface MutableSymbolTable extends SymbolTable {
  set(key: string, value: Sym): void;

  /**
   * Put the symbols in the source table into this table.
   * @param source table to copy
   * @param parentSym Parent symbol that the source symbol should update to.
   */
  include(source: SymbolTable, parentSym?: Sym): void;
}

/**
 * Bit flags describing a symbol's category and how it is bound.
 * Category bits may be combined with flags such as `Declaration`, `Member`, or `Internal`.
 */
// prettier-ignore
export const enum SymbolFlags {
  /** No category or binding-state bits are set. */
  None                  = 0,
  /** A model declaration or structural model expression. */
  Model                 = 1 << 1,
  /** A scalar declaration, including a scalar declaration expression. */
  Scalar                = 1 << 2,
  /** An operation, either namespace-level or an interface member. */
  Operation             = 1 << 3,
  /** An enum whose members can be looked up by name. */
  Enum                  = 1 << 4,
  /** An interface containing operation members. */
  Interface             = 1 << 5,
  /** A keyword-form union containing variant members. */
  Union                 = 1 << 6,
  /** An alias whose target must be resolved before accessing the underlying type. */
  Alias                 = 1 << 7,
  /** A namespace that can merge declarations and export contained symbols. */
  Namespace             = 1 << 8,
  /** A decorator signature or JavaScript decorator implementation. */
  Decorator             = 1 << 9,
  /** A parameter declared in a template's `<...>` list. */
  TemplateParameter     = 1 << 10,
  /** A function signature or JavaScript function implementation. */
  Function              = 1 << 11,
  /** A named parameter in a function, decorator, or scalar constructor signature. */
  FunctionParameter     = 1 << 12,
  /** A lookup binding introduced by `using`, forwarding to `symbolSource`. */
  Using                 = 1 << 13,
  /** A using binding made ambiguous by another using binding with the same name. */
  DuplicateUsing        = 1 << 14,
  /** A file-level container for exported declarations. */
  SourceFile            = 1 << 15,
  /** A symbol accessed as a member of its containing model, scalar, enum, union, or interface. */
  Member                = 1 << 16,
  /** A constant declaration whose initializer produces a value. */
  Const                 = 1 << 17,


  /**
   * A symbol which represents a declaration. Such symbols will have at least
   * one entry in the `declarations` array. Non-declaration symbols instead store
   * their originating node in `node`, when one exists.
   */
  Declaration           = 1 << 20,

  /** A JavaScript implementation to be merged with its TypeSpec decorator or function signature. */
  Implementation        = 1 << 21,
  
  /**
   * A symbol which was late-bound, in which case, the type referred to
   * by this symbol is stored directly in the symbol.
   */
  LateBound = 1 << 22,

  /**
   * An internal symbol that can only be referenced from a source file in the same package.
   */
  Internal = 1 << 23,

  /** Categories that store contained declarations in their `exports` table. */
  ExportContainer = Namespace | SourceFile,
  /**
   * Symbols whose members will be late bound (and stored on the type)
   */
  MemberContainer = Model | Enum | Union | Interface | Scalar,
}

/**
 * Maps type arguments to instantiated type.
 */
export interface TypeInstantiationMap {
  /** Retrieve the cached instantiation for an ordered argument list, or `undefined` if absent. */
  get(args: readonly (Type | Value | IndeterminateEntity)[]): Type | undefined;
  /** Cache an instantiated type under its ordered list of type or value arguments. */
  set(args: readonly (Type | Value | IndeterminateEntity)[], type: Type): void;
}

/**
 * A map where keys can be changed without changing enumeration order.
 * @hidden bug in typedoc
 */
export interface RekeyableMap<K, V> extends Map<K, V> {
  /**
   * Change the given key without impacting enumeration order.
   *
   * @param existingKey Existing key
   * @param newKey New key
   * @returns boolean if updated successfully.
   */
  rekey(existingKey: K, newKey: K): boolean;
}

/**
 * Discriminants for syntax nodes, comment ranges, and documentation nodes.
 * Use a node's `kind` to narrow to its corresponding AST interface.
 */
export enum SyntaxKind {
  /** Root of a parsed TypeSpec file, including statements and parse diagnostics. */
  TypeSpecScript,
  /** Loaded JavaScript module supplying decorator or function implementations. */
  JsSourceFile,
  /** File or package import such as `import "./models.tsp";`. */
  ImportStatement,
  /** Name token, with its decoded spelling available as `sv`. */
  Identifier,
  /** Out-of-line decorator application using `@@decorator(Target, ...)`. */
  AugmentDecoratorStatement,
  /** Decorator application attached to a declaration using `@decorator(...)`. */
  DecoratorExpression,
  /** Compiler directive introduced by `#`, such as `#suppress`. */
  DirectiveExpression,
  /** Qualified name segment selected with `.` or metatype selector `::`. */
  MemberExpression,
  /** Namespace declaration, including blockless and dotted forms. */
  NamespaceStatement,
  /** Namespace import into the current lookup scope using `using`. */
  UsingStatement,
  /** Named operation declaration, either with a signature or an `is` reference. */
  OperationStatement,
  /** Explicit operation parameter list and return type. */
  OperationSignatureDeclaration,
  /** Operation signature reused through an `is` reference. */
  OperationSignatureReference,
  /** Named model declaration registered in its enclosing namespace. */
  ModelStatement,
  /** Structural model type in braces, also used for operation parameter lists. */
  ModelExpression,
  /** Model property or operation parameter, including its type and optional default. */
  ModelProperty,
  /** Model properties copied into a body or parameter list using `...`. */
  ModelSpreadProperty,
  /** Named scalar declaration with optional base scalar and constructors. */
  ScalarStatement,
  /** Named interface declaration containing operations. */
  InterfaceStatement,
  /** Named union declaration containing variant nodes. */
  UnionStatement,
  /** Named or unnamed alternative in a keyword-form union. */
  UnionVariant,
  /** Named enum declaration containing members and member spreads. */
  EnumStatement,
  /** Enum member with an optional explicit string or numeric value. */
  EnumMember,
  /** Members copied from another enum using `...`. */
  EnumSpreadMember,
  /** Type alias declaration, optionally parameterized by template parameters. */
  AliasStatement,
  /** Decorator signature declaration with a separate target parameter. */
  DecoratorDeclarationStatement,
  /** Named function signature declaration, distinct from a function type expression. */
  FunctionDeclarationStatement,
  /** Parameter in a function, decorator, or scalar constructor signature. */
  FunctionParameter,
  /** Infix union type assembled with `|`, not a keyword-form union declaration. */
  UnionExpression,
  /** Intersection type assembled with `&`. */
  IntersectionExpression,
  /** Tuple type written `[A, B]`, not an array value literal. */
  TupleExpression,
  /** Array type formed by an element type followed by `[]`. */
  ArrayExpression,
  /** Quoted string without interpolation. */
  StringLiteral,
  /** Numeric token retaining both its spelling and JavaScript numeric value. */
  NumericLiteral,
  /** The `true` or `false` literal. */
  BooleanLiteral,
  /** Interpolated string with a head and ordered substitution spans. */
  StringTemplateExpression,
  /** Text before the first `${...}` substitution in an interpolated string. */
  StringTemplateHead,
  /** Text between consecutive substitutions in an interpolated string. */
  StringTemplateMiddle,
  /** Text after the final substitution in an interpolated string. */
  StringTemplateTail,
  /** A string substitution expression paired with the text that follows it. */
  StringTemplateSpan,
  /** The `extern` declaration modifier. */
  ExternKeyword,
  /** The `void` type keyword, typically used for an operation with no return value. */
  VoidKeyword,
  /** The `never` type keyword, denoting a type with no possible values. */
  NeverKeyword,
  /** The `unknown` type keyword, represented by {@link AnyKeywordNode}. */
  UnknownKeyword,
  /** Value constraint introduced by `valueof`. */
  ValueOfExpression,
  /** Reference to a name with an optional template argument list. */
  TypeReference,
  /** Template parameter declaration with optional constraint and default. */
  TemplateParameterDeclaration,
  /** Standalone semicolon without a declaration. */
  EmptyStatement,
  /** Recovery node for source that could not be parsed as a valid statement. */
  InvalidStatement,
  /** Single-line comment range collected when comment tracking is enabled. */
  LineComment,
  /** Block comment range, possibly also parsed as documentation. */
  BlockComment,
  /** Parsed documentation comment with body content and tags. */
  Doc,
  /** Text content within a documentation comment or tag. */
  DocText,
  /** Documentation tag describing a function or operation parameter. */
  DocParamTag,
  /** Documentation tag describing a model property. */
  DocPropTag,
  /** Documentation tag describing a return value. */
  DocReturnsTag,
  /** Documentation tag describing error responses. */
  DocErrorsTag,
  /** Documentation tag describing a template parameter. */
  DocTemplateTag,
  /** Documentation tag whose name has no dedicated syntax kind. */
  DocUnknownTag,
  /** Reserved kind; the parser does not currently produce return-statement nodes. */
  Return,
  /** Namespace node synthesized while binding JavaScript implementations. */
  JsNamespaceDeclaration,
  /** Positional or named argument inside a type reference's `<...>` list. */
  TemplateArgument,
  /** Expression introduced by `typeof` to obtain the type of a value. */
  TypeOfExpression,
  /** Object value written `#{ ... }`, distinct from a structural model type. */
  ObjectLiteral,
  /** Named value entry in an object literal. */
  ObjectLiteralProperty,
  /** Properties copied from an object value using `...`. */
  ObjectLiteralSpreadProperty,
  /** Array value written `#[ ... ]`, distinct from a tuple type. */
  ArrayLiteral,
  /** Named constant value with an optional type annotation. */
  ConstStatement,
  /** Function or scalar-constructor invocation with positional arguments. */
  CallExpression,
  /** Named `init` signature declared within a scalar. */
  ScalarConstructor,
  /** The `internal` declaration modifier restricting package visibility. */
  InternalKeyword,
  /** The `auto` modifier requesting a compiler-provided decorator implementation. */
  AutoKeyword,
  /** Anonymous function signature written `fn(...) => ...`. */
  FunctionTypeExpression,
  /** Keyword-form `model` used as an expression without namespace registration. */
  ModelDeclarationExpression,
  /** Keyword-form `scalar` used as an expression without namespace registration. */
  ScalarDeclarationExpression,
  /** Keyword-form `union` used as an expression without namespace registration. */
  UnionDeclarationExpression,
  /** Keyword-form `enum` used as an expression without namespace registration. */
  EnumDeclarationExpression,
}

/** Parser error-state and origin bits attached to syntax nodes. */
export const enum NodeFlags {
  /** No error-state or synthetic-origin bits have been set. */
  None = 0,
  /**
   * If this is set, the DescendantHasError bit can be trusted. If this not set,
   * children need to be visited still to see if DescendantHasError should be
   * set.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  DescendantErrorsExamined = 1 << 0,

  /**
   * Indicates that a parse error was associated with this specific node.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  ThisNodeHasError = 1 << 1,

  /**
   * Indicates that a child of this node (or one of its children,
   * transitively) has a parse error.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  DescendantHasError = 1 << 2,

  /**
   * Indicates that a node was created synthetically and therefore may not be parented.
   */
  Synthetic = 1 << 3,
}

/**
 * Shared source range and metadata for syntax nodes.
 * Parent and binding information need not be available on a freshly parsed or synthetic tree.
 */
export interface BaseNode extends TextRange {
  /** Discriminant used to narrow the node to a specific syntax interface. */
  readonly kind: SyntaxKind;
  /** Enclosing syntax node once parent links have been established; absent at roots. */
  readonly parent?: Node;
  /** Compiler directives attached to this node, in source order when present. */
  readonly directives?: readonly DirectiveExpressionNode[];
  /** Attached documentation comments when documentation parsing is enabled. */
  readonly docs?: readonly DocNode[];
  /** Parse-error cache state and synthetic-origin markers; use `hasParseError` for errors. */
  readonly flags: NodeFlags;
  /**
   * Could be undefined but making this optional creates a lot of noise. In practice,
   * you will likely only access symbol in cases where you know the node has a symbol.
   * @internal
   */
  readonly symbol: Sym;
  /** Unique id across the process used to look up NodeLinks */
  _id?: number;
}

/** Syntax shared by declarations that accept template parameter lists. */
export interface TemplateDeclarationNode {
  /** Parameters in declaration order; empty when no template list was written. */
  readonly templateParameters: readonly TemplateParameterDeclarationNode[];
  /** Range including `<` and `>`; positions are `-1` when the list is absent. */
  readonly templateParametersRange: TextRange;
  /** Local bindings, including template parameters, populated during binding when applicable. */
  readonly locals?: SymbolTable;
}

/**
 * owner node and other related information according to the position
 */
export interface PositionDetail {
  /** Most specific node accepted by the position query, or `undefined` when none matches. */
  readonly node: Node | undefined;
  /** Queried zero-based UTF-16 offset in the source file. */
  readonly position: number;
  /** UTF-16 code unit at `position`, or `NaN` outside the source text. */
  readonly char: number;
  /** UTF-16 code unit immediately before `position`, or `NaN` outside the source text. */
  readonly preChar: number;
  /** UTF-16 code unit immediately after `position`, or `NaN` outside the source text. */
  readonly nextChar: number;
  /** Whether the position query identifies whitespace or comment trivia at this offset. */
  readonly inTrivia: boolean;

  /**
   * if the position is in a trivia, return the start position of the trivia containing the position
   * if the position is not a trivia, return the start position of the trivia before the text(identifier code) containing the position
   *
   * Please be aware that this may not be the pre node in the tree because some non-trivia char is ignored in the tree but will counted here
   *
   * also comments are considered as trivia
   */
  readonly triviaStartPosition: number;
  /**
   * if the position is in a trivia, return the end position (exclude as other 'end' means) of the trivia containing the position
   * if the position is not a trivia, return the end position (exclude as other 'end' means) of the trivia after the node containing the position
   *
   * Please be aware that this may not be the next node in the tree because some non-trivia char is ignored in the tree but will considered here
   *
   * also comments are considered as trivia
   */
  readonly triviaEndPosition: number;
  /** get the PositionDetail of positionBeforeTrivia */
  readonly getPositionDetailBeforeTrivia: () => PositionDetail;
  /** get the PositionDetail of positionAfterTrivia */
  readonly getPositionDetailAfterTrivia: () => PositionDetail;
}

/**
 * Discriminated union of syntax nodes visited by the parser's AST utilities.
 * Comment ranges are tracked separately as {@link Comment}, not as child nodes.
 */
export type Node =
  | TypeSpecScriptNode
  | JsSourceFileNode
  | JsNamespaceDeclarationNode
  | TemplateArgumentNode
  | TemplateParameterDeclarationNode
  | ModelPropertyNode
  | UnionVariantNode
  | OperationStatementNode
  | OperationSignatureDeclarationNode
  | OperationSignatureReferenceNode
  | EnumMemberNode
  | EnumSpreadMemberNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
  | DirectiveExpressionNode
  | Statement
  | Expression
  | FunctionParameterNode
  | StringTemplateSpanNode
  | StringTemplateHeadNode
  | StringTemplateMiddleNode
  | StringTemplateTailNode
  | Modifier
  | DocNode
  | DocContent
  | DocTag
  | ReferenceExpression
  | ObjectLiteralNode
  | ObjectLiteralPropertyNode
  | ObjectLiteralSpreadPropertyNode
  | ScalarConstructorNode
  | ArrayLiteralNode;

/**
 * Node that can be used as template
 */
export type TemplateableNode =
  | ModelStatementNode
  | ModelDeclarationExpressionNode
  | ScalarStatementNode
  | ScalarDeclarationExpressionNode
  | AliasStatementNode
  | InterfaceStatementNode
  | OperationStatementNode
  | UnionStatementNode
  | UnionDeclarationExpressionNode;

/**
 * Node types that can have referencable members
 */
export type MemberContainerNode =
  | ModelStatementNode
  | ModelExpressionNode
  | ModelDeclarationExpressionNode
  | InterfaceStatementNode
  | EnumStatementNode
  | EnumDeclarationExpressionNode
  | UnionStatementNode
  | UnionDeclarationExpressionNode
  | IntersectionExpressionNode
  | ScalarStatementNode
  | ScalarDeclarationExpressionNode;

/** Syntax declarations that introduce members of a model, enum, interface, union, or scalar. */
export type MemberNode =
  | ModelPropertyNode
  | EnumMemberNode
  | OperationStatementNode
  | UnionVariantNode
  | ScalarConstructorNode;

/** Semantic types whose named members can be resolved through member access. */
export type MemberContainerType = Model | Enum | Interface | Union | Scalar;

/**
 * Type that can be used as members of a container type.
 */
export type MemberType = ModelProperty | EnumMember | Operation | UnionVariant | ScalarConstructor;

/** Source comment ranges collected separately from the syntax tree when requested by {@link ParseOptions}. */
export type Comment = LineComment | BlockComment;

/** Range of a `//` comment, excluding the terminating line break. */
export interface LineComment extends TextRange {
  /** Identifies a line-comment range rather than a block-comment range. */
  readonly kind: SyntaxKind.LineComment;
}
/** Range of a `/* ... *\/` comment, including its delimiters. */
export interface BlockComment extends TextRange {
  /** Identifies a block-comment range, including documentation comments. */
  readonly kind: SyntaxKind.BlockComment;
  /** If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. */
  readonly parsedAsDocs?: boolean;
}

/** Controls optional comment collection and documentation parsing without changing the source text. */
export interface ParseOptions {
  /** When true, collect comment ranges in {@link TypeSpecScriptNode.comments}. */
  readonly comments?: boolean;
  /** When true, parse doc comments into {@link Node.docs}. */
  readonly docs?: boolean;
}

/**
 * Root syntax node for a TypeSpec source file.
 * Parsing creates statements and diagnostics; binding later populates namespace,
 * using, and local-symbol indexes without replacing the source-order statement tree.
 */
export interface TypeSpecScriptNode extends BaseNode {
  /** Identifies a TypeSpec file root, rather than a loaded JavaScript module. */
  readonly kind: SyntaxKind.TypeSpecScript;
  /** Synthetic identifier whose spelling is the source file path. */
  readonly id: IdentifierNode;
  /** Top-level statements in source order, including recovery and empty statements. */
  readonly statements: readonly Statement[];
  /** Source text and path from which this tree was parsed. */
  readonly file: SourceFile;
  /** Blockless file namespace and its enclosing namespace segments, populated during binding. */
  readonly inScopeNamespaces: readonly NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  /** All namespace declaration nodes encountered during binding, including nested segments. */
  readonly namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  /** Using statements from all scopes in this file, collected during binding. */
  readonly usings: readonly UsingStatementNode[];
  /** Source-order comment ranges; empty unless comment collection was requested. */
  readonly comments: readonly Comment[];
  /** Diagnostics produced while parsing, independent of later binding and checking diagnostics. */
  readonly parseDiagnostics: readonly Diagnostic[];
  /** Whether parser recovery left a tree that the formatter can safely print. */
  readonly printable: boolean; // If this ast tree can safely be printed/formatted.
  /** File-local lookup bindings; initialized by the binder, not by parsing alone. */
  readonly locals: SymbolTable;
  /** Options supplied to the parser for this tree. */
  readonly parseOptions: ParseOptions; // Options used to parse this file
}

/**
 * AST node variants representable in a statement list, including declarations and recovery nodes.
 * The union also includes call expressions, but the parser does not accept standalone call statements.
 */
export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | ScalarStatementNode
  | NamespaceStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | UsingStatementNode
  | EnumStatementNode
  | AliasStatementNode
  | OperationStatementNode
  | DecoratorDeclarationStatementNode
  | FunctionDeclarationStatementNode
  | AugmentDecoratorStatementNode
  | ConstStatementNode
  | CallExpressionNode
  | EmptyStatementNode
  | InvalidStatementNode;

/**
 * Shared shape for named statement declarations.
 * Parsed modifiers preserve source order and may include combinations later rejected by the checker.
 */
export interface DeclarationNode {
  /**
   * Identifier that this node declares.
   */
  readonly id: IdentifierNode;

  /**
   * Modifier nodes applied to this declaration.
   */
  readonly modifiers: Modifier[];

  /**
   * Combined modifier flags for this declaration.
   */
  readonly modifierFlags: ModifierFlags;
}

/**
 * Declaration node whose identifier is optional. Used by declaration-expression nodes
 * (e.g. `alias Foo = enum { a, b }`), which may be anonymous (no `id`) or carry a name
 * that is kept on the resulting type but never registered in a namespace.
 */
export interface OptionallyNamedDeclarationNode {
  /**
   * Identifier that this node declares. May be undefined when the declaration is used
   * as an anonymous expression.
   */
  readonly id?: IdentifierNode;

  /**
   * Modifier nodes applied to this declaration. Empty for parsed declaration expressions.
   */
  readonly modifiers: Modifier[];

  /**
   * Combined modifier flags for this declaration. `None` for parsed declaration expressions.
   */
  readonly modifierFlags: ModifierFlags;
}

/** Statement variants that introduce a named declaration and carry declaration modifiers. */
export type Declaration = Extract<Statement, DeclarationNode>;

/** Syntax nodes used as lexical scopes for declaration and reference lookup. */
export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode
  | TypeSpecScriptNode
  | JsSourceFileNode;

/** File or package import written `import "path";` at the source-file level. */
export interface ImportStatementNode extends BaseNode {
  /** Distinguishes module loading from namespace lookup through a `using` statement. */
  readonly kind: SyntaxKind.ImportStatement;
  /** Quoted module specifier; its decoded value may be a relative path or package name. */
  readonly path: StringLiteralNode;
  /** Source file containing the import once parent links have been established. */
  readonly parent?: TypeSpecScriptNode;
}

/** Name token used for declarations, references, member selectors, and other named syntax. */
export interface IdentifierNode extends BaseNode {
  /** Identifies the name token itself, not a reference or declaration containing it. */
  readonly kind: SyntaxKind.Identifier;
  /**
   * Decoded name without quoting or escapes; identifier tokens are NFC-normalized.
   * Read the source range instead when the original spelling is needed.
   */
  readonly sv: string;
}

/** An `@decorator(...)` annotation attached to a declaration or member. */
export interface DecoratorExpressionNode extends BaseNode {
  /** Distinguishes an attached annotation from an out-of-line `@@` application. */
  readonly kind: SyntaxKind.DecoratorExpression;
  /** Decorator name, without the leading `@`, optionally qualified by a namespace. */
  readonly target: IdentifierNode | MemberExpressionNode;
  /** Explicit arguments in source order; the decorated entity is supplied separately by the checker. */
  readonly arguments: readonly Expression[];
}

/** An out-of-line decorator application, such as `@@doc(MyModel, "description");`. */
export interface AugmentDecoratorStatementNode extends BaseNode {
  /** Identifies the `@@` statement form rather than a declaration annotation. */
  readonly kind: SyntaxKind.AugmentDecoratorStatement;
  /** Decorator name without the leading `@@`. */
  readonly target: IdentifierNode | MemberExpressionNode;
  /** First source argument: the reference to the entity being decorated. */
  readonly targetType: TypeReferenceNode;
  /** Remaining source arguments, excluding the decorated entity reference. */
  readonly arguments: readonly Expression[];
  /** Containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/** A line-oriented compiler directive, such as `#suppress "code" "reason"`. */
export interface DirectiveExpressionNode extends BaseNode {
  /** Identifies a `#` directive rather than an `@` decorator annotation. */
  readonly kind: SyntaxKind.DirectiveExpression;
  /** Directive name without the leading `#`. */
  readonly target: IdentifierNode;
  /** Identifier or quoted-string arguments before the terminating newline. */
  readonly arguments: readonly DirectiveArgument[];
}

/** Directive arguments are names or quoted strings, not arbitrary TypeSpec expressions. */
export type DirectiveArgument = StringLiteralNode | IdentifierNode;

/**
 * Syntax accepted in expression positions, including type expressions and value-producing syntax.
 * Whether an expression denotes a type, value, or constraint is determined during checking.
 */
export type Expression =
  | ArrayExpressionNode
  | MemberExpressionNode
  | ModelExpressionNode
  | ModelDeclarationExpressionNode
  | EnumDeclarationExpressionNode
  | UnionDeclarationExpressionNode
  | ScalarDeclarationExpressionNode
  | ObjectLiteralNode
  | ArrayLiteralNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IntersectionExpressionNode
  | TypeReferenceNode
  | ValueOfExpressionNode
  | TypeOfExpressionNode
  | CallExpressionNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | StringTemplateExpressionNode
  | VoidKeywordNode
  | NeverKeywordNode
  | AnyKeywordNode
  | FunctionTypeExpressionNode;

export type ParenthesizedExpression = Expression & { readonly parenthesized: true };

/** Name-reference syntax accepted by resolution utilities, including the intrinsic `void` and `never` keywords. */
export type ReferenceExpression =
  TypeReferenceNode | MemberExpressionNode | IdentifierNode | VoidKeywordNode | NeverKeywordNode;

/** One step of a qualified reference, such as `Namespace.Type` or `Operation::parameters`. */
export interface MemberExpressionNode extends BaseNode {
  /** Identifies a selected name segment rather than a complete reference with template arguments. */
  readonly kind: SyntaxKind.MemberExpression;
  /** Name immediately following this node's selector. */
  readonly id: IdentifierNode;
  /** Reference prefix to the left of the selector; longer chains nest through this property. */
  readonly base: MemberExpressionNode | IdentifierNode;
  /** `.` selects namespace or type members; `::` selects compiler-provided metatype members. */
  readonly selector: "." | "::";
}

/**
 * One segment of a namespace declaration.
 * Dotted namespaces are nested nodes, while a blockless namespace scopes subsequent file statements.
 */
export interface NamespaceStatementNode extends BaseNode, DeclarationNode {
  /** Identifies a source namespace declaration, not a namespace synthesized for JavaScript. */
  readonly kind: SyntaxKind.NamespaceStatement;
  /**
   * Block statements, a nested segment of a dotted name, or `undefined` for the
   * innermost segment of a blockless namespace.
   */
  readonly statements?: readonly Statement[] | NamespaceStatementNode;
  /** Annotations on this segment; outer segments synthesized for a dotted name have none. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Local lookup bindings initialized during binding, separate for each declaration of a merged namespace. */
  readonly locals?: SymbolTable;
  /** Enclosing file or namespace segment after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/** Brings a namespace's exported names into the containing lookup scope without loading a module. */
export interface UsingStatementNode extends BaseNode {
  /** Identifies namespace lookup syntax rather than a file import. */
  readonly kind: SyntaxKind.UsingStatement;
  /** Namespace reference to make available for unqualified name lookup. */
  readonly name: IdentifierNode | MemberExpressionNode;
  /** Syntactic container after binding; effective blockless namespace scope is in `scopeNamespace`. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;

  /**
   * Namespace this using statement is scoped to.
   * Set by the binder.
   *
   * This is the enclosing namespace for a using declared inside a namespace block, or the file(blockless) namespace
   * if the using is declared after it. It is `undefined` when the using is declared at the file level, before any
   * blockless namespace declaration, in which case its name resolves from the global namespace.
   */
  readonly scopeNamespace?: NamespaceStatementNode;
}

/** Explicit `(parameters): ReturnType` portion of an operation declaration. */
export interface OperationSignatureDeclarationNode extends BaseNode {
  /** Selects the explicit-signature branch of {@link OperationSignature}. */
  readonly kind: SyntaxKind.OperationSignatureDeclaration;
  /** Parameter list represented as model properties and spreads, with parentheses as its body range. */
  readonly parameters: ModelExpressionNode;
  /** Type expression following the signature's colon. */
  readonly returnType: Expression;
}

/** `is BaseOperation` portion of an operation that reuses another operation's signature. */
export interface OperationSignatureReferenceNode extends BaseNode {
  /** Selects signature reuse rather than an explicit parameter list and return type. */
  readonly kind: SyntaxKind.OperationSignatureReference;
  /** Referenced operation, including any explicit template arguments. */
  readonly baseOperation: TypeReferenceNode;
}

/** An operation either declares its own signature or reuses one through `is`. */
export type OperationSignature =
  OperationSignatureDeclarationNode | OperationSignatureReferenceNode;

/**
 * Named operation declared in a namespace or interface.
 * The `op` keyword is optional for interface members, but both forms use this node shape.
 */
export interface OperationStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Identifies the named operation node rather than its signature child. */
  readonly kind: SyntaxKind.OperationStatement;
  /** Explicit signature or reference to an operation whose signature is reused. */
  readonly signature: OperationSignature;
  /** Decorator annotations in source order, not their execution order. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** File, namespace, or interface syntactically containing this operation after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode | InterfaceStatementNode;
}

/** Named model declaration whose checked type is registered in the enclosing namespace. */
export interface ModelStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Distinguishes a namespace declaration from a keyword-form model in expression position. */
  readonly kind: SyntaxKind.ModelStatement;
  /** Own property declarations and spreads in source order; inherited properties are not inserted here. */
  readonly properties: readonly (ModelPropertyNode | ModelSpreadPropertyNode)[];
  /** Range including body braces, or `{-1, -1}` when an `is` declaration has no body. */
  readonly bodyRange: TextRange;
  /** Base model expression following `extends`; mutually exclusive with `is` in parsed syntax. */
  readonly extends?: Expression;
  /** Model expression following `is`, whose properties and decorators are copied by the checker. */
  readonly is?: Expression;
  /** Decorator annotations as written, before semantic evaluation. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Syntactic containing file or namespace after binding, including for blockless namespaces. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * A `model` declaration used in expression position (e.g. `alias M = model { x: string }`
 * or a property type). May carry a name (kept on the resulting type but never registered)
 * and produces a model type with `expression: true`. Checking requires the
 * `declaration-expressions` feature. Template parameters are syntactically accepted
 * for error recovery but rejected by the checker.
 */
export interface ModelDeclarationExpressionNode
  extends BaseNode, OptionallyNamedDeclarationNode, TemplateDeclarationNode {
  /** Identifies keyword-form model syntax in expression position, not a bare `{ ... }` model type. */
  readonly kind: SyntaxKind.ModelDeclarationExpression;
  /** Own property declarations and spreads in source order, before inheritance or copying is resolved. */
  readonly properties: readonly (ModelPropertyNode | ModelSpreadPropertyNode)[];
  /** Range including body braces, or `{-1, -1}` when an `is` expression omits a body. */
  readonly bodyRange: TextRange;
  /** Base model expression following `extends`, absent when `is` is used. */
  readonly extends?: Expression;
  /** Source model expression following `is`, absent when `extends` is used. */
  readonly is?: Expression;
  /** Annotations applied to the resulting model type, not to the enclosing expression's owner. */
  readonly decorators: readonly DecoratorExpressionNode[];
}

/** Named scalar declaration with an optional base scalar and named constructor signatures. */
export interface ScalarStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Distinguishes a namespace scalar declaration from a scalar declaration expression. */
  readonly kind: SyntaxKind.ScalarStatement;
  /** Base scalar reference following `extends`, including any template arguments. */
  readonly extends?: TypeReferenceNode;
  /** Decorator annotations on this scalar in source order. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Constructor signatures written in this body, excluding inherited constructors. */
  readonly members: readonly ScalarConstructorNode[];
  /** Range including constructor-body braces, or `{-1, -1}` for a bodyless declaration. */
  readonly bodyRange: TextRange;
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * A `scalar` declaration used in expression position (e.g. `alias S = scalar extends int32`).
 * May carry a name (kept on the resulting type but never registered) and
 * produces a scalar type with `expression: true`. Checking requires the
 * `declaration-expressions` feature. Template parameters are syntactically accepted
 * for error recovery but rejected by the checker.
 */
export interface ScalarDeclarationExpressionNode
  extends BaseNode, OptionallyNamedDeclarationNode, TemplateDeclarationNode {
  /** Identifies a scalar used as an expression without introducing a namespace binding. */
  readonly kind: SyntaxKind.ScalarDeclarationExpression;
  /** Base scalar reference following `extends`, or `undefined` when omitted. */
  readonly extends?: TypeReferenceNode;
  /** Annotations applied to the scalar type produced by this expression. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Constructor signatures written in the optional scalar body. */
  readonly members: readonly ScalarConstructorNode[];
  /** Range including constructor-body braces, or `{-1, -1}` when no body was written. */
  readonly bodyRange: TextRange;
}

/** Named scalar constructor signature written `init name(parameters);`. */
export interface ScalarConstructorNode extends BaseNode {
  /** Distinguishes a constructor declaration from a call to that constructor. */
  readonly kind: SyntaxKind.ScalarConstructor;
  /** Constructor name following `init`. */
  readonly id: IdentifierNode;
  /** Constructor parameters in source order, using function-parameter syntax rather than model properties. */
  readonly parameters: FunctionParameterNode[];
  /** Scalar declaration or scalar declaration expression containing this signature after binding. */
  readonly parent?: ScalarStatementNode | ScalarDeclarationExpressionNode;
}

/** Named interface declaration grouping operations and optionally extending other interfaces. */
export interface InterfaceStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Identifies an interface declaration, not one of its operation members. */
  readonly kind: SyntaxKind.InterfaceStatement;
  /** Operations explicitly written in this body; inherited operations exist only in the checked type. */
  readonly operations: readonly OperationStatementNode[];
  /** Range including the braces surrounding the operation list. */
  readonly bodyRange: TextRange;
  /** Base interface references in source order; empty when no `extends` clause was written. */
  readonly extends: readonly TypeReferenceNode[];
  /** Annotations on the interface itself, separate from annotations on individual operations. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/** Named keyword-form union whose alternatives may have individually addressable names. */
export interface UnionStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Distinguishes a named union declaration from an infix `|` expression. */
  readonly kind: SyntaxKind.UnionStatement;
  /** Variant nodes in source order, including both named and unnamed alternatives. */
  readonly options: readonly UnionVariantNode[];
  /**
   * Type that every variant of this union must be assignable to.
   *
   * This is a constraint only, it does not imply any subtyping relationship between
   * the union and the base type beyond the one that already exists structurally.
   *
   * @experimental
   */
  readonly extends?: Expression;
  /** Annotations on the union itself, separate from variant annotations. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * A keyword-form `union` declaration used in expression position
 * (e.g. `alias U = union { string, int32 }`). May carry a name (kept on the resulting type
 * but never registered) and produces a union type with `expression: true`.
 * Checking requires the `declaration-expressions` feature. Template parameters
 * are syntactically accepted for error recovery but rejected by the checker.
 */
export interface UnionDeclarationExpressionNode
  extends BaseNode, OptionallyNamedDeclarationNode, TemplateDeclarationNode {
  /** Identifies keyword-form union syntax in expression position, not an infix `|` expression. */
  readonly kind: SyntaxKind.UnionDeclarationExpression;
  /** Named or unnamed variants in source order; retained as members of this union when used in a larger `|`. */
  readonly options: readonly UnionVariantNode[];
  /**
   * Type that every variant of this union must be assignable to.
   *
   * This is a constraint only, it does not imply any subtyping relationship between
   * the union and the base type beyond the one that already exists structurally.
   *
   * @experimental
   */
  readonly extends?: Expression;
  /** Annotations applied to the union type produced by this expression. */
  readonly decorators: readonly DecoratorExpressionNode[];
}

/** One alternative in a keyword-form union, with an optional name before `:`. */
export interface UnionVariantNode extends BaseNode {
  /** Identifies a declaration-body alternative rather than an operand of an infix union. */
  readonly kind: SyntaxKind.UnionVariant;
  /** Explicit variant name; absent for an unnamed alternative such as `string`. */
  readonly id?: IdentifierNode;
  /** Type expression for this alternative, whether or not a name was provided. */
  readonly value: Expression;
  /** Annotations on this variant, not on its containing union. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Containing union declaration or union declaration expression after binding. */
  readonly parent?: UnionStatementNode | UnionDeclarationExpressionNode;
}

/** Named enum declaration containing explicit members and enum spreads. */
export interface EnumStatementNode extends BaseNode, DeclarationNode {
  /** Distinguishes a namespace enum declaration from an enum declaration expression. */
  readonly kind: SyntaxKind.EnumStatement;
  /** Members and spread references as written; spreads are not expanded in the syntax tree. */
  readonly members: readonly (EnumMemberNode | EnumSpreadMemberNode)[];
  /** Annotations on this enum, separate from member annotations. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * An `enum` declaration used in expression position (e.g. `alias E = enum { a, b }`).
 * May carry a name (kept on the resulting type but never registered) and produces
 * an enum type with `expression: true`. Checking requires the `declaration-expressions` feature.
 */
export interface EnumDeclarationExpressionNode extends BaseNode, OptionallyNamedDeclarationNode {
  /** Identifies enum syntax used as an expression without introducing a namespace binding. */
  readonly kind: SyntaxKind.EnumDeclarationExpression;
  /** Members and spreads in source order, before enum spreads are resolved by the checker. */
  readonly members: readonly (EnumMemberNode | EnumSpreadMemberNode)[];
  /** Annotations applied to the enum type produced by this expression. */
  readonly decorators: readonly DecoratorExpressionNode[];
}

/** Enum member declaration with an optional explicit string or numeric literal after `:`. */
export interface EnumMemberNode extends BaseNode {
  /** Identifies an explicit member rather than an enum spread. */
  readonly kind: SyntaxKind.EnumMember;
  /** Member name, including decoded names accepted through quoted-identifier syntax. */
  readonly id: IdentifierNode;
  /** Explicit literal value; absent when the member is declared by name alone. */
  readonly value?: StringLiteralNode | NumericLiteralNode;
  /** Annotations on this member, not its containing enum. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Containing enum declaration or enum declaration expression after binding. */
  readonly parent?: EnumStatementNode | EnumDeclarationExpressionNode;
}

/** An enum-body `...OtherEnum` entry whose members are copied during type checking. */
export interface EnumSpreadMemberNode extends BaseNode {
  /** Distinguishes a spread reference from an explicitly named enum member. */
  readonly kind: SyntaxKind.EnumSpreadMember;
  /** Reference to the enum supplying the copied members. */
  readonly target: TypeReferenceNode;
}

/** Named alias for a type expression, optionally parameterized by template parameters. */
export interface AliasStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  /** Identifies a named alias declaration rather than the expression it aliases. */
  readonly kind: SyntaxKind.AliasStatement;
  /** Expression following `=`, resolved in the alias's template and namespace scope. */
  readonly value: Expression;
  /** Enclosing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/** Named constant value, optionally checked against an explicit type annotation. */
export interface ConstStatementNode extends BaseNode, DeclarationNode {
  /** Identifies a value declaration rather than a type alias. */
  readonly kind: SyntaxKind.ConstStatement;
  /** Initializer following `=`, evaluated as a value by the checker. */
  readonly value: Expression;
  /** Type annotation following `:`, or `undefined` when the value's type is inferred. */
  readonly type?: Expression;
  /** Enclosing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}
/**
 * Invocation of a function or scalar constructor in an expression.
 * Although included in {@link Statement}, the parser does not accept standalone call statements.
 */
export interface CallExpressionNode extends BaseNode {
  /** Distinguishes invocation with `(...)` from a name reference with optional `<...>` arguments. */
  readonly kind: SyntaxKind.CallExpression;
  /** Function name or qualified constructor reference, without the argument list. */
  readonly target: MemberExpressionNode | IdentifierNode;
  /** Explicit argument expressions in source order; no implicit context argument is stored here. */
  readonly arguments: Expression[];
}

/** Recovery placeholder for source that could not form a recognized statement. */
export interface InvalidStatementNode extends BaseNode {
  /** Identifies a parser-recovery node, not a valid declaration. */
  readonly kind: SyntaxKind.InvalidStatement;
  /** Leading decorators retained while recovering from the invalid statement. */
  readonly decorators: readonly DecoratorExpressionNode[];
}

/** Standalone semicolon with no associated declaration or expression. */
export interface EmptyStatementNode extends BaseNode {
  /** Identifies an intentionally empty statement rather than a recovery placeholder. */
  readonly kind: SyntaxKind.EmptyStatement;
}

/**
 * Structural model type written `{ ... }`, also used for operation parameter lists.
 * Unlike a model declaration expression, it has no declaration name, modifiers, or heritage clauses.
 */
export interface ModelExpressionNode extends BaseNode {
  /** Identifies structural model syntax rather than an object value written `#{ ... }`. */
  readonly kind: SyntaxKind.ModelExpression;
  /** Explicit property declarations and spreads in source order, before spreads are expanded. */
  readonly properties: (ModelPropertyNode | ModelSpreadPropertyNode)[];
  /** Range including the surrounding braces, or parentheses when used as an operation parameter list. */
  readonly bodyRange: TextRange;
}

/** Array type formed by applying a postfix `[]` to an element type expression. */
export interface ArrayExpressionNode extends BaseNode {
  /** Identifies an array type rather than an array value literal. */
  readonly kind: SyntaxKind.ArrayExpression;
  /** Expression before this `[]`; nested array types contain another array expression here. */
  readonly elementType: Expression;
}
/** Fixed-length tuple type written `[A, B]`, distinct from an array value `#[a, b]`. */
export interface TupleExpressionNode extends BaseNode {
  /** Identifies tuple type syntax rather than value-literal syntax. */
  readonly kind: SyntaxKind.TupleExpression;
  /** Element type expressions in tuple index order. */
  readonly values: readonly Expression[];
}

/** Property type declaration in a model body, or parameter declaration in an operation signature. */
export interface ModelPropertyNode extends BaseNode {
  /** Identifies an explicitly declared property rather than a property spread. */
  readonly kind: SyntaxKind.ModelProperty;
  /** Property name, decoded from identifier or legacy quoted-name syntax. */
  readonly id: IdentifierNode;
  /** Declared type expression following `:`, not the property's default value. */
  readonly value: Expression;
  /** Property or parameter annotations in source order. */
  readonly decorators: readonly DecoratorExpressionNode[];
  /** Whether `?` was written after the property name. */
  readonly optional: boolean;
  /** Default-value expression following `=`, absent when no default was written. */
  readonly default?: Expression;
  /** Containing model syntax or operation-parameter model after parent links are established. */
  readonly parent?: ModelStatementNode | ModelExpressionNode | ModelDeclarationExpressionNode;
}

/** Model-body or operation-parameter spread written `...SourceModel`. */
export interface ModelSpreadPropertyNode extends BaseNode {
  /** Identifies a spread that contributes properties during checking, not an explicit property node. */
  readonly kind: SyntaxKind.ModelSpreadProperty;
  /** Model reference, including any template arguments, supplying the copied properties. */
  readonly target: TypeReferenceNode;
  /** Containing model syntax or operation-parameter model after binding. */
  readonly parent?: ModelStatementNode | ModelExpressionNode | ModelDeclarationExpressionNode;
}

/** Object value literal written `#{ ... }`, not a structural model type. */
export interface ObjectLiteralNode extends BaseNode {
  /** Distinguishes value-producing object syntax from a model expression. */
  readonly kind: SyntaxKind.ObjectLiteral;
  /** Property initializers and object spreads in source order, before evaluation. */
  readonly properties: (ObjectLiteralPropertyNode | ObjectLiteralSpreadPropertyNode)[];
  /** Range including the `#{` opening token and closing brace. */
  readonly bodyRange: TextRange;
}

/** Named object-value initializer written `name: expression` inside `#{ ... }`. */
export interface ObjectLiteralPropertyNode extends BaseNode {
  /** Identifies an explicit initializer rather than an object spread. */
  readonly kind: SyntaxKind.ObjectLiteralProperty;
  /** Decoded object property name. */
  readonly id: IdentifierNode;
  /** Initializer expression, evaluated as a value rather than a property type annotation. */
  readonly value: Expression;
  /** Object literal containing this initializer after binding. */
  readonly parent?: ObjectLiteralNode;
}

/** Object-value spread written `...source` inside `#{ ... }`. */
export interface ObjectLiteralSpreadPropertyNode extends BaseNode {
  /** Identifies property copying from an object value rather than from a model type. */
  readonly kind: SyntaxKind.ObjectLiteralSpreadProperty;
  /** Reference to the object value whose properties are copied during evaluation. */
  readonly target: TypeReferenceNode;
  /** Object literal containing this spread after binding. */
  readonly parent?: ObjectLiteralNode;
}

/** Array value literal written `#[ ... ]`, not a tuple type expression. */
export interface ArrayLiteralNode extends BaseNode {
  /** Distinguishes value-producing array syntax from tuple and array type syntax. */
  readonly kind: SyntaxKind.ArrayLiteral;
  /** Element expressions in array index order, evaluated as values. */
  readonly values: readonly Expression[];
}

/** Primitive literal nodes and string-template text fragments; excludes whole templates and structural literals. */
export type LiteralNode =
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | StringTemplateHeadNode
  | StringTemplateMiddleNode
  | StringTemplateTailNode;

/** Quoted string without unescaped interpolation, including triple-quoted strings. */
export interface StringLiteralNode extends BaseNode {
  /** Identifies a complete string literal rather than a fragment of an interpolated string. */
  readonly kind: SyntaxKind.StringLiteral;
  /** Decoded content without delimiters; triple-quoted strings also have indentation removed. */
  readonly value: string;
}

/** Numeric literal retaining its source spelling independently of JavaScript number precision. */
export interface NumericLiteralNode extends BaseNode {
  /** Identifies numeric literal syntax, including decimal, hexadecimal, and binary forms. */
  readonly kind: SyntaxKind.NumericLiteral;
  /** JavaScript `Number` conversion of the token, which may lose precision or overflow. */
  readonly value: number;
  /** Original numeric token spelling, preserving radix, exponent, and precision for exact numeric handling. */
  readonly valueAsString: string;
}

/** Boolean literal written `true` or `false`. */
export interface BooleanLiteralNode extends BaseNode {
  /** Identifies a boolean literal rather than a reference named by an identifier. */
  readonly kind: SyntaxKind.BooleanLiteral;
  /** `true` for the `true` keyword and `false` for the `false` keyword. */
  readonly value: boolean;
}

/** Interpolated string split into initial text and ordered expression/text pairs. */
export interface StringTemplateExpressionNode extends BaseNode {
  /** Identifies a string containing substitutions rather than a plain string literal. */
  readonly kind: SyntaxKind.StringTemplateExpression;
  /** Text before the first substitution, possibly empty. */
  readonly head: StringTemplateHeadNode;
  /** One span per substitution in source order; the final span ends in a tail node. */
  readonly spans: readonly StringTemplateSpanNode[];
}

/** A `${expression}` substitution paired with the string text immediately following it. */
export interface StringTemplateSpanNode extends BaseNode {
  /** Identifies an expression/text pair, not a standalone string token. */
  readonly kind: SyntaxKind.StringTemplateSpan;
  /** Expression inside the substitution's braces. */
  readonly expression: Expression;
  /** Following text: a middle fragment if another substitution follows, otherwise the closing tail. */
  readonly literal: StringTemplateMiddleNode | StringTemplateTailNode;
}

/** Shared decoded-text contract for the head, middle, and tail fragments of an interpolated string. */
export interface StringTemplateLiteralLikeNode extends BaseNode {
  /** Text without string or substitution delimiters, with escapes and triple-quote indentation processed. */
  readonly value: string;

  /** @internal */
  readonly tokenFlags: TokenFlags;
}

/** Opening text fragment before an interpolated string's first `${...}` substitution. */
export interface StringTemplateHeadNode extends StringTemplateLiteralLikeNode {
  /** Identifies the initial fragment stored in {@link StringTemplateExpressionNode.head}. */
  readonly kind: SyntaxKind.StringTemplateHead;
}

/** Text fragment after one substitution and before the next in an interpolated string. */
export interface StringTemplateMiddleNode extends StringTemplateLiteralLikeNode {
  /** Indicates that another substitution follows this fragment. */
  readonly kind: SyntaxKind.StringTemplateMiddle;
}

/** Closing text fragment after the last substitution in an interpolated string. */
export interface StringTemplateTailNode extends StringTemplateLiteralLikeNode {
  /** Indicates that this fragment ends the interpolated string. */
  readonly kind: SyntaxKind.StringTemplateTail;
}

/** `extern` modifier token for a declaration implemented in JavaScript. */
export interface ExternKeywordNode extends BaseNode {
  /** Selects the externally implemented declaration modifier in {@link Modifier}. */
  readonly kind: SyntaxKind.ExternKeyword;
}

/** `internal` modifier token restricting a declaration's visibility to its package. */
export interface InternalKeywordNode extends BaseNode {
  /** Selects the package-visibility modifier in {@link Modifier}. */
  readonly kind: SyntaxKind.InternalKeyword;
}

/** `auto` modifier token requesting a compiler-provided decorator implementation. */
export interface AutoKeywordNode extends BaseNode {
  /** Selects the automatic-implementation modifier, mutually exclusive with `extern` on decorators. */
  readonly kind: SyntaxKind.AutoKeyword;
}

/** Intrinsic `void` type syntax, used for operations with no return value. */
export interface VoidKeywordNode extends BaseNode {
  /** Identifies the intrinsic keyword rather than an identifier named `void`. */
  readonly kind: SyntaxKind.VoidKeyword;
}

/** Intrinsic `never` type syntax, denoting a type with no possible values. */
export interface NeverKeywordNode extends BaseNode {
  /** Identifies the intrinsic keyword rather than a name resolved through lookup. */
  readonly kind: SyntaxKind.NeverKeyword;
}

/** Intrinsic `unknown` type syntax; the historical interface name does not imply an `any` keyword. */
export interface AnyKeywordNode extends BaseNode {
  /** Uses `UnknownKeyword` because the source spelling is `unknown`. */
  readonly kind: SyntaxKind.UnknownKeyword;
}

/** Infix type union such as `A | B`, distinct from a keyword-form union with variant declarations. */
export interface UnionExpressionNode extends BaseNode {
  /** Identifies infix union syntax rather than a named or inline keyword-form declaration. */
  readonly kind: SyntaxKind.UnionExpression;
  /** Operand expressions in source order; parenthesized unions remain nested rather than being flattened here. */
  readonly options: readonly Expression[];
}

/** Infix intersection such as `A & B`, resolved to a model type by the checker. */
export interface IntersectionExpressionNode extends BaseNode {
  /** Identifies intersection syntax rather than an explicit model body. */
  readonly kind: SyntaxKind.IntersectionExpression;
  /** Operand expressions in source order, before their properties are combined during checking. */
  readonly options: readonly Expression[];
}

/** Value constraint `valueof T`, permitting values whose types are assignable to the target type. */
export interface ValueOfExpressionNode extends BaseNode {
  /** Identifies a value constraint, not the type-of-value query written `typeof`. */
  readonly kind: SyntaxKind.ValueOfExpression;
  /** Type expression following `valueof`. */
  readonly target: Expression;
}

/** Type query `typeof value`, obtaining the type of a value-producing expression. */
export interface TypeOfExpressionNode extends BaseNode {
  /** Identifies a type query rather than a `valueof` constraint. */
  readonly kind: SyntaxKind.TypeOfExpression;
  /** Value-producing expression whose type is requested. */
  readonly target: Expression;
}

/** Name reference with an optional template argument list, interpreted in its checking context. */
export interface TypeReferenceNode extends BaseNode {
  /** Identifies a complete reference rather than a bare identifier or member-selection segment. */
  readonly kind: SyntaxKind.TypeReference;
  /** Unqualified name or nested qualified name, excluding template arguments. */
  readonly target: MemberExpressionNode | IdentifierNode;
  /** Explicit template arguments in source order; does not include inferred or default arguments. */
  readonly arguments: readonly TemplateArgumentNode[];
}

/** One positional expression or `name = expression` argument in a reference's `<...>` list. */
export interface TemplateArgumentNode extends BaseNode {
  /** Identifies an argument at a reference site, not a parameter declaration. */
  readonly kind: SyntaxKind.TemplateArgument;
  /** Parameter name for a named argument; absent for positional arguments. */
  readonly name?: IdentifierNode;
  /** Supplied argument expression, which may be checked as a type or value according to the parameter. */
  readonly argument: Expression;
}

/** Template parameter syntax, optionally constrained with `extends` and defaulted with `=`. */
export interface TemplateParameterDeclarationNode extends BaseNode {
  /** Identifies a declared template parameter rather than an argument supplied at a reference. */
  readonly kind: SyntaxKind.TemplateParameterDeclaration;
  /** Explicit type, value, or mixed constraint following `extends`, absent when omitted. */
  readonly constraint?: Expression;
  /** Argument expression to use when this parameter is omitted, absent when no default was written. */
  readonly default?: Expression;
  /** Owning declaration after binding; declaration-expression owners may retain invalid template syntax for recovery. */
  readonly parent?: TemplateableNode;
  /** Name introduced into the owning declaration's template scope. */
  readonly id: IdentifierNode;
}

/**
 * Bit mask derived from a declaration's modifier tokens.
 * Presence records parsed syntax, not validity; the checker enforces allowed and required combinations.
 */
export const enum ModifierFlags {
  /** No modifier tokens were written. */
  None,
  /** An `extern` token requests a JavaScript implementation. */
  Extern = 1 << 1,
  /** An `internal` token requests package-local visibility. */
  Internal = 1 << 2,
  /** An `auto` token requests a compiler-provided decorator implementation. */
  Auto = 1 << 3,

  /** Mask of every recognized modifier bit, not a combination valid on every declaration. */
  All = Extern | Internal | Auto,
}

/** Individual declaration modifier tokens, preserved separately from their combined bit mask. */
export type Modifier = ExternKeywordNode | InternalKeywordNode | AutoKeywordNode;

/**
 * Represent a decorator declaration
 * @example
 * ```typespec
 * extern dec doc(target: Type, value: valueof string);
 * ```
 */
export interface DecoratorDeclarationStatementNode extends BaseNode, DeclarationNode {
  /** Identifies a decorator signature declaration, not an application of that decorator. */
  readonly kind: SyntaxKind.DecoratorDeclarationStatement;
  /**
   * Decorator target. First parameter.
   */
  readonly target: FunctionParameterNode;

  /**
   * Additional parameters
   */
  readonly parameters: FunctionParameterNode[];
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * Parameter syntax shared by functions, decorators, and scalar constructors.
 * Invalid optional/rest combinations remain in the AST and are reported as diagnostics.
 */
export interface FunctionParameterNode extends BaseNode {
  /** Identifies signature-parameter syntax rather than an operation's model-property parameter. */
  readonly kind: SyntaxKind.FunctionParameter;
  /** Parameter name without an optional marker or rest prefix. */
  readonly id: IdentifierNode;
  /** Constraint following `:`; absent when omitted, in which case checking uses `unknown`. */
  readonly type?: Expression;

  /**
   * Parameter defined with `?`
   */
  readonly optional: boolean;

  /**
   * Parameter defined with `...` notation.
   */
  readonly rest: boolean;
}

/**
 * The syntax representing a function value declaration.
 *
 * @example
 * ```typespec
 * extern fn camelCase(value: valueof string): valueof string;
 * ```
 */
export interface FunctionDeclarationStatementNode extends BaseNode, DeclarationNode {
  /** Identifies a named function declaration, distinct from an anonymous function type expression. */
  readonly kind: SyntaxKind.FunctionDeclarationStatement;
  /** Declared parameters in source order; the JavaScript context parameter is not part of this list. */
  readonly parameters: FunctionParameterNode[];
  /** Constraint following `:`, absent when omitted; checking defaults the result constraint to `unknown`. */
  readonly returnType?: Expression;
  /** Syntactic containing file or namespace after binding. */
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

/**
 * The syntax representing a function type expression.
 *
 * @example
 * ```typespec
 * fn(value: valueof string) => valueof string
 * ```
 */
export interface FunctionTypeExpressionNode extends BaseNode {
  /** Identifies anonymous function type syntax, not a named function declaration. */
  readonly kind: SyntaxKind.FunctionTypeExpression;
  /** Signature parameters in source order, including optional and rest markers. */
  readonly parameters: FunctionParameterNode[];
  /** Constraint following `=>`, absent when omitted; checking defaults the result constraint to `unknown`. */
  readonly returnType?: Expression;
}

/** Syntactic role of an identifier, used to choose reference resolution and completion behavior. */
export interface IdentifierContext {
  /** Context category, not the semantic type or symbol category of the identifier. */
  kind: IdentifierKind;
  /** First ancestor that is not a member-expression segment, retaining the construct that gives the name its role. */
  node: Node;
}

/** Identifier roles classified by `getIdentifierContext`, independently of whether lookup succeeds. */
export enum IdentifierKind {
  /** Name within a type reference, including segments of a qualified target. */
  TypeReference,
  /** Named template argument's parameter name, not the expression supplied as its argument. */
  TemplateArgument,
  /** Decorator name in an attached annotation or out-of-line augment statement. */
  Decorator,
  /** Invocation target in a call expression, not a function declaration's name. */
  Function,
  /** Namespace name targeted by a `using` statement. */
  Using,
  /** Declaration name not classified by one of the property-specific roles. */
  Declaration,
  /** Property name in a structural model expression, including operation parameters. */
  ModelExpressionProperty,
  /** Property name in a model statement or keyword-form model declaration expression. */
  ModelStatementProperty,
  /** Property name in a `#{ ... }` object value literal. */
  ObjectLiteralProperty,
  /** Name in syntax without a more specific resolution or declaration role. */
  Other,
}

// Doc-comment related syntax

/**
 * Parsed documentation comment, with free-form text separated from its block tags.
 * These nodes are available when documentation parsing is enabled.
 */
export interface DocNode extends BaseNode {
  /** Identifies a complete documentation comment. */
  readonly kind: SyntaxKind.Doc;
  /** Text outside block tags, in source order; inspect node text rather than array length for a description. */
  readonly content: readonly DocContent[];
  /** Recognized and unrecognized block tags, in source order. */
  readonly tags: readonly DocTag[];
}

/** Common syntax retained for every documentation block tag. */
export interface DocTagBaseNode extends BaseNode {
  /** Written tag name without the leading `@`, including unrecognized names. */
  readonly tagName: IdentifierNode;
  /** Descriptive text after the tag name and any parameter or property name. */
  readonly content: readonly DocContent[];
}

/** Supported documentation block tags, including a fallback for unrecognized tags. */
export type DocTag =
  | DocReturnsTagNode
  | DocErrorsTagNode
  | DocParamTagNode
  | DocPropTagNode
  | DocTemplateTagNode
  | DocUnknownTagNode;
/** Content within a documentation comment or tag; currently stored as text rather than parsed Markdown. */
export type DocContent = DocTextNode;

/** A text segment from a documentation comment, retaining Markdown as text. */
export interface DocTextNode extends BaseNode {
  /** Identifies documentation text rather than a block tag. */
  readonly kind: SyntaxKind.DocText;
  /** Text with comment-line prefixes removed, line endings normalized, and outer whitespace trimmed. */
  readonly text: string;
}

/** Return-value documentation introduced by either `@return` or `@returns`. */
export interface DocReturnsTagNode extends DocTagBaseNode {
  /** Identifies either spelling of the return-documentation tag. */
  readonly kind: SyntaxKind.DocReturnsTag;
}

/** Error-response documentation introduced by `@errors`. */
export interface DocErrorsTagNode extends DocTagBaseNode {
  /** Identifies an error-documentation tag. */
  readonly kind: SyntaxKind.DocErrorsTag;
}

/** Documentation associated with the named parameter of a declaration. */
export interface DocParamTagNode extends DocTagBaseNode {
  /** Identifies an `@param` tag. */
  readonly kind: SyntaxKind.DocParamTag;
  /** Parameter name as written in the comment, not a resolved parameter declaration. */
  readonly paramName: IdentifierNode;
}

/** Documentation associated with the named property of a model. */
export interface DocPropTagNode extends DocTagBaseNode {
  /** Identifies an `@prop` tag. */
  readonly kind: SyntaxKind.DocPropTag;
  /** Property name as written in the comment, not a resolved property declaration. */
  readonly propName: IdentifierNode;
}

/** Documentation associated with a named template parameter. */
export interface DocTemplateTagNode extends DocTagBaseNode {
  /** Identifies an `@template` tag. */
  readonly kind: SyntaxKind.DocTemplateTag;
  /** Template parameter name as written in the comment. */
  readonly paramName: IdentifierNode;
}

/** Unrecognized block tag retained for tools without assigning built-in semantics. */
export interface DocUnknownTagNode extends DocTagBaseNode {
  /** Identifies a tag whose name has no specialized documentation node. */
  readonly kind: SyntaxKind.DocUnknownTag;
}
////

/**
 * Identifies the position within a source file by line number and offset from
 * beginning of line.
 */
export interface LineAndCharacter {
  /** The line number. 0-based. */
  line: number;

  /**
   * The offset in UTF-16 code units to the character from the beginning of the
   * line. 0-based.
   *
   * NOTE: This is not necessarily the same as what a given text editor might
   * call the "column". Tabs, combining characters, surrogate pairs, and so on
   * can all cause an editor to report the column differently. Indeed, different
   * text editors report different column numbers for the same position in a
   * given document.
   */
  character: number;
}

/** Loaded JavaScript module represented in the syntax graph without parsing its JavaScript source. */
export interface JsSourceFileNode extends DeclarationNode, BaseNode {
  /** Distinguishes a loaded JavaScript module from a parsed TypeSpec script. */
  readonly kind: SyntaxKind.JsSourceFile;

  /** Empty source file carrying the module's path for diagnostic locations. */
  readonly file: SourceFile;

  /** Module namespace object returned by the host's JavaScript import operation. */
  readonly esmExports: any;

  /* Any namespaces declared by decorators. */
  /** @internal */
  readonly namespaceSymbols: Sym[];
}

/** Namespace declaration synthesized while binding JavaScript implementations to TypeSpec namespaces. */
export interface JsNamespaceDeclarationNode extends DeclarationNode, BaseNode {
  /** Distinguishes a JavaScript-provided namespace from a namespace written in TypeSpec. */
  readonly kind: SyntaxKind.JsNamespaceDeclaration;
}

export type EmitterFunc = (context: EmitContext) => Promise<void> | void;

/**
 * Source text and diagnostic identity shared by syntax nodes and source locations.
 * Positions and line mappings refer to this text snapshot, not a subsequently modified file.
 */
export interface SourceFile {
  /** The source code text. */
  readonly text: string;

  /**
   * The source file path.
   *
   * This is used only for diagnostics. The command line compiler will populate
   * it with the actual path from which the file was read, but it can actually
   * be an arbitrary name for other scenarios.
   */
  readonly path: string;

  /**
   * Array of positions in the text where each line begins. There is one entry
   * per line, in order of lines, and each entry represents the offset in UTF-16
   * code units from the start of the document to the beginning of the line.
   */
  getLineStarts(): readonly number[];

  /**
   * Converts a one-dimensional position in the document (measured in UTF-16
   * code units) to line number and offset from line start.
   */
  getLineAndCharacterOfPosition(position: number): LineAndCharacter;
}

/**
 * Represent a location context in the mind of the compiler. This can be:
 * - the user project
 * - a library
 * - the compiler(standard library)
 * - virtual
 */
export type LocationContext =
  | ProjectLocationContext
  | CompilerLocationContext
  | SyntheticLocationContext
  | LibraryLocationContext;

/** Defined in the user project. */
export interface ProjectLocationContext {
  /** Identifies source belonging to the consuming project rather than a dependency. */
  readonly type: "project";
  /** Package flags exported by the project's JavaScript code, when available. */
  readonly flags?: PackageFlags;
}

/** Built-in */
export interface CompilerLocationContext {
  /** Identifies the compiler's standard-library source. */
  readonly type: "compiler";
}

/** Refer to a type that was not declared in a file */
export interface SyntheticLocationContext {
  /** Identifies a target for which no source-file location exists. */
  readonly type: "synthetic";
}

/** Defined in a library. */
export interface LibraryLocationContext {
  /** Identifies source loaded from a library package. */
  readonly type: "library";

  /** Library metadata */
  readonly metadata: ModuleLibraryMetadata;

  /** Module definition */
  readonly flags?: PackageFlags;

  /**
   * Compiler features enabled for this library, as declared in the library's own
   * `tspconfig.yaml` `features`. Used to gate experimental features (e.g. `auto-decorators`)
   * for the library's own source files, independently of the consuming project's config.
   */
  readonly features?: readonly string[];
}

/** Resolution and exported contracts of a JavaScript library loaded by the program. */
export interface LibraryInstance {
  /** Resolved package or standalone file from which the JavaScript entry point was loaded. */
  module: ModuleResolutionResult;
  /** Loaded JavaScript entry point and its exports. */
  entrypoint: JsSourceFileNode;
  /** Package metadata, or standalone-file metadata when no package was resolved. */
  metadata: LibraryMetadata;
  /** The entry point's `$lib` export, if it declares a TypeSpec library. */
  definition?: TypeSpecLibrary<any>;
  /** Resolved `$linter` export; populated when the entry point provides a linter. */
  linter: LinterResolvedDefinition;
}

/** Metadata discriminated by whether the library resolved to a package or a standalone file. */
export type LibraryMetadata = FileLibraryMetadata | ModuleLibraryMetadata;

/** Optional package information used to describe a library and direct consumers to support resources. */
interface LibraryMetadataBase {
  /** Library homepage. */
  homepage?: string;

  /** Library version */
  version?: string;

  /** Issue-tracker metadata, when supplied by the package. */
  bugs?: {
    /** Url where to file bugs for this library. */
    url?: string;
  };
}

/** Metadata for a standalone JavaScript file, whose name may come from its `$lib` export. */
export interface FileLibraryMetadata extends LibraryMetadataBase {
  /** Identifies a library resolved directly to a file rather than a package. */
  type: "file";

  /** Library name as specified in the package.json or in exported $lib. */
  name?: string;
}

/** Data for a library. Either loaded via a node_modules package or a standalone js file  */
export interface ModuleLibraryMetadata extends LibraryMetadataBase {
  /** Identifies a library resolved through a package manifest. */
  readonly type: "module";

  /** Library name as specified in the package.json or in exported $lib. */
  readonly name: string;
}

/** Half-open range of UTF-16 code-unit offsets in a source string. */
export interface TextRange {
  /**
   * The starting position of the range measured in UTF-16 code units from the
   * start of the full string. Inclusive.
   */
  readonly pos: number;

  /**
   * The ending position measured in UTF-16 code units from the start of the
   * full string. Exclusive.
   */
  readonly end: number;
}

/** A source range together with the text snapshot to which its offsets refer. */
export interface SourceLocation extends TextRange {
  /** Source text and path used to resolve the range into line and character coordinates. */
  file: SourceFile;
  /** True when the location is a placeholder rather than a range in actual source text. */
  isSynthetic?: boolean;
}

/** Used to explicitly specify that a diagnostic has no target. */
export const NoTarget = Symbol.for("NoTarget");

/** Diagnostic target that can be used when working with TypeSpec types.  */
export type TypeSpecDiagnosticTarget = Node | Entity | Sym | TemplateInstanceTarget;

/** Represent a diagnostic target that happens in a template instance context.  */
export interface TemplateInstanceTarget {
  /** Node target */
  readonly node: Node;
  /** Template mapper used. */
  readonly templateMapper: TypeMapper;
}

export type DiagnosticTarget = TypeSpecDiagnosticTarget | SourceLocation;

export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  code: string;
  /** @internal Diagnostic documentation url */
  readonly url?: string;
  severity: DiagnosticSeverity;
  message: string;
  target: DiagnosticTarget | typeof NoTarget;
  readonly codefixes?: readonly CodeFix[];
}

export interface CodeFix {
  readonly id: string;
  readonly label: string;
  readonly fix: (fixContext: CodeFixContext) => CodeFixEdit | CodeFixEdit[] | Promise<void> | void;
}

export interface FilePos {
  readonly pos: number;
  readonly file: SourceFile;
}

export interface CodeFixContext {
  /** Add the given text before the range or pos given. */
  readonly prependText: (location: SourceLocation | FilePos, text: string) => InsertTextCodeFixEdit;
  /** Add the given text after the range or pos given. */
  readonly appendText: (location: SourceLocation | FilePos, text: string) => InsertTextCodeFixEdit;
  /** Replace the text at the given range. */
  readonly replaceText: (location: SourceLocation, newText: string) => ReplaceTextCodeFixEdit;
}

export type CodeFixEdit = InsertTextCodeFixEdit | ReplaceTextCodeFixEdit;

export interface InsertTextCodeFixEdit {
  readonly kind: "insert-text";
  readonly text: string;
  readonly pos: number;
  readonly file: SourceFile;
}

export interface ReplaceTextCodeFixEdit extends TextRange {
  readonly kind: "replace-text";
  readonly text: string;
  readonly file: SourceFile;
}

/**
 * Return type of accessor functions in TypeSpec.
 * Tuple composed of:
 * - 0: Actual result of an accessor function
 * - 1: List of diagnostics that were emitted while retrieving the data.
 */
export type DiagnosticResult<T> = [T, readonly Diagnostic[]];

export interface DirectiveBase {
  node: DirectiveExpressionNode;
}

export type Directive = SuppressDirective | DeprecatedDirective;

export interface SuppressDirective extends DirectiveBase {
  name: "suppress";
  code: string;
  message: string;
}

export interface DeprecatedDirective extends DirectiveBase {
  name: "deprecated";
  message: string;
}

export interface RmOptions {
  /**
   * If `true`, perform a recursive directory removal. In
   * recursive mode, errors are not reported if `path` does not exist, and
   * operations are retried on failure.
   * @default false
   */
  recursive?: boolean;
}

export interface SystemHost {
  /** read a file at the given url. */
  readUrl(url: string): Promise<SourceFile>;

  /** read a utf-8 or utf-8 with bom encoded file */
  readFile(path: string): Promise<SourceFile>;

  /**
   * Write the file.
   * @param path Path to the file.
   * @param content Content of the file.
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Read directory.
   * @param path Path to the directory.
   * @returns list of file/directory in the given directory. Returns the name not the full path.
   */
  readDir(path: string): Promise<string[]>;

  /**
   * Deletes a directory or file.
   * @param path Path to the directory or file.
   */
  rm(path: string, options?: RmOptions): Promise<void>;

  /**
   * create directory recursively.
   * @param path Path to the directory.
   */
  mkdirp(path: string): Promise<string | undefined>;

  // get info about a path
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  // get the real path of a possibly symlinked path
  realpath(path: string): Promise<string>;
}

export interface CompilerHost extends SystemHost {
  /**
   * Optional cache to reuse the results of parsing and binding across programs.
   */
  parseCache?: WeakMap<SourceFile, TypeSpecScriptNode>;

  // get the directory TypeSpec is executing from
  getExecutionRoot(): string;

  // get the directories we should load standard library files from
  getLibDirs(): string[];

  // get a promise for the ESM module shape of a JS module
  getJsImport(path: string): Promise<Record<string, any>>;

  getSourceFileKind(path: string): SourceFileKind | undefined;

  // convert a file URL to a path in a file system
  fileURLToPath(url: string): string;

  // convert a file system path to a URL
  pathToFileURL(path: string): string;

  logSink: LogSink;
}

/**
 * Type of the source file that can be loaded via typespec
 */
export type SourceFileKind = "typespec" | "js";

type UnionToIntersection<T> = (T extends any ? (k: T) => void : never) extends (k: infer I) => void
  ? I
  : never;

/** Traversal control returned by semantic listeners when the navigation API honors callback results. */
export enum ListenerFlow {
  /**
   * Skip recursive traversal from the current type, and its exit callback when
   * that navigation path checks this result. This does not stop the whole walk.
   */
  NoRecursion = 1,
}

/**
 * Listener function. Can return false to stop recursion.
 */
type TypeListener<T> = (context: T) => ListenerFlow | undefined | void;
type exitListener<T extends string | number | symbol> = T extends string ? `exit${T}` : T;
type ListenerForType<T extends Type> = T extends Type
  ? { [k in Uncapitalize<T["kind"]> | exitListener<T["kind"]>]?: TypeListener<T> }
  : never;

/**
 * Optional synchronous callbacks keyed by uncapitalized type kind, such as `model`,
 * and corresponding exit names, such as `exitModel`.
 * Entry callbacks run before following the type's relationships; exit callbacks,
 * where emitted by the walker, run afterward. This walks the semantic graph, not syntax.
 */
export type TypeListeners = UnionToIntersection<ListenerForType<Type>>;

type ValueListener<V> = (context: V) => ListenerFlow | undefined | void;
type exitValueListener<T extends string | number | symbol> = T extends string ? `exit${T}` : T;
type ListenerForValue<V extends Value> = V extends Value
  ? { [k in Uncapitalize<V["valueKind"]> | exitValueListener<V["valueKind"]>]?: ValueListener<V> }
  : never;

/**
 * Optional synchronous callbacks keyed by uncapitalized value kind and corresponding
 * exit names. A callback is invoked only when the selected navigation API visits that value.
 */
export type ValueListeners = UnionToIntersection<ListenerForValue<Value>>;

/** Callbacks for semantic navigation, with an optional program-level entry event. */
export type SemanticNodeListener = {
  /** Called once by program navigation before visiting the global namespace. */
  root?: (context: Program) => void | undefined;
} & TypeListeners &
  ValueListeners;

/**
 * Extra information about a type contributed by a library through `$provideTypeInfo`. Used to
 * enrich IDE hover documentation and to answer queries (e.g. from AI agents/tooling).
 */
export interface TypeInfo {
  /** Markdown content describing this information, e.g. ``"`HTTP Route`: `GET /pets/{id}`"``. */
  readonly content: string;
}

/**
 * Context passed to a library's `$provideTypeInfo` provider. Additional properties may be added
 * over time.
 */
export interface TypeInfoContext {
  /** The current program. */
  readonly program: Program;
  /** The type the information is being requested for. */
  readonly target: Type;
}

/**
 * Provides extra information about a given type.
 *
 * A library registers one by exporting a `$provideTypeInfo` function (typically via
 * {@link defineTypeInfoProvider}). Unlike the `$onValidate` lifecycle hook, a provider is never
 * run during compilation and must not mutate the type graph. It is invoked lazily and on demand
 * (e.g. by the language server when computing hover documentation, or by tooling querying
 * {@link Program.getTypeInfo}).
 *
 * Providers are gated behind the experimental `type-info-provider` compiler feature.
 */
export type TypeInfoProvider = (context: TypeInfoContext) => TypeInfo | undefined;

export type DiagnosticReportWithoutTarget<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> = {
  code: C;
  messageId?: M;
  readonly codefixes?: readonly CodeFix[];
} & DiagnosticFormat<T, C, M>;

export type DiagnosticReport<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> = DiagnosticReportWithoutTarget<T, C, M> & { target: DiagnosticTarget | typeof NoTarget };

export type DiagnosticFormat<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> =
  T[C][M] extends CallableMessage<infer A>
    ? { format: Record<A[number], string> }
    : Record<string, unknown>;

/**
 * Declare a diagnostic that can be reported by the library.
 *
 * @example
 *
 * ```ts
 * unterminated: {
 *   severity: "error",
 *   description: "Unterminated token.",
 *   url: "https://example.com/docs/diags/unterminated",
 *   messages: {
 *     default: paramMessage`Unterminated ${"token"}.`,
 *   },
 * },
 * ```
 */
export interface DiagnosticDefinition<M extends DiagnosticMessages> {
  /**
   * Diagnostic severity.
   * - `warning` - Suppressable, should be used to represent potential issues but not blocking.
   * - `error` - Non-suppressable, should be used to represent failure to move forward.
   */
  readonly severity: "warning" | "error";
  /** Messages that can be reported with the diagnostic. */
  readonly messages: M;
  /** Short description of the diagnostic */
  readonly description?: string;
  /** Specifies the URL at which the full documentation can be accessed. */
  readonly url?: string;
  /**
   * Extended documentation for this diagnostic. Surfaced both in generated reference
   * documentation and in editor tooling (e.g. completion and hover). Either raw markdown,
   * or a {@link FileRef} pointing to a markdown file (recommended).
   */
  readonly docs?: string | FileRef;
}

export interface DiagnosticMessages {
  readonly [messageId: string]: string | CallableMessage<string[]>;
}

export interface CallableMessage<T extends string[]> {
  keys: T;
  (dict: Record<T[number], string>): string;
}

export type DiagnosticMap<T extends { [code: string]: DiagnosticMessages }> = {
  readonly [code in keyof T]: DiagnosticDefinition<T[code]>;
};

export interface DiagnosticCreator<T extends { [code: string]: DiagnosticMessages }> {
  readonly type: T;
  readonly diagnostics: DiagnosticMap<T>;
  createDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    diag: DiagnosticReport<T, C, M>,
  ): Diagnostic;
  reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diag: DiagnosticReport<T, C, M>,
  ): void;
}

export type TypeOfDiagnostics<T extends DiagnosticMap<any>> =
  T extends DiagnosticMap<infer D> ? D : never;

/** JSON Schema typed against an emitter's options, used to validate configured option values. */
export type JSONSchemaType<T> = AjvJSONSchemaType<T>;

/**
 * @internal
 */
export interface JSONSchemaValidator {
  /**
   * Validate the configuration against its JSON Schema.
   *
   * @param config Configuration to validate.
   * @param target Source file target to use for diagnostics.
   * @returns Diagnostics produced by schema validation of the configuration.
   */
  validate(
    config: unknown,
    target: YamlScript | YamlPathTarget | SourceFile | typeof NoTarget,
  ): Diagnostic[];
}

/** Metadata for a library state key whose symbol is created with the library. */
export interface StateDef {
  /**
   * Description for this state.
   */
  readonly description?: string;
}

/** Opt-in compiler behavior supported by a library or emitter. */
export interface TypeSpecLibraryCapabilities {
  /**
   * Allows an emitter to run during dry-run compilation. The emitter must inspect
   * the program's dry-run option and avoid writing output while still reporting diagnostics.
   * Emitters without this capability are skipped in dry-run mode.
   */
  readonly dryRun?: boolean;
}

/** Definition supplied to {@link createTypeSpecLibrary} and typically exported as `$lib`. */
export interface TypeSpecLibraryDef<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
  State extends string = never,
> {
  /**
   * Library name. MUST match package.json name.
   */
  readonly name: string;

  /**
   * Optional short alias for this library used in diagnostic and linter rule codes.
   * When provided, diagnostic/linter codes can be referenced as `${alias}/${code}`
   * in addition to the full `${name}/${code}` form (e.g. `tcgc/no-foo`).
   * Overrides the automatically scope-stripped short name.
   */
  readonly alias?: string;

  /** Optional registration of capabilities the library/emitter provides */
  readonly capabilities?: TypeSpecLibraryCapabilities;

  /**
   * Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code.
   */
  readonly diagnostics: DiagnosticMap<T>;

  /**
   * List of other library that should be imported when this is used as an emitter.
   * Compiler will emit an error if the libraries are not explicitly imported.
   */
  readonly requireImports?: readonly string[];

  /**
   * Emitter configuration if library is an emitter. Its optional `options` JSON Schema
   * validates custom configuration before the emitter runs; omit it when no schema is supplied.
   */
  readonly emitter?: {
    options?: JSONSchemaType<E>;
  };

  /** Named state definitions used to create the corresponding symbols in the library's `stateKeys` map. */
  readonly state?: Record<State, StateDef>;
}

/**
 * Type for the $decorators export from libraries.
 *
 * @example
 * ```
 * export const $decorators = {
 *   "Azure.Core": {
 *     flags: $flags,
 *     "foo-bar": fooBarDecorator
 *   }
 * }
 * ```
 */
export interface DecoratorImplementations {
  /** Implementations grouped by fully qualified TypeSpec namespace, not JavaScript module path. */
  readonly [namespace: string]: {
    /** Decorator implementations keyed by their TypeSpec names, without the JavaScript `$` prefix. */
    readonly [name: string]: DecoratorFunction;
  };
}

export interface FunctionImplementations {
  readonly [namespace: string]: {
    readonly [name: string]: (ctx: FunctionContext, ...parameters: never[]) => unknown;
  };
}

/** Extension point for package-level flags exported as `$flags`; no flags are currently predefined. */
export interface PackageFlags {}

/** A library's `$linter` export: available rules and optional named rule-set configurations. */
export interface LinterDefinition {
  /** Rule definitions in registration order; listing a rule does not enable it. */
  rules: LinterRuleDefinition<string, DiagnosticMessages, any>[];
  /** Named presets consumers can extend, with names local to this library. */
  ruleSets?: Record<string, LinterRuleSet>;
}

/** Loaded linter definition with library-qualified rule IDs and a materialized rule-set map. */
export interface LinterResolvedDefinition {
  /** Rules in definition order, each with its library-qualified ID. */
  readonly rules: LinterRule<string, DiagnosticMessages, any>[];
  /**
   * Named presets. A nonempty rule list gets an `"all"` preset enabling every rule
   * unless the library explicitly defines one; otherwise this map may be empty.
   */
  readonly ruleSets: {
    [name: string]: LinterRuleSet;
  };
}

/** Shared diagnostic metadata and option configuration for synchronous and asynchronous rules. */
interface LinterRuleDefinitionBase<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> {
  /** Rule name (without the library name) */
  name: N;
  /** Rule default severity. */
  severity: "warning";
  /** Short description of the rule */
  description: string;
  /** Specifies the URL at which the full documentation can be accessed. */
  url?: string;
  /**
   * Extended documentation for this rule. Surfaced both in generated reference
   * documentation and in editor tooling (e.g. completion and hover). Either raw markdown,
   * or a {@link FileRef} pointing to a markdown file (recommended).
   */
  docs?: string | FileRef;
  /** Messages that can be reported with the diagnostic. */
  messages: DM;
  /**
   * JSON Schema for the rule options.
   * When provided, options will be validated against this schema before the rule runs.
   */
  optionSchema?: Record<string, unknown>;
  /** Defaults used with `true` and shallowly merged with explicitly configured option properties. */
  defaultOptions?: Options;
}

/** Rule whose navigation callbacks and post-navigation `exit` callback must all complete synchronously. */
interface LinterRuleDefinitionSync<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> extends LinterRuleDefinitionBase<N, DM, Options> {
  /** Whether this is an async rule. Default is false */
  async?: false;
  /**
   * Creates a fresh listener before navigation. Its optional `exit` callback runs
   * after the walk with the program. Linter dispatch ignores listener return values,
   * including {@link ListenerFlow.NoRecursion}.
   */
  create(
    context: LinterRuleContext<DM, Options>,
  ): SemanticNodeListener & { exit?: (context: Program) => void | undefined };
}

/**
 * Rule run in the asynchronous-rule pass after synchronous rules finish.
 * Navigation callbacks remain synchronous; only the post-navigation `exit` callback may return a promise.
 */
interface LinterRuleDefinitionAsync<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> extends LinterRuleDefinitionBase<N, DM, Options> {
  /** Enables awaiting the promise returned by the post-navigation `exit` callback. */
  async: true;
  /**
   * Creates a fresh listener before navigation. `exit` runs after the walk, and
   * its promise is awaited before the asynchronous-rule pass completes.
   * Linter dispatch ignores navigation callback return values.
   */
  create(
    context: LinterRuleContext<DM, Options>,
  ): SemanticNodeListener & { exit?: (context: Program) => Promise<void | undefined> };
}

/** Rule definition discriminated by whether its post-navigation callback can perform asynchronous work. */
export type LinterRuleDefinition<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> = LinterRuleDefinitionSync<N, DM, Options> | LinterRuleDefinitionAsync<N, DM, Options>;

/** Resolved instance of a linter rule that will run. */
export type LinterRule<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> = LinterRuleDefinition<N, DM, Options> & {
  /** Expanded rule ID in the form `<library-name>/<rule-name>`, used as its diagnostic code. */
  id: string;
};

/** Library-qualified reference in the form `<library-name>/<rule-or-ruleset-name>`. */
export type RuleRef = `${string}/${string}`;

/**
 * Reference to a ruleset defined in a yaml file. In this format `file:<path to the yaml file>`.
 * A relative path is resolved relative to the file declaring it (`tspconfig.yaml` or another ruleset file).
 * Only valid in `tspconfig.yaml` or in another ruleset file, not in a ruleset defined by a library.
 */
export type RuleSetFileRef = `file:${string}`;

/** Reference to a ruleset. Either a ruleset defined in a library or one defined in a local yaml file. */
export type RuleSetRef = RuleRef | RuleSetFileRef;

/**
 * Value for enabling a linter rule.
 * - `true` enables the rule with default options.
 * - `false` skips enabling the rule; it does not disable a rule enabled by an extended preset.
 * - An object enables the rule with its properties shallowly merged over default options.
 */
export type LinterRuleEnableValue = boolean | Record<string, unknown>;

/** Preset applied by extending other rule sets, then applying local enable and disable entries. */
export interface LinterRuleSet {
  /** Rule sets to apply first, in array order, before this preset's own entries. */
  extends?: RuleSetRef[];

  /** Rules to enable/configure, keyed by library-qualified reference. Entries set to `false` are ignored. */
  enable?: Record<RuleRef, LinterRuleEnableValue>;

  /** Rules to disable, with explanatory strings as values. A rule cannot also be enabled in this preset. */
  disable?: Record<RuleRef, string>;
}

/** Per-run rule context providing resolved options and a rule-scoped diagnostic collector. */
export interface LinterRuleContext<
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown> = Record<string, never>,
> {
  /** Program being linted; report rule findings through this context rather than directly to the program. */
  readonly program: Program;
  /** Configured properties merged over rule defaults, or an empty object when neither is provided. */
  readonly options: Options;
  /**
   * Formats a warning using this rule's ID and messages and adds it to the linter's results.
   * Only targets belonging to the user project are collected: library, compiler,
   * synthetic, and {@link NoTarget} findings are ignored. The program later reports collected findings.
   */
  reportDiagnostic<M extends keyof DM>(diag: LinterRuleDiagnosticReport<DM, M>): void;
}

/** Requires a `format` substitution map when the selected rule message is callable. */
export type LinterRuleDiagnosticFormat<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> =
  T[M] extends CallableMessage<infer A>
    ? { format: Record<A[number], string> }
    : Record<string, unknown>;

/** Rule finding before its source target is attached; the context supplies the rule code and severity. */
export type LinterRuleDiagnosticReportWithoutTarget<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = {
  /** Message variant to use; omitted selects `"default"`. */
  messageId?: M;
  /** Optional actions offered with the finding, without executing them during linting. */
  codefixes?: CodeFix[];
} & LinterRuleDiagnosticFormat<T, M>;

/**
 * Rule finding with a source-location target. Although {@link NoTarget} is accepted
 * by the shape, the linter only collects findings whose targets belong to the user project.
 */
export type LinterRuleDiagnosticReport<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = LinterRuleDiagnosticReportWithoutTarget<T, M> & { target: DiagnosticTarget | typeof NoTarget };

/** Library definition enriched with diagnostic, state-key, and tracing helpers by {@link createTypeSpecLibrary}. */
export interface TypeSpecLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
  State extends string = never,
> extends TypeSpecLibraryDef<T, E, State> {
  /** Library name */
  readonly name: string;

  /**
   * JSON Schema validator for emitter options
   * @internal
   */
  readonly emitterOptionValidator?: JSONSchemaValidator;

  /** Creates a library-qualified diagnostic and reports it through the program's reporting policies. */
  reportDiagnostic<C extends keyof T, M extends keyof T[C]>(
    program: Program,
    diag: DiagnosticReport<T, C, M>,
  ): void;
  /** Creates a library-qualified diagnostic without reporting it; the caller owns reporting or returning it. */
  createDiagnostic<C extends keyof T, M extends keyof T[C]>(
    diag: DiagnosticReport<T, C, M>,
  ): Diagnostic;

  /**
   * Get or create a symbol with the given name unique for that library.
   * @param name Symbol name scoped with the library name.
   */
  createStateSymbol(name: string): symbol;

  /**
   * Returns a tracer scopped to the current library.
   * All trace area logged via this tracer will be prefixed with the library name.
   */
  getTracer(program: Program): Tracer;

  /** Symbols for declared state names, registered as `<library-name>/<state-name>` for program state maps and sets. */
  readonly stateKeys: Record<State, symbol>;
}

/**
 * Get the options for the onEmit of this library.
 */
export type EmitOptionsFor<C> = C extends TypeSpecLibrary<infer _T, infer E> ? E : never;

/**
 * Base context passed to JavaScript implementations of invocable constructs (decorators, functions).
 */
export interface InvocationContext {
  /**
   * The current TypeSpec Program.
   */
  program: Program;

  /**
   * Helper to get the target for a given argument index.
   *
   * @param argIndex Argument index in the decorator call.
   * @example
   * ```tsp
   * @dec("hello", 123)
   * model MyModel { }
   * ```
   * - `getArgumentTarget(0)` -> target for "hello"
   * - `getArgumentTarget(1)` -> target for 123
   */
  getArgumentTarget(argIndex: number): DiagnosticTarget | undefined;

  /**
   * Helper to call a decorator implementation from within another decorator implementation.
   *
   * @param decorator The decorator function to call.
   * @param target The target to which the decorator is applied.
   * @param args Arguments to pass to the decorator.
   */
  callDecorator<T extends Type, A extends any[], R>(
    decorator: (context: DecoratorContext, target: T, ...args: A) => R,
    target: T,
    ...args: A
  ): R;

  /**
   * Helper to call a function implementation from within a decorator implementation.
   * @param func The function implementation to call.
   * @param args Arguments to pass to the function.
   */
  callFunction<A extends any[], R>(
    func: (context: FunctionContext, ...args: A) => R,
    ...args: A
  ): R;
}

/**
 * Context passed to decorator implementations.
 */
export interface DecoratorContext extends InvocationContext {
  program: Program;

  /**
   * The diagnostic target for the decorator application.
   */
  decoratorTarget: DiagnosticTarget;

  /**
   * Helper to call a decorator implementation from within another decorator implementation.
   *
   * This function is identical to `callDecorator`.
   *
   * @param decorator The decorator function to call.
   * @param target The target to which the decorator is applied.
   * @param args Arguments to pass to the decorator.
   */
  call<T extends Type, A extends any[], R>(
    decorator: (context: DecoratorContext, target: T, ...args: A) => R,
    target: T,
    ...args: A
  ): R;
}

/**
 * Context passed to function implementations.
 */
export interface FunctionContext extends InvocationContext {
  /**
   * The function call diagnostic target.
   */
  functionCallTarget: DiagnosticTarget;
}

export interface EmitContext<TOptions extends object = Record<string, never>> {
  /**
   * TypeSpec Program.
   */
  program: Program;

  /**
   * Configured output dir for the emitter. Emitter should emit all output under that directory.
   */
  emitterOutputDir: string;

  /**
   * Emitter custom options defined in createTypeSpecLibrary
   */
  options: TOptions;

  /**
   * Performance measurement utilities.
   * Use this to report performance of areas of your emitter.
   * The information will be displayed when the compiler is run with `--stats` flag.
   */
  readonly perf: PerfReporter;
}

export interface Timer {
  end: () => number;
}

export interface PerfReporter {
  /**
   * Start timer for the given label.
   *
   * @example
   * ```ts
   * const timer = emitContext.perf.startTimer("my-emitter-task");
   * // ... do work
   * const elapsed = timer.end(); // my-emitter-task automatically reported to the compiler
   * ```
   */
  startTimer(label: string): Timer;
  /** Report a sync function elapsed time.  */
  time<T>(label: string, callback: () => T): T;
  /** Report an async function elapsed time.  */
  timeAsync<T>(label: string, callback: () => Promise<T>): Promise<T>;

  /**
   * Report a custom elapsed time for the given label.
   * Can be used with {@link import("./perf.js").perf}
   * @example
   * ```ts
   * import { perf } from "@typespec/compiler";
   *
   * // somewhere in your emitter
   * const start = perf.now();
   * await doSomething();
   * const end = perf.now();
   *
   * emitContext.perf.report("doSomething", end - start);
   * ```
   */
  report(label: string, milliseconds: number): void;

  /** @internal */
  readonly measures: Readonly<Record<string, number>>;
}

export type LogLevel = "trace" | "warning" | "error";

export interface LogInfo {
  level: LogLevel;
  message: string;
  code?: string;
  target?: DiagnosticTarget | typeof NoTarget;
}

export interface ProcessedLog {
  level: LogLevel;
  message: string;
  code?: string;
  /** Documentation for the error code. */
  url?: string;

  /** Log location */
  sourceLocation?: SourceLocation;

  /** @internal */
  related?: RelatedSourceLocation[];
}

/** @internal */
export interface RelatedSourceLocation {
  readonly message: string;
  readonly location: SourceLocation;
}

/** @internal */
export type TaskStatus = "success" | "failure" | "skipped" | "warn";

/** @internal */
export interface TrackActionTask {
  message: string;
  readonly isStopped: boolean;
  succeed(message?: string): void;
  fail(message?: string): void;
  warn(message?: string): void;
  skip(message?: string): void;
  stop(status: TaskStatus, message?: string): void;
}

export interface LogSink {
  log(log: ProcessedLog): void;

  /** @internal */
  getPath?(path: string): string;

  /**
   * @internal
   */
  trackAction?<T>(
    message: string,
    finalMessage: string,
    asyncAction: (task: TrackActionTask) => Promise<T>,
  ): Promise<T>;
}

export interface Logger {
  trace(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  log(log: LogInfo): void;

  /** @internal */
  trackAction<T>(
    message: string,
    finalMessage: string,
    asyncAction: (task: TrackActionTask) => Promise<T>,
  ): Promise<T>;
}

export interface TracerOptions {
  filter?: string[];
}
export interface Tracer {
  /**
   * Trace
   * @param area
   * @param message
   */
  trace(area: string, message: string, target?: DiagnosticTarget): void;

  /**
   * @param subarea
   */
  sub(subarea: string): Tracer;
}
