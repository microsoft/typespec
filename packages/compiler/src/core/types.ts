import type { JSONSchemaType as AjvJSONSchemaType } from "ajv";
import { TypeEmitter } from "../emitter-framework/type-emitter.js";
import { AssetEmitter } from "../emitter-framework/types.js";
import { YamlScript } from "../yaml/types.js";
import { ModuleResolutionResult } from "./module-resolver.js";
import { Program } from "./program.js";

// prettier-ignore
export type MarshalledValue<Type>  = 
  Type extends StringLiteral ? string
  : Type extends NumericLiteral ? number
  : Type extends BooleanLiteral ? boolean
  : Type

/**
 * Type System types
 */

export type DecoratorArgumentValue = Type | number | string | boolean;

export interface DecoratorArgument {
  value: Type;
  /**
   * Marshalled value for use in Javascript.
   */
  jsValue: Type | string | number | boolean;
  node?: Node;
}

export interface DecoratorApplication {
  definition?: Decorator;
  // TODO-TIM deprecate replace with `implementation`?
  decorator: DecoratorFunction;
  args: DecoratorArgument[];
  node?: DecoratorExpressionNode | AugmentDecoratorStatementNode;
}

export interface DecoratorFunction {
  (program: DecoratorContext, target: any, ...customArgs: any[]): void;
  namespace?: string;
}

export interface BaseType {
  kind: string;
  node?: Node;
  instantiationParameters?: Type[];
  get projections(): ProjectionStatementNode[];
  projectionsByName(name: string): ProjectionStatementNode[];
  projectionSource?: Type;
  projectionBase?: Type;
  projector?: Projector;

  /**
   * Reflect if a type has been finished(Decorators have been called).
   * There is multiple reasons a type might not be finished:
   * - a template declaration will not
   * - a template instance that argument that are still template parameters
   * - a template instance that is only partially instantiated(like a templated operation inside a templated interface)
   */
  isFinished: boolean;
}

export interface DecoratedType {
  decorators: DecoratorApplication[];
}

/**
 * Union of all the types that implement TemplatedTypeBase
 */
export type TemplatedType = Model | Operation | Interface | Union;

export interface TypeMapper {
  partial: boolean;
  getMappedType(type: TemplateParameter): Type;
  args: readonly Type[];
  /** @internal */ map: Map<TemplateParameter, Type>;
}

export interface TemplatedTypeBase {
  templateMapper?: TypeMapper;
  /**
   * @deprecated use templateMapper instead.
   */
  templateArguments?: Type[];
  templateNode?: Node;
}

export type Type =
  | Model
  | ModelProperty
  | Scalar
  | Interface
  | Enum
  | EnumMember
  | TemplateParameter
  | Namespace
  | Operation
  | StringLiteral
  | NumericLiteral
  | BooleanLiteral
  | Tuple
  | Union
  | UnionVariant
  | IntrinsicType
  | FunctionType
  | Decorator
  | FunctionParameter
  | ObjectType
  | Projection;

export type StdTypes = {
  // Models
  Array: Model;
  Record: Model;
} & Record<IntrinsicScalarName, Scalar>;
export type StdTypeName = keyof StdTypes;

export type TypeOrReturnRecord = Type | ReturnRecord;

export interface ObjectType extends BaseType {
  kind: "Object";
  properties: Record<string, Type>;
}

export interface Projection extends BaseType {
  kind: "Projection";
  node: undefined;
  nodeByKind: Map<string, ProjectionStatementNode>;
  nodeByType: Map<Type, ProjectionStatementNode>;
}

export interface ProjectionApplication {
  scope?: Type;
  projectionName: string;
  arguments: DecoratorArgumentValue[];
  direction?: "from" | "to";
}

export interface Projector {
  parentProjector?: Projector;
  projections: ProjectionApplication[];
  projectedTypes: Map<Type, Type>;
  projectType(type: Type): Type;
  projectedStartNode?: Type;
  projectedGlobalNamespace?: Namespace;
}

export interface ValueType {
  kind: "Value"; // Todo remove?
  target: Type;
}

export interface IntrinsicType extends BaseType {
  kind: "Intrinsic";
  name: "ErrorType" | "void" | "never" | "unknown" | "null";
}

export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
}

export interface VoidType extends IntrinsicType {
  name: "void";
}

export interface NeverType extends IntrinsicType {
  name: "never";
}

export interface UnknownType extends IntrinsicType {
  name: "unknown";
}
export interface NullType extends IntrinsicType {
  name: "null";
}

// represents a type that is being returned from the
// currently executing lambda or projection
export interface ReturnRecord {
  kind: "Return";
  value: Type;
}

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

export type NeverIndexer = { key: NeverType; value: undefined };
export type ModelIndexer = {
  key: Scalar;
  value: Type;
};

export interface ArrayModelType extends Model {
  indexer: { key: Scalar; value: Type };
}

export interface RecordModelType extends Model {
  indexer: { key: Scalar; value: Type };
}

export interface Model extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Model";
  name: string;
  node?:
    | ModelStatementNode
    | ModelExpressionNode
    | IntersectionExpressionNode
    | ProjectionModelExpressionNode;
  namespace?: Namespace;
  indexer?: ModelIndexer;

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
   * Late-bound symbol of this model type.
   * @internal
   */
  symbol?: Sym;
}

