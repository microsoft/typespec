import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  Range,
  TextDocumentChangeEvent,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node.js";
import { createSourceFile } from "../compiler/diagnostics.js";
import { parse } from "../compiler/parser.js";
import { adlVersion } from "../compiler/util.js";

let connection: Connection;
let documents: TextDocuments<TextDocument>;
main();

function main() {
  log(`ADL language server v${adlVersion}\n`);
  log(`Module: ${fileURLToPath(import.meta.url)}`);
  log(`Command Line: ${JSON.stringify(process.argv)}`);

  connection = createConnection(ProposedFeatures.all);
  documents = new TextDocuments(TextDocument);

  connection.onInitialize(initialize);
  documents.onDidChangeContent(checkChange);
  documents.listen(connection);
  connection.listen();
}

function initialize(params: InitializeParams): InitializeResult {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
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

function log(...args: any[]) {
  // NB: We must log to stderr because stdin/out are used as the LSP pipe.
  console.error(...args);
}
