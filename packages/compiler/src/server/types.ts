import type {
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
  RenameFilesParams,
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
import type { TextDocument, TextEdit } from "vscode-languageserver-textdocument";
import type { CompilerOptions } from "../core/options.js";
import type { Program } from "../core/program.js";
import type {
  CompilerHost,
  Diagnostic,
  NoTarget,
  SourceFile,
  SourceLocation,
  TypeSpecScriptNode,
} from "../core/types.js";
import type { LoadedCoreTemplates } from "../init/core-templates.js";
import type {
  EmitterTemplate,
  InitTemplate,
  InitTemplateLibrarySpec,
} from "../init/init-template.js";
import type { ScaffoldingConfig } from "../init/scaffold.js";
import type { CompileTracker, ServerCompileOptions } from "./server-compile-manager.js";

/** Severity or verbosity assigned to a message delivered to the server host. */
export type ServerLogLevel = "trace" | "debug" | "info" | "warning" | "error";
/** A server message with optional structured context for the host's logging implementation. */
export interface ServerLog {
  /** Severity or verbosity of this message; filtering is left to the host. */
  level: ServerLogLevel;
  /** Human-readable message, without a separately formatted severity prefix. */
  message: string;
  /** Additional context, such as an error or configuration object; not necessarily a string. */
  detail?: unknown;
}

/** Environment and client callbacks needed to embed the TypeSpec language server. */
export interface ServerHost {
  /** Base compiler I/O host; the server wraps it to read open documents and cache files. */
  readonly compilerHost: CompilerHost;
  /** Rethrow unexpected compilation errors instead of publishing error diagnostics. Defaults to false. */
  readonly throwInternalErrors?: boolean;
  /** Look up the current open document by its original URI; return undefined for closed documents. */
  readonly getOpenDocumentByURL: (url: string) => TextDocument | undefined;
  /** Publish diagnostics to the client, including empty lists that clear previously reported diagnostics. */
  readonly sendDiagnostics: (params: PublishDiagnosticsParams) => void;
  /** Receive server messages for display, persistence, or filtering by the embedding application. */
  readonly log: (log: ServerLog) => void;
  /** Ask the client to apply a workspace edit, for example to repair imports after a file rename. */
  readonly applyEdit: (
    paramOrEdit: ApplyWorkspaceEditParams | WorkspaceEdit,
  ) => Promise<ApplyWorkspaceEditResult>;
  /**
   * This debounce delay function is designed to reduce the running time of the test and should not be overridden during normal use.
   * @returns debounce delay in milliseconds
   * @internal
   */
  readonly getDocumentUpdateDebounceDelay?: () => number;
}

export interface CompileResult {
  readonly program: Program;
  readonly document: TextDocument | undefined;
  readonly script: TypeSpecScriptNode | undefined;
  readonly optionsFromConfig: CompilerOptions;
  readonly tracker: CompileTracker;
}

/** Compiler diagnostic returned by the custom compilation request with a resolved source location. */
export interface ServerDiagnostic extends Diagnostic {
  /** Resolved diagnostic location, or NoTarget when no source location is available. */
  target:
    | (SourceLocation & {
        /** Human-readable start position when the diagnostic has an associated source file. */
        position?: {
          /** One-based line number, unlike the zero-based positions used by LSP. */
          line: number;
          /** One-based character offset within the line. */
          column: number;
        };
      })
    | typeof NoTarget;
}

/** Result of the custom compilation request, which bypasses server compilation caches. */
export interface InternalCompileResult {
  /** Whether the program has errors, or compilation failed to produce a result. */
  readonly hasError: boolean;
  /** Compiler diagnostics, or an internal-error diagnostic if no compilation result was obtained. */
  readonly diagnostics: ServerDiagnostic[];
  /** URI of the result's open document, if available; not necessarily the inferred project entry point. */
  readonly entrypoint?: string;
  /** Effective options used by the returned program; absent when no compilation result was obtained. */
  readonly options?: CompilerOptions;
}

/**
 * Language-server handlers and state for an embedding host to connect to LSP.
 * Initialize the server before enabling document-update processing with {@link Server.initialized}.
 */
export interface Server {
  /** Messages queued before initialized; the queue is flushed through the host when logging resumes. */
  readonly pendingMessages: readonly ServerLog[];
  /** Current workspace folders, including normalized paths used for project discovery. */
  readonly workspaceFolders: readonly ServerWorkspaceFolder[];
  /**
   * Compile the inferred project containing a document, falling back to the document itself
   * if it is not included. Additional options override server defaults and resolved configuration.
   * Returns undefined for unsupported documents, unresolved entry points, cancelled or stale
   * requests, or handled compilation failures.
   */
  compile(
    document: TextDocument | TextDocumentIdentifier,
    additionalOptions: CompilerOptions | undefined,
    serverCompileOptions: ServerCompileOptions,
  ): Promise<CompileResult | undefined>;
  /** Configure workspace roots and update callbacks, and return LSP and TypeSpec-specific capabilities. */
  initialize(params: InitializeParams): Promise<InitializeResult>;
  /** Enable debounced updates and flush queued log messages after client initialization completes. */
  initialized(params: InitializedParams): void;
  /** Apply added and removed workspace folders, resolving normalized paths for newly added roots. */
  workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent): Promise<void>;
  /** Invalidate file and package caches for the client's watched-file change notifications. */
  watchedFilesChanged(params: DidChangeWatchedFilesParams): void;
  /** Format an open TypeSpec document using Prettier configuration, falling back to the client's indentation options. */
  formatDocument(params: DocumentFormattingParams): Promise<TextEdit[]>;
  /** Resolve a symbol's declarations or an import's target file; return an empty list when none is available. */
  gotoDefinition(params: DefinitionParams): Promise<Location[]>;
  /** Compute completion items at the requested position, including configuration-file completions. */
  complete(params: CompletionParams): Promise<CompletionList>;
  /** Find references to the selected symbol across the compiled program's source files. */
  findReferences(params: ReferenceParams): Promise<Location[]>;
  /** Find occurrences of the selected symbol within the requested document, marked as read highlights. */
  findDocumentHighlight(params: DocumentHighlightParams): Promise<DocumentHighlight[]>;
  /** Return the selected identifier's rename range, or undefined when no identifier can be renamed. */
  prepareRename(params: PrepareRenameParams): Promise<Range | undefined>;
  /** Build edits renaming references to the selected identifier; applying them is the caller's responsibility. */
  rename(params: RenameParams): Promise<WorkspaceEdit>;
  /** Process renamed files or folders, schedule recompilation, and ask the host to apply import-path repairs. */
  renameFiles(params: RenameFilesParams): Promise<void>;
  /** Classify TypeSpec source into tokens with absolute source offsets rather than LSP-encoded positions. */
  getSemanticTokens(params: SemanticTokensParams): Promise<SemanticToken[]>;
  /** Encode classified tokens as LSP semantic-token data using the legend advertised during initialization. */
  buildSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens>;
  /** Schedule diagnostics for a changed document, ignoring the initial change notification accompanying an open. */
  checkChange(change: TextDocumentChangeEvent<TextDocument>): void;
  /** Describe the symbol at the requested position; return empty contents when no description is available. */
  getHover(params: HoverParams): Promise<Hover>;
  /** Return debounced template or decorator signature help, or undefined for superseded requests or unsupported positions. */
  getSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | undefined>;
  /** Compute multiline folding regions for comments, consecutive imports, decorators, and syntax nodes. */
  getFoldingRanges(getFoldingRanges: FoldingRangeParams): Promise<FoldingRange[]>;
  /** Build the hierarchical symbol outline for a TypeSpec document. */
  getDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[]>;
  /** Forget the document's opening version and clear its published diagnostics. */
  documentClosed(change: TextDocumentChangeEvent<TextDocument>): void;
  /** Record a document's opening version and schedule its initial diagnostics. */
  documentOpened(change: TextDocumentChangeEvent<TextDocument>): void;
  /** Offer unresolved quick fixes for published diagnostics, including file-wide fixes when applicable. */
  getCodeActions(params: CodeActionParams): Promise<CodeAction[]>;
  /** Populate a previously offered code action's edit from the current diagnostic index. */
  resolveCodeAction(codeAction: CodeAction): Promise<CodeAction>;
  /**
   * Publish diagnostics for the result's open documents and clear stale diagnostics for files without errors.
   * Does nothing when the result has no open document or that document is tspconfig.yaml.
   */
  reportDiagnostics({ program, document, optionsFromConfig }: CompileResult): void;
  /** Queue a message before initialized; afterwards flush queued messages and deliver it to the host. */
  log(log: ServerLog): void;

  // Following custom capacities are added for supporting tsp init project from IDE (vscode for now) so that IDE can trigger compiler
  // to do the real job while collecting the necessary information accordingly from the user.
  // We can't do the tsp init experience by simple cli interface because the experience needs to talk
  // with the compiler for multiple times in different steps (i.e. get core templates, validate the selected template, scaffold the project)
  // and it's not a good idea to expose these capacity in cli interface and call cli again and again.
  /** Load the built-in project templates used by the editor's project-creation workflow. */
  getInitProjectContext(): Promise<InitProjectContext>;
  /** Validate a project template against the relaxed template schema, logging any validation diagnostics. */
  validateInitProjectTemplate(param: {
    /** Template definition selected or supplied by the client. */
    template: InitTemplate;
  }): Promise<boolean>;
  /** Scaffold a project using the supplied configuration; log unexpected failures and return false on failure. */
  initProject(param: {
    /** Resolved project location, template, and user inputs used for scaffolding. */
    config: InitProjectConfig;
  }): Promise<boolean>;
  /** Run a full compilation without reusing cached compilations or old programs, forwarding captured compiler logs to the host. */
  internalCompile(param: {
    /** Document used to infer the project to compile. */
    doc: TextDocumentIdentifier;
    /** Compiler options overriding the resolved project and server defaults. */
    options: CompilerOptions;
  }): Promise<InternalCompileResult>;
}