export interface ModelProperty extends BaseType, DecoratedType {
  kind: "ModelProperty";
  node:
    | ModelPropertyNode
    | ModelSpreadPropertyNode
    | ProjectionModelPropertyNode
    | ProjectionModelSpreadPropertyNode;
  name: string;
  type: Type;
  // when spread or intersection operators make new property types,
  // this tracks the property we copied from.
  sourceProperty?: ModelProperty;
  optional: boolean;
  default?: Type;
  model?: Model;
}

export interface Scalar extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Scalar";
  name: string;
  node: ScalarStatementNode;
  /**
   * Namespace the scalar was defined in.
   */
  namespace?: Namespace;

  /**
   * Scalar this scalar extends.
   */
  baseScalar?: Scalar;

  /**
   * Direct children. This is the reverse relation of @see baseScalar
   */
  derivedScalars: Scalar[];

  /**
   * Late-bound symbol of this model type.
   * @internal
   */
  symbol?: Sym;
}

export interface Interface extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Interface";
  name: string;
  node: InterfaceStatementNode;
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

export interface Enum extends BaseType, DecoratedType {
  kind: "Enum";
  name: string;
  node: EnumStatementNode;
  namespace?: Namespace;

  /**
   * The members of the enum.
   *
   * Members are ordered in the order that they appear in source. Members
   * obtained via `...` are inserted where the spread appears in source.
   */
  members: RekeyableMap<string, EnumMember>;
}

export interface EnumMember extends BaseType, DecoratedType {
  kind: "EnumMember";
  name: string;
  enum: Enum;
  node: EnumMemberNode;
  value?: string | number;
  /**
   * when spread operators make new enum members,
   * this tracks the enum member we copied from.
   */
  sourceMember?: EnumMember;
}

export interface Operation extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Operation";
  node: OperationStatementNode;
  name: string;
  namespace?: Namespace;
  interface?: Interface;
  parameters: Model;
  returnType: Type;

  /**
   * The operation that is referenced via `op is`.
   */
  sourceOperation?: Operation;
}

export interface Namespace extends BaseType, DecoratedType {
  kind: "Namespace";
  name: string;
  namespace?: Namespace;
  node: NamespaceStatementNode | JsNamespaceDeclarationNode;

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
  functionDeclarations: Map<string, FunctionType>;
}

export type LiteralType = StringLiteral | NumericLiteral | BooleanLiteral;

export interface StringLiteral extends BaseType {
  kind: "String";
  node?: StringLiteralNode;
  value: string;
}

export interface NumericLiteral extends BaseType {
  kind: "Number";
  node?: NumericLiteralNode;
  value: number;
  valueAsString: string;
}

export interface BooleanLiteral extends BaseType {
  kind: "Boolean";
  node?: BooleanLiteralNode;
  value: boolean;
}

export interface Tuple extends BaseType {
  kind: "Tuple";
  node: TupleExpressionNode;
  values: Type[];
}

export interface Union extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Union";
  name?: string;
  node: UnionExpressionNode | UnionStatementNode;
  namespace?: Namespace;

  /**
   * The variants of the union.
   *
   * Variants are ordered in order that they appear in source.
   */
  variants: RekeyableMap<string | symbol, UnionVariant>;

  expression: boolean;
  /**
   * @deprecated use variants
   */
  readonly options: Type[];

  /**
   * Late-bound symbol of this interface type.
   * @internal
   */
  symbol?: Sym;
}

export interface UnionVariant extends BaseType, DecoratedType {
  kind: "UnionVariant";
  name: string | symbol;
  node: UnionVariantNode | undefined;
  type: Type;
  union: Union;
}

export interface TemplateParameter extends BaseType {
  kind: "TemplateParameter";
  node: TemplateParameterDeclarationNode;
  constraint?: Type | ValueType;
  default?: Type;
}

export interface Decorator extends BaseType {
  kind: "Decorator";
  node: DecoratorDeclarationStatementNode;
  name: `@${string}`;
  namespace: Namespace;
  target: FunctionParameter;
  parameters: FunctionParameter[];
  implementation: (...args: unknown[]) => void;
}

export interface FunctionType extends BaseType {
  kind: "Function";
  node?: FunctionDeclarationStatementNode;
  namespace?: Namespace;
  name: string;
  parameters: FunctionParameter[];
  returnType: Type;
  implementation: (...args: unknown[]) => unknown;
}

export interface FunctionParameter extends BaseType {
  kind: "FunctionParameter";
  node: FunctionParameterNode;
  name: string;
  type: Type | ValueType;
  optional: boolean;
  rest: boolean;
}

export interface Sym {
  readonly flags: SymbolFlags;

  /**
   * Nodes which contribute to this declaration
   */
  readonly declarations: readonly Node[];

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
   * Symbol table
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

