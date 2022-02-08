import { Program } from "./program";

/**
 * Type System types
 */

export type DecoratorArgument = Type | number | string | boolean;

export interface DecoratorApplication {
  decorator: DecoratorFunction;
  args: DecoratorArgument[];
  node?: DecoratorExpressionNode;
}

export interface DecoratorFunction {
  (program: DecoratorContext, target: Type, ...customArgs: any[]): void;
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
}

export interface DecoratedType {
  decorators: DecoratorApplication[];
}

export interface TemplatedType {
  templateArguments?: Type[];
  templateNode?: Node;
}
export type Type =
  | ModelType
  | ModelTypeProperty
  | InterfaceType
  | EnumType
  | EnumMemberType
  | TemplateParameterType
  | NamespaceType
  | OperationType
  | StringLiteralType
  | NumericLiteralType
  | BooleanLiteralType
  | ArrayType
  | TupleType
  | UnionType
  | UnionTypeVariant
  | IntrinsicType
  | FunctionType
  | ObjectType
  | ProjectionType;

export type TypeOrReturnRecord = Type | ReturnRecord;

export interface FunctionType extends BaseType {
  kind: "Function";
  call(...args: any[]): Type;
}

export interface ObjectType extends BaseType {
  kind: "Object";
  properties: Record<string, Type>;
}

export interface ProjectionType extends BaseType {
  kind: "Projection";
  node: undefined;
  nodeByKind: Map<string, ProjectionStatementNode>;
  nodeByType: Map<Type, ProjectionStatementNode>;
}

export interface ProjectionApplication {
  scope?: Type;
  projectionName: string;
  arguments: DecoratorArgument[];
  direction?: "from" | "to";
}

export interface Projector {
  projections: ProjectionApplication[];
  projectedTypes: Map<Type, Type>;
  projectType(type: Type): Type;
  projectedStartNode?: Type;
  projectedGlobalNamespace?: NamespaceType;
}

export interface IntrinsicType extends BaseType {
  kind: "Intrinsic";
  name: string;
}

export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
}

// represents a type that is being returned from the
// currently executing lambda or projection
export interface ReturnRecord {
  kind: "Return";
  value: Type;
}

export type IntrinsicModelName =
  | "bytes"
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
  | "string"
  | "plainDate"
  | "plainTime"
  | "zonedDateTime"
  | "duration"
  | "boolean"
  | "null";

export interface ModelType extends BaseType, DecoratedType, TemplatedType {
  kind: "Model";
  name: IntrinsicModelName | string;
  node:
    | ModelStatementNode
    | ModelExpressionNode
    | IntersectionExpressionNode
    | ProjectionModelExpressionNode;
  namespace?: NamespaceType;
  properties: Map<string, ModelTypeProperty>;
  baseModel?: ModelType;
}

export interface ModelTypeProperty extends BaseType, DecoratedType {
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
  sourceProperty?: ModelTypeProperty;
  optional: boolean;
  default?: Type;
}

export interface InterfaceType extends BaseType, DecoratedType, TemplatedType {
  kind: "Interface";
  name: string;
  node: InterfaceStatementNode;
  namespace?: NamespaceType;
  operations: Map<string, OperationType>;
}

export interface EnumType extends BaseType, DecoratedType {
  kind: "Enum";
  name: string;
  node: EnumStatementNode;
  namespace?: NamespaceType;
  members: EnumMemberType[];
}

export interface EnumMemberType extends BaseType, DecoratedType {
  kind: "EnumMember";
  name: string;
  enum: EnumType;
  node: EnumMemberNode;
  value?: string | number;
}

export interface OperationType extends BaseType, DecoratedType {
  kind: "Operation";
  node: OperationStatementNode;
  name: string;
  namespace?: NamespaceType;
  interface?: InterfaceType;
  parameters: ModelType;
  returnType: Type;
}

export interface NamespaceType extends BaseType, DecoratedType {
  kind: "Namespace";
  name: string;
  namespace?: NamespaceType;
  node: NamespaceStatementNode;
  models: Map<string, ModelType>;
  operations: Map<string, OperationType>;
  namespaces: Map<string, NamespaceType>;
  interfaces: Map<string, InterfaceType>;
  enums: Map<string, EnumType>;
  unions: Map<string, UnionType>;
}

export type LiteralType = StringLiteralType | NumericLiteralType | BooleanLiteralType;

