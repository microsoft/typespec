import { Program } from "./program";

/**
 * Type System types
 */

export type DecoratorArgument = Type | number | string | boolean;

export interface DecoratorApplication {
  decorator: DecoratorFunction;
  args: DecoratorArgument[];
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

export type Type =
  | ModelType
  | ModelTypeProperty
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
  | IntrinsicType;

export interface IntrinsicType extends BaseType {
  kind: "Intrinsic";
  name: string;
}

export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
}

export interface ModelType extends BaseType, DecoratedType {
  kind: "Model";
  name: string;
  node: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode;
  namespace?: NamespaceType;
  properties: Map<string, ModelTypeProperty>;
  baseModel?: ModelType;
  templateArguments?: Type[];
  templateNode?: Node;
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

export interface UnionType extends BaseType {
  kind: "Union";
  node: UnionExpressionNode;
  options: Type[];
}

export interface TemplateParameterType extends BaseType {
  kind: "TemplateParameter";
  node: TemplateParameterDeclarationNode;
}

// trying to avoid masking built-in Symbol
export type Sym = DecoratorSymbol | TypeSymbol;

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

export interface SymbolLinks {
  type?: Type;

  // for types which can be instantiated, we split `type` into declaredType and
  // a map of instantiations.
  declaredType?: Type;
  instantiations?: TypeInstantiationMap;
}

export interface SymbolTable extends Map<string, Sym> {
  readonly duplicates: Set<Sym>;
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
  MemberExpression,
  NamespaceStatement,
  UsingStatement,
  OperationStatement,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  ModelSpreadProperty,
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
  kind: SyntaxKind;
  parent?: Node;
}

export type Node =
  | CadlScriptNode
  | TemplateParameterDeclarationNode
  | ModelPropertyNode
  | OperationStatementNode
  | NamedImportNode
  | EnumMemberNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
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
  kind: SyntaxKind.CadlScript;
  statements: Statement[];
  file: SourceFile;
  inScopeNamespaces: NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  usings: UsingStatementNode[];
  comments: Comment[];
  parseDiagnostics: Diagnostic[];
  printable: boolean; // If this ast tree can safely be printed/formatted.
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | NamespaceStatementNode
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
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode
  | EnumStatementNode
  | AliasStatementNode;

export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | AliasStatementNode
  | CadlScriptNode;

export interface ImportStatementNode extends BaseNode {
  kind: SyntaxKind.ImportStatement;
  path: StringLiteralNode;
}

export interface IdentifierNode extends BaseNode {
  kind: SyntaxKind.Identifier;
  sv: string;
}

export interface NamedImportNode extends BaseNode {
  kind: SyntaxKind.NamedImport;
  id: IdentifierNode;
}

export interface DecoratorExpressionNode extends BaseNode {
  kind: SyntaxKind.DecoratorExpression;
  target: IdentifierNode | MemberExpressionNode;
  arguments: Expression[];
}

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

export type ReferenceExpression = TypeReferenceNode | MemberExpressionNode | IdentifierNode;

export interface MemberExpressionNode extends BaseNode {
  kind: SyntaxKind.MemberExpression;
  id: IdentifierNode;
  base: MemberExpressionNode | IdentifierNode;
}

export interface ContainerNode {
  locals?: SymbolTable;
  exports?: SymbolTable;
}

export interface NamespaceStatementNode extends BaseNode, DeclarationNode, ContainerNode {
  kind: SyntaxKind.NamespaceStatement;
  name: IdentifierNode;
  statements?: Statement[] | NamespaceStatementNode;
  decorators: DecoratorExpressionNode[];
}

export interface UsingStatementNode extends BaseNode {
  kind: SyntaxKind.UsingStatement;
  name: IdentifierNode | MemberExpressionNode;
}

export interface OperationStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.OperationStatement;
  id: IdentifierNode;
  parameters: ModelExpressionNode;
  returnType: Expression;
  decorators: DecoratorExpressionNode[];
}