  // for types which can be instantiated, we split `type` into declaredType and
  // a map of instantiations.
  declaredType?: Type;
  instantiations?: TypeInstantiationMap;
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

// prettier-ignore
export const enum SymbolFlags {
  None                  = 0,
  Model                 = 1 << 1,
  ModelProperty         = 1 << 2,
  Scalar                = 1 << 3,
  Operation             = 1 << 4,
  Enum                  = 1 << 5,
  EnumMember            = 1 << 6,
  Interface             = 1 << 7,
  InterfaceMember       = 1 << 8,
  Union                 = 1 << 9,
  UnionVariant          = 1 << 10,
  Alias                 = 1 << 11,
  Namespace             = 1 << 12,
  Projection            = 1 << 13,
  Decorator             = 1 << 14,
  TemplateParameter     = 1 << 15,
  ProjectionParameter   = 1 << 16,
  Function              = 1 << 17,
  FunctionParameter     = 1 << 18,
  Using                 = 1 << 19,
  DuplicateUsing        = 1 << 20,
  SourceFile            = 1 << 21,
  Declaration           = 1 << 22,
  Implementation        = 1 << 23,
  
  /**
   * A symbol which was late-bound, in which case, the type referred to
   * by this symbol is stored directly in the symbol.
   */
  LateBound = 1 << 24,

  ExportContainer = Namespace | SourceFile,
  /**
   * Symbols whose members will be late bound (and stored on the type)
   */
  MemberContainer = Model | Enum | Union | Interface,
  Member = ModelProperty | EnumMember | UnionVariant | InterfaceMember,
}

/**
 * Maps type arguments to instantiated type.
 */
export interface TypeInstantiationMap {
  get(args: readonly Type[]): Type | undefined;
  set(args: readonly Type[], type: Type): void;
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
 * AST types
 */
export enum SyntaxKind {
  TypeSpecScript,
  /** @deprecated Use TypeSpecScript */
  CadlScript = TypeSpecScript,
  JsSourceFile,
  ImportStatement,
  Identifier,
  AugmentDecoratorStatement,
  DecoratorExpression,
  DirectiveExpression,
  MemberExpression,
  NamespaceStatement,
  UsingStatement,
  OperationStatement,
  OperationSignatureDeclaration,
  OperationSignatureReference,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  ModelSpreadProperty,
  ScalarStatement,
  InterfaceStatement,
  UnionStatement,
  UnionVariant,
  EnumStatement,
  EnumMember,
  EnumSpreadMember,
  AliasStatement,
  DecoratorDeclarationStatement,
  FunctionDeclarationStatement,
  FunctionParameter,
  UnionExpression,
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  ExternKeyword,
  VoidKeyword,
  NeverKeyword,
  UnknownKeyword,
  ValueOfExpression,
  TypeReference,
  ProjectionReference,
  TemplateParameterDeclaration,
  EmptyStatement,
  InvalidStatement,
  LineComment,
  BlockComment,
  Doc,
  DocText,
  DocParamTag,
  DocReturnsTag,
  DocErrorsTag,
  DocTemplateTag,
  DocUnknownTag,
  Projection,
  ProjectionParameterDeclaration,
  ProjectionModelSelector,
  ProjectionModelPropertySelector,
  ProjectionOperationSelector,
  ProjectionUnionSelector,
  ProjectionUnionVariantSelector,
  ProjectionInterfaceSelector,
  ProjectionEnumSelector,
  ProjectionEnumMemberSelector,
  ProjectionExpressionStatement,
  ProjectionIfExpression,
  ProjectionBlockExpression,
  ProjectionMemberExpression,
  ProjectionLogicalExpression,
  ProjectionEqualityExpression,
  ProjectionUnaryExpression,
  ProjectionRelationalExpression,
  ProjectionArithmeticExpression,
  ProjectionCallExpression,
  ProjectionLambdaExpression,
  ProjectionLambdaParameterDeclaration,
  ProjectionModelExpression,
  ProjectionModelProperty,
  ProjectionModelSpreadProperty,
  ProjectionSpreadProperty,
  ProjectionTupleExpression,
  ProjectionStatement,
  ProjectionDecoratorReferenceExpression,
  Return,
  JsNamespaceDeclaration,
}

export const enum NodeFlags {
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

export interface BaseNode extends TextRange {
  readonly kind: SyntaxKind;
  readonly parent?: Node;
  readonly directives?: readonly DirectiveExpressionNode[];
  readonly docs?: readonly DocNode[];
  readonly flags: NodeFlags;
  /**
   * Could be undefined but making this optional creates a lot of noise. In practice,
   * you will likely only access symbol in cases where you know the node has a symbol.
   */
  readonly symbol: Sym;
}

export interface TemplateDeclarationNode {
  readonly templateParameters: readonly TemplateParameterDeclarationNode[];
  readonly locals?: SymbolTable;
}

export type Node =
  | TypeSpecScriptNode
  | JsSourceFileNode
  | JsNamespaceDeclarationNode
  | TemplateParameterDeclarationNode
  | ProjectionParameterDeclarationNode
  | ProjectionLambdaParameterDeclarationNode
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
  | Modifier
  | DocNode
  | DocContent
  | DocTag
  | ProjectionStatementItem
  | ProjectionExpression
  | ProjectionModelSelectorNode
  | ProjectionModelPropertySelectorNode
  | ProjectionInterfaceSelectorNode
  | ProjectionOperationSelectorNode
  | ProjectionEnumSelectorNode
  | ProjectionEnumMemberSelectorNode
  | ProjectionUnionSelectorNode
  | ProjectionUnionVariantSelectorNode
  | ProjectionModelPropertyNode
  | ProjectionModelSpreadPropertyNode
  | ProjectionStatementNode
  | ProjectionNode;

/**
 * Node that can be used as template
 */
export type TemplateableNode =
  | ModelStatementNode
  | ScalarStatementNode
  | AliasStatementNode
  | InterfaceStatementNode
  | OperationStatementNode
  | UnionStatementNode;

/**
 * Node types that can have referencable members
 */
export type MemberContainerNode =
  | ModelStatementNode
  | ModelExpressionNode
  | InterfaceStatementNode
  | EnumStatementNode
  | UnionStatementNode;

export type MemberNode =
  | ModelPropertyNode
  | EnumMemberNode
  | OperationStatementNode
  | UnionVariantNode;

export type MemberContainerType = Model | Enum | Interface | Union;

/**
 * Type that can be used as members of a container type.
 */
export type MemberType = ModelProperty | EnumMember | Operation | UnionVariant;

export type Comment = LineComment | BlockComment;

export interface LineComment extends TextRange {
  readonly kind: SyntaxKind.LineComment;
}
export interface BlockComment extends TextRange {
  readonly kind: SyntaxKind.BlockComment;
  /** If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. */
  readonly parsedAsDocs?: boolean;
}

export interface ParseOptions {
  /** When true, collect comment ranges in {@link TypeSpecScriptNode.comments}. */
  readonly comments?: boolean;
  /** When true, parse doc comments into {@link Node.docs}. */
  readonly docs?: boolean;
}

/** @deprecated Use TypeSpecScriptNode */
export type CadlScriptNode = TypeSpecScriptNode;

export interface TypeSpecScriptNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.TypeSpecScript;
  readonly statements: readonly Statement[];
  readonly file: SourceFile;
  readonly inScopeNamespaces: readonly NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  readonly namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  readonly usings: readonly UsingStatementNode[];
  readonly comments: readonly Comment[];
  readonly parseDiagnostics: readonly Diagnostic[];
  readonly printable: boolean; // If this ast tree can safely be printed/formatted.
  readonly locals: SymbolTable;
  readonly parseOptions: ParseOptions; // Options used to parse this file
}

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
  | EmptyStatementNode
  | InvalidStatementNode
  | ProjectionStatementNode;

export interface DeclarationNode {
  readonly id: IdentifierNode;
}

export type Declaration =
  | ModelStatementNode
  | ScalarStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode
  | ProjectionStatementNode
  | ProjectionParameterDeclarationNode
  | ProjectionLambdaParameterDeclarationNode
  | EnumStatementNode
  | AliasStatementNode
  | DecoratorDeclarationStatementNode
  | FunctionDeclarationStatementNode;

export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode
  | TypeSpecScriptNode
  | JsSourceFileNode
  | ProjectionLambdaExpressionNode
  | ProjectionNode;

export interface ImportStatementNode extends BaseNode {
  readonly kind: SyntaxKind.ImportStatement;
  readonly path: StringLiteralNode;
  readonly parent?: TypeSpecScriptNode;
}

export interface IdentifierNode extends BaseNode {
  readonly kind: SyntaxKind.Identifier;
  readonly sv: string;
}

export interface DecoratorExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.DecoratorExpression;
  readonly target: IdentifierNode | MemberExpressionNode;
  readonly arguments: readonly Expression[];
}

export interface AugmentDecoratorStatementNode extends BaseNode {
  readonly kind: SyntaxKind.AugmentDecoratorStatement;
  readonly target: IdentifierNode | MemberExpressionNode;
  readonly targetType: TypeReferenceNode;
  readonly arguments: readonly Expression[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface DirectiveExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.DirectiveExpression;
  readonly target: IdentifierNode;
  readonly arguments: readonly DirectiveArgument[];
}

export type DirectiveArgument = StringLiteralNode | IdentifierNode;

export type Expression =
  | ArrayExpressionNode
  | MemberExpressionNode
  | ModelExpressionNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IntersectionExpressionNode
  | TypeReferenceNode
  | ValueOfExpressionNode
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | VoidKeywordNode
  | NeverKeywordNode
  | AnyKeywordNode;

export type ProjectionExpression =
  | ProjectionLogicalExpressionNode
  | ProjectionRelationalExpressionNode
  | ProjectionEqualityExpressionNode
  | ProjectionUnaryExpressionNode
  | ProjectionArithmeticExpressionNode
  | ProjectionCallExpressionNode
  | ProjectionMemberExpressionNode
  | ProjectionDecoratorReferenceExpressionNode
  | ProjectionTupleExpressionNode
  | ProjectionModelExpressionNode
  | ProjectionIfExpressionNode
  | ProjectionBlockExpressionNode
  | ProjectionLambdaExpressionNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | IdentifierNode
  | VoidKeywordNode
  | NeverKeywordNode
  | AnyKeywordNode
  | ReturnExpressionNode;

export type ReferenceExpression =
  | TypeReferenceNode
  | MemberExpressionNode
  | IdentifierNode
  | VoidKeywordNode
  | NeverKeywordNode;

export interface MemberExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.MemberExpression;
  readonly id: IdentifierNode;
  readonly base: MemberExpressionNode | IdentifierNode;
  readonly selector: "." | "::";
}

export interface NamespaceStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.NamespaceStatement;
  readonly statements?: readonly Statement[] | NamespaceStatementNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly locals?: SymbolTable;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UsingStatementNode extends BaseNode {
  readonly kind: SyntaxKind.UsingStatement;
  readonly name: IdentifierNode | MemberExpressionNode;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface OperationSignatureDeclarationNode extends BaseNode {
  readonly kind: SyntaxKind.OperationSignatureDeclaration;
  readonly parameters: ModelExpressionNode;
  readonly returnType: Expression;
}

export interface OperationSignatureReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.OperationSignatureReference;
  readonly baseOperation: TypeReferenceNode;
}

export type OperationSignature =
  | OperationSignatureDeclarationNode
  | OperationSignatureReferenceNode;

export interface OperationStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.OperationStatement;
  readonly signature: OperationSignature;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode | InterfaceStatementNode;
}

