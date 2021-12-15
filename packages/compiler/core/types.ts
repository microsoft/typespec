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
  (program: Program, target: Type, ...customArgs: any[]): void;
  namespace?: string;
}

export interface BaseType {
  kind: string;
  node?: Node;
  instantiationParameters?: Type[];
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
  | IntrinsicType;

export interface IntrinsicType extends BaseType {
  kind: "Intrinsic";
  name: string;
}

export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
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
  node: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode;
  namespace?: NamespaceType;
  properties: Map<string, ModelTypeProperty>;
  baseModel?: ModelType;
}

export interface ModelTypeProperty extends DecoratedType {
  kind: "ModelProperty";
  node: ModelPropertyNode | ModelSpreadPropertyNode;
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

export interface OperationType extends DecoratedType {
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
  unions: Map<string, UnionType>;
}

export type LiteralType = StringLiteralType | NumericLiteralType | BooleanLiteralType;

export interface StringLiteralType extends BaseType {
  kind: "String";
  node: StringLiteralNode;
  value: string;
}

export interface NumericLiteralType extends BaseType {
  kind: "Number";
  node: NumericLiteralNode;
  value: number;
}

export interface BooleanLiteralType extends BaseType {
  kind: "Boolean";
  node: BooleanLiteralNode;
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
  variants: Map<string | Symbol, Type>;
  expression: boolean;
  readonly options: Type[];
}

export interface UnionTypeVariant extends BaseType, DecoratedType {
  kind: "UnionVariant";
  name: string | Symbol;
  node: UnionVariantNode;
  type: Type;
}

export interface TemplateParameterType extends BaseType {
  kind: "TemplateParameter";
  node: TemplateParameterDeclarationNode;
}

// trying to avoid masking built-in Symbol
// export type Sym = DecoratorSymbol | TypeSymbol;

export interface DecoratorSymbol {
  kind: "decorator";
  path: string;
  name: string;
  value: (...args: any[]) => any;
}

export interface TypeSymbol {
  kind: "type";
  node: Node;
  name: string;
  id?: number;
}

export interface UsingSymbol {
  kind: "using";
  symbolSource: ExportSymbol;
  duplicate?: boolean;
}

export type LocalSymbol = UsingSymbol | TypeSymbol;
export type ExportSymbol = TypeSymbol | DecoratorSymbol;
export type Sym = UsingSymbol | TypeSymbol | DecoratorSymbol;

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
  TypeReference,
  TemplateParameterDeclaration,
  EmptyStatement,
  InvalidStatement,
  LineComment,
  BlockComment,
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
  | ModelPropertyNode
  | UnionVariantNode
  | OperationStatementNode
  | NamedImportNode
  | EnumMemberNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
  | DirectiveExpressionNode
  | Statement
  | Expression;

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
  | InvalidStatementNode;

export interface DeclarationNode {
  symbol?: TypeSymbol; // tracks the symbol assigned to this declaration
  namespaceSymbol?: TypeSymbol; // tracks the namespace this declaration is in
}

export type Declaration =
  | ModelStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode
  | EnumStatementNode
  | AliasStatementNode;

export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode
  | CadlScriptNode;

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
  | BooleanLiteralNode;

export interface MemberExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.MemberExpression;
  readonly id: IdentifierNode;
  readonly base: MemberExpressionNode | IdentifierNode;
}

export interface ContainerNode {
  locals?: SymbolTable<LocalSymbol>;
  exports?: SymbolTable<ExportSymbol>;
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

export interface UnionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.UnionExpression;
  readonly options: readonly Expression[];
}

export interface IntersectionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.IntersectionExpression;
  readonly options: readonly Expression[];
}

export interface TypeReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.TypeReference;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: readonly Expression[];
}

export interface TemplateParameterDeclarationNode extends BaseNode {
  readonly kind: SyntaxKind.TemplateParameterDeclaration;
  readonly id: IdentifierNode;
  symbol?: TypeSymbol;
}

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
  exports?: SymbolTable<DecoratorSymbol>;

  /* Any namespaces declared by decorators. */
  readonly namespaces: readonly NamespaceStatementNode[];
}

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

  // If path is already absolute, normalize it, otherwise resolve an
  // absolute path to the given path based on current working directory and
  // normalize it.
  resolveAbsolutePath(path: string): string;

  // get info about a path
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  // get the real path of a possibly symlinked path
  realpath(path: string): Promise<string>;

  logSink: LogSink;
}

type UnionToIntersection<T> = (T extends any ? (k: T) => void : never) extends (k: infer I) => void
  ? I
  : never;

type ListenerForType<T extends Type> = T extends Type
  ? { [k in Uncapitalize<T["kind"]>]?: (context: T) => void }
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
export interface CadlLibraryDef<T extends { [code: string]: DiagnosticMessages }> {
  /**
   * Name of the library. Must match the package.json name.
   */
  readonly name: string;

  /**
   * Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code.
   */
  readonly diagnostics: DiagnosticMap<T>;
}

export interface CadlLibrary<T extends { [code: string]: DiagnosticMessages }> {
  readonly name: string;
  readonly diagnostics: DiagnosticMap<T>;
  reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diag: DiagnosticReport<T, C, M>
  ): void;
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