export interface ModelStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.ModelStatement;
  id: IdentifierNode;
  properties: (ModelPropertyNode | ModelSpreadPropertyNode)[];
  extends?: ReferenceExpression;
  is?: ReferenceExpression;
  templateParameters: TemplateParameterDeclarationNode[];
  locals?: SymbolTable;
  decorators: DecoratorExpressionNode[];
}

export interface EnumStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.EnumStatement;
  id: IdentifierNode;
  members: EnumMemberNode[];
  decorators: DecoratorExpressionNode[];
}

export interface EnumMemberNode extends BaseNode {
  kind: SyntaxKind.EnumMember;
  id: IdentifierNode | StringLiteralNode;
  value?: StringLiteralNode | NumericLiteralNode;
  decorators: DecoratorExpressionNode[];
}

export interface AliasStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.AliasStatement;
  id: IdentifierNode;
  value: Expression;
  templateParameters: TemplateParameterDeclarationNode[];
  locals?: SymbolTable;
}

export interface InvalidStatementNode extends BaseNode {
  kind: SyntaxKind.InvalidStatement;
}

export interface EmptyStatementNode extends BaseNode {
  kind: SyntaxKind.EmptyStatement;
}

export interface ModelExpressionNode extends BaseNode {
  kind: SyntaxKind.ModelExpression;
  properties: (ModelPropertyNode | ModelSpreadPropertyNode)[];
}

export interface ArrayExpressionNode extends BaseNode {
  kind: SyntaxKind.ArrayExpression;
  elementType: Expression;
}
export interface TupleExpressionNode extends BaseNode {
  kind: SyntaxKind.TupleExpression;
  values: Expression[];
}

export interface ModelPropertyNode extends BaseNode {
  kind: SyntaxKind.ModelProperty;
  id: IdentifierNode | StringLiteralNode;
  value: Expression;
  decorators: DecoratorExpressionNode[];
  optional: boolean;
}

export interface ModelSpreadPropertyNode extends BaseNode {
  kind: SyntaxKind.ModelSpreadProperty;
  target: ReferenceExpression;
}

export type LiteralNode = StringLiteralNode | NumericLiteralNode | BooleanLiteralNode;

export interface StringLiteralNode extends BaseNode {
  kind: SyntaxKind.StringLiteral;
  value: string;
}

export interface NumericLiteralNode extends BaseNode {
  kind: SyntaxKind.NumericLiteral;
  value: number;
}

export interface BooleanLiteralNode extends BaseNode {
  kind: SyntaxKind.BooleanLiteral;
  value: boolean;
}

export interface UnionExpressionNode extends BaseNode {
  kind: SyntaxKind.UnionExpression;
  options: Expression[];
}

export interface IntersectionExpressionNode extends BaseNode {
  kind: SyntaxKind.IntersectionExpression;
  options: Expression[];
}

export interface TypeReferenceNode extends BaseNode {
  kind: SyntaxKind.TypeReference;
  target: ReferenceExpression;
  arguments: Expression[];
}

export interface TemplateParameterDeclarationNode extends BaseNode {
  kind: SyntaxKind.TemplateParameterDeclaration;
  id: IdentifierNode;
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
  kind: "JsSourceFile";

  /* A source file with empty contents to represent the file on disk. */
  file: SourceFile;

  /* The exports object as comes from `import()` */
  esmExports: any;

  /* Exported "global scope" bindings */
  exports?: SymbolTable;

  /* Any namespaces declared by decorators. */
  namespaces: NamespaceStatementNode[];
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

export interface Diagnostic extends Partial<SourceLocation> {
  message: string;
  code?: string;
  severity: "warning" | "error" | "info";
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
}

export type SemanticNodeListener = {
  root?: (context: Program) => void;
  namespace?: (context: NamespaceType) => void;
  model?: (context: ModelType) => void;
  modelProperty?: (context: ModelTypeProperty) => void;
  operation?: (context: OperationType) => void;
  array?: (context: ArrayType) => void;
  enum?: (context: EnumType) => void;
  union?: (context: UnionType) => void;
  tuple?: (context: TupleType) => void;
  templateParameter?: (context: TemplateParameterType) => void;
};