export interface ModelStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.ModelStatement;
  readonly properties: readonly (ModelPropertyNode | ModelSpreadPropertyNode)[];
  readonly extends?: Expression;
  readonly is?: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface ScalarStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.ScalarStatement;
  readonly extends?: TypeReferenceNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface InterfaceStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.InterfaceStatement;
  readonly operations: readonly OperationStatementNode[];
  readonly extends: readonly TypeReferenceNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UnionStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.UnionStatement;
  readonly options: readonly UnionVariantNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UnionVariantNode extends BaseNode {
  readonly kind: SyntaxKind.UnionVariant;
  readonly id?: IdentifierNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: UnionStatementNode;
}

export interface EnumStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.EnumStatement;
  readonly members: readonly (EnumMemberNode | EnumSpreadMemberNode)[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface EnumMemberNode extends BaseNode {
  readonly kind: SyntaxKind.EnumMember;
  readonly id: IdentifierNode;
  readonly value?: StringLiteralNode | NumericLiteralNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: EnumStatementNode;
}

export interface EnumSpreadMemberNode extends BaseNode {
  readonly kind: SyntaxKind.EnumSpreadMember;
  readonly target: TypeReferenceNode;
}

export interface AliasStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.AliasStatement;
  readonly value: Expression;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface InvalidStatementNode extends BaseNode {
  readonly kind: SyntaxKind.InvalidStatement;
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface EmptyStatementNode extends BaseNode {
  readonly kind: SyntaxKind.EmptyStatement;
}

export interface ModelExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ModelExpression;
  readonly properties: (ModelPropertyNode | ModelSpreadPropertyNode)[];
}

export interface ArrayExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ArrayExpression;
  readonly elementType: Expression;
}
export interface TupleExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.TupleExpression;
  readonly values: readonly Expression[];
}

