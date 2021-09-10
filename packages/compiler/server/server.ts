import { dirname, isAbsolute, join, normalize } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  DefinitionParams,
  Diagnostic as VSDiagnostic,
  DiagnosticSeverity,
  DidChangeWatchedFilesParams,
  InitializedParams,
  InitializeParams,
  InitializeResult,
  Location,
  ProposedFeatures,
  Range,
  ServerCapabilities,
  TextDocumentChangeEvent,
  TextDocumentIdentifier,
  TextDocuments,
  TextDocumentSyncKind,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver/node.js";
import {
  compilerAssert,
  createSourceFile,
  formatDiagnostic,
  getSourceLocation,
} from "../core/diagnostics.js";
import { CompilerOptions } from "../core/options.js";
import { visitChildren } from "../core/parser.js";
import { createProgram, Program } from "../core/program.js";
import {
  CadlScriptNode,
  CompilerHost,
  Diagnostic as CadlDiagnostic,
  Node,
  SourceFile,
  SourceLocation,
  SyntaxKind,
} from "../core/types.js";
import { cadlVersion, doIO, loadFile, NodeHost } from "../core/util.js";

interface ServerSourceFile extends SourceFile {
  // Keep track of the open doucment (if any) associated with a source file.
  readonly document?: TextDocument;
}

interface ServerWorkspaceFolder extends WorkspaceFolder {
  // Remember path to URL conversion for workspace folders.
  path: string;
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

const serverHost: CompilerHost = {
  ...NodeHost,
  resolveAbsolutePath,
  readFile,
  stat,
};

const serverOptions: CompilerOptions = {
  noEmit: true,
  designTimeBuild: true,
};

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
const fileSystemCache = new Map<string, CachedFile | CachedError>();

let connection: Connection;
let documents: TextDocuments<TextDocument>;
let clientHasWorkspaceFolderCapability = false;
let workspaceFolders: ServerWorkspaceFolder[] = [];
let isInitialized = false;
let pendingMessages: string[] = [];

process.on("unhandledRejection", fatalError);
try {
  main();
} catch (e) {
  fatalError(e);
}

function main() {
  log(`Cadl language server v${cadlVersion}`);
  log("Module", fileURLToPath(import.meta.url));
  log("Command Line", process.argv);

  connection = createConnection(ProposedFeatures.all);
  documents = new TextDocuments(TextDocument);

  connection.onInitialize(initialize);
  connection.onInitialized(initialized);
  connection.onDidChangeWatchedFiles(watchedFilesChanged);
  documents.onDidChangeContent(checkChange);
  connection.onDefinition(gotoDefinition);
  documents.onDidClose(documentClosed);
  documents.listen(connection);
  connection.listen();
}

function initialize(params: InitializeParams): InitializeResult {
  const capabilities: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    definitionProvider: true,
  };

  if (params.capabilities.workspace?.workspaceFolders) {
    clientHasWorkspaceFolderCapability = true;
    workspaceFolders =
      params.workspaceFolders?.map((w) => ({ ...w, path: fileURLToPath(w.uri) })) ?? [];
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
        path: fileURLToPath(params.rootUri),
      },
    ];
  } else if (params.rootPath) {
    workspaceFolders = [
      {
        name: "<root>",
        uri: pathToFileURL(params.rootPath).href,
        path: params.rootPath,
      },
    ];
  }

  log("Workspace Folders", workspaceFolders);
  return { capabilities };
}

function initialized(params: InitializedParams): void {
  if (clientHasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(workspaceFoldersChanged);
  }
  isInitialized = true;
  log("Initialization complete.");
}

function workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent) {
  log("Workspace Folders Changed", e);
  const map = new Map(workspaceFolders.map((f) => [f.uri, f]));
  for (const folder of e.removed) {
    map.delete(folder.uri);
  }
  for (const folder of e.added) {
    map.set(folder.uri, { ...folder, path: fileURLToPath(folder.uri) });
  }
  workspaceFolders = Array.from(map.values());
  log("Workspace Folders", workspaceFolders);
}

function watchedFilesChanged(params: DidChangeWatchedFilesParams) {
  // remove stale file system cache entries on file change notification
  for (const each of params.changes) {
    if (each.uri.startsWith("file:")) {
      const path = fileURLToPath(each.uri);
      fileSystemCache.delete(path);
    }
  }
}

async function compile(
  document: TextDocument | TextDocumentIdentifier
): Promise<Program | undefined> {
  const path = getPath(document);
  const mainFile = await getMainFileForDocument(path);
  if (!upToDate(document)) {
    return undefined;
  }

  let program = await createProgram(serverHost, mainFile, serverOptions);
  if (!upToDate(document)) {
    return undefined;
  }

  if (mainFile !== path && !program.sourceFiles.has(path)) {
    // If the file that changed wasn't imported by anything from the main
    // file, retry using the file itself as the main file.
    program = await createProgram(serverHost, path, serverOptions);
  }

  if (!upToDate(document)) {
    return undefined;
  }

  return program;
}

async function checkChange(change: TextDocumentChangeEvent<TextDocument>) {
  const program = await compile(change.document);
  if (!program) {
    return;
  }

  // Group diagnostics by file.
  //
  // Initialize diagnostics for all source files in program to empty array
  // aw we must send an empty array when a file has no diagnostics or else
  // stale diagnostics from a previous run will stick around in the IDE.
  //
  const diagnosticMap: Map<TextDocument, VSDiagnostic[]> = new Map();
  for (const each of program.sourceFiles.values()) {
    const document = (each.file as ServerSourceFile)?.document;
    if (document) {
      diagnosticMap.set(document, []);
    }
  }

  for (const each of program.diagnostics) {
    const document = (each?.file as ServerSourceFile)?.document;
    if (!document || !upToDate(document)) {
      continue;
    }
    const start = document.positionAt(each.pos ?? 0);
    const end = document.positionAt(each.end ?? 0);
    const range = Range.create(start, end);
    const severity = convertSeverity(each.severity);
    const diagnostic = VSDiagnostic.create(range, each.message, severity, each.code, "Cadl");
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

async function gotoDefinition(params: DefinitionParams): Promise<Location | undefined> {
  const path = getPath(params.textDocument);
  const mainFile = await getMainFileForDocument(path);
  const program = await createProgram(serverHost, mainFile, serverOptions);

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return undefined;
  }

  const file = program.sourceFiles.get(path);
  if (!file) {
    return undefined;
  }

  const referringNode = getTypeReferenceNodeAtPosition(file, document.offsetAt(params.position));
  if (!referringNode) {
    return undefined;
  }

  const definingNode = program.checker?.getTypeForNode(referringNode)?.node;
  if (!definingNode) {
    return undefined;
  }

  const definingLocation = getSourceLocation(definingNode);
  return convertSourceLocation(definingLocation);
}

function documentClosed(change: TextDocumentChangeEvent<TextDocument>) {
  // clear diagnostics on file close
  sendDiagnostics(change.document, []);
}

function getTypeReferenceNodeAtPosition(file: CadlScriptNode, position: number) {
  return visit(file);

  function visit(node: Node): Node | undefined {
    if (node.pos <= position && position < node.end) {
      // We only need to recursively visit children of nodes that satisfied
      // the condition above and therefore contain the given position. If a
      // node does not contain a position, then neither do its children.
      const child = visitChildren(node, visit);

      // A child match here is better than a self-match below as we want the
      // deepest (most specific) node. In other words, the search is depth
      // first. For example, consider `A<B<C>>`: If the cursor is on `B`,
      // then prefer B<C> over A<B<C>>.
      if (child) {
        return child;
      }

      if (node.kind === SyntaxKind.TypeReference) {
        return node;
      }
    }

    return undefined;
  }
}

function convertSourceLocation(location: SourceLocation): Location {
  const start = location.file.getLineAndCharacterOfPosition(location.pos);
  const end = location.file.getLineAndCharacterOfPosition(location.end);
  return {
    uri: getURL(location.file.path),
    range: Range.create(start, end),
  };
}

function convertSeverity(severity: "warning" | "error" | "info"): DiagnosticSeverity {
  switch (severity) {
    case "warning":
      return DiagnosticSeverity.Warning;
    case "error":
      return DiagnosticSeverity.Error;
    case "info":
      return DiagnosticSeverity.Information;
  }
}

function log(message: string, details: any = undefined) {
  if (details) {
    message += ": " + JSON.stringify(details, undefined, 2);
  }

  if (!isInitialized) {
    pendingMessages.push(message);
    return;
  }

  for (const pending of pendingMessages) {
    connection.console.log(pending);
  }

  pendingMessages = [];
  connection.console.log(message);
}

function fatalError(e: any) {
  // If we failed to send any log messages over LSP pipe, send them to
  // stderr before exiting.
  for (const pending of pendingMessages) {
    console.error(pending);
  }
  console.error(e);
  process.exit(1);
}

function sendDiagnostics(document: TextDocument, diagnostics: VSDiagnostic[]) {
  connection.sendDiagnostics({
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
  return document.version === documents.get(document.uri)?.version;
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

  let dir = dirname(path);
  const options = { allowFileNotFound: true };

  while (inWorkspace(dir)) {
    let mainFile = "main.cadl";
    let pkg: any;
    const pkgPath = join(dir, "package.json");
    const cached = fileSystemCache.get(pkgPath)?.data;

    if (cached) {
      pkg = cached;
    } else {
      [pkg] = await loadFile(serverHost, pkgPath, JSON.parse, logMainFileSearchDiagnostic, options);
      fileSystemCache.get(pkgPath)!.data = pkg ?? {};
    }

    if (typeof pkg?.cadlMain === "string") {
      mainFile = pkg.cadlMain;
    }

    const candidate = join(dir, mainFile);
    const stat = await doIO(
      () => serverHost.stat(candidate),
      candidate,
      logMainFileSearchDiagnostic,
      options
    );

    if (stat?.isFile()) {
      return candidate;
    }

    dir = dirname(dir);
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
  return workspaceFolders.some((f) => path.startsWith(f.path));
}

function getPath(document: TextDocument | TextDocumentIdentifier) {
  if (isUntitled(document.uri)) {
    return document.uri;
  }
  const path = fileURLToPath(document.uri);
  pathToURLMap.set(path, document.uri);
  return path;
}

function getURL(path: string) {
  if (isUntitled(path)) {
    return path;
  }
  return pathToURLMap.get(path) ?? pathToFileURL(path).href;
}

function isUntitled(pathOrUrl: string) {
  return pathOrUrl.startsWith("untitled:");
}

function getDocument(path: string) {
  const url = getURL(path);
  return url ? documents.get(url) : undefined;
}

function resolveAbsolutePath(path: string): string {
  if (isUntitled(path)) {
    return path;
  }
  compilerAssert(isAbsolute(path), "Cannot use relative path in language server");
  return normalize(path);
}

async function readFile(path: string): Promise<ServerSourceFile> {
  // Try open files sent from client over LSP
  const document = getDocument(path);
  if (document) {
    return {
      document,
      ...createSourceFile(document.getText(), path),
    };
  }

  // Try file system cache
  const cached = fileSystemCache.get(path);
  if (cached) {
    if (cached.type === "error") {
      throw cached.error;
    }
    return cached.file;
  }

  // Hit the disk and cache
  try {
    const file = await NodeHost.readFile(path);
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
  if (getDocument(path) || fileSystemCache.has(path)) {
    return {
      isFile() {
        return true;
      },
      isDirectory() {
        return false;
      },
    };
  }
  return await NodeHost.stat(path);
}