export interface StringLiteralType extends BaseType {
  kind: "String";
  node?: StringLiteralNode;
  value: string;
}

export interface NumericLiteralType extends BaseType {
  kind: "Number";
  node?: NumericLiteralNode;
  value: number;
}

export interface BooleanLiteralType extends BaseType {
  kind: "Boolean";
  node?: BooleanLiteralNode;
  value: boolean;
}

export interface ArrayType extends BaseType {
  kind: "Array";
  node: ArrayExpressionNode;
  elementType: Type;
}

export interface TupleType extends BaseType {
  kind: "Tuple";
  node: TupleExpressionNode;
  values: Type[];
}

export interface UnionType extends BaseType, DecoratedType, TemplatedType {
  kind: "Union";
  name?: string;
  node: UnionExpressionNode | UnionStatementNode;
  namespace?: NamespaceType;
  variants: Map<string | Symbol, UnionTypeVariant>;
  expression: boolean;
  readonly options: Type[];
}

export interface UnionTypeVariant extends BaseType, DecoratedType {
  kind: "UnionVariant";
  name: string | Symbol;
  node: UnionVariantNode | undefined;
  type: Type;
}

export interface TemplateParameterType extends BaseType {
  kind: "TemplateParameter";
  node: TemplateParameterDeclarationNode;
}

export interface ProjectionSymbol {
  kind: "projection";
  name: string;
  node: ProjectionStatementNode;
  byKind: Map<string, { to?: ProjectionNode; from?: ProjectionNode }>;
  byId: Map<TypeReferenceNode, { to?: ProjectionNode; from?: ProjectionNode }>;
  id?: number;
  symbolSource?: ProjectionSymbol;
}

export interface DecoratorSymbol {
  kind: "decorator";
  path: string;
  name: string;
  value: (...args: any[]) => any;
}

export interface FunctionSymbol {
  kind: "function";
  name: string;
  value: (...args: any[]) => any;
  symbolSource?: FunctionSymbol;
}
export interface TypeSymbol {
  kind: "type";
  node: Node;
  name: string;
  merged?: boolean;
  // for merged nodes, this lists all the nodes
  // that contribute to this symbol.
  nodes?: Node[];
  id?: number;
}

export interface UsingSymbol {
  kind: "using";
  symbolSource: ExportSymbol;
  duplicate?: boolean;
}

export type LocalSymbol = UsingSymbol | TypeSymbol;
export type ExportSymbol = TypeSymbol | DecoratorSymbol | ProjectionSymbol | FunctionSymbol;
export type Sym = LocalSymbol | ExportSymbol;

export interface SymbolLinks {
  type?: Type;

  // for types which can be instantiated, we split `type` into declaredType and
  // a map of instantiations.
  declaredType?: Type;
  instantiations?: TypeInstantiationMap;
}

export interface SymbolTable<T extends Sym> extends Map<string, T> {
  /**
   * Duplicate
   */
  readonly duplicates: Map<T, Set<T>>;
}

/**
 * Maps type arguments to instantiated type.
 */
export interface TypeInstantiationMap {
  get(args: Type[]): Type | undefined;
  set(args: Type[], type: Type): void;
}

/**
 * AST types
 */
export enum SyntaxKind {
  CadlScript,
  ImportStatement,
  Identifier,
  NamedImport,
  DecoratorExpression,
  DirectiveExpression,
  MemberExpression,
  NamespaceStatement,
  UsingStatement,
  OperationStatement,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  ModelSpreadProperty,
  InterfaceStatement,
  UnionStatement,
  UnionVariant,
  EnumStatement,
  EnumMember,
  AliasStatement,
  UnionExpression,
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  VoidKeyword,
  NeverKeyword,
  TypeReference,
  ProjectionReference,
  TemplateParameterDeclaration,
  EmptyStatement,
  InvalidStatement,
  LineComment,
  BlockComment,
  Projection,
  ProjectionParameterDeclaration,
  ProjectionModelSelector,
  ProjectionOperationSelector,
  ProjectionUnionSelector,
  ProjectionInterfaceSelector,
  ProjectionEnumSelector,
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
}

export interface BaseNode extends TextRange {
  readonly kind: SyntaxKind;
  parent?: Node;
  readonly directives?: readonly DirectiveExpressionNode[];
}

export interface TemplateDeclarationNode {
  readonly templateParameters: readonly TemplateParameterDeclarationNode[];
  locals?: SymbolTable<LocalSymbol>;
}