export interface ModelPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ModelProperty;
  readonly id: IdentifierNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly optional: boolean;
  readonly default?: Expression;
  readonly parent?: ModelStatementNode | ModelExpressionNode;
}

export interface ModelSpreadPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ModelSpreadProperty;
  readonly target: TypeReferenceNode;
  readonly parent?: ModelStatementNode | ModelExpressionNode;
}

export type LiteralNode = StringLiteralNode | NumericLiteralNode | BooleanLiteralNode;

export interface StringLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.StringLiteral;
  readonly value: string;
}

export interface NumericLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.NumericLiteral;
  readonly value: number;
  readonly valueAsString: string;
}

export interface BooleanLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.BooleanLiteral;
  readonly value: boolean;
}

export interface ExternKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.ExternKeyword;
}

export interface VoidKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.VoidKeyword;
}

export interface NeverKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.NeverKeyword;
}

export interface AnyKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.UnknownKeyword;
}

export interface ReturnExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.Return;
  readonly value: ProjectionExpression;
}

export interface UnionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.UnionExpression;
  readonly options: readonly Expression[];
}

export interface IntersectionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.IntersectionExpression;
  readonly options: readonly Expression[];
}

export interface ValueOfExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ValueOfExpression;
  readonly target: Expression;
}

export interface TypeReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.TypeReference;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: readonly Expression[];
}

export interface ProjectionReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionReference;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: readonly Expression[];
}

export interface TemplateParameterDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.TemplateParameterDeclaration;
  readonly constraint?: Expression;
  readonly default?: Expression;
  readonly parent?: TemplateableNode;
}

export const enum ModifierFlags {
  None,
  Extern = 1 << 1,
}

export type Modifier = ExternKeywordNode;

/**
 * Represent a decorator declaration
 * @example
 * ```typespec
 * extern dec doc(target: Type, value: valueof string);
 * ```
 */
export interface DecoratorDeclarationStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.DecoratorDeclarationStatement;
  readonly modifiers: readonly Modifier[];
  readonly modifierFlags: ModifierFlags;
  /**
   * Decorator target. First parameter.
   */
  readonly target: FunctionParameterNode;

  /**
   * Additional parameters
   */
  readonly parameters: FunctionParameterNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface FunctionParameterNode extends BaseNode {
  readonly kind: SyntaxKind.FunctionParameter;
  readonly id: IdentifierNode;
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
 * Represent a function declaration
 * @example
 * ```typespec
 * extern fn camelCase(value: StringLiteral): StringLiteral;
 * ```
 */
export interface FunctionDeclarationStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.FunctionDeclarationStatement;
  readonly modifiers: readonly Modifier[];
  readonly modifierFlags: ModifierFlags;
  readonly parameters: FunctionParameterNode[];
  readonly returnType?: Expression;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

// Projection-related Syntax

export interface ProjectionModelSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionModelSelector;
}

