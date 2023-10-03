import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionList,
  CompletionParams,
  DefinitionParams,
  DiagnosticSeverity,
  DiagnosticTag,
  DidChangeWatchedFilesParams,
  DocumentFormattingParams,
  DocumentHighlight,
  DocumentHighlightKind,
  DocumentHighlightParams,
  DocumentSymbol,
  DocumentSymbolParams,
  FileEvent,
  FoldingRange,
  FoldingRangeParams,
  Hover,
  HoverParams,
  InitializeParams,
  InitializeResult,
  InitializedParams,
  Location,
  MarkupContent,
  MarkupKind,
  ParameterInformation,
  PrepareRenameParams,
  PublishDiagnosticsParams,
  Range,
  ReferenceParams,
  RenameParams,
  SemanticTokens,
  SemanticTokensBuilder,
  SemanticTokensLegend,
  SemanticTokensParams,
  ServerCapabilities,
  SignatureHelp,
  SignatureHelpParams,
  TextDocumentChangeEvent,
  TextDocumentIdentifier,
  TextDocumentSyncKind,
  TextEdit,
  Diagnostic as VSDiagnostic,
  WorkspaceEdit,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver/node.js";
import {
  defaultConfig,
  findTypeSpecConfigPath,
  loadTypeSpecConfigFile,
} from "../config/config-loader.js";
import { resolveOptionsFromConfig } from "../config/config-to-options.js";
import { TypeSpecConfig } from "../config/types.js";
import { CharCode, codePointBefore, isIdentifierContinue } from "../core/charcode.js";
import {
  compilerAssert,
  createSourceFile,
  formatDiagnostic,
  getSourceLocation,
} from "../core/diagnostics.js";
import { formatTypeSpec } from "../core/formatter.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { CompilerOptions } from "../core/options.js";
import { getNodeAtPosition, visitChildren } from "../core/parser.js";
import {
  ensureTrailingDirectorySeparator,
  getDirectoryPath,
  joinPaths,
} from "../core/path-utils.js";
import { Program, compile as compileProgram } from "../core/program.js";
import {
  Token,
  TokenFlags,
  createScanner,
  isKeyword,
  isPunctuation,
  skipTrivia,
  skipWhiteSpace,
} from "../core/scanner.js";
import {
  AugmentDecoratorStatementNode,
  CompilerHost,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  DiagnosticTarget,
  IdentifierNode,
  Node,
  SourceFile,
  StringLiteralNode,
  SyntaxKind,
  TextRange,
  TypeReferenceNode,
  Diagnostic as TypeSpecDiagnostic,
  TypeSpecScriptNode,
} from "../core/types.js";
import {
  doIO,
  getNormalizedRealPath,
  getSourceFileKindFromExt,
  loadFile,
  resolveTspMain,
} from "../core/util.js";
import { resolveCompletion } from "./completion.js";
import { getPositionBeforeTrivia } from "./server-utils.js";
import { getSymbolStructure } from "./symbol-structure.js";
import {
  getParameterDocumentation,
  getSymbolDetails,
  getTemplateParameterDocumentation,
} from "./type-details.js";

export interface ServerHost {
  compilerHost: CompilerHost;
  throwInternalErrors?: boolean;
  getOpenDocumentByURL(url: string): TextDocument | undefined;
  sendDiagnostics(params: PublishDiagnosticsParams): void;
  log(message: string): void;
}

export interface Server {
  readonly pendingMessages: readonly string[];
  readonly workspaceFolders: readonly ServerWorkspaceFolder[];
  compile(document: TextDocument | TextDocumentIdentifier): Promise<Program | undefined>;
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

interface CachedFile {
  type: "file";
  file: SourceFile;
  version?: number;

  // Cache additional data beyond the raw text of the source file. Currently
  // used only for JSON.parse result of package.json.
  data?: any;
}

interface CachedError {
  type: "error";
  error: unknown;
  data?: any;
  version?: undefined;
}

const serverOptions: CompilerOptions = {
  noEmit: true,
  designTimeBuild: true,
  parseOptions: {
    comments: true,
    docs: true,
  },
};

export function createServer(host: ServerHost): Server {
  // Remember original URL when we convert it to a local path so that we can
  // get it back. We can't convert it back because things like URL-encoding
  // could give us back an equivalent but non-identical URL but the original
  // URL is used as a key into the opened documents and so we must reproduce
  // it exactly.
  const pathToURLMap = new Map<string, string>();

  // Cache all file I/O. Only open documents are sent over the LSP pipe. When
  // the compiler reads a file that isn't open, we use this cache to avoid
  // hitting the disk. Entries are invalidated when LSP client notifies us of
  // a file change.
  const fileSystemCache = createFileSystemCache();
  const compilerHost = createCompilerHost();

  const oldPrograms = new Map<string, Program>();

  let workspaceFolders: ServerWorkspaceFolder[] = [];
  let isInitialized = false;
  let pendingMessages: string[] = [];

  return {
    get pendingMessages() {
      return pendingMessages;
    },
    get workspaceFolders() {
      return workspaceFolders;
    },
    compile,
    initialize,
    initialized,
    workspaceFoldersChanged,
    watchedFilesChanged,
    formatDocument,
    gotoDefinition,
    documentClosed,
    complete,
    findReferences,
    findDocumentHighlight,
    prepareRename,
    rename,
    getSemanticTokens,
    buildSemanticTokens,
    checkChange,
    getFoldingRanges,
    getHover,
    getSignatureHelp,
    getDocumentSymbols,
    log,
  };

  async function initialize(params: InitializeParams): Promise<InitializeResult> {
    const tokenLegend: SemanticTokensLegend = {
      tokenTypes: Object.keys(SemanticTokenKind)
        .filter((x) => Number.isNaN(Number(x)))
        .map((x) => x.slice(0, 1).toLocaleLowerCase() + x.slice(1)),
      tokenModifiers: [],
    };

    const capabilities: ServerCapabilities = {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      definitionProvider: true,
      foldingRangeProvider: true,
      hoverProvider: true,
      documentSymbolProvider: true,
      documentHighlightProvider: true,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [".", "@", "/"],
      },
      semanticTokensProvider: {
        full: true,
        legend: tokenLegend,
      },
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      documentFormattingProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ["(", ",", "<"],
        retriggerCharacters: [")"],
      },
    };

