import { YAMLError, parseDocument } from "yaml";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { createSourceFile } from "../core/source-file.js";
import { Diagnostic, DiagnosticSeverity, SourceFile } from "../core/types.js";
import { YamlScript } from "./types.js";

export function parseYaml(source: string | SourceFile): [YamlScript, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;

  const doc = parseDocument(file.text, {
    prettyErrors: false, // We are handling the error display ourself to be consistent in the style.
  });
  for (const error of doc.errors) {
    diagnostics.add(convertYamlErrorToDiagnostic("error", error, file));
  }
  for (const warning of doc.warnings) {
    diagnostics.add(convertYamlErrorToDiagnostic("warning", warning, file));
  }
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
  file: SourceFile,
): Diagnostic {
  return {
    code: `yaml-${error.code.toLowerCase().replace(/_/g, "-")}`,
    message: error.message,
    severity,
    target: { file, pos: error.pos[0], end: error.pos[1] },
  };
}
