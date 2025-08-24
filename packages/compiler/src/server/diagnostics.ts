import {
  DiagnosticRelatedInformation,
  DocumentDiagnosticReportKind,
  PreviousResultId,
  Range,
  TextDocumentIdentifier,
  Diagnostic as VSDiagnostic,
  WorkspaceDocumentDiagnosticReport,
} from "vscode-languageserver";
import type { Position, TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node.js";
import {
  getDiagnosticTemplateInstantitationTrace,
  getSourceLocation,
} from "../core/diagnostics.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import type { Program } from "../core/program.js";
import type { Node, SourceLocation } from "../core/types.js";
import { Diagnostic } from "../core/types.js";
import { isDefined, md5 } from "../utils/misc.js";
import type { FileService } from "./file-service.js";
import type { ServerSourceFile } from "./types.js";

export function createWorkspaceDocumentDiagnosticReport(
  doc: TextDocument | TextDocumentIdentifier,
  diagnostics: VSDiagnostic[],
  previousResultIds: PreviousResultId[],
): WorkspaceDocumentDiagnosticReport {
  const newResultId = createDiagnosticsResultId(diagnostics);
  const found = previousResultIds.find((p) => p.uri === doc.uri && p.value === newResultId);
  if (found) {
    const r: WorkspaceDocumentDiagnosticReport = {
      kind: DocumentDiagnosticReportKind.Unchanged,
      resultId: newResultId,
      uri: doc.uri,
      version: "version" in doc ? doc.version : null,
    };
    return r;
  } else {
    const r: WorkspaceDocumentDiagnosticReport = {
      kind: DocumentDiagnosticReportKind.Full,
      resultId: newResultId,
      uri: doc.uri,
      items: diagnostics,
      version: "version" in doc ? doc.version : null,
    };
    return r;
  }
}

export function createDiagnosticsResultId(diagnostics: VSDiagnostic[]): string {
  const arr = diagnostics.map(createDiagnosticHash).sort();
  const all = arr.join("||");
  return md5(all);
}

function createDiagnosticHash(diagnostic: VSDiagnostic): string {
  const posToString = (pos: Position) => `(${pos.line},${pos.character})`;
  const base = [
    diagnostic.code ?? "no-code",
    diagnostic.source ?? "no-source",
    diagnostic.severity ?? "no-severity",
    diagnostic.message,
    `${posToString(diagnostic.range.start)}->${posToString(diagnostic.range.end)}`,
  ].join("##");
  const relatedArray = [];
  if (diagnostic.relatedInformation) {
    for (const info of diagnostic.relatedInformation) {
      const related = [
        info.message,
        info.location.uri,
        `${posToString(info.location.range.start)}->${posToString(info.location.range.end)}`,
      ].join("##");
      relatedArray.push(related);
    }
  }
  if (relatedArray.length > 0) {
    return `${base}|${relatedArray.sort().join("|")}`;
  } else {
    return base;
  }
}

/** Convert TypeSpec Diagnostic to Lsp diagnostic. Each TypeSpec diagnostic could produce multiple lsp ones when it involve multiple locations. */
export function convertDiagnosticToLsp(
  fileService: FileService,
  program: Program,
  document: TextDocument,
  diagnostic: Diagnostic,
): [VSDiagnostic, TextDocument | TextDocumentIdentifier][] {
  const root = getVSLocation(getSourceLocation(diagnostic.target, { locateId: true }), document);
  if (root === undefined) {
    return [];
  }
  if ("version" in root.document && !fileService.upToDate(root.document)) {
    return [];
  }

  const instantiationNodes = getDiagnosticTemplateInstantitationTrace(diagnostic.target);
  const relatedInformation: DiagnosticRelatedInformation[] = [];
  const relatedDiagnostics: [VSDiagnostic, TextDocument | TextDocumentIdentifier][] = [];
  if (instantiationNodes.length > 0) {
    const items = instantiationNodes
      .map((node) => getVSLocationWithTypeInfo(program, node, document))
      .filter(isDefined);

    for (const location of items) {
      relatedInformation.push({
        location: { uri: location.document.uri, range: location.range },
        message: `in instantiation of template \`${location.typeName}\``,
      });
    }

    const [last, ...rest] = [...items].reverse();

    if (last) {
      relatedDiagnostics.push([
        createLspDiagnostic({
          range: last.range,
          message: `In instantiation of this template:`,
          severity: DiagnosticSeverity.Warning,
          code: diagnostic.code,
          relatedInformation: [
            ...rest.map((location) => ({
              location: { uri: location.document.uri, range: location.range },
              message: `in instantiation of template \`${location.typeName}\``,
            })),
            {
              location: { uri: root.document.uri, range: root.range },
              message: diagnostic.message,
            },
          ],
        }),
        last.document,
      ]);
    }
  }
  const rootDiagnostic: [VSDiagnostic, TextDocument | TextDocumentIdentifier] = [
    createLspDiagnostic({
      range: root.range,
      message: diagnostic.message,
      severity: convertSeverity(diagnostic.severity),
      code: diagnostic.code,
      relatedInformation,
    }),
    root.document,
  ];
  return [rootDiagnostic, ...relatedDiagnostics];
}

function createLspDiagnostic(diag: Omit<VSDiagnostic, "source">): VSDiagnostic {
  return {
    source: "TypeSpec",
    ...diag,
  };
}

function getDocumentForLocation(
  location: SourceLocation,
  currentDocument: TextDocument,
): TextDocument | undefined {
  if (location?.file) {
    return (location.file as ServerSourceFile).document;
  } else {
    // https://github.com/microsoft/language-server-protocol/issues/256
    //
    // LSP does not currently allow sending a diagnostic with no location so
    // we report diagnostics with no location on the document that changed to
    // trigger.
    return currentDocument;
  }
}

interface VSLocation {
  readonly document: TextDocument | TextDocumentIdentifier;
  readonly range: Range;
}

function getVSLocation(
  location: SourceLocation | undefined,
  currentDocument: TextDocument,
): VSLocation | undefined {
  if (location === undefined) return undefined;
  const document = getDocumentForLocation(location, currentDocument);
  if (!document) {
    const start = location.file.getLineAndCharacterOfPosition(location.pos);
    const end = location.file.getLineAndCharacterOfPosition(location.end);

    return { range: { start, end }, document: TextDocumentIdentifier.create(location.file.path) };
  } else {
    const start = document.positionAt(location?.pos ?? 0);
    const end = document.positionAt(location?.end ?? 0);

    return { range: { start, end }, document };
  }
}

interface VSLocationWithTypeInfo extends VSLocation {
  readonly typeName: string;
  readonly node: Node;
}
function getVSLocationWithTypeInfo(
  program: Program,
  node: Node,
  document: TextDocument,
): VSLocationWithTypeInfo | undefined {
  const location = getVSLocation(getSourceLocation(node, { locateId: true }), document);
  if (location === undefined) return undefined;
  return {
    ...location,
    node,
    typeName: getTypeName(program.checker.getTypeForNode(node)),
  };
}

function convertSeverity(severity: "warning" | "error"): DiagnosticSeverity {
  switch (severity) {
    case "warning":
      return DiagnosticSeverity.Warning;
    case "error":
      return DiagnosticSeverity.Error;
  }
}