    if (params.capabilities.workspace?.workspaceFolders) {
      for (const w of params.workspaceFolders ?? []) {
        workspaceFolders.push({
          ...w,
          path: ensureTrailingDirectorySeparator(await fileURLToRealPath(w.uri)),
        });
      }
      capabilities.workspace = {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      };
      // eslint-disable-next-line deprecation/deprecation
    } else if (params.rootUri) {
      workspaceFolders = [
        {
          name: "<root>",
          // eslint-disable-next-line deprecation/deprecation
          uri: params.rootUri,
          // eslint-disable-next-line deprecation/deprecation
          path: ensureTrailingDirectorySeparator(await fileURLToRealPath(params.rootUri)),
        },
      ];
      // eslint-disable-next-line deprecation/deprecation
    } else if (params.rootPath) {
      workspaceFolders = [
        {
          name: "<root>",
          // eslint-disable-next-line deprecation/deprecation
          uri: compilerHost.pathToFileURL(params.rootPath),
          path: ensureTrailingDirectorySeparator(
            // eslint-disable-next-line deprecation/deprecation
            await getNormalizedRealPath(compilerHost, params.rootPath)
          ),
        },
      ];
    }

    log("Workspace Folders", workspaceFolders);
    return { capabilities };
  }

  function initialized(params: InitializedParams): void {
    isInitialized = true;
    log("Initialization complete.");
  }

  async function workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent) {
    log("Workspace Folders Changed", e);
    const map = new Map(workspaceFolders.map((f) => [f.uri, f]));
    for (const folder of e.removed) {
      map.delete(folder.uri);
    }
    for (const folder of e.added) {
      map.set(folder.uri, {
        ...folder,
        path: ensureTrailingDirectorySeparator(await fileURLToRealPath(folder.uri)),
      });
    }
    workspaceFolders = Array.from(map.values());
    log("Workspace Folders", workspaceFolders);
  }

  function watchedFilesChanged(params: DidChangeWatchedFilesParams) {
    fileSystemCache.notify(params.changes);
  }

  type CompileCallback<T> = (
    program: Program,
    document: TextDocument,
    script: TypeSpecScriptNode
  ) => (T | undefined) | Promise<T | undefined>;

  async function compile(
    document: TextDocument | TextDocumentIdentifier
  ): Promise<Program | undefined>;

  async function compile<T>(
    document: TextDocument | TextDocumentIdentifier,
    callback: CompileCallback<T>
  ): Promise<T | undefined>;

  async function compile<T>(
    document: TextDocument | TextDocumentIdentifier,
    callback?: CompileCallback<T>
  ): Promise<T | Program | undefined> {
    const path = await getPath(document);
    const mainFile = await getMainFileForDocument(path);
    const config = await getConfig(mainFile);

    const [optionsFromConfig, _] = resolveOptionsFromConfig(config, { cwd: path });
    const options: CompilerOptions = {
      ...optionsFromConfig,
      ...serverOptions,
    };

    if (!upToDate(document)) {
      return undefined;
    }

    let program: Program;
    try {
      program = await compileProgram(compilerHost, mainFile, options, oldPrograms.get(mainFile));
      oldPrograms.set(mainFile, program);
      if (!upToDate(document)) {
        return undefined;
      }

      if (mainFile !== path && !program.sourceFiles.has(path)) {
        // If the file that changed wasn't imported by anything from the main
        // file, retry using the file itself as the main file.
        program = await compileProgram(compilerHost, path, options, oldPrograms.get(path));
        oldPrograms.set(path, program);
      }

      if (!upToDate(document)) {
        return undefined;
      }

      if (callback) {
        const doc = "version" in document ? document : host.getOpenDocumentByURL(document.uri);
        compilerAssert(doc, "Failed to get document.");
        const path = await getPath(doc);
        const script = program.sourceFiles.get(path);
        compilerAssert(script, "Failed to get script.");
        return await callback(program, doc, script);
      }

      return program;
    } catch (err: any) {
      if (host.throwInternalErrors) {
        throw err;
      }
      host.sendDiagnostics({
        uri: document.uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: Range.create(0, 0, 0, 0),
            message:
              `Internal compiler error!\nFile issue at https://github.com/microsoft/typespec\n\n` +
              err.stack,
          },
        ],
      });

      return undefined;
    }
  }

  async function getConfig(mainFile: string): Promise<TypeSpecConfig> {
    const entrypointStat = await host.compilerHost.stat(mainFile);

    const lookupDir = entrypointStat.isDirectory() ? mainFile : getDirectoryPath(mainFile);
    const configPath = await findTypeSpecConfigPath(compilerHost, lookupDir, true);
    if (!configPath) {
      return { ...defaultConfig, projectRoot: getDirectoryPath(mainFile) };
    }

    const cached = await fileSystemCache.get(configPath);
    if (cached?.data) {
      return cached.data;
    }

    const config = await loadTypeSpecConfigFile(compilerHost, configPath);
    await fileSystemCache.setData(configPath, config);
    return config;
  }

  async function getScript(document: TextDocument | TextDocumentIdentifier) {
    const file = await compilerHost.readFile(await getPath(document));
    const cached = compilerHost.parseCache?.get(file);
    return cached ?? (await compile<TypeSpecScriptNode>(document, (_, __, script) => script));
  }

  async function getFoldingRanges(params: FoldingRangeParams): Promise<FoldingRange[]> {
    const ast = await getScript(params.textDocument);
    if (!ast) {
      return [];
    }
    const file = ast.file;
    const ranges: FoldingRange[] = [];
    let rangeStartSingleLines = -1;
    for (let i = 0; i < ast.comments.length; i++) {
      const comment = ast.comments[i];
      if (
        comment.kind === SyntaxKind.LineComment &&
        i + 1 < ast.comments.length &&
        ast.comments[i + 1].kind === SyntaxKind.LineComment &&
        ast.comments[i + 1].pos === skipWhiteSpace(file.text, comment.end)
      ) {
        if (rangeStartSingleLines === -1) {
          rangeStartSingleLines = comment.pos;
        }
      } else if (rangeStartSingleLines !== -1) {
        addRange(rangeStartSingleLines, comment.end);
        rangeStartSingleLines = -1;
      } else {
        addRange(comment.pos, comment.end);
      }
    }
    visitChildren(ast, addRangesForNode);
    function addRangesForNode(node: Node) {
      if (node.kind === SyntaxKind.Doc) {
        return; // fold doc comments as regular comments
      }
      let nodeStart = node.pos;
      if ("decorators" in node && node.decorators.length > 0) {
        const decoratorEnd = node.decorators[node.decorators.length - 1].end;
        addRange(nodeStart, decoratorEnd);
        nodeStart = skipTrivia(file.text, decoratorEnd);
      }

      addRange(nodeStart, node.end);
      visitChildren(node, addRangesForNode);
    }
    return ranges;
    function addRange(startPos: number, endPos: number) {
      const start = file.getLineAndCharacterOfPosition(startPos);
      const end = file.getLineAndCharacterOfPosition(endPos);
      if (start.line !== end.line) {
        ranges.push({
          startLine: start.line,
          startCharacter: start.character,
          endLine: end.line,
          endCharacter: end.character,
        });
      }
    }
  }

  async function getDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    const ast = await getScript(params.textDocument);
    if (!ast) {
      return [];
    }

    return getSymbolStructure(ast);
  }

  async function findDocumentHighlight(
    params: DocumentHighlightParams
  ): Promise<DocumentHighlight[]> {
    let highlights: DocumentHighlight[] = [];
    await compile(params.textDocument, (program, document, file) => {
      const identifiers = findReferenceIdentifiers(
        program,
        file,
        document.offsetAt(params.position),
        [file]
      );
      highlights = identifiers.map((identifier) => ({
        range: getRange(identifier, file.file),
        kind: DocumentHighlightKind.Read,
      }));
    });
    return highlights;
  }

  async function checkChange(change: TextDocumentChangeEvent<TextDocument>) {
    const program = await compile(change.document);
    if (!program) {
      return;
    }

    // Group diagnostics by file.
    //
    // Initialize diagnostics for all source files in program to empty array
    // as we must send an empty array when a file has no diagnostics or else
    // stale diagnostics from a previous run will stick around in the IDE.
    //
    const diagnosticMap: Map<TextDocument, VSDiagnostic[]> = new Map();
    diagnosticMap.set(change.document, []);
    for (const each of program.sourceFiles.values()) {
      const document = (each.file as ServerSourceFile)?.document;
      if (document) {
        diagnosticMap.set(document, []);
      }
    }

    for (const each of program.diagnostics) {
      let document: TextDocument | undefined;

      const location = getSourceLocation(each.target, { locateId: true });
      if (location?.file) {
        document = (location.file as ServerSourceFile).document;
      } else {
        // https://github.com/microsoft/language-server-protocol/issues/256
        //
        // LSP does not currently allow sending a diagnostic with no location so
        // we report diagnostics with no location on the document that changed to
        // trigger.
        document = change.document;
      }

      if (!document || !upToDate(document)) {
        continue;
      }

      const start = document.positionAt(location?.pos ?? 0);
      const end = document.positionAt(location?.end ?? 0);
      const range = Range.create(start, end);
      const severity = convertSeverity(each.severity);
      const diagnostic = VSDiagnostic.create(range, each.message, severity, each.code, "TypeSpec");
      if (each.code === "deprecated") {
        diagnostic.tags = [DiagnosticTag.Deprecated];
      }
      const diagnostics = diagnosticMap.get(document);
      compilerAssert(
        diagnostics,
        "Diagnostic reported against a source file that was not added to the program."
      );
      diagnostics.push(diagnostic);
    }

    for (const [document, diagnostics] of diagnosticMap) {
      sendDiagnostics(document, diagnostics);
    }
  }

  async function getHover(params: HoverParams): Promise<Hover> {
    const docString = await compile(params.textDocument, (program, document, file) => {
      const id = getNodeAtPosition(file, document.offsetAt(params.position));
      const sym =
        id?.kind === SyntaxKind.Identifier ? program.checker.resolveIdentifier(id) : undefined;
      if (sym) {
        return getSymbolDetails(program, sym);
      }
      return undefined;
    });

    const markdown: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: docString ?? "",
    };
    return {
      contents: markdown,
    };
  }

  async function getSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | undefined> {
    return await compile(params.textDocument, (program, document, file) => {
      const data = getSignatureHelpNodeAtPosition(file, document.offsetAt(params.position));
      if (data === undefined) {
        return undefined;
      }
      const { node, argumentIndex } = data;
      switch (node.kind) {
        case SyntaxKind.TypeReference:
          return getSignatureHelpForTemplate(program, node, argumentIndex);
        case SyntaxKind.DecoratorExpression:
        case SyntaxKind.AugmentDecoratorStatement:
          return getSignatureHelpForDecorator(program, node, argumentIndex);
        default:
          const _assertNever: never = node;
          compilerAssert(false, "Unreachable");
      }
    });
  }

  function getSignatureHelpForTemplate(
    program: Program,
    node: TypeReferenceNode,
    argumentIndex: number
  ): SignatureHelp | undefined {
    const sym = program.checker.resolveIdentifier(
      node.target.kind === SyntaxKind.MemberExpression ? node.target.id : node.target
    );
    const templateDeclNode = sym?.declarations[0];
    if (
      !templateDeclNode ||
      !("templateParameters" in templateDeclNode) ||
      templateDeclNode.templateParameters.length === 0
    ) {
      return undefined;
    }

    const parameterDocs = getTemplateParameterDocumentation(templateDeclNode);
    const parameters = templateDeclNode.templateParameters.map((x) => {
      const info: ParameterInformation = { label: x.id.sv };
      const doc = parameterDocs.get(x.id.sv);
      if (doc) {
        info.documentation = { kind: MarkupKind.Markdown, value: doc };
      }
      return info;
    });

    const help: SignatureHelp = {
      signatures: [
        {
          label: `${sym.name}<${parameters.map((x) => x.label).join(", ")}>`,
          parameters,
          activeParameter: Math.min(parameters.length - 1, argumentIndex),
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    };

    const doc = getSymbolDetails(program, sym, {
      includeSignature: false,
      includeParameterTags: false,
    });
    if (doc) {
      help.signatures[0].documentation = { kind: MarkupKind.Markdown, value: doc };
    }

    return help;
  }

  function getSignatureHelpForDecorator(
    program: Program,
    node: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    argumentIndex: number
  ): SignatureHelp | undefined {
    const sym = program.checker.resolveIdentifier(
      node.target.kind === SyntaxKind.MemberExpression ? node.target.id : node.target
    );
    if (!sym) {
      return undefined;
    }

    const decoratorDeclNode: DecoratorDeclarationStatementNode | undefined = sym.declarations.find(
      (x): x is DecoratorDeclarationStatementNode =>
        x.kind === SyntaxKind.DecoratorDeclarationStatement
    );
    if (decoratorDeclNode === undefined) {
      return undefined;
    }

    const type = program.checker.getTypeForNode(decoratorDeclNode);
    compilerAssert(type.kind === "Decorator", "Expected type to be a decorator.");

    const parameterDocs = getParameterDocumentation(program, type);
    let labelPrefix = "";
    const parameters: ParameterInformation[] = [];
    if (node.kind === SyntaxKind.AugmentDecoratorStatement) {
      const targetType = decoratorDeclNode.target.type
        ? program.checker.getTypeForNode(decoratorDeclNode.target.type)
        : undefined;

      parameters.push({
        label: `${decoratorDeclNode.target.id.sv}: ${
          targetType ? getTypeName(targetType) : "unknown"
        }`,
      });

      labelPrefix = "@";
    }

    parameters.push(
      ...type.parameters.map((x) => {
        const info: ParameterInformation = {
          // prettier-ignore
          label: `${x.rest ? "..." : ""}${x.name}${x.optional ? "?" : ""}: ${getTypeName(x.type)}`,
        };
        const doc = parameterDocs.get(x.name);
        if (doc) {
          info.documentation = { kind: MarkupKind.Markdown, value: doc };
        }
        return info;
      })
    );

    const help: SignatureHelp = {
      signatures: [
        {
          label: `${labelPrefix}${type.name}(${parameters.map((x) => x.label).join(", ")})`,
          parameters,
          activeParameter: Math.min(parameters.length - 1, argumentIndex),
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    };

    const doc = getSymbolDetails(program, sym, {
      includeSignature: false,
      includeParameterTags: false,
    });
    if (doc) {
      help.signatures[0].documentation = { kind: MarkupKind.Markdown, value: doc };
    }

    return help;
  }

  async function formatDocument(params: DocumentFormattingParams): Promise<TextEdit[]> {
    const document = host.getOpenDocumentByURL(params.textDocument.uri);
    if (document === undefined) {
      return [];
    }
    const formattedText = await formatTypeSpec(document.getText(), {
      tabWidth: params.options.tabSize,
      useTabs: !params.options.insertSpaces,
    });
    return [minimalEdit(document, formattedText)];
  }

  function minimalEdit(document: TextDocument, string1: string): TextEdit {
    const string0 = document.getText();
    // length of common prefix
    let i = 0;
    while (i < string0.length && i < string1.length && string0[i] === string1[i]) {
      ++i;
    }
    // length of common suffix
    let j = 0;
    while (
      i + j < string0.length &&
      i + j < string1.length &&
      string0[string0.length - j - 1] === string1[string1.length - j - 1]
    ) {
      ++j;
    }
    const newText = string1.substring(i, string1.length - j);
    const pos0 = document.positionAt(i);
    const pos1 = document.positionAt(string0.length - j);

    return TextEdit.replace(Range.create(pos0, pos1), newText);
  }

  async function gotoDefinition(params: DefinitionParams): Promise<Location[]> {
    const sym = await compile(params.textDocument, (program, document, file) => {
      const id = getNodeAtPosition(file, document.offsetAt(params.position));
      return id?.kind === SyntaxKind.Identifier ? program.checker.resolveIdentifier(id) : undefined;
    });

    return getLocations(sym?.declarations);
  }
  async function complete(params: CompletionParams): Promise<CompletionList> {
    const completions: CompletionList = {
      isIncomplete: false,
      items: [],
    };
    await compile(params.textDocument, async (program, document, file) => {
      const node = getCompletionNodeAtPosition(file, document.offsetAt(params.position));

      await resolveCompletion(
        {
          program,
          file,
          completions,
          params,
        },
        node
      );
    });
    return completions;
  }

  async function findReferences(params: ReferenceParams): Promise<Location[]> {
    const identifiers = await compile(params.textDocument, (program, document, file) =>
      findReferenceIdentifiers(program, file, document.offsetAt(params.position))
    );
    return getLocations(identifiers);
  }

  async function prepareRename(params: PrepareRenameParams): Promise<Range | undefined> {
    return await compile(params.textDocument, (_, document, file) => {
      const id = getNodeAtPosition(file, document.offsetAt(params.position));
      return id?.kind === SyntaxKind.Identifier ? getLocation(id)?.range : undefined;
    });
  }

  async function rename(params: RenameParams): Promise<WorkspaceEdit> {
    const changes: Record<string, TextEdit[]> = {};
    await compile(params.textDocument, (program, document, file) => {
      const identifiers = findReferenceIdentifiers(
        program,
        file,
        document.offsetAt(params.position)
      );
      for (const id of identifiers) {
        const location = getLocation(id);
        if (!location) {
          continue;
        }
        const change = TextEdit.replace(location.range, params.newName);
        if (location.uri in changes) {
          changes[location.uri].push(change);
        } else {
          changes[location.uri] = [change];
        }
      }
    });
    return { changes };
  }

  function findReferenceIdentifiers(
    program: Program,
    file: TypeSpecScriptNode,
    pos: number,
    searchFiles: Iterable<TypeSpecScriptNode> = program.sourceFiles.values()
  ): IdentifierNode[] {
    const id = getNodeAtPosition(file, pos);
    if (id?.kind !== SyntaxKind.Identifier) {
      return [];
    }

    const sym = program.checker.resolveIdentifier(id);
    if (!sym) {
      return [id];
    }

    const references: IdentifierNode[] = [];
    for (const searchFile of searchFiles) {
      visitChildren(searchFile, function visit(node) {
        if (node.kind === SyntaxKind.Identifier) {
          const s = program.checker.resolveIdentifier(node);
          if (s === sym || (sym.type && s?.type === sym.type)) {
            references.push(node);
          }
        }
        visitChildren(node, visit);
      });
    }
    return references;
  }

  async function getSemanticTokens(params: SemanticTokensParams): Promise<SemanticToken[]> {
    const ignore = -1;
    const defer = -2;

    const ast = await getScript(params.textDocument);
    if (!ast) {
      return [];
    }
    const file = ast.file;
    const tokens = mapTokens();
    classifyNode(ast);
    return Array.from(tokens.values()).filter((t) => t.kind !== undefined);

    function mapTokens() {
      const tokens = new Map<number, SemanticToken>();
      const scanner = createScanner(file, () => {});

      while (scanner.scan() !== Token.EndOfFile) {
        if (scanner.tokenFlags & TokenFlags.DocComment) {
          classifyDocComment({ pos: scanner.tokenPosition, end: scanner.position });
        } else {
          const kind = classifyToken(scanner.token);
          if (kind === ignore) {
            continue;
          }
          tokens.set(scanner.tokenPosition, {
            kind: kind === defer ? undefined! : kind,
            pos: scanner.tokenPosition,
            end: scanner.position,
          });
        }
      }
      return tokens;

      function classifyDocComment(range: TextRange) {
        scanner.scanRange(range, () => {
          while (scanner.scanDoc() !== Token.EndOfFile) {
            const kind = classifyDocToken(scanner.token);
            if (kind === ignore) {
              continue;
            }
            tokens.set(scanner.tokenPosition, {
              kind: kind === defer ? undefined! : kind,
              pos: scanner.tokenPosition,
              end: scanner.position,
            });
          }
        });
      }
    }

    function classifyToken(token: Token): SemanticTokenKind | typeof defer | typeof ignore {
      switch (token) {
        case Token.Identifier:
          return defer;
        case Token.StringLiteral:
          return SemanticTokenKind.String;
        case Token.NumericLiteral:
          return SemanticTokenKind.Number;
        case Token.MultiLineComment:
        case Token.SingleLineComment:
          return SemanticTokenKind.Comment;
        default:
          if (isKeyword(token)) {
            return SemanticTokenKind.Keyword;
          }
          if (isPunctuation(token)) {
            return SemanticTokenKind.Operator;
          }
          return ignore;
      }
    }

    /** Classify tokens when scanning doc comment. */
    function classifyDocToken(token: Token): SemanticTokenKind | typeof defer | typeof ignore {
      switch (token) {
        case Token.NewLine:
        case Token.Whitespace:
          return ignore;
        case Token.DocText:
        case Token.Star:
        case Token.Identifier:
          return SemanticTokenKind.Comment;
        case Token.At:
          return defer;
        default:
          return ignore;
      }
    }

    function classifyNode(node: Node) {
      switch (node.kind) {
        case SyntaxKind.DirectiveExpression:
          classify(node.target, SemanticTokenKind.Keyword);
          break;
        case SyntaxKind.TemplateParameterDeclaration:
          classify(node.id, SemanticTokenKind.TypeParameter);
          break;
        case SyntaxKind.ModelProperty:
        case SyntaxKind.UnionVariant:
          if (node.id) {
            classify(node.id, SemanticTokenKind.Property);
          }
          break;
        case SyntaxKind.AliasStatement:
          classify(node.id, SemanticTokenKind.Struct);
          break;
        case SyntaxKind.ModelStatement:
          classify(node.id, SemanticTokenKind.Struct);
          break;
        case SyntaxKind.ScalarStatement:
          classify(node.id, SemanticTokenKind.Type);
          break;
        case SyntaxKind.EnumStatement:
          classify(node.id, SemanticTokenKind.Enum);
          break;
        case SyntaxKind.EnumMember:
          classify(node.id, SemanticTokenKind.EnumMember);
          break;
        case SyntaxKind.NamespaceStatement:
          classify(node.id, SemanticTokenKind.Namespace);
          break;
        case SyntaxKind.InterfaceStatement:
          classify(node.id, SemanticTokenKind.Interface);
          break;
        case SyntaxKind.OperationStatement:
          classify(node.id, SemanticTokenKind.Function);
          break;
        case SyntaxKind.DecoratorDeclarationStatement:
          classify(node.id, SemanticTokenKind.Function);
          break;
        case SyntaxKind.FunctionDeclarationStatement:
          classify(node.id, SemanticTokenKind.Function);
          break;
        case SyntaxKind.FunctionParameter:
          classify(node.id, SemanticTokenKind.Parameter);
          break;
        case SyntaxKind.AugmentDecoratorStatement:
          classifyReference(node.targetType, SemanticTokenKind.Type);
          classifyReference(node.target, SemanticTokenKind.Macro);
          break;
        case SyntaxKind.DecoratorExpression:
          classifyReference(node.target, SemanticTokenKind.Macro);
          break;

        case SyntaxKind.TypeReference:
          classifyReference(node.target);
          break;
        case SyntaxKind.MemberExpression:
          classifyReference(node);
          break;
        case SyntaxKind.ProjectionStatement:
          classifyReference(node.selector);
          classify(node.id, SemanticTokenKind.Variable);
          break;
        case SyntaxKind.Projection:
          classify(node.directionId, SemanticTokenKind.Keyword);
          for (const modifierId of node.modifierIds) {
            classify(modifierId, SemanticTokenKind.Keyword);
          }
          break;
        case SyntaxKind.ProjectionParameterDeclaration:
          classifyReference(node.id, SemanticTokenKind.Parameter);
          break;
        case SyntaxKind.ProjectionCallExpression:
          classifyReference(node.target, SemanticTokenKind.Function);
          for (const arg of node.arguments) {
            classifyReference(arg);
          }
          break;
        case SyntaxKind.ProjectionMemberExpression:
          classifyReference(node.id);
          break;
        case SyntaxKind.DocParamTag:
        case SyntaxKind.DocTemplateTag:
          classifyDocTag(node.tagName, SemanticTokenKind.DocCommentTag);
          classifyOverride(node.paramName, SemanticTokenKind.Variable);
          break;
        case SyntaxKind.DocReturnsTag:
          classifyDocTag(node.tagName, SemanticTokenKind.DocCommentTag);
          break;
        case SyntaxKind.DocUnknownTag:
          classifyDocTag(node.tagName, SemanticTokenKind.Macro);
          break;
        default:
          break;
      }
      visitChildren(node, classifyNode);
    }

    function classifyDocTag(node: IdentifierNode, kind: SemanticTokenKind) {
      classifyOverride(node, kind);
      const token = tokens.get(node.pos - 1); // Get the `@` token
      if (token) {
        token.kind = kind;
      }
    }

    function classify(node: IdentifierNode | StringLiteralNode, kind: SemanticTokenKind) {
      const token = tokens.get(node.pos);
      if (token && token.kind === undefined) {
        token.kind = kind;
      }
    }
    function classifyOverride(node: IdentifierNode | StringLiteralNode, kind: SemanticTokenKind) {
      const token = tokens.get(node.pos);
      if (token) {
        token.kind = kind;
      }
    }

    function classifyReference(node: Node, kind = SemanticTokenKind.Type) {
      switch (node.kind) {
        case SyntaxKind.MemberExpression:
          classifyIdentifier(node.base, SemanticTokenKind.Namespace);
          classifyIdentifier(node.id, kind);
          break;
        case SyntaxKind.ProjectionMemberExpression:
          classifyReference(node.base, SemanticTokenKind.Namespace);
          classifyIdentifier(node.id, kind);
          break;
        case SyntaxKind.TypeReference:
          classifyIdentifier(node.target, kind);
          break;
        case SyntaxKind.Identifier:
          classify(node, kind);
          break;
      }
    }

    function classifyIdentifier(node: Node, kind: SemanticTokenKind) {
      if (node.kind === SyntaxKind.Identifier) {
        classify(node, kind);
      }
    }
  }

  async function buildSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens> {
    const builder = new SemanticTokensBuilder();
    const tokens = await getSemanticTokens(params);
    const file = await compilerHost.readFile(await getPath(params.textDocument));
    const starts = file.getLineStarts();

    for (const token of tokens) {
      const start = file.getLineAndCharacterOfPosition(token.pos);
      const end = file.getLineAndCharacterOfPosition(token.end);

      for (let pos = token.pos, line = start.line; line <= end.line; line++) {
        const endPos = line === end.line ? token.end : starts[line + 1];
        const character = line === start.line ? start.character : 0;
        builder.push(line, character, endPos - pos, token.kind, 0);
        pos = endPos;
      }
    }

    return builder.build();
  }

  function documentClosed(change: TextDocumentChangeEvent<TextDocument>) {
    // clear diagnostics on file close
    sendDiagnostics(change.document, []);
  }

  function getLocations(targets: readonly DiagnosticTarget[] | undefined): Location[] {
    return targets?.map(getLocation).filter((x): x is Location => !!x) ?? [];
  }

  function getLocation(target: DiagnosticTarget): Location | undefined {
    const location = getSourceLocation(target);
    if (location.isSynthetic) {
      return undefined;
    }

    return {
      uri: getURL(location.file.path),
      range: getRange(location, location.file),
    };
  }

  function getRange(location: TextRange, file: SourceFile): Range {
    const start = file.getLineAndCharacterOfPosition(location.pos);
    const end = file.getLineAndCharacterOfPosition(location.end);
    return Range.create(start, end);
  }

  function convertSeverity(severity: "warning" | "error"): DiagnosticSeverity {
    switch (severity) {
      case "warning":
        return DiagnosticSeverity.Warning;
      case "error":
        return DiagnosticSeverity.Error;
    }
  }

  function log(message: string, details: any = undefined) {
    message = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (details) {
      message += ": " + JSON.stringify(details, undefined, 2);
    }

    if (!isInitialized) {
      pendingMessages.push(message);
      return;
    }

    for (const pending of pendingMessages) {
      host.log(pending);
    }

    pendingMessages = [];
    host.log(message);
  }

  function sendDiagnostics(document: TextDocument, diagnostics: VSDiagnostic[]) {
    host.sendDiagnostics({
      uri: document.uri,
      version: document.version,
      diagnostics,
    });
  }

  /**
   * Determine if the given document is the latest version.
   *
   * A document can become out-of-date if a change comes in during an async
   * operation.
   */
  function upToDate(document: TextDocument | TextDocumentIdentifier) {
    if (!("version" in document)) {
      return true;
    }
    return document.version === host.getOpenDocumentByURL(document.uri)?.version;
  }

  /**
   * Infer the appropriate entry point (a.k.a. "main file") for analyzing a
   * change to the file at the given path. This is necessary because different
   * results can be obtained from compiling the same file with different entry
   * points.
   *
   * Walk directory structure upwards looking for package.json with tspMain or
   * main.tsp file. Stop search when reaching a workspace root. If a root is
   * reached without finding an entry point, use the given path as its own
   * entry point.
   *
   * Untitled documents are always treated as their own entry points as they
   * do not exist in a directory that could pull them in via another entry
   * point.
   */
  async function getMainFileForDocument(path: string) {
    if (path.startsWith("untitled:")) {
      return path;
    }

    let dir = getDirectoryPath(path);
    const options = { allowFileNotFound: true };

    while (true) {
      let mainFile = "main.tsp";
      let pkg: any;
      const pkgPath = joinPaths(dir, "package.json");
      const cached = await fileSystemCache.get(pkgPath);

      if (cached?.data) {
        pkg = cached.data;
      } else {
        [pkg] = await loadFile(
          compilerHost,
          pkgPath,
          JSON.parse,
          logMainFileSearchDiagnostic,
          options
        );
        await fileSystemCache.setData(pkgPath, pkg ?? {});
      }

      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        mainFile = tspMain;
      }

      const candidate = joinPaths(dir, mainFile);
      const stat = await doIO(
        () => compilerHost.stat(candidate),
        candidate,
        logMainFileSearchDiagnostic,
        options
      );

      if (stat?.isFile()) {
        return candidate;
      }

      const parentDir = getDirectoryPath(dir);
      if (parentDir === dir) {
        break;
      }
      dir = parentDir;
    }

    return path;

    function logMainFileSearchDiagnostic(diagnostic: TypeSpecDiagnostic) {
      log(
        `Unexpected diagnostic while looking for main file of ${path}`,
        formatDiagnostic(diagnostic)
      );
    }
  }

  async function getPath(document: TextDocument | TextDocumentIdentifier) {
    if (isUntitled(document.uri)) {
      return document.uri;
    }
    const path = await fileURLToRealPath(document.uri);
    pathToURLMap.set(path, document.uri);
    return path;
  }

  function getURL(path: string) {
    if (isUntitled(path)) {
      return path;
    }
    return pathToURLMap.get(path) ?? compilerHost.pathToFileURL(path);
  }

  function isUntitled(pathOrUrl: string) {
    return pathOrUrl.startsWith("untitled:");
  }

  function getOpenDocument(path: string) {
    const url = getURL(path);
    return url ? host.getOpenDocumentByURL(url) : undefined;
  }

  async function fileURLToRealPath(url: string) {
    return getNormalizedRealPath(compilerHost, compilerHost.fileURLToPath(url));
  }

  function createFileSystemCache() {
    const cache = new Map<string, CachedFile | CachedError>();
    let changes: FileEvent[] = [];
    return {
      async get(path: string) {
        for (const change of changes) {
          const path = await fileURLToRealPath(change.uri);
          cache.delete(path);
        }
        changes = [];
        return cache.get(path);
      },
      set(path: string, entry: CachedFile | CachedError) {
        cache.set(path, entry);
      },
      async setData(path: string, data: any) {
        const entry = await this.get(path);
        if (entry) {
          entry.data = data;
        }
      },
      notify(changes: FileEvent[]) {
        changes.push(...changes);
      },
    };
  }

  function createCompilerHost(): CompilerHost {
    const base = host.compilerHost;
    return {
      ...base,
      parseCache: new WeakMap(),
      readFile,
      stat,
      getSourceFileKind,
    };

    async function readFile(path: string): Promise<ServerSourceFile> {
      const document = getOpenDocument(path);
      const cached = await fileSystemCache.get(path);

      // Try cache
      if (cached && (!document || document.version === cached.version)) {
        if (cached.type === "error") {
          throw cached.error;
        }
        return cached.file;
      }

      // Try open document, although this is cheap, the instance still needs
      // to be cached so that the compiler can reuse parse and bind results.
      if (document) {
        const file = {
          document,
          ...createSourceFile(document.getText(), path),
        };
        fileSystemCache.set(path, { type: "file", file, version: document.version });
        return file;
      }

      // Hit the disk and cache
      try {
        const file = await base.readFile(path);
        fileSystemCache.set(path, { type: "file", file });
        return file;
      } catch (error) {
        fileSystemCache.set(path, { type: "error", error });
        throw error;
      }
    }

    async function stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
      // if we have an open document for the path or a cache entry, then we know
      // it's a file and not a directory and needn't hit the disk.
      if (getOpenDocument(path) || (await fileSystemCache.get(path))?.type === "file") {
        return {
          isFile() {
            return true;
          },
          isDirectory() {
            return false;
          },
        };
      }
      return await base.stat(path);
    }

    function getSourceFileKind(path: string) {
      const document = getOpenDocument(path);
      if (document?.languageId === "typespec") {
        return "typespec";
      }
      return getSourceFileKindFromExt(path);
    }
  }
}

type SignatureHelpNode =
  | DecoratorExpressionNode
  | AugmentDecoratorStatementNode
  | TypeReferenceNode;

function getSignatureHelpNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number
): { node: SignatureHelpNode; argumentIndex: number } | undefined {
  // Move back over any trailing trivia. Otherwise, if there is no
  // closing paren/angle bracket, we can find ourselves outside the desired
  // node altogether in cases like `@dec(test, |`.
  position = getPositionBeforeTrivia(script, position);

  const node = getNodeAtPosition<SignatureHelpNode>(
    script,
    position,
    (n): n is SignatureHelpNode => {
      switch (n.kind) {
        case SyntaxKind.DecoratorExpression:
        case SyntaxKind.AugmentDecoratorStatement:
        case SyntaxKind.TypeReference:
          // Do not consider node if positioned before the argument list.
          // This is the standard behavior for signature help and further
          // deals with nesting such as `Outer<Inner|> where we do not want
          // we want help with the `Outer` arguments, not the `Inner` ones.
          if (position <= n.target.end) {
            return false;
          }

          // Likewise, no signature help at the end of argument list unless the
          // it has no closing paren/angle bracket.
          if (position === n.end) {
            const endChar = script.file.text.charCodeAt(position - 1);
            const closeChar =
              n.kind === SyntaxKind.TypeReference ? CharCode.GreaterThan : CharCode.CloseParen;
            if (endChar === closeChar) {
              return false;
            }
          }
          return true;
        default:
          return false;
      }
    }
  );

  if (!node) {
    return undefined;
  }

  const argumentIndex = getSignatureHelpArgumentIndex(script, node, position);
  if (argumentIndex < 0) {
    return undefined;
  }

  return { node, argumentIndex };
}

