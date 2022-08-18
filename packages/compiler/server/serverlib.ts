import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  CompletionList,
  CompletionParams,
  DefinitionParams,
  Diagnostic as VSDiagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  DidChangeWatchedFilesParams,
  DocumentHighlight,
  DocumentHighlightKind,
  DocumentHighlightParams,
  DocumentSymbolParams,
  FileEvent,
  FoldingRange,
  FoldingRangeParams,
  InitializedParams,
  InitializeParams,
  InitializeResult,
  Location,
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
  SymbolInformation,
  SymbolKind,
  TextDocumentChangeEvent,
  TextDocumentIdentifier,
  TextDocumentSyncKind,
  TextEdit,
  WorkspaceEdit,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver/node.js";
import { loadCadlConfigForPath } from "../config/config-loader.js";
import {
  compilerAssert,
  createSourceFile,
  formatDiagnostic,
  getSourceLocation,
} from "../core/diagnostics.js";
import { CompilerOptions } from "../core/options.js";
import { getNodeAtPosition, parse, visitChildren } from "../core/parser.js";
import {
  ensureTrailingDirectorySeparator,
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  hasTrailingDirectorySeparator,
  joinPaths,
  resolvePath,
} from "../core/path-utils.js";
import { createProgram, Program } from "../core/program.js";
import {
  createScanner,
  isKeyword,
  isPunctuation,
  skipTrivia,
  skipWhiteSpace,
  Token,
} from "../core/scanner.js";
import {
  CadlScriptNode,
  CompilerHost,
  Diagnostic as CadlDiagnostic,
  DiagnosticTarget,
  IdentifierNode,
  Node,
  SourceFile,
  StringLiteralNode,
  Sym,
  SymbolFlags,
  SyntaxKind,
  Type,
} from "../core/types.js";
import {
  doIO,
  findProjectRoot,
  getNormalizedRealPath,
  getSourceFileKindFromExt,
  loadFile,
} from "../core/util.js";
import { getDoc, isDeprecated, isIntrinsic } from "../lib/decorators.js";

export interface ServerHost {
  compilerHost: CompilerHost;
  getOpenDocumentByURL(url: string): TextDocument | undefined;
  sendDiagnostics(params: PublishDiagnosticsParams): void;
  log(message: string): void;
}

export interface Server {
  readonly pendingMessages: readonly string[];
  readonly workspaceFolders: readonly ServerWorkspaceFolder[];
  initialize(params: InitializeParams): Promise<InitializeResult>;
  initialized(params: InitializedParams): void;
  workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent): Promise<void>;
  watchedFilesChanged(params: DidChangeWatchedFilesParams): void;
  gotoDefinition(params: DefinitionParams): Promise<Location[]>;
  complete(params: CompletionParams): Promise<CompletionList>;
  findReferences(params: ReferenceParams): Promise<Location[]>;
  findDocumentHighlight(params: DocumentHighlightParams): Promise<DocumentHighlight[]>;
  prepareRename(params: PrepareRenameParams): Promise<Range | undefined>;
  rename(params: RenameParams): Promise<WorkspaceEdit>;
  getSemanticTokens(params: SemanticTokensParams): Promise<SemanticToken[]>;
  buildSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens>;
  checkChange(change: TextDocumentChangeEvent<TextDocument>): Promise<void>;
  getFoldingRanges(getFoldingRanges: FoldingRangeParams): Promise<FoldingRange[]>;
  getDocumentSymbols(params: DocumentSymbolParams): Promise<SymbolInformation[]>;
  documentClosed(change: TextDocumentChangeEvent<TextDocument>): void;
  log(message: string, details?: any): void;
}

export interface ServerSourceFile extends SourceFile {
  // Keep track of the open doucment (if any) associated with a source file.
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
  Modifier,
  Comment,
  String,
  Number,
  Regexp,
  Operator,
}

export interface SemanticToken {
  kind: SemanticTokenKind;
  pos: number;
  end: number;
}

interface CachedFile {
  type: "file";
  file: SourceFile;

  // Cache additional data beyond the raw text of the source file. Currently
  // used only for JSON.parse result of package.json.
  data?: any;
}

interface CachedError {
  type: "error";
  error: unknown;
  data?: any;
}

interface KeywordArea {
  root?: boolean;
  namespace?: boolean;
  model?: boolean;
  identifier?: boolean;
}

const serverOptions: CompilerOptions = {
  noEmit: true,
  designTimeBuild: true,
};

