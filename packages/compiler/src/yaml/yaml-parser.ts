import { YAMLError, parseDocument } from "yaml";
import { createDiagnosticCollector, createSourceFile } from "../core/diagnostics.js";
import { Diagnostic, DiagnosticSeverity, SourceFile } from "../core/types.js";
import { YamlScript } from "./types.js";

export function parseYaml(source: string | SourceFile): [YamlScript, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;

  const doc = parseDocument(file.text);
  for (const error of doc.errors) {
    diagnostics.add(convertYamlErrorToDiagnostic("error", error, file));
  }
  for (const warning of doc.warnings) {
    diagnostics.add(convertYamlErrorToDiagnostic("warning", warning, file));
  }
  console.log("Doc", doc);
  return diagnostics.wrap({
    kind: "yaml-script",
    file,
    value: doc.toJSON(),
    doc,
  });
}

function convertYamlErrorToDiagnostic(
  severity: DiagnosticSeverity,
  error: YAMLError,
  file: SourceFile
): Diagnostic {
  return {
    code: `yaml-${error.code.toLowerCase().replace(/_/g, "-")}`,
    message: error.message,
    severity,
    target: { file, pos: error.pos[0], end: error.pos[1] },
  };
}