export interface ProjectionModelPropertySelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionModelPropertySelector;
}

export interface ProjectionInterfaceSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionInterfaceSelector;
}

export interface ProjectionOperationSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionOperationSelector;
}

export interface ProjectionUnionSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionUnionSelector;
}

export interface ProjectionUnionVariantSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionUnionVariantSelector;
}

export interface ProjectionEnumSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionEnumSelector;
}

export interface ProjectionEnumMemberSelectorNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionEnumMemberSelector;
}

export type ProjectionStatementItem = ProjectionExpressionStatementNode;

export interface ProjectionParameterDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.ProjectionParameterDeclaration;
}

export interface ProjectionExpressionStatementNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionExpressionStatement;
  readonly expr: ProjectionExpression;
}

export interface ProjectionLogicalExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionLogicalExpression;
  readonly op: "||" | "&&";
  readonly left: ProjectionExpression;
  readonly right: ProjectionExpression;
}

export interface ProjectionRelationalExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionRelationalExpression;
  readonly op: "<=" | "<" | ">" | ">=";
  readonly left: ProjectionExpression;
  readonly right: ProjectionExpression;
}

export interface ProjectionEqualityExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionEqualityExpression;
  readonly op: "==" | "!=";
  readonly left: ProjectionExpression;
  readonly right: ProjectionExpression;
}

export interface ProjectionArithmeticExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionArithmeticExpression;
  readonly op: "+" | "-" | "*" | "/";
  readonly left: ProjectionExpression;
  readonly right: ProjectionExpression;
}

export interface ProjectionUnaryExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionUnaryExpression;
  readonly op: "!";
  readonly target: ProjectionExpression;
}

export interface ProjectionCallExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionCallExpression;
  readonly callKind: "method" | "template";
  readonly target: ProjectionExpression;
  readonly arguments: ProjectionExpression[];
}

export interface ProjectionMemberExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionMemberExpression;
  readonly base: ProjectionExpression;
  readonly id: IdentifierNode;
  readonly selector: "." | "::";
}

export interface ProjectionModelExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionModelExpression;
  readonly properties: (ProjectionModelPropertyNode | ProjectionModelSpreadPropertyNode)[];
}

export interface ProjectionTupleExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionTupleExpression;
  readonly values: ProjectionExpression[];
}

export interface ProjectionModelPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionModelProperty;
  readonly id: IdentifierNode;
  readonly value: ProjectionExpression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly optional: boolean;
  readonly default?: ProjectionExpression;
}

export interface ProjectionModelSpreadPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionModelSpreadProperty;
  readonly target: ProjectionExpression;
}

export interface ProjectionIfExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionIfExpression;
  readonly test: ProjectionExpression;
  readonly consequent: ProjectionBlockExpressionNode;
  readonly alternate?: ProjectionBlockExpressionNode | ProjectionIfExpressionNode;
}

export interface ProjectionBlockExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionBlockExpression;
  readonly statements: ProjectionStatementItem[];
}

export interface ProjectionLambdaExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionLambdaExpression;
  readonly parameters: readonly ProjectionLambdaParameterDeclarationNode[];
  readonly locals?: SymbolTable;
  readonly body: ProjectionBlockExpressionNode;
}

export interface ProjectionLambdaParameterDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.ProjectionLambdaParameterDeclaration;
}

export interface ProjectionNode extends BaseNode {
  readonly kind: SyntaxKind.Projection;
  readonly direction: "to" | "from" | "pre_to" | "pre_from" | "<error>";
  readonly directionId: IdentifierNode;
  readonly modifierIds: readonly IdentifierNode[];
  readonly parameters: ProjectionParameterDeclarationNode[];
  readonly body: readonly ProjectionStatementItem[];
  readonly locals?: SymbolTable;
}

export interface ProjectionStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.ProjectionStatement;
  readonly selector:
    | ProjectionModelSelectorNode
    | ProjectionModelPropertySelectorNode
    | ProjectionInterfaceSelectorNode
    | ProjectionOperationSelectorNode
    | ProjectionUnionSelectorNode
    | ProjectionUnionVariantSelectorNode
    | ProjectionEnumSelectorNode
    | ProjectionEnumMemberSelectorNode
    | MemberExpressionNode
    | IdentifierNode;
  readonly to?: ProjectionNode;
  readonly from?: ProjectionNode;
  readonly preTo?: ProjectionNode;
  readonly preFrom?: ProjectionNode;
  readonly projections: readonly ProjectionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface ProjectionDecoratorReferenceExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionDecoratorReferenceExpression;
  readonly target: MemberExpressionNode | IdentifierNode;
}

export interface IdentifierContext {
  kind: IdentifierKind;
  node: Node;
}

export enum IdentifierKind {
  TypeReference,
  Decorator,
  Function,
  Using,
  Declaration,
  Other,
}

// Doc-comment related syntax

export interface DocNode extends BaseNode {
  readonly kind: SyntaxKind.Doc;
  readonly content: readonly DocContent[];
  readonly tags: readonly DocTag[];
}

