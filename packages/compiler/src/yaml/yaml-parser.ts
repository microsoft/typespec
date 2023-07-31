import { parseDocument } from "yaml";
import { createDiagnosticCollector, createSourceFile } from "../core/diagnostics.js";
import { Diagnostic, SourceFile } from "../core/types.js";
import { YamlScript } from "./types.js";

export function parseYaml(source: string | SourceFile): [YamlScript, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;

  const doc = parseDocument(file.text);

  return diagnostics.wrap({
    kind: "yaml-script",
    file,
    value: doc.toJSON(),
    doc,
  });
}