export type Node =
  | CadlScriptNode
  | TemplateParameterDeclarationNode
  | ProjectionParameterDeclarationNode
  | ProjectionLambdaParameterDeclarationNode
  | ModelPropertyNode
  | UnionVariantNode
  | OperationStatementNode
  | NamedImportNode
  | EnumMemberNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
  | DirectiveExpressionNode
  | Statement
  | Expression
  | ProjectionStatementItem
  | ProjectionExpression
  | ProjectionModelSelectorNode
  | ProjectionInterfaceSelectorNode
  | ProjectionOperationSelectorNode
  | ProjectionEnumSelectorNode
  | ProjectionUnionSelectorNode
  | ProjectionModelPropertyNode
  | ProjectionModelSpreadPropertyNode
  | ProjectionStatementNode
  | ProjectionNode;

export type Comment = LineComment | BlockComment;

export interface LineComment extends TextRange {
  kind: SyntaxKind.LineComment;
}
export interface BlockComment extends TextRange {
  kind: SyntaxKind.BlockComment;
}

export interface CadlScriptNode extends ContainerNode, BaseNode {
  readonly kind: SyntaxKind.CadlScript;
  readonly statements: readonly Statement[];
  readonly file: SourceFile;
  readonly inScopeNamespaces: readonly NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  readonly namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  readonly usings: readonly UsingStatementNode[];
  readonly comments: readonly Comment[];
  readonly parseDiagnostics: readonly Diagnostic[];
  readonly printable: boolean; // If this ast tree can safely be printed/formatted.
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | NamespaceStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | UsingStatementNode
  | EnumStatementNode
  | AliasStatementNode
  | OperationStatementNode
  | EmptyStatementNode
  | InvalidStatementNode
  | ProjectionStatementNode;

export interface DeclarationNode<SymbolKind = TypeSymbol> {
  readonly symbol: SymbolKind; // tracks the symbol assigned to this declaration
  readonly namespaceSymbol?: TypeSymbol; // tracks the namespace this declaration is in
}

export type Declaration =
  | ModelStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode
  | ProjectionStatementNode
  | ProjectionParameterDeclarationNode
  | ProjectionLambdaParameterDeclarationNode
  | EnumStatementNode
  | AliasStatementNode;

export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode
  | CadlScriptNode
  | ProjectionLambdaExpressionNode
  | ProjectionNode;

export interface ImportStatementNode extends BaseNode {
  readonly kind: SyntaxKind.ImportStatement;
  readonly path: StringLiteralNode;
}

export interface IdentifierNode extends BaseNode {
  readonly kind: SyntaxKind.Identifier;
  readonly sv: string;
}

export interface NamedImportNode extends BaseNode {
  readonly kind: SyntaxKind.NamedImport;
  readonly id: IdentifierNode;
}

export interface DecoratorExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.DecoratorExpression;
  readonly target: IdentifierNode | MemberExpressionNode;
  readonly arguments: readonly Expression[];
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
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | VoidKeywordNode
  | NeverKeywordNode;

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
}

export interface ContainerNode {
  readonly locals?: SymbolTable<LocalSymbol>;
  readonly exports?: SymbolTable<ExportSymbol>;
}

export interface NamespaceStatementNode extends BaseNode, DeclarationNode, ContainerNode {
  readonly kind: SyntaxKind.NamespaceStatement;
  readonly name: IdentifierNode;
  readonly statements?: readonly Statement[] | NamespaceStatementNode;
  readonly decorators: DecoratorExpressionNode[];
}

export interface UsingStatementNode extends BaseNode {
  readonly kind: SyntaxKind.UsingStatement;
  readonly name: IdentifierNode | MemberExpressionNode;
}

export interface OperationStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.OperationStatement;
  readonly id: IdentifierNode;
  readonly parameters: ModelExpressionNode;
  readonly returnType: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface ModelStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.ModelStatement;
  readonly id: IdentifierNode;
  readonly properties: readonly (ModelPropertyNode | ModelSpreadPropertyNode)[];
  readonly extends?: TypeReferenceNode;
  readonly is?: TypeReferenceNode;
  readonly decorators: DecoratorExpressionNode[];
}

