import type {
  DiagnosticRelatedInformation,
  Range,
  Diagnostic as VSDiagnostic,
} from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node.js";
import {
  getDiagnosticTemplateInstantitationTrace,
  getSourceLocation,
} from "../core/diagnostics.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import type { Program } from "../core/program.js";
import type { Node, SourceLocation } from "../core/types.js";
import { Diagnostic } from "../core/types.js";
import { isDefined } from "../utils/misc.js";
import type { FileService } from "./file-service.js";
import type { ServerSourceFile } from "./types.js";

/** Convert TypeSpec Diagnostic to Lsp diagnostic. Each TypeSpec diagnostic could produce multiple lsp ones when it involve multiple locations. */
export function convertDiagnosticToLsp(
  fileService: FileService,
  program: Program,
  document: TextDocument,
  diagnostic: Diagnostic,
): [VSDiagnostic, TextDocument][] {
  const root = getVSLocation(getSourceLocation(diagnostic.target, { locateId: true }), document);
  if (root === undefined || !fileService.upToDate(root.document)) return [];

  const instantiationNodes = getDiagnosticTemplateInstantitationTrace(diagnostic.target);
  const relatedInformation: DiagnosticRelatedInformation[] = [];
  const relatedDiagnostics: [VSDiagnostic, TextDocument][] = [];
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
  const rootDiagnostic: [VSDiagnostic, TextDocument] = [
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
  readonly document: TextDocument;
  readonly range: Range;
}

function getVSLocation(
  location: SourceLocation | undefined,
  currentDocument: TextDocument,
): VSLocation | undefined {
  if (location === undefined) return undefined;
  const document = getDocumentForLocation(location, currentDocument);
  if (!document) {
    return undefined;
  }

  const start = document.positionAt(location?.pos ?? 0);
  const end = document.positionAt(location?.end ?? 0);

  return { range: { start, end }, document };
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