const keywords = [
  // Root only
  ["import", { root: true }],

  // Root and namespace
  ["using", { root: true, namespace: true }],
  ["model", { root: true, namespace: true }],
  ["namespace", { root: true, namespace: true }],
  ["interface", { root: true, namespace: true }],
  ["union", { root: true, namespace: true }],
  ["enum", { root: true, namespace: true }],
  ["alias", { root: true, namespace: true }],
  ["op", { root: true, namespace: true }],

  // On model `model Foo <keyword> ...`
  ["extends", { model: true }],
  ["is", { model: true }],

  // On identifier`
  ["true", { identifier: true }],
  ["false", { identifier: true }],
] as const;

export function createServer(host: ServerHost): Server {
  // Remember original URL when we convert it to a local path so that we can
  // get it back. We can't convert it back because things like URL-encoding
  // could give us back an equivalent but non-identical URL but the original
  // URL is used as a key into the opened documents and so we must reproduce
  // it exactly.
  const pathToURLMap: Map<string, string> = new Map();

  // Cache all file I/O. Only open documents are sent over the LSP pipe. When
  // the compiler reads a file that isn't open, we use this cache to avoid
  // hitting the disk. Entries are invalidated when LSP client notifies us of
  // a file change.
  const fileSystemCache = createFileSystemCache();
  const compilerHost = createCompilerHost();

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
    initialize,
    initialized,
    workspaceFoldersChanged,
    watchedFilesChanged,
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
      documentSymbolProvider: true,
      documentHighlightProvider: true,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [".", "@", "/"],
        allCommitCharacters: [".", ",", ";", "("],
      },
      semanticTokensProvider: {
        full: true,
        legend: tokenLegend,
      },
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
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
    } else if (params.rootUri) {
      workspaceFolders = [
        {
          name: "<root>",
          uri: params.rootUri,
          path: ensureTrailingDirectorySeparator(await fileURLToRealPath(params.rootUri)),
        },
      ];
    } else if (params.rootPath) {
      workspaceFolders = [
        {
          name: "<root>",
          uri: compilerHost.pathToFileURL(params.rootPath),
          path: ensureTrailingDirectorySeparator(
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
    script: CadlScriptNode
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
    const config = await loadCadlConfigForPath(compilerHost, mainFile);

    const options = {
      ...serverOptions,
      emitters: config.emitters,
    };

    if (!upToDate(document)) {
      return undefined;
    }

    let program: Program;
    try {
      program = await createProgram(compilerHost, mainFile, options);
      if (!upToDate(document)) {
        return undefined;
      }

      if (mainFile !== path && !program.sourceFiles.has(path)) {
        // If the file that changed wasn't imported by anything from the main
        // file, retry using the file itself as the main file.
        program = await createProgram(compilerHost, path, options);
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
      host.sendDiagnostics({
        uri: document.uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: Range.create(0, 0, 0, 0),
            message:
              `Internal compiler error!\nFile issue at https://github.com/microsoft/cadl\n\n` +
              err.stack,
          },
        ],
      });

      return undefined;
    }
  }

  async function getFoldingRanges(params: FoldingRangeParams): Promise<FoldingRange[]> {
    const file = await compilerHost.readFile(await getPath(params.textDocument));
    const ast = parse(file, { comments: true });
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

  function getSymbolNameAndKind(node: Node): { name: string; kind: SymbolKind } | undefined {
    switch (node.kind) {
      case SyntaxKind.NamespaceStatement:
        return { name: node.id.sv, kind: SymbolKind.Namespace };
      case SyntaxKind.CadlScript:
        return { name: node.id.sv, kind: SymbolKind.File };
      case SyntaxKind.EnumStatement:
        return { name: node.id.sv, kind: SymbolKind.Enum };
      case SyntaxKind.InterfaceStatement:
        return { name: node.id.sv, kind: SymbolKind.Interface };
      case SyntaxKind.OperationStatement:
        return { name: node.id.sv, kind: SymbolKind.Function };
      case SyntaxKind.ModelStatement:
        return { name: node.id.sv, kind: SymbolKind.Struct };
      case SyntaxKind.ModelProperty:
        if (node.id.kind === SyntaxKind.StringLiteral) {
          return { name: node.id.value, kind: SymbolKind.Struct };
        }
        return { name: node.id.sv, kind: SymbolKind.Struct };
      case SyntaxKind.UnionStatement:
        return { name: node.id.sv, kind: SymbolKind.Enum };
      default:
        return undefined;
    }
  }

  async function getDocumentSymbols(params: DocumentSymbolParams): Promise<SymbolInformation[]> {
    const file = await compilerHost.readFile(await getPath(params.textDocument));
    const ast = parse(file);
    const symbols: SymbolInformation[] = [];
    visitChildren(ast, addSymbolsForNode);

    function addSymbolsForNode(node: Node) {
      const symbolNode = getSymbolNameAndKind(node);
      if (symbolNode !== undefined) {
        const start = file.getLineAndCharacterOfPosition(node.pos);
        const end = file.getLineAndCharacterOfPosition(node.end);
        symbols.push({
          name: symbolNode.name,
          kind: symbolNode.kind,
          location: Location.create(params.textDocument.uri, Range.create(start, end)),
        });
      }
      visitChildren(node, addSymbolsForNode);
    }
    return symbols;
  }

  async function findDocumentHighlight(
    params: DocumentHighlightParams
  ): Promise<DocumentHighlight[]> {
    const file = await compilerHost.readFile(await getPath(params.textDocument));
    const identifiers = await compile(params.textDocument, (program, document, file) =>
      findReferenceIdentifiers(program, file, document.offsetAt(params.position), false)
    );
    if (identifiers === undefined) {
      return [];
    }
    return identifiers.map((identifier) => {
      const start = file.getLineAndCharacterOfPosition(identifier.pos);
      const end = file.getLineAndCharacterOfPosition(identifier.end);
      return {
        range: Range.create(start, end),
        kind: DocumentHighlightKind.Read,
      };
    });
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

      const location = getSourceLocation(each.target);
      if (location?.file) {
        document = (location.file as ServerSourceFile).document;
      } else {
        // https://github.com/Microsoft/language-server-protocol/issues/256
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
      const diagnostic = VSDiagnostic.create(range, each.message, severity, each.code, "Cadl");
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

  async function gotoDefinition(params: DefinitionParams): Promise<Location[]> {
    const sym = await compile(params.textDocument, (program, document, file) => {
      const id = getNodeAtPosition(file, document.offsetAt(params.position));
      return id?.kind == SyntaxKind.Identifier ? program.checker.resolveIdentifier(id) : undefined;
    });

    return getLocations(sym?.declarations);
  }

  async function complete(params: CompletionParams): Promise<CompletionList> {
    const completions: CompletionList = {
      isIncomplete: false,
      items: [],
    };
    await compile(params.textDocument, async (program, document, file) => {
      const node = getNodeAtPosition(file, document.offsetAt(params.position));
      if (node === undefined) {
        addKeywordCompletion("root", completions);
      } else {
        switch (node.kind) {
          case SyntaxKind.NamespaceStatement:
            addKeywordCompletion("namespace", completions);
            break;
          case SyntaxKind.Identifier:
            addIdentifierCompletion(program, node, completions);
            break;
          case SyntaxKind.StringLiteral:
            if (node.parent && node.parent.kind === SyntaxKind.ImportStatement) {
              await addImportCompletion(program, document, completions, node);
            }
            break;
        }
      }
    });

    return completions;
  }

  async function findReferences(params: ReferenceParams): Promise<Location[]> {
    const identifiers = await compile(params.textDocument, (program, document, file) =>
      findReferenceIdentifiers(program, file, document.offsetAt(params.position), true)
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
        document.offsetAt(params.position),
        true
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

  function addReferenceIdentifiers(
    program: Program,
    file: CadlScriptNode,
    sym: Sym,
    references: IdentifierNode[]
  ) {
    visitChildren(file, function visit(node) {
      if (node.kind === SyntaxKind.Identifier) {
        const s = program.checker.resolveIdentifier(node);
        if (s === sym || (sym.type && s?.type === sym.type)) {
          references.push(node);
        }
      }
      visitChildren(node, visit);
    });
  }

  function findReferenceIdentifiers(
    program: Program,
    file: CadlScriptNode,
    pos: number,
    wholeProgram: boolean
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
    if (wholeProgram) {
      for (const script of program.sourceFiles.values() ?? []) {
        addReferenceIdentifiers(program, script, sym, references);
      }
    } else {
      addReferenceIdentifiers(program, file, sym, references);
    }
    return references;
  }

  function addKeywordCompletion(area: keyof KeywordArea, completions: CompletionList) {
    const filteredKeywords = keywords.filter(([_, x]) => area in x);
    for (const [keyword] of filteredKeywords) {
      completions.items.push({
        label: keyword,
        kind: CompletionItemKind.Keyword,
      });
    }
  }

  async function addLibraryImportCompletion(
    program: Program,
    document: TextDocument,
    completions: CompletionList
  ) {
    const documentPath = await getPath(document);
    const projectRoot = await findProjectRoot(compilerHost, documentPath);
    if (projectRoot != undefined) {
      const [packagejson] = await loadFile(
        compilerHost,
        resolvePath(projectRoot, "package.json"),
        JSON.parse,
        program.reportDiagnostic
      );
      let dependencies: string[] = [];
      if (packagejson.dependencies != undefined) {
        dependencies = dependencies.concat(Object.keys(packagejson.dependencies));
      }
      if (packagejson.peerDependencies != undefined) {
        dependencies = dependencies.concat(Object.keys(packagejson.peerDependencies));
      }
      for (const dependency of dependencies) {
        const nodeProjectRoot = resolvePath(projectRoot, "node_modules", dependency);
        const [libPackageJson] = await loadFile(
          compilerHost,
          resolvePath(nodeProjectRoot, "package.json"),
          JSON.parse,
          program.reportDiagnostic
        );
        if (libPackageJson.cadlMain != undefined) {
          completions.items.push({
            label: dependency,
            commitCharacters: [],
            kind: CompletionItemKind.Module,
          });
        }
      }
    }
  }

  async function addImportCompletion(
    program: Program,
    document: TextDocument,
    completions: CompletionList,
    node: StringLiteralNode
  ) {
    if (node.value.startsWith("./") || node.value.startsWith("../")) {
      await addRelativePathCompletion(program, document, completions, node);
    } else if (!node.value.startsWith(".")) {
      await addLibraryImportCompletion(program, document, completions);
    }
  }

  async function addRelativePathCompletion(
    program: Program,
    document: TextDocument,
    completions: CompletionList,
    node: StringLiteralNode
  ) {
    const documentPath = await getPath(document);
    const documentFile = getBaseFileName(documentPath);
    const documentDir = getDirectoryPath(documentPath);
    const nodevalueDir = hasTrailingDirectorySeparator(node.value)
      ? node.value
      : getDirectoryPath(node.value);
    const mainCadl = resolvePath(documentDir, nodevalueDir);
    const files = (await program.host.readDir(mainCadl)).filter(
      (x) => x !== documentFile && x !== "node_modules"
    );
    for (const file of files) {
      const extension = getAnyExtensionFromPath(file);
      switch (extension) {
        case ".cadl":
        case ".js":
        case ".mjs":
          completions.items.push({
            label: file,
            commitCharacters: [],
            kind: CompletionItemKind.File,
          });
          break;
        case "":
          completions.items.push({
            label: file,
            commitCharacters: [],
            kind: CompletionItemKind.Folder,
          });
          break;
      }
    }
  }

  /**
   * Add completion options for an identifier.
   */
  function addIdentifierCompletion(
    program: Program,
    node: IdentifierNode,
    completions: CompletionList
  ) {
    const result = program.checker.resolveCompletions(node);
    if (result.size === 0) {
      return;
    }
    for (const [key, { sym, label }] of result) {
      let documentation: string | undefined;
      let kind: CompletionItemKind;
      let deprecated = false;
      if (sym.flags & (SymbolFlags.Function | SymbolFlags.Decorator)) {
        kind = CompletionItemKind.Function;
      } else if (
        sym.flags & SymbolFlags.Namespace &&
        sym.declarations[0].kind !== SyntaxKind.NamespaceStatement
      ) {
        kind = CompletionItemKind.Module;
      } else {
        const type = sym.type ?? program.checker.getTypeForNode(sym.declarations[0]);
        documentation = getDoc(program, type);
        kind = getCompletionItemKind(program, type);
        deprecated = isDeprecated(program, type);
      }
      const item: CompletionItem = {
        label: label ?? key,
        documentation,
        kind,
        insertText: key,
      };
      if (deprecated) {
        item.tags = [CompletionItemTag.Deprecated];
      }
      completions.items.push(item);
    }

    if (node.parent?.kind === SyntaxKind.TypeReference) {
      addKeywordCompletion("identifier", completions);
    }
  }

  function getCompletionItemKind(program: Program, target: Type): CompletionItemKind {
    switch (target.node?.kind) {
      case SyntaxKind.EnumStatement:
      case SyntaxKind.UnionStatement:
        return CompletionItemKind.Enum;
      case SyntaxKind.EnumMember:
      case SyntaxKind.UnionVariant:
        return CompletionItemKind.EnumMember;
      case SyntaxKind.AliasStatement:
        return CompletionItemKind.Variable;
      case SyntaxKind.ModelStatement:
        return isIntrinsic(program, target) ? CompletionItemKind.Keyword : CompletionItemKind.Class;
      case SyntaxKind.ModelProperty:
        return CompletionItemKind.Field;
      case SyntaxKind.OperationStatement:
        return CompletionItemKind.Method;
      case SyntaxKind.NamespaceStatement:
        return CompletionItemKind.Module;
      default:
        return CompletionItemKind.Struct;
    }
  }

  async function getSemanticTokens(params: SemanticTokensParams): Promise<SemanticToken[]> {
    const ignore = -1;
    const defer = -2;
    const file = await compilerHost.readFile(await getPath(params.textDocument));
    const tokens = mapTokens();
    const ast = parse(file);
    classifyNode(ast);
    return Array.from(tokens.values()).filter((t) => t.kind !== undefined);

    function mapTokens() {
      const tokens = new Map<number, SemanticToken>();
      const scanner = createScanner(file, () => {});

      while (scanner.scan() !== Token.EndOfFile) {
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
      return tokens;
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
          classify(node.id, SemanticTokenKind.Property);
          break;
        case SyntaxKind.AliasStatement:
          classify(node.id, SemanticTokenKind.Struct);
          break;
        case SyntaxKind.ModelStatement:
          classify(node.id, SemanticTokenKind.Struct);
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
        case SyntaxKind.DecoratorExpression:
          classifyReference(node.target, SemanticTokenKind.Macro);
          break;
        case SyntaxKind.TypeReference:
          classifyReference(node.target);
          break;
        case SyntaxKind.MemberExpression:
          classifyReference(node);
          break;
      }
      visitChildren(node, classifyNode);
    }

    function classify(node: Node, kind: SemanticTokenKind) {
      const token = tokens.get(node.pos);
      if (token && token.kind === undefined) {
        token.kind = kind;
      }
    }

    function classifyReference(node: Node, kind = SemanticTokenKind.Type) {
      switch (node.kind) {
        case SyntaxKind.MemberExpression:
          classifyIdentifier(node.base, SemanticTokenKind.Namespace);
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

  function getLocations(targets: DiagnosticTarget[] | undefined): Location[] {
    return targets?.map(getLocation).filter((x): x is Location => !!x) ?? [];
  }

  function getLocation(target: DiagnosticTarget): Location | undefined {
    const location = getSourceLocation(target);
    if (location.isSynthetic) {
      return undefined;
    }

    const start = location.file.getLineAndCharacterOfPosition(location.pos);
    const end = location.file.getLineAndCharacterOfPosition(location.end);
    return {
      uri: getURL(location.file.path),
      range: Range.create(start, end),
    };
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
   * Walk directory structure upwards looking for package.json with cadlMain or
   * main.cadl file. Stop search when reaching a workspace root. If a root is
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

    while (inWorkspace(dir)) {
      let mainFile = "main.cadl";
      let pkg: any;
      const pkgPath = joinPaths(dir, "package.json");
      const cached = (await fileSystemCache.get(pkgPath))?.data;

      if (cached) {
        pkg = cached;
      } else {
        [pkg] = await loadFile(
          compilerHost,
          pkgPath,
          JSON.parse,
          logMainFileSearchDiagnostic,
          options
        );
        (await fileSystemCache.get(pkgPath))!.data = pkg ?? {};
      }

      if (typeof pkg?.cadlMain === "string") {
        mainFile = pkg.cadlMain;
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

      dir = getDirectoryPath(dir);
    }

    return path;

    function logMainFileSearchDiagnostic(diagnostic: CadlDiagnostic) {
      log(
        `Unexpected diagnostic while looking for main file of ${path}`,
        formatDiagnostic(diagnostic)
      );
    }
  }

  function inWorkspace(path: string) {
    path = ensureTrailingDirectorySeparator(path);
    return workspaceFolders.some((f) => path.startsWith(f.path));
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
      notify(changes: FileEvent[]) {
        changes.push(...changes);
      },
    };
  }

  function createCompilerHost(): CompilerHost {
    const base = host.compilerHost;
    return {
      ...base,
      readFile,
      stat,
      getSourceFileKind,
    };

    async function readFile(path: string): Promise<ServerSourceFile> {
      // Try open files sent from client over LSP
      const document = getOpenDocument(path);
      if (document) {
        return {
          document,
          ...createSourceFile(document.getText(), path),
        };
      }

      // Try file system cache
      const cached = await fileSystemCache.get(path);
      if (cached) {
        if (cached.type === "error") {
          throw cached.error;
        }
        return cached.file;
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
      if (document?.languageId === "cadl") {
        return "cadl";
      }
      return getSourceFileKindFromExt(path);
    }
  }
}
