import { adlVersion } from "../compiler/util.js";
import { Diagnostic as ADLDiagnostic, DiagnosticError } from "../compiler/diagnostics.js";
import { createSourceFile } from "../compiler/scanner.js";
import { parse } from "../compiler/parser.js";
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

let connection: Connection;
let documents: TextDocuments<TextDocument>;
main();

function main() {
  log(`** ADL Language Server v${adlVersion} **`);
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
  const parseDiagnostics = getParseDiagnostics(document);
  const diagnostics: Diagnostic[] = [];

  for (const each of parseDiagnostics) {
    const start = document.positionAt(each.pos);
    const end = document.positionAt(each.end);
    const range = Range.create(start, end);
    const severity = convertSeverity(each.severity);
    const diagnostic = Diagnostic.create(range, each.message, severity, "ADL");
    diagnostics.push(diagnostic);
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

function getParseDiagnostics(document: TextDocument): readonly ADLDiagnostic[] {
  try {
    const sourceFile = createSourceFile(document.getText(), document.uri);
    parse(sourceFile);
  } catch (err) {
    if (err instanceof DiagnosticError) {
      return err.diagnostics;
    }
  }

  return [];
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