export interface InterfaceStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.InterfaceStatement;
  readonly id: IdentifierNode;
  readonly operations: readonly OperationStatementNode[];
  readonly mixes: readonly TypeReferenceNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface UnionStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.UnionStatement;
  readonly id: IdentifierNode;
  readonly options: readonly UnionVariantNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface UnionVariantNode extends BaseNode {
  readonly kind: SyntaxKind.UnionVariant;
  readonly id: IdentifierNode | StringLiteralNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface EnumStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.EnumStatement;
  readonly id: IdentifierNode;
  readonly members: readonly EnumMemberNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface EnumMemberNode extends BaseNode {
  readonly kind: SyntaxKind.EnumMember;
  readonly id: IdentifierNode | StringLiteralNode;
  readonly value?: StringLiteralNode | NumericLiteralNode;
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface AliasStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.AliasStatement;
  readonly id: IdentifierNode;
  readonly value: Expression;
}

export interface InvalidStatementNode extends BaseNode {
  readonly kind: SyntaxKind.InvalidStatement;
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
  readonly id: IdentifierNode | StringLiteralNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly optional: boolean;
  readonly default?: Expression;
}

export interface ModelSpreadPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ModelSpreadProperty;
  readonly target: TypeReferenceNode;
}

export type LiteralNode = StringLiteralNode | NumericLiteralNode | BooleanLiteralNode;

export interface StringLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.StringLiteral;
  readonly value: string;
}

export interface NumericLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.NumericLiteral;
  readonly value: number;
}

export interface BooleanLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.BooleanLiteral;
  readonly value: boolean;
}

export interface VoidKeywordNode extends BaseNode {
  kind: SyntaxKind.VoidKeyword;
}

export interface NeverKeywordNode extends BaseNode {
  kind: SyntaxKind.NeverKeyword;
}

export interface ReturnExpressionNode extends BaseNode {
  kind: SyntaxKind.Return;
  value: ProjectionExpression;
}

export interface UnionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.UnionExpression;
  readonly options: readonly Expression[];
}

export interface IntersectionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.IntersectionExpression;
  readonly options: readonly Expression[];
}

export interface TypeReferenceNode extends BaseNode {
  kind: SyntaxKind.TypeReference;
  target: MemberExpressionNode | IdentifierNode;
  arguments: Expression[];
}

export interface ProjectionReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.ProjectionReference;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: readonly Expression[];
}

export interface TemplateParameterDeclarationNode extends BaseNode {
  readonly kind: SyntaxKind.TemplateParameterDeclaration;
  readonly id: IdentifierNode;
  symbol?: TypeSymbol;
}

// Projection-related Syntax

export interface ProjectionModelSelectorNode extends BaseNode {
  kind: SyntaxKind.ProjectionModelSelector;
}

export interface ProjectionInterfaceSelectorNode extends BaseNode {
  kind: SyntaxKind.ProjectionInterfaceSelector;
}

export interface ProjectionOperationSelectorNode extends BaseNode {
  kind: SyntaxKind.ProjectionOperationSelector;
}

export interface ProjectionUnionSelectorNode extends BaseNode {
  kind: SyntaxKind.ProjectionUnionSelector;
}

export interface ProjectionEnumSelectorNode extends BaseNode {
  kind: SyntaxKind.ProjectionEnumSelector;
}

export type ProjectionStatementItem = ProjectionExpressionStatement;

export interface ProjectionParameterDeclarationNode extends BaseNode {
  kind: SyntaxKind.ProjectionParameterDeclaration;
  id: IdentifierNode;
  symbol?: TypeSymbol;
}

export interface ProjectionExpressionStatement extends BaseNode {
  kind: SyntaxKind.ProjectionExpressionStatement;
  expr: ProjectionExpression;
}

export interface ProjectionLogicalExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionLogicalExpression;
  op: "||" | "&&";
  left: ProjectionExpression;
  right: ProjectionExpression;
}

export interface ProjectionRelationalExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionRelationalExpression;
  op: "<=" | "<" | ">" | ">=";
  left: ProjectionExpression;
  right: ProjectionExpression;
}

export interface ProjectionEqualityExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionEqualityExpression;
  op: "==" | "!=";
  left: ProjectionExpression;
  right: ProjectionExpression;
}

export interface ProjectionArithmeticExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionArithmeticExpression;
  op: "+" | "-" | "*" | "/";
  left: ProjectionExpression;
  right: ProjectionExpression;
}