/** Compiler source file that may have been read from an open editor document instead of disk. */
export interface ServerSourceFile extends SourceFile {
  /** Open document associated with this file when it was read; absent for files read from disk. */
  readonly document?: TextDocument;
}

/** Workspace root paired with its local path for project entry-point discovery. */
export interface ServerWorkspaceFolder extends WorkspaceFolder {
  /** Resolved, normalized path with a trailing separator, suitable for directory-prefix comparisons. */
  path: string;
}

/**
 * Token-type indices used by the server's semantic-token legend.
 * Names map to LSP token types by lowercasing their first character, including docCommentTag.
 */
export enum SemanticTokenKind {
  /** Namespace declarations, using directives, and bases of qualified references. */
  Namespace,
  /** Scalar declarations and references classified syntactically as types. */
  Type,
  /** LSP class category, reserved in the legend. */
  Class,
  /** Enum and union declaration names. */
  Enum,
  /** Interface declaration names. */
  Interface,
  /** Model and alias declaration names. */
  Struct,
  /** Template parameter declarations and named template arguments. */
  TypeParameter,
  /** Function or decorator parameter declarations. */
  Parameter,
  /** Constant declarations and parameter or property names in documentation tags. */
  Variable,
  /** Model, object, and union properties, including union variants. */
  Property,
  /** Enum member declarations and references. */
  EnumMember,
  /** LSP event category, reserved in the legend. */
  Event,
  /** Operations, functions, and scalar constructors. */
  Function,
  /** LSP method category, reserved in the legend. */
  Method,
  /** Decorator uses and unrecognized documentation tags. */
  Macro,
  /** Language keywords and compiler directives. */
  Keyword,
  /** Ordinary comments and documentation text outside classified tags. */
  Comment,
  /** String literals and the text portions of interpolated strings. */
  String,
  /** Numeric literals in source. */
  Number,
  /** LSP regular-expression category, reserved in the legend. */
  Regexp,
  /** Punctuation and interpolation delimiters. */
  Operator,