function getSignatureHelpArgumentIndex(
  script: TypeSpecScriptNode,
  node: SignatureHelpNode,
  position: number
) {
  // Normalize arguments into a single list to avoid special case for
  // augment decorators.
  const args =
    node.kind === SyntaxKind.AugmentDecoratorStatement
      ? [node.targetType, ...node.arguments]
      : node.arguments;

  // Find the first argument that ends after the position. We don't look at
  // the argument start position since the cursor might be in leading
  // trivia, and we skip trivia to get the effective argument end position
  // since the cursor might be in trailing trivia.
  for (let i = 0; i < args.length; i++) {
    if (position <= skipTrivia(script.file.text, args[i].end)) {
      return i;
    }
  }

  // If we reach here, we must be at the next argument after any that are in
  // the syntax tree. There won't be a missing identifier for this argument
  // in the tree since the parser error recovery will have assumed a
  // trailing delimiter or empty list.
  return args.length;
}

/**
 * Resolve the node that should be auto completed at the given position.
 * It will try to guess what node it could be as during auto complete the ast might not be complete.
 * @internal
 */
export function getCompletionNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number,
  filter: (node: Node) => boolean = (node: Node) => true
): Node | undefined {
  const realNode = getNodeAtPosition(script, position, filter);
  if (realNode?.kind === SyntaxKind.StringLiteral) {
    return realNode;
  }
  // If we're not immediately after an identifier character, then advance
  // the position past any trivia. This is done because a zero-width
  // inserted missing identifier that the user is now trying to complete
  // starts after the trivia following the cursor.
  const cp = codePointBefore(script.file.text, position);
  if (!cp || !isIdentifierContinue(cp)) {
    const newPosition = skipTrivia(script.file.text, position);
    if (newPosition !== position) {
      return getNodeAtPosition(script, newPosition, filter);
    }
  }
  return realNode;
}
