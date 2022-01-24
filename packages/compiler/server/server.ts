import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  createConnection,
  ProposedFeatures,
  PublishDiagnosticsParams,
  TextDocuments,
} from "vscode-languageserver/node.js";
import { cadlVersion, NodeHost } from "../core/util.js";
import { createServer, Server, ServerHost } from "./serverlib.js";

let server: Server | undefined = undefined;

process.on("unhandledRejection", fatalError);
try {
  main();
} catch (e) {
  fatalError(e);
}

function main() {
  let clientHasWorkspaceFolderCapability = false;
  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const host: ServerHost = {
    compilerHost: NodeHost,
    sendDiagnostics(params: PublishDiagnosticsParams) {
      connection.sendDiagnostics(params);
    },
    log(message: string) {
      connection.console.log(message);
    },
    getDocumentByURL(url: string) {
      return documents.get(url);
    },
  };

  server = createServer(host);
  server.log(`Cadl language server v${cadlVersion}`);
  server.log("Module", fileURLToPath(import.meta.url));
  server.log("Command Line", process.argv);

  connection.onInitialize((params) => {
    if (params.capabilities.workspace?.workspaceFolders) {
      clientHasWorkspaceFolderCapability = true;
    }
    return server!.initialize(params);
  });

  connection.onInitialized((params) => {
    if (clientHasWorkspaceFolderCapability) {
      connection.workspace.onDidChangeWorkspaceFolders(server!.workspaceFoldersChanged);
    }
    server!.initialized(params);
  });

  connection.onDidChangeWatchedFiles(server.watchedFilesChanged);
  connection.onDefinition(server.gotoDefinition);
  connection.onCompletion(server.complete);
  documents.onDidChangeContent(server.checkChange);
  documents.onDidClose(server.documentClosed);

  documents.listen(connection);
  connection.listen();
}

function fatalError(e: any) {
  // If we failed to send any log messages over LSP pipe, send them to
  // stderr before exiting.
  for (const pending of server?.pendingMessages ?? []) {
    console.error(pending);
  }
  console.error(e);
  process.exit(1);
}