export interface ProjectionUnaryExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionUnaryExpression;
  op: "!";
  target: ProjectionExpression;
}

export interface ProjectionCallExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionCallExpression;
  callKind: "method" | "template";
  target: ProjectionExpression;
  arguments: ProjectionExpression[];
}

export interface ProjectionMemberExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionMemberExpression;
  base: ProjectionExpression;
  id: IdentifierNode;
  selector: "." | "::";
}

export interface ProjectionModelExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionModelExpression;
  properties: (ProjectionModelPropertyNode | ProjectionModelSpreadPropertyNode)[];
}

export interface ProjectionTupleExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionTupleExpression;
  values: ProjectionExpression[];
}

export interface ProjectionModelPropertyNode extends BaseNode {
  kind: SyntaxKind.ProjectionModelProperty;
  id: IdentifierNode | StringLiteralNode;
  value: ProjectionExpression;
  decorators: DecoratorExpressionNode[];
  optional: boolean;
  default?: ProjectionExpression;
}

export interface ProjectionModelSpreadPropertyNode extends BaseNode {
  kind: SyntaxKind.ProjectionModelSpreadProperty;
  target: ProjectionExpression;
}

export interface ProjectionIfExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionIfExpression;
  test: ProjectionExpression;
  consequent: ProjectionBlockExpressionNode;
  alternate?: ProjectionBlockExpressionNode | ProjectionIfExpressionNode;
}

export interface ProjectionBlockExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionBlockExpression;
  statements: ProjectionStatementItem[];
}

export interface ProjectionLambdaExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionLambdaExpression;
  parameters: ProjectionLambdaParameterDeclarationNode[];
  locals?: SymbolTable<LocalSymbol>;
  body: ProjectionBlockExpressionNode;
}

export interface ProjectionLambdaParameterDeclarationNode extends BaseNode {
  kind: SyntaxKind.ProjectionLambdaParameterDeclaration;
  id: IdentifierNode;
  symbol?: TypeSymbol;
}

export interface ProjectionNode extends BaseNode {
  kind: SyntaxKind.Projection;
  direction: "to" | "from";
  parameters: ProjectionParameterDeclarationNode[];
  body: ProjectionStatementItem[];
  locals?: SymbolTable<LocalSymbol>;
}

export interface ProjectionStatementNode extends BaseNode, DeclarationNode<ProjectionSymbol> {
  kind: SyntaxKind.ProjectionStatement;
  id: IdentifierNode;
  selector:
    | ProjectionModelSelectorNode
    | ProjectionInterfaceSelectorNode
    | ProjectionOperationSelectorNode
    | ProjectionUnionSelectorNode
    | ProjectionEnumSelectorNode
    | MemberExpressionNode
    | IdentifierNode;
  to?: ProjectionNode;
  from?: ProjectionNode;
}

export interface ProjectionDecoratorReferenceExpressionNode extends BaseNode {
  kind: SyntaxKind.ProjectionDecoratorReferenceExpression;
  target: MemberExpressionNode | IdentifierNode;
}

export interface ProjectionInstructionBase {
  op: string;
}

export interface ProjectionRenamePropertyInstruction extends ProjectionInstructionBase {
  op: "renameProperty";
  from: string;
  to: string;
}

export interface ProjectionDeletePropertyInstruction extends ProjectionInstructionBase {
  op: "deleteProperty";
  name: string;
}

export interface ProjectionAddPropertyInstruction extends ProjectionInstructionBase {
  op: "addProperty";
  name: string;
  type: Type;
}

export interface ProjectionProjectPropertyInstruction extends ProjectionInstructionBase {
  op: "projectProperty";
  name: string;
  ops: ProjectionInstruction[];
}

export type ProjectionInstruction =
  | ProjectionRenamePropertyInstruction
  | ProjectionDeletePropertyInstruction
  | ProjectionAddPropertyInstruction
  | ProjectionProjectPropertyInstruction;
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

export interface JsSourceFile {
  readonly kind: "JsSourceFile";

  /* A source file with empty contents to represent the file on disk. */
  readonly file: SourceFile;

  /* The exports object as comes from `import()` */
  readonly esmExports: any;

  /* Exported "global scope" bindings */
  exports?: SymbolTable<DecoratorSymbol | FunctionSymbol>;

  /* Any namespaces declared by decorators. */
  readonly namespaces: readonly NamespaceStatementNode[];
}