export interface DocTagBaseNode extends BaseNode {
  readonly tagName: IdentifierNode;
  readonly content: readonly DocContent[];
}

export type DocTag =
  | DocReturnsTagNode
  | DocErrorsTagNode
  | DocParamTagNode
  | DocTemplateTagNode
  | DocUnknownTagNode;
export type DocContent = DocTextNode;

export interface DocTextNode extends BaseNode {
  readonly kind: SyntaxKind.DocText;
  readonly text: string;
}

export interface DocReturnsTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocReturnsTag;
}

export interface DocErrorsTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocErrorsTag;
}

export interface DocParamTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocParamTag;
  readonly paramName: IdentifierNode;
}

export interface DocTemplateTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocTemplateTag;
  readonly paramName: IdentifierNode;
}

export interface DocUnknownTagNode extends DocTagBaseNode {
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

export interface JsSourceFileNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.JsSourceFile;

  /* A source file with empty contents to represent the file on disk. */
  readonly file: SourceFile;

  /* The exports object as comes from `import()` */
  readonly esmExports: any;

  /* Any namespaces declared by decorators. */
  readonly namespaceSymbols: Sym[];
}

export interface JsNamespaceDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.JsNamespaceDeclaration;
}

export type EmitterFunc = (context: EmitContext) => Promise<void> | void;

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
  type: "project";
}

/** Built-in */
export interface CompilerLocationContext {
  type: "compiler";
}

/** Refer to a type that was not declared in a file */
export interface SyntheticLocationContext {
  type: "synthetic";
}

/** Defined in a library. */
export interface LibraryLocationContext {
  type: "library";
  metadata: ModuleLibraryMetadata;
}

export interface LibraryInstance {
  module: ModuleResolutionResult;
  entrypoint: JsSourceFileNode | undefined;
  metadata: LibraryMetadata;
  definition?: TypeSpecLibrary<any>;
}

export type LibraryMetadata = FileLibraryMetadata | ModuleLibraryMetadata;

interface LibraryMetadataBase {
  /** Library homepage. */
  homepage?: string;

  /** Library version */
  version?: string;

  bugs?: {
    /** Url where to file bugs for this library. */
    url?: string;
  };
}

export interface FileLibraryMetadata extends LibraryMetadataBase {
  type: "file";

  /** Library name as specified in the package.json or in exported $lib. */
  name?: string;
}

/** Data for a library. Either loaded via a node_modules package or a standalone js file  */
export interface ModuleLibraryMetadata extends LibraryMetadataBase {
  type: "module";

  /** Library name as specified in the package.json or in exported $lib. */
  name: string;
}

export interface TextRange {
  /**
   * The starting position of the ranger measured in UTF-16 code units from the
   * start of the full string. Inclusive.
   */
  readonly pos: number;

  /**
   * The ending position measured in UTF-16 code units from the start of the
   * full string. Exclusive.
   */
  readonly end: number;
}

export interface SourceLocation extends TextRange {
  file: SourceFile;
  isSynthetic?: boolean;
}

/** Used to explicitly specify that a diagnostic has no target. */
export const NoTarget = Symbol.for("NoTarget");

/** Diagnostic target that can be used when working with TypeSpec types.  */
export type TypeSpecDiagnosticTarget = Node | Type | Sym;
export type DiagnosticTarget = TypeSpecDiagnosticTarget | SourceLocation;

export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  target: DiagnosticTarget | typeof NoTarget;
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

export interface Dirent {
  isFile(): boolean;
  name: string;
  isDirectory(): boolean;
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

export interface CompilerHost {
  /** read a file at the given url. */
  readUrl(url: string): Promise<SourceFile>;

  /** read a utf-8 or utf-8 with bom encoded file */
  readFile(path: string): Promise<SourceFile>;

  /**
   * Optional cache to reuse the results of parsing and binding across programs.
   */
  parseCache?: WeakMap<SourceFile, TypeSpecScriptNode>;

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
  readDir(dir: string): Promise<string[]>;

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

  // get the directory TypeSpec is executing from
  getExecutionRoot(): string;

  // get the directories we should load standard library files from
  getLibDirs(): string[];

  // get a promise for the ESM module shape of a JS module
  getJsImport(path: string): Promise<Record<string, any>>;

  // get info about a path
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  getSourceFileKind(path: string): SourceFileKind | undefined;

