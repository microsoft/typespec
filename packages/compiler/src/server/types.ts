import {
  CompletionList,
  CompletionParams,
  DefinitionParams,
  DidChangeWatchedFilesParams,
  DocumentFormattingParams,
  DocumentHighlight,
  DocumentHighlightParams,
  DocumentSymbol,
  DocumentSymbolParams,
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
import { CompilerHost, Program, SourceFile, TypeSpecScriptNode } from "../index.js";

export interface ServerHost {
  compilerHost: CompilerHost;
  throwInternalErrors?: boolean;
  getOpenDocumentByURL(url: string): TextDocument | undefined;
  sendDiagnostics(params: PublishDiagnosticsParams): void;
  log(message: string): void;
}

export interface CompileResult {
  program: Program;
  document: TextDocument;
  script: TypeSpecScriptNode;
}
export interface Server {
  readonly pendingMessages: readonly string[];
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
  log(message: string, details?: any): void;
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
