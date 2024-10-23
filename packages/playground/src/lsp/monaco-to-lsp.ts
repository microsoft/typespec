import * as monaco from "monaco-editor";
import type * as lsp from "vscode-languageserver";
import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

function textDocumentForModel(model: monaco.editor.IModel): TextDocument {
  return TextDocument.create(
    model.uri.toString(),
    "typespec",
    model.getVersionId(),
    model.getValue(),
  );
}

function position(pos: monaco.Position): lsp.Position {
  return {
    line: pos.lineNumber - 1,
    character: pos.column - 1,
  };
}

function range(range: monaco.IRange): lsp.Range {
  return Range.create(
    {
      line: range.startLineNumber - 1,
      character: range.startColumn - 1,
    },
    {
      line: range.endLineNumber - 1,
      character: range.endColumn - 1,
    },
  );
}

function severity(severity: monaco.MarkerSeverity): DiagnosticSeverity {
  switch (severity) {
    case monaco.MarkerSeverity.Error:
      return DiagnosticSeverity.Error;
    case monaco.MarkerSeverity.Warning:
      return DiagnosticSeverity.Warning;
    case monaco.MarkerSeverity.Hint:
      return DiagnosticSeverity.Hint;
    case monaco.MarkerSeverity.Info:
      return DiagnosticSeverity.Information;
  }
}

function markerToDiagnostic(marker: monaco.editor.IMarkerData): lsp.Diagnostic {
  return {
    severity: marker.severity ? severity(marker.severity) : DiagnosticSeverity.Error,
    range: range(marker),
    message: marker.message,
    code: typeof marker.code === "string" ? marker.code : marker.code?.value,
    source: marker.source,
    data: marker.relatedInformation,
  };
}

function codeActionContext(context: monaco.languages.CodeActionContext): lsp.CodeActionContext {
  return {
    only: context.only ? [context.only] : undefined,
    triggerKind: context.trigger,
    diagnostics: context.markers.map(markerToDiagnostic),
  };
}
export const MonacoToLsp = {
  textDocumentForModel,
  position,
  range,
  codeActionContext,
} as const;
