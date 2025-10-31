import type {
  DiagnosticRelatedInformation,
  Range,
  Diagnostic as VSDiagnostic,
} from "vscode-languageserver";
import { Range as VSRange } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node.js";
import {
  getDiagnosticTemplateInstantitationTrace,
  getSourceLocation,
} from "../core/diagnostics.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { NodeSystemHost } from "../core/node-system-host.js";
import type { Program } from "../core/program.js";
import type { Node, SourceLocation } from "../core/types.js";
import { Diagnostic, NoTarget } from "../core/types.js";
import { isDefined } from "../utils/misc.js";
import { getLocationInYamlScript } from "../yaml/diagnostics.js";
import { parseYaml } from "../yaml/parser.js";
import type { FileService } from "./file-service.js";
import type { ServerSourceFile } from "./types.js";

/** Convert TypeSpec Diagnostic to Lsp diagnostic. Each TypeSpec diagnostic could produce multiple lsp ones when it involve multiple locations. */
export async function convertDiagnosticToLsp(
  fileService: FileService,
  program: Program,
  document: TextDocument,
  diagnostic: Diagnostic,
  emitters?: string[] | undefined,
): Promise<[VSDiagnostic, TextDocument][]> {
  const emitterName = program.compilerOptions.emit?.find((emitName) =>
    diagnostic.message.includes(emitName),
  );
  const root = await getVSLocation(
    fileService,
    getSourceLocation(diagnostic.target, { locateId: true }),
    document,
    program.compilerOptions.config,
    emitterName,
  );
  const relatedInformation: DiagnosticRelatedInformation[] = [];
  if (root === NoTarget) {
    let customMsg = "";
    if (emitters && emitters.includes(emitterName || "")) {
      customMsg = ". It's configured in vscode settings.";
    }
    return [
      [
        createLspDiagnostic({
          range: VSRange.create(0, 0, 0, 0),
          message: diagnostic.message + customMsg,
          severity: convertSeverity(diagnostic.severity),
          code: diagnostic.code,
          relatedInformation,
        }),
        document,
      ],
    ];
  }
  if (root === undefined || !fileService.upToDate(root.document)) return [];

  const instantiationNodes = getDiagnosticTemplateInstantitationTrace(diagnostic.target);

  const relatedDiagnostics: [VSDiagnostic, TextDocument][] = [];
  if (instantiationNodes.length > 0) {
    const items = (
      await Promise.all(
        instantiationNodes.map((node) =>
          getVSLocationWithTypeInfo(program, fileService, node, document),
        ),
      )
    ).filter(isDefined);

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
  fileService: FileService,
  location: SourceLocation,
  currentDocument: TextDocument,
): TextDocument | undefined {
  if (location?.file) {
    const doc = (location.file as ServerSourceFile).document;
    if (doc) {
      return doc;
    }
    // Since we are using cache between compilations, it's possible that when the result is used as cache, the file is actually opened or closed,
    // so need to do some handling for the open case here. No special handling for the closed case which will just be ignored by client
    const opened = fileService.getOpenDocument(location.file.path);
    if (opened) {
      // the doc is opened now and return it if it's not out-of-date
      // compared to when it was first opened.
      const initVersion = fileService.getOpenDocumentInitVersion(opened.uri);
      if (opened.version === initVersion) {
        return opened;
      }
    }
    return undefined;
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

async function getVSLocation(
  fileService: FileService,
  location: SourceLocation | undefined,
  currentDocument: TextDocument,
  configFilePath: string | undefined = undefined,
  emitterName: string | undefined = undefined,
): Promise<VSLocation | typeof NoTarget | undefined> {
  if (configFilePath && emitterName && emitterName.length > 0 && location === undefined) {
    const [yamlScript] = parseYaml(await NodeSystemHost.readFile(configFilePath));
    const target = getLocationInYamlScript(yamlScript, ["emit", emitterName], "key");
    if (target.pos === 0) {
      return NoTarget;
    }

    const docTspConfig = fileService.getOpenDocument(configFilePath);
    if (!docTspConfig) {
      return NoTarget;
    }

    const lineAndChar = target.file.getLineAndCharacterOfPosition(target.pos);
    const range = VSRange.create(
      lineAndChar.line,
      lineAndChar.character,
      lineAndChar.line,
      lineAndChar.character + emitterName.length,
    );

    return {
      range,
      document: docTspConfig,
    };
  }

  if (location === undefined) return undefined;
  const document = getDocumentForLocation(fileService, location, currentDocument);
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
async function getVSLocationWithTypeInfo(
  program: Program,
  fileService: FileService,
  node: Node,
  document: TextDocument,
): Promise<VSLocationWithTypeInfo | undefined> {
  const location = await getVSLocation(
    fileService,
    getSourceLocation(node, { locateId: true }),
    document,
  );
  if (location === undefined || location === NoTarget) return undefined;
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
