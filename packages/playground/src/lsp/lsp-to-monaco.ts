import * as monaco from "monaco-editor";
import type * as lsp from "vscode-languageserver";
import { DiagnosticSeverity } from "vscode-languageserver";

function range(range: lsp.Range): monaco.IRange {
  return {
    startColumn: range.start.character + 1,
    startLineNumber: range.start.line + 1,
    endColumn: range.end.character + 1,
    endLineNumber: range.end.line + 1,
  };
}

function foldingRange(range: lsp.FoldingRange): monaco.languages.FoldingRange {
  return {
    start: range.startLine + 1,
    end: range.endLine + 1,
    kind: range.kind ? new monaco.languages.FoldingRangeKind(range.kind) : undefined,
  };
}

function textEdits(edit: lsp.TextEdit[]): monaco.languages.TextEdit[] {
  return edit.map(textEdit);
}

function textEdit(edit: lsp.TextEdit): monaco.languages.TextEdit {
  return {
    range: range(edit.range),
    text: edit.newText,
  };
}

function signatureHelp(help: lsp.SignatureHelp | undefined): monaco.languages.SignatureHelp {
  return {
    signatures:
      help?.signatures.map((x) => ({
        ...x,
        parameters: x.parameters ?? [],
      })) ?? [],
    activeSignature: help?.activeSignature ?? 0,
    activeParameter: help?.activeParameter ?? 0,
  };
}

function command(command: lsp.Command): monaco.languages.Command {
  return {
    id: command.command,
    title: command.title,
    arguments: command.arguments,
  };
}

function severity(severity: lsp.DiagnosticSeverity): monaco.MarkerSeverity {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return monaco.MarkerSeverity.Error;
    case DiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;
    case DiagnosticSeverity.Hint:
      return monaco.MarkerSeverity.Hint;
    case DiagnosticSeverity.Information:
      return monaco.MarkerSeverity.Info;
  }
}

function diagnostic(diagnostic: lsp.Diagnostic): monaco.editor.IMarkerData {
  return {
    severity: diagnostic.severity ? severity(diagnostic.severity) : monaco.MarkerSeverity.Error,
    message: diagnostic.message,
    code: diagnostic.code?.toString(),
    source: diagnostic.source,
    startLineNumber: diagnostic.range.start.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    endColumn: diagnostic.range.end.character + 1,
  };
}

function codeAction(action: lsp.CodeAction): monaco.languages.CodeAction {
  return {
    title: action.title,
    kind: action.kind,
    diagnostics: action.diagnostics?.map(diagnostic),
    command: action.command && command(action.command),
  };
}

export const LspToMonaco = {
  range,
  foldingRange,
  textEdits,
  textEdit,
  signatureHelp,
  codeAction,
  command,
} as const;
