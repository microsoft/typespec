import { SymbolTable } from "./binder";
import { MultiKeyMap } from "./checker";

/**
 * Type System types
 */
export interface BaseType {
  kind: string;
  node?: Node;
  instantiationParameters?: Array<Type>;
}

export type Type =
  | ModelType
  | ModelTypeProperty
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

export interface ModelType extends BaseType {
  kind: "Model";
  name: string;
  node: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode;
  namespace?: NamespaceType;
  properties: Map<string, ModelTypeProperty>;
  baseModels: Array<ModelType>;
  templateArguments?: Array<Type>;
  templateNode?: Node;
  assignmentType?: Type;
}

export interface ModelTypeProperty {
  kind: "ModelProperty";
  node: ModelPropertyNode | ModelSpreadPropertyNode;
  name: string;
  type: Type;
  // when spread or intersection operators make new property types,
  // this tracks the property we copied from.
  sourceProperty?: ModelTypeProperty;
  optional: boolean;
}

export interface OperationType {
  kind: "Operation";
  node: OperationStatementNode;
  name: string;
  namespace?: NamespaceType;
  parameters?: ModelType;
  returnType: Type;
}

export interface NamespaceType extends BaseType {
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
  values: Array<Type>;
}

export interface UnionType extends BaseType {
  kind: "Union";
  node: UnionExpressionNode;
  options: Array<Type>;
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
  value: (...args: Array<any>) => any;
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
  instantiations?: MultiKeyMap<Type>;
}

/**
 * AST types
 */
export enum SyntaxKind {
  ADLScript,
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
  UnionExpression,
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  TypeReference,
  TemplateParameterDeclaration,
}

export interface BaseNode extends TextRange {
  kind: SyntaxKind;
  parent?: Node;
}

export type Node =
  | ADLScriptNode
  | TemplateParameterDeclarationNode
  | ModelPropertyNode
  | OperationStatementNode
  | NamedImportNode
  | ModelPropertyNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
  | Statement
  | Expression;

export interface ADLScriptNode extends BaseNode {
  kind: SyntaxKind.ADLScript;
  statements: Array<Statement>;
  models: Array<ModelType>;
  file: SourceFile;
  interfaces: Array<NamespaceType>;
  inScopeNamespaces: NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  locals: SymbolTable;
  usings: UsingStatementNode[];
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | NamespaceStatementNode
  | UsingStatementNode
  | OperationStatementNode;

export interface DeclarationNode {
  symbol?: TypeSymbol; // tracks the symbol assigned to this declaration
  namespaceSymbol?: TypeSymbol; // tracks the namespace this declaration is in
}

export type Declaration =
  | ModelStatementNode
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode;

export type ScopeNode = NamespaceStatementNode | ModelStatementNode | ADLScriptNode;

export interface ImportStatementNode extends BaseNode {
  kind: SyntaxKind.ImportStatement;
  id: IdentifierNode;
  as: Array<NamedImportNode>;
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
  arguments: Array<Expression>;
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

export interface NamespaceStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.NamespaceStatement;
  name: IdentifierNode;
  statements?: Array<Statement> | NamespaceStatementNode;
  locals?: SymbolTable;
  exports?: SymbolTable;
  decorators: Array<DecoratorExpressionNode>;
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
  decorators: Array<DecoratorExpressionNode>;
}

export interface ModelStatementNode extends BaseNode, DeclarationNode {
  kind: SyntaxKind.ModelStatement;
  id: IdentifierNode;
  properties?: Array<ModelPropertyNode | ModelSpreadPropertyNode>;
  heritage: Array<ReferenceExpression>;
  assignment?: Expression;
  templateParameters: Array<TemplateParameterDeclarationNode>;
  locals?: SymbolTable;
  decorators: Array<DecoratorExpressionNode>;
}

export interface ModelExpressionNode extends BaseNode {
  kind: SyntaxKind.ModelExpression;
  properties: Array<ModelPropertyNode | ModelSpreadPropertyNode>;
  decorators: Array<DecoratorExpressionNode>;
}

export interface ArrayExpressionNode extends BaseNode {
  kind: SyntaxKind.ArrayExpression;
  elementType: Expression;
}
export interface TupleExpressionNode extends BaseNode {
  kind: SyntaxKind.TupleExpression;
  values: Array<Expression>;
}

export interface ModelPropertyNode extends BaseNode {
  kind: SyntaxKind.ModelProperty;
  id: IdentifierNode | StringLiteralNode;
  value: Expression;
  decorators: Array<DecoratorExpressionNode>;
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
  options: Array<Expression>;
}

export interface IntersectionExpressionNode extends BaseNode {
  kind: SyntaxKind.IntersectionExpression;
  options: Array<Expression>;
}

export interface TypeReferenceNode extends BaseNode {
  kind: SyntaxKind.TypeReference;
  target: ReferenceExpression;
  arguments: Array<Expression>;
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
  getLineStarts(): ReadonlyArray<number>;

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

export interface Message {
  code?: number;
  text: string;
  severity: "error" | "warning";
}

interface Dirent {
  isFile(): boolean;
  name: string;
  isDirectory(): boolean;
}

export interface CompilerHost {
  // read a utf-8 encoded file
  readFile(path: string): Promise<string | undefined>;

  // read the contents of a directory
  readDir(path: string): Promise<Dirent[]>;

  // get the directory ADL is executing from
  getExecutionRoot(): string;

  // get the directories we should load standard library files from
  getLibDirs(): string[];

  // get a promise for the ESM module shape of a JS module
  getJsImport(path: string): Promise<any>;

  // get the current working directory
  getCwd(): string;
}
