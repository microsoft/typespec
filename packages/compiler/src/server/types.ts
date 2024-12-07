import {
  ApplyWorkspaceEditParams,
  ApplyWorkspaceEditResult,
  CodeAction,
  CodeActionParams,
  CompletionList,
  CompletionParams,
  DefinitionParams,
  DidChangeWatchedFilesParams,
  DocumentFormattingParams,
  DocumentHighlight,
  DocumentHighlightParams,
  DocumentSymbol,
  DocumentSymbolParams,
  ExecuteCommandParams,
  FoldingRange,
  FoldingRangeParams,
  Hover,
  HoverParams,
  InitializeParams,
  InitializeResult,
  InitializedParams,
  Location,
  PrepareRenameParams,
  PublishDiagnosticsParams,
  Range,
  ReferenceParams,
  RenameParams,
  SemanticTokens,
  SemanticTokensParams,
  SignatureHelp,
  SignatureHelpParams,
  TextDocumentChangeEvent,
  TextDocumentIdentifier,
  WorkspaceEdit,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver";
import { TextDocument, TextEdit } from "vscode-languageserver-textdocument";
import type { CompilerHost, Program, SourceFile, TypeSpecScriptNode } from "../core/index.js";
import { LoadedCoreTemplates } from "../init/core-templates.js";
import { InitTemplate, InitTemplateLibrarySpec } from "../init/init-template.js";
import { ScaffoldingConfig } from "../init/scaffold.js";

export type ServerLogLevel = "trace" | "debug" | "info" | "warning" | "error";
export interface ServerLog {
  level: ServerLogLevel;
  message: string;
  detail?: unknown;
}

export interface ServerHost {
  readonly compilerHost: CompilerHost;
  readonly throwInternalErrors?: boolean;
  readonly getOpenDocumentByURL: (url: string) => TextDocument | undefined;
  readonly sendDiagnostics: (params: PublishDiagnosticsParams) => void;
  readonly log: (log: ServerLog) => void;
  readonly applyEdit: (
    paramOrEdit: ApplyWorkspaceEditParams | WorkspaceEdit,
  ) => Promise<ApplyWorkspaceEditResult>;
}

export interface CompileResult {
  readonly program: Program;
  readonly document: TextDocument;
  readonly script: TypeSpecScriptNode;
}

export interface Server {
  readonly pendingMessages: readonly ServerLog[];
  readonly workspaceFolders: readonly ServerWorkspaceFolder[];
  compile(document: TextDocument | TextDocumentIdentifier): Promise<CompileResult | undefined>;
  initialize(params: InitializeParams): Promise<InitializeResult>;
  initialized(params: InitializedParams): void;
  workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent): Promise<void>;
  watchedFilesChanged(params: DidChangeWatchedFilesParams): void;
  formatDocument(params: DocumentFormattingParams): Promise<TextEdit[]>;
  gotoDefinition(params: DefinitionParams): Promise<Location[]>;
  complete(params: CompletionParams): Promise<CompletionList>;
  findReferences(params: ReferenceParams): Promise<Location[]>;
  findDocumentHighlight(params: DocumentHighlightParams): Promise<DocumentHighlight[]>;
  prepareRename(params: PrepareRenameParams): Promise<Range | undefined>;
  rename(params: RenameParams): Promise<WorkspaceEdit>;
  getSemanticTokens(params: SemanticTokensParams): Promise<SemanticToken[]>;
  buildSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens>;
  checkChange(change: TextDocumentChangeEvent<TextDocument>): Promise<void>;
  getHover(params: HoverParams): Promise<Hover>;
  getSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | undefined>;
  getFoldingRanges(getFoldingRanges: FoldingRangeParams): Promise<FoldingRange[]>;
  getDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[]>;
  documentClosed(change: TextDocumentChangeEvent<TextDocument>): void;
  getCodeActions(params: CodeActionParams): Promise<CodeAction[]>;
  executeCommand(params: ExecuteCommandParams): Promise<void>;
  log(log: ServerLog): void;

  // Following custom capacities are added for supporting tsp init project from IDE (vscode for now) so that IDE can trigger compiler
  // to do the real job while collecting the necessary information accordingly from the user.
  // We can't do the tsp init experience by simple cli interface because the experience needs to talk
  // with the compiler for multiple times in different steps (i.e. get core templates, validate the selected template, scaffold the project)
  // and it's not a good idea to expose these capacity in cli interface and call cli again and again.
  getInitProjectContext(): Promise<InitProjectContext>;
  validateInitProjectTemplate(param: { template: InitTemplate }): Promise<boolean>;
  initProject(param: { config: InitProjectConfig }): Promise<boolean>;
}

export interface ServerSourceFile extends SourceFile {
  // Keep track of the open document (if any) associated with a source file.
  readonly document?: TextDocument;
}

export interface ServerWorkspaceFolder extends WorkspaceFolder {
  // Remember path to URL conversion for workspace folders. This path must
  // be resolved and normalized as other paths and have a trailing separator
  // character so that we can test if a path is within a workspace using
  // startsWith.
  path: string;
}

export enum SemanticTokenKind {
  Namespace,
  Type,
  Class,
  Enum,
  Interface,
  Struct,
  TypeParameter,
  Parameter,
  Variable,
  Property,
  EnumMember,
  Event,
  Function,
  Method,
  Macro,
  Keyword,
  Comment,
  String,
  Number,
  Regexp,
  Operator,

  DocCommentTag,
}

export interface SemanticToken {
  kind: SemanticTokenKind;
  pos: number;
  end: number;
}

export type CustomRequestName =
  | "typespec/getInitProjectContext"
  | "typespec/initProject"
  | "typespec/validateInitProjectTemplate";
export interface ServerCustomCapacities {
  getInitProjectContext?: boolean;
  validateInitProjectTemplate?: boolean;
  initProject?: boolean;
}

export interface ServerInitializeResult extends InitializeResult {
  customCapacities?: ServerCustomCapacities;
  compilerRootFolder?: string;
  compilerCliJsPath?: string;
}

export interface InitProjectContext {
  /** provide the default templates current compiler/cli supports */
  coreInitTemplates: LoadedCoreTemplates;
}

export type InitProjectConfig = ScaffoldingConfig;
export type InitProjectTemplate = InitTemplate;
export type InitProjectTemplateLibrarySpec = InitTemplateLibrarySpec;