  /** Recognized documentation tags, including their leading at sign. */
  DocCommentTag,
}

/** Classified source span before conversion into the LSP semantic-token encoding. */
export interface SemanticToken {
  /** Index into the server's semantic-token legend. */
  kind: SemanticTokenKind;
  /** Inclusive start offset in UTF-16 code units within the source text. */
  pos: number;
  /** Exclusive end offset in UTF-16 code units within the source text. */
  end: number;
}

/** TypeSpec-specific request method names implemented alongside standard LSP handlers. */
export type CustomRequestName =
  | "typespec/getInitProjectContext"
  | "typespec/initProject"
  | "typespec/validateInitProjectTemplate"
  | "typespec/internalCompile";
/** Availability flags for the TypeSpec-specific requests advertised by server initialization. */
export interface ServerCustomCapacities {
  /** Whether the server can supply built-in project templates. */
  getInitProjectContext?: boolean;
  /** Whether the server can validate client-supplied project templates. */
  validateInitProjectTemplate?: boolean;
  /** Whether the server can scaffold a project from a resolved configuration. */
  initProject?: boolean;
  /** Whether the server supports explicit full compilation with captured diagnostics. */
  internalCompile?: boolean;
}

/** LSP initialization result extended with TypeSpec requests and compiler installation locations. */
export interface ServerInitializeResult extends InitializeResult {
  /** Supported TypeSpec-specific requests; an absent flag does not advertise support. */
  customCapacities?: ServerCustomCapacities;
  /** Compiler package directory when discoverable from the server module's installed location. */
  compilerRootFolder?: string;
  /** Path to cmd/tsp.js within that compiler installation; absent when the package root cannot be inferred. */
  compilerCliJsPath?: string;
}

/** Built-in template information needed to start the editor's project-creation workflow. */
export interface InitProjectContext {
  /** provide the default templates current compiler/cli supports */
  coreInitTemplates: LoadedCoreTemplates;
}

/** Resolved scaffolding inputs accepted by the server's project-creation request. */
export type InitProjectConfig = ScaffoldingConfig;
/** Project template definition exchanged with editor clients. */
export type InitProjectTemplate = InitTemplate;
/** Library dependency specification within an editor project template. */
export type InitProjectTemplateLibrarySpec = InitTemplateLibrarySpec;
/** Emitter configuration contributed by an editor project template. */
export type InitProjectTemplateEmitterTemplate = EmitterTemplate;