export type EmitterOptions = { name?: string } & Record<string, any>;
export type Emitter = (program: Program, options: EmitterOptions) => void;

export interface SourceFile {
  /** The source code text. */
  readonly text: string;

  /**
   * The source file path.
   *
   * This is used only for diagnostics. The command line compiler will populate
   * it with the actual path from which the file was read, but it can actually
   * be an aribitrary name for other scenarios.
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

export interface TextRange {
  /**
   * The starting position of the ranger measured in UTF-16 code units from the
   * start of the full string. Inclusive.
   */
  pos: number;

  /**
   * The ending position measured in UTF-16 code units from the start of the
   * full string. Exclusive.
   */
  end: number;
}

export interface SourceLocation extends TextRange {
  file: SourceFile;
}

export const NoTarget = Symbol("NoTarget");

export type DiagnosticTarget = Node | Type | Sym | SourceLocation;

export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  target: DiagnosticTarget | typeof NoTarget;
}

export interface DirectiveBase {
  node: DirectiveExpressionNode;
}

export type Directive = SuppressDirective;

export interface SuppressDirective extends DirectiveBase {
  name: "suppress";
  code: string;
  message: string;
}

export interface Dirent {
  isFile(): boolean;
  name: string;
  isDirectory(): boolean;
}

export interface RemoveDirOptions {
  /**
   * If `true`, perform a recursive directory removal. In
   * recursive mode, errors are not reported if `path` does not exist, and
   * operations are retried on failure.
   * @default false
   */
  recursive?: boolean;
}

export interface CompilerHost {
  // read a file at the given url.
  readUrl(url: string): Promise<SourceFile>;

  // read a utf-8 encoded file
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
  readDir(dir: string): Promise<string[]>;

  /**
   * Deletes the directory.
   * @param path Path to the directory.
   */
  removeDir(dir: string, options?: RemoveDirOptions): Promise<void>;

  /**
   * create directory recursively.
   * @param path Path to the directory.
   */
  mkdirp(path: string): Promise<string | undefined>;

  // get the directory Cadl is executing from
  getExecutionRoot(): string;

  // get the directories we should load standard library files from
  getLibDirs(): string[];

  // get a promise for the ESM module shape of a JS module
  getJsImport(path: string): Promise<any>;

  // get info about a path
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  // get the real path of a possibly symlinked path
  realpath(path: string): Promise<string>;

  logSink: LogSink;
}

type UnionToIntersection<T> = (T extends any ? (k: T) => void : never) extends (k: infer I) => void
  ? I
  : never;

type exitListener<T extends string | number | symbol> = T extends string ? `exit${T}` : T;
type ListenerForType<T extends Type> = T extends Type
  ? { [k in Uncapitalize<T["kind"]> | exitListener<T["kind"]>]?: (context: T) => void }
  : never;

type TypeListeners = UnionToIntersection<ListenerForType<Type>>;

export type SemanticNodeListener = {
  root?: (context: Program) => void;
} & TypeListeners;

export type DiagnosticReport<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default"
> = {
  code: C;
  messageId?: M;
  target: DiagnosticTarget | typeof NoTarget;
} & DiagnosticFormat<T, C, M>;

export type DiagnosticFormat<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default"
> = T[C][M] extends CallableMessage<infer A> ? { format: Record<A[number], string> } : {};

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

/**
 * Definition of a cadle library
 */
export interface CadlLibraryDef<
  T extends { [code: string]: DiagnosticMessages },
  E extends string = string
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
   * Provide names for emitters if there is multiple.
   */
  readonly emitter?: {
    names?: readonly E[];
  };
}

export interface CadlLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends string = string
> {
  readonly name: string;
  readonly diagnostics: DiagnosticMap<T>;
  readonly emitter?: {
    names?: readonly E[];
  };

  reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diag: DiagnosticReport<T, C, M>
  ): void;
}

/**
 * Get the options for the onEmit of this library.
 */
export type EmitOptionsFor<C> = C extends CadlLibrary<infer T, infer E> ? EmitOptions<E> : never;

export interface EmitOptions<E extends string> {
  name?: E;
}

export interface DecoratorContext {
  program: Program;
}

export type LogLevel = "debug" | "verbose" | "info" | "warning" | "error";

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
  debug(message: string): void;
  verbose(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  log(log: LogInfo): void;
}

/**
 * Remove the readonly properties on an object.
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };
