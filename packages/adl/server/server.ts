import { fileURLToPath, pathToFileURL } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  InitializedParams,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  Range,
  ServerCapabilities,
  TextDocumentChangeEvent,
  TextDocuments,
  TextDocumentSyncKind,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver/node.js";
import { createSourceFile } from "../compiler/diagnostics.js";
import { parse } from "../compiler/parser.js";
import { adlVersion } from "../compiler/util.js";

let connection: Connection;
let documents: TextDocuments<TextDocument>;
let clientHasWorkspaceFolderCapability = false;
let workspaceFolders: WorkspaceFolder[] = [];
let isInitialized = false;
let pendingMessages: string[] = [];

process.on("unhandledRejection", fatalError);
try {
  main();
} catch (e) {
  fatalError(e);
}

function main() {
  log(`ADL language server v${adlVersion}`);
  log("Module", fileURLToPath(import.meta.url));
  log("Command Line", process.argv);

  connection = createConnection(ProposedFeatures.all);
  documents = new TextDocuments(TextDocument);

  connection.onInitialize(initialize);
  connection.onInitialized(initialized);
  documents.onDidChangeContent(checkChange);
  documents.listen(connection);
  connection.listen();
}

function initialize(params: InitializeParams): InitializeResult {
  const capabilities: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
  };

  if (params.capabilities.workspace?.workspaceFolders) {
    clientHasWorkspaceFolderCapability = true;
    workspaceFolders = params.workspaceFolders ?? [];
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
        uri: params.rootUri?.toString(),
      },
    ];
  } else if (params.rootPath) {
    workspaceFolders = [
      {
        name: "<root>",
        uri: pathToFileURL(params.rootPath).href,
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
    map.set(folder.uri, folder);
  }
  workspaceFolders = Array.from(map.values());
  log("Workspace Folders", workspaceFolders);
}

function checkChange(change: TextDocumentChangeEvent<TextDocument>) {
  const document = change.document;
  const sourceFile = createSourceFile(document.getText(), document.uri);
  const { parseDiagnostics } = parse(sourceFile);
  const diagnostics: Diagnostic[] = [];

  for (const each of parseDiagnostics) {
    const start = document.positionAt(each.pos ?? 0);
    const end = document.positionAt(each.end ?? 0);
    const range = Range.create(start, end);
    const severity = convertSeverity(each.severity);
    const diagnostic = Diagnostic.create(range, each.message, severity, each.code, "ADL");
    diagnostics.push(diagnostic);
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
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
  // If we failed to send any log messages over LSP pipe, send them to stderr before exiting.
  for (const pending of pendingMessages) {
    console.error(pending);
  }
  console.error(e);
  process.exit(1);
}