  // get the real path of a possibly symlinked path
  realpath(path: string): Promise<string>;

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

export enum ListenerFlow {
  /**
   * Do not navigate any containing or referenced type.
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

export type TypeListeners = UnionToIntersection<ListenerForType<Type>>;

export type SemanticNodeListener = {
  root?: (context: Program) => void | undefined;
} & TypeListeners;

export type DiagnosticReportWithoutTarget<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> = {
  code: C;
  messageId?: M;
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
> = T[C][M] extends CallableMessage<infer A>
  ? { format: Record<A[number], string> }
  : Record<string, unknown>;

export interface DiagnosticDefinition<M extends DiagnosticMessages> {
  readonly severity: "warning" | "error";
  readonly messages: M;
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
    diag: DiagnosticReport<T, C, M>
  ): Diagnostic;
  reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diag: DiagnosticReport<T, C, M>
  ): void;
}

export type TypeOfDiagnostics<T extends DiagnosticMap<any>> = T extends DiagnosticMap<infer D>
  ? D
  : never;

export type JSONSchemaType<T> = AjvJSONSchemaType<T>;

export interface JSONSchemaValidator {
  /**
   * Validate the configuration against its JSON Schema.
   *
   * @param config Configuration to validate.
   * @param target Source file target to use for diagnostics.
   * @returns Diagnostics produced by schema validation of the configuration.
   */
  validate(config: unknown, target: YamlScript | SourceFile | typeof NoTarget): Diagnostic[];
}

/** @deprecated Use TypeSpecLibraryDef */
export type CadlLibraryDef<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
> = TypeSpecLibraryDef<T, E>;

/**
 * Definition of a TypeSpec library
 */
export interface TypeSpecLibraryDef<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
> {
  /**
   * Name of the library. Must match the package.json name.
   */
  readonly name: string;

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
   * Emitter configuration if library is an emitter.
   */
  readonly emitter?: {
    options?: JSONSchemaType<E>;
  };

  /**
   * Configuration if library is providing linting rules/rulesets.
   */
  readonly linter?: LinterDefinition;
}

export interface LinterDefinition {
  rules: LinterRuleDefinition<string, DiagnosticMessages>[];
  ruleSets?: Record<string, LinterRuleSet>;
}

export interface LinterRuleDefinition<N extends string, DM extends DiagnosticMessages> {
  name: N;
  severity: "warning";
  description: string;
  messages: DM;
  create(context: LinterRuleContext<DM>): SemanticNodeListener;
}

/** Resolved instance of a linter rule that will run. */
export interface LinterRule<N extends string, DM extends DiagnosticMessages>
  extends LinterRuleDefinition<N, DM> {
  /** Expanded rule id in format `<library-name>:<rule-name>` */
  id: string;
}

/** Reference to a rule. In this format `<library name>:<rule/ruleset name>` */
export type RuleRef = `${string}/${string}`;
export interface LinterRuleSet {
  /** Other ruleset this ruleset extends */
  extends?: RuleRef[];

  /** Rules to enable/configure */
  enable?: Record<RuleRef, boolean>;

  /** Rules to disable. A rule CANNOT be in enable and disable map. */
  disable?: Record<RuleRef, string>;
}

export interface LinterRuleContext<DM extends DiagnosticMessages> {
  readonly program: Program;
  reportDiagnostic<M extends keyof DM>(diag: LinterRuleDiagnosticReport<DM, M>): void;
}

export type LinterRuleDiagnosticFormat<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = T[M] extends CallableMessage<infer A>
  ? { format: Record<A[number], string> }
  : Record<string, unknown>;

export type LinterRuleDiagnosticReportWithoutTarget<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = {
  messageId?: M;
} & LinterRuleDiagnosticFormat<T, M>;

export type LinterRuleDiagnosticReport<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = LinterRuleDiagnosticReportWithoutTarget<T, M> & { target: DiagnosticTarget | typeof NoTarget };

/** @deprecated Use TypeSpecLibrary */
export type CadlLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
> = TypeSpecLibrary<T, E>;

export interface TypeSpecLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
> extends TypeSpecLibraryDef<T, E> {
  /**
   * JSON Schema validator for emitter options
   */
  readonly emitterOptionValidator?: JSONSchemaValidator;

  reportDiagnostic<C extends keyof T, M extends keyof T[C]>(
    program: Program,
    diag: DiagnosticReport<T, C, M>
  ): void;
  createDiagnostic<C extends keyof T, M extends keyof T[C]>(
    diag: DiagnosticReport<T, C, M>
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
}

/**
 * Get the options for the onEmit of this library.
 */
export type EmitOptionsFor<C> = C extends TypeSpecLibrary<infer _T, infer E> ? E : never;

export interface DecoratorContext {
  program: Program;

  /**
   * Point to the decorator target
   */
  decoratorTarget: DiagnosticTarget;

  /**
   * Function that can be used to retrieve the target for a parameter at the given index.
   * @param paramIndex Parameter index in the typespec
   * @example @foo("bar", 123) -> $foo(context, target, arg0: string, arg1: number);
   *  getArgumentTarget(0) -> target for arg0
   *  getArgumentTarget(1) -> target for arg1
   */
  getArgumentTarget(paramIndex: number): DiagnosticTarget | undefined;

  /**
   * Helper to call out to another decorator
   * @param decorator Other decorator function
   * @param args Args to pass to other decorator function
   */
  call<T extends Type, A extends any[], R>(
    decorator: (context: DecoratorContext, target: T, ...args: A) => R,
    target: T,
    ...args: A
  ): R;
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
   * Get an asset emitter to write emitted output to disk using a TypeEmitter
   *
   * @param TypeEmitterClass The TypeEmitter to construct your emitted output
   */
  getAssetEmitter<T>(TypeEmitterClass: typeof TypeEmitter<T, TOptions>): AssetEmitter<T, TOptions>;
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
  sourceLocation?: SourceLocation;
}

export interface LogSink {
  log(log: ProcessedLog): void;
}

export interface Logger {
  trace(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  log(log: LogInfo): void;
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
   * @param area
   */
  sub(subarea: string): Tracer;
}
