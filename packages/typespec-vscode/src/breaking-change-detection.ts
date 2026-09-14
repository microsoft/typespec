import type { ExtensionContext } from "vscode";
import vscode, { commands } from "vscode";
import logger from "./log/logger.js";
import {
  createTypeSpecSymbolNameRangeResolver,
  findInnermostSymbolAtOffset,
  findTypeSpecEntityAtOffset,
} from "./symbol-range.js";
import {
  BREAKING_CHANGE_DIAGNOSTIC_CODE_PREFIX,
  BREAKING_CHANGE_DIAGNOSTIC_SOURCE,
  CommandName,
} from "./types.js";

const RECORD_BREAKING_CHANGE_TOOL = "typespec_recordBreakingChange";
const RECORD_TYPESPEC_EXPLANATION_TOOL = "typespec_recordExplanation";

interface BreakingChangeTarget {
  documentUri: vscode.Uri;
  documentVersion: number;
  symbolKey: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
}

interface RecordBreakingChangeInput {
  targetId: string;
  messages: string[];
}

interface RecordTypeSpecExplanationInput {
  targetId: string;
  explanation: string;
}

interface BreakingChangeFinding {
  id: string;
  symbolKey: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
  message: string;
}

interface TypeSpecExplanation {
  symbolKey: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
  markdown: string;
}

interface TypeSpecExplanationTarget extends BreakingChangeTarget {
  symbolName: string;
}

interface SymbolSnapshot {
  symbolKey: string;
  symbol: vscode.DocumentSymbol;
  ownText: string;
}

function createSymbolSnapshots(
  document: vscode.TextDocument,
  symbols: readonly vscode.DocumentSymbol[],
  parentKey = "",
): SymbolSnapshot[] {
  const snapshots: SymbolSnapshot[] = [];
  const occurrences = new Map<string, number>();
  for (const symbol of symbols) {
    const identity = `${symbol.kind}:${symbol.name}`;
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    const symbolKey = `${parentKey}/${identity}:${occurrence}`;
    const children = [...symbol.children].sort((left, right) =>
      left.range.start.compareTo(right.range.start),
    );
    const ownText: string[] = [];
    let cursor = symbol.range.start;
    for (const child of children) {
      ownText.push(document.getText(new vscode.Range(cursor, child.range.start)));
      cursor = child.range.end;
    }
    ownText.push(document.getText(new vscode.Range(cursor, symbol.range.end)));
    snapshots.push(
      { symbolKey, symbol, ownText: ownText.join("").replace(/\s+/g, " ").trim() },
      ...createSymbolSnapshots(document, symbol.children, symbolKey),
    );
  }
  return snapshots;
}

function createSymbolHoverRangeResolver(document: vscode.TextDocument) {
  const resolveSymbolNameRange = createTypeSpecSymbolNameRangeResolver(document.getText());
  return (symbol: vscode.DocumentSymbol): vscode.Range => {
    const nameRange = resolveSymbolNameRange(
      document.offsetAt(symbol.range.start),
      document.offsetAt(symbol.range.end),
    );
    return nameRange
      ? new vscode.Range(document.positionAt(nameRange.pos), document.positionAt(nameRange.end))
      : symbol.selectionRange;
  };
}

export function registerTypeSpecAuthoringSkillTrigger(context: ExtensionContext) {
  let targetSequence = 0;
  let findingSequence = 0;
  const pendingTargets = new Map<string, BreakingChangeTarget>();
  const pendingExplanationTargets = new Map<string, BreakingChangeTarget>();
  const findings = new Map<string, BreakingChangeFinding[]>();
  const explanations = new Map<string, TypeSpecExplanation[]>();
  const savedSymbolSnapshots = new Map<string, Map<string, string>>();
  const diagnostics = vscode.languages.createDiagnosticCollection("typespec-breaking-changes");

  const resolveExplanationTarget = async (
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<TypeSpecExplanationTarget | undefined> => {
    const documentVersion = document.version;
    let symbols: vscode.DocumentSymbol[] = [];
    try {
      symbols =
        (await commands.executeCommand<vscode.DocumentSymbol[]>(
          "vscode.executeDocumentSymbolProvider",
          document.uri,
        )) ?? [];
    } catch (error) {
      logger.debug("Unable to resolve TypeSpec document symbols for AI explanation.", [error]);
    }
    if (document.version !== documentVersion) {
      return undefined;
    }

    const symbol = findInnermostSymbolAtOffset(
      symbols,
      document.offsetAt(position),
      (candidate) => ({
        pos: document.offsetAt(candidate.range.start),
        end: document.offsetAt(candidate.range.end),
      }),
      (candidate) => candidate.children,
    );
    const snapshot = symbol
      ? createSymbolSnapshots(document, symbols).find((candidate) => candidate.symbol === symbol)
      : undefined;
    if (!symbol || !snapshot) {
      const entity = findTypeSpecEntityAtOffset(document.getText(), document.offsetAt(position));
      if (!entity) {
        return undefined;
      }
      return {
        documentUri: document.uri,
        documentVersion,
        symbolKey: `ast:${entity.range.pos}:${entity.range.end}:${entity.name}`,
        symbolName: entity.name,
        analysisRange: new vscode.Range(
          document.positionAt(entity.range.pos),
          document.positionAt(entity.range.end),
        ),
        hoverRange: new vscode.Range(
          document.positionAt(entity.nameRange.pos),
          document.positionAt(entity.nameRange.end),
        ),
      };
    }

    return {
      documentUri: document.uri,
      documentVersion,
      symbolKey: snapshot.symbolKey,
      symbolName: symbol.name,
      analysisRange: symbol.range,
      hoverRange: createSymbolHoverRangeResolver(document)(symbol),
    };
  };

  const requestTypeSpecExplanation = (target: TypeSpecExplanationTarget) => {
    const documentKey = target.documentUri.toString();
    const existingTarget = [...pendingExplanationTargets.values()].find(
      (candidate) =>
        candidate.documentUri.toString() === documentKey &&
        candidate.symbolKey === target.symbolKey,
    );
    if (existingTarget) {
      return;
    }

    const targetId = `explanation:${++targetSequence}:${documentKey}`;
    pendingExplanationTargets.set(targetId, target);
    logger.debug(`Requesting an AI explanation for TypeSpec symbol '${target.symbolName}'.`);
    setTimeout(() => {
      void commands
        .executeCommand("workbench.action.chat.open", {
          mode: "agent",
          query: `Explain the attached TypeSpec entity in at most two short Markdown paragraphs. Describe what it represents and how its decorators, types, constraints, and relationships affect the API. This is read-only analysis: do not edit, undo, revert, format, or save files. Call #recordTypeSpecExplanation exactly once with targetId ${JSON.stringify(targetId)} and the complete explanation. Do not call any other tool.`,
          attachFiles: [
            {
              uri: target.documentUri,
              range: {
                startLineNumber: target.analysisRange.start.line + 1,
                startColumn: target.analysisRange.start.character + 1,
                endLineNumber: target.analysisRange.end.line + 1,
                endColumn: target.analysisRange.end.character + 1,
              },
            },
          ],
        })
        .then(undefined, (error) => {
          pendingExplanationTargets.delete(targetId);
          logger.error("Failed to start the TypeSpec AI explanation request.", [error]);
        });
    }, 0);
  };

  const captureSymbolSnapshot = async (document: vscode.TextDocument) => {
    if (document.languageId !== "typespec") {
      return;
    }

    const documentVersion = document.version;
    const symbols =
      (await commands.executeCommand<vscode.DocumentSymbol[]>(
        "vscode.executeDocumentSymbolProvider",
        document.uri,
      )) ?? [];
    if (document.version !== documentVersion || symbols.length === 0) {
      return;
    }

    const symbolSnapshots = createSymbolSnapshots(document, symbols);
    savedSymbolSnapshots.set(
      document.uri.toString(),
      new Map(symbolSnapshots.map((snapshot) => [snapshot.symbolKey, snapshot.ownText])),
    );
  };

  const updateDiagnostics = (documentKey: string) => {
    const documentDiagnostics = (findings.get(documentKey) ?? []).map((finding) => {
      const diagnostic = new vscode.Diagnostic(
        finding.hoverRange,
        finding.message,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.source = BREAKING_CHANGE_DIAGNOSTIC_SOURCE;
      diagnostic.code = `${BREAKING_CHANGE_DIAGNOSTIC_CODE_PREFIX}${finding.id}`;
      return diagnostic;
    });
    diagnostics.set(vscode.Uri.parse(documentKey), documentDiagnostics);
  };

  const openBreakingChangeFix = (documentKey: string, finding: BreakingChangeFinding) => {
    void commands.executeCommand("workbench.action.chat.open", {
      mode: "agent",
      query: `/typespec-authoring Fix this breaking change: ${finding.message}`,
      attachFiles: [
        {
          uri: vscode.Uri.parse(documentKey),
          range: {
            startLineNumber: finding.analysisRange.start.line + 1,
            startColumn: finding.analysisRange.start.character + 1,
            endLineNumber: finding.analysisRange.end.line + 1,
            endColumn: finding.analysisRange.end.character + 1,
          },
        },
      ],
    });
  };

  context.subscriptions.push(
    diagnostics,
    vscode.languages.registerHoverProvider("typespec", {
      async provideHover(document, position) {
        const documentKey = document.uri.toString();
        const explanation = (explanations.get(documentKey) ?? []).find((candidate) =>
          candidate.hoverRange.contains(position),
        );
        if (explanation) {
          const contents = new vscode.MarkdownString("**AI explanation**\n\n");
          contents.appendMarkdown(explanation.markdown);
          return new vscode.Hover(contents, explanation.hoverRange);
        }

        const target = await resolveExplanationTarget(document, position);
        if (!target || !target.hoverRange.contains(position)) {
          return undefined;
        }

        requestTypeSpecExplanation(target);
        return new vscode.Hover(
          new vscode.MarkdownString(
            `$(loading~spin) Explaining **${target.symbolName}** with AI...`,
          ),
          target.hoverRange,
        );
      },
    }),
    vscode.workspace.onDidOpenTextDocument((document) => {
      void captureSymbolSnapshot(document);
    }),
    commands.registerCommand(
      CommandName.ExplainTypeSpec,
      async (documentKey?: string, position?: vscode.Position) => {
        const activeEditor = vscode.window.activeTextEditor;
        const document = documentKey
          ? await vscode.workspace.openTextDocument(vscode.Uri.parse(documentKey))
          : activeEditor?.document;
        const targetPosition = position ?? activeEditor?.selection.active;
        if (!document || document.languageId !== "typespec" || !targetPosition) {
          void vscode.window.showInformationMessage(
            "Place the cursor on a TypeSpec entity to explain it.",
          );
          return;
        }

        const target = await resolveExplanationTarget(document, targetPosition);
        if (!target) {
          void vscode.window.showInformationMessage(
            "No TypeSpec entity was found at the current cursor position.",
          );
          return;
        }

        requestTypeSpecExplanation(target);
      },
    ),
    commands.registerCommand(
      CommandName.SelectBreakingChangeFix,
      async (documentKey: string, findingIds: string[]) => {
        const documentFindings = findings.get(documentKey) ?? [];
        const groupedItems: (vscode.QuickPickItem & { findingId?: string })[] = [];
        for (const findingId of findingIds) {
          const finding = documentFindings.find((candidate) => candidate.id === findingId);
          if (finding) {
            groupedItems.push(
              { label: finding.message, kind: vscode.QuickPickItemKind.Separator },
              { label: "$(wrench) Fix", findingId },
            );
          }
        }

        const selected = await vscode.window.showQuickPick(groupedItems, {
          placeHolder: "Select the breaking-change information to fix",
        });
        if (!selected?.findingId) {
          return;
        }

        const finding = documentFindings.find((candidate) => candidate.id === selected.findingId);
        if (finding) {
          openBreakingChangeFix(documentKey, finding);
        }
      },
    ),
    vscode.lm.registerTool<RecordBreakingChangeInput>(RECORD_BREAKING_CHANGE_TOOL, {
      async invoke(options) {
        const target = pendingTargets.get(options.input.targetId);
        if (!target) {
          throw new Error("The TypeSpec breaking-change target is no longer available.");
        }

        const document = vscode.workspace.textDocuments.find(
          (candidate) => candidate.uri.toString() === target.documentUri.toString(),
        );
        if (!document || document.version !== target.documentVersion) {
          pendingTargets.delete(options.input.targetId);
          throw new Error("The TypeSpec target changed before the finding could be recorded.");
        }

        const documentKey = target.documentUri.toString();
        const otherFindings = (findings.get(documentKey) ?? []).filter(
          (finding) => finding.symbolKey !== target.symbolKey,
        );
        findings.set(documentKey, [
          ...otherFindings,
          ...options.input.messages.map((message) => ({
            id: `${++findingSequence}`,
            symbolKey: target.symbolKey,
            analysisRange: target.analysisRange,
            hoverRange: target.hoverRange,
            message,
          })),
        ]);
        pendingTargets.delete(options.input.targetId);
        updateDiagnostics(documentKey);
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "The breaking-change findings were updated for the symbol.",
          ),
        ]);
      },
    }),
    vscode.lm.registerTool<RecordTypeSpecExplanationInput>(RECORD_TYPESPEC_EXPLANATION_TOOL, {
      async invoke(options) {
        const target = pendingExplanationTargets.get(options.input.targetId);
        if (!target) {
          throw new Error("The TypeSpec explanation target is no longer available.");
        }

        const document = vscode.workspace.textDocuments.find(
          (candidate) => candidate.uri.toString() === target.documentUri.toString(),
        );
        if (!document || document.version !== target.documentVersion) {
          pendingExplanationTargets.delete(options.input.targetId);
          throw new Error("The TypeSpec target changed before its explanation could be recorded.");
        }

        const markdown = options.input.explanation.trim();
        if (markdown.length === 0) {
          pendingExplanationTargets.delete(options.input.targetId);
          throw new Error("The TypeSpec explanation cannot be empty.");
        }

        const documentKey = target.documentUri.toString();
        const otherExplanations = (explanations.get(documentKey) ?? []).filter(
          (explanation) => explanation.symbolKey !== target.symbolKey,
        );
        explanations.set(documentKey, [
          ...otherExplanations,
          {
            symbolKey: target.symbolKey,
            analysisRange: target.analysisRange,
            hoverRange: target.hoverRange,
            markdown,
          },
        ]);
        pendingExplanationTargets.delete(options.input.targetId);
        const activeEditor = vscode.window.activeTextEditor;
        if (
          activeEditor?.document.uri.toString() === documentKey &&
          target.hoverRange.contains(activeEditor.selection.active)
        ) {
          void commands.executeCommand("editor.action.showHover");
        }
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("The TypeSpec hover explanation was updated."),
        ]);
      },
    }),
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId !== "typespec") {
        return;
      }

      const documentKey = document.uri.toString();
      const documentVersion = document.version;
      for (const [targetId, target] of pendingTargets) {
        if (target.documentUri.toString() === documentKey) {
          pendingTargets.delete(targetId);
        }
      }
      for (const [targetId, target] of pendingExplanationTargets) {
        if (target.documentUri.toString() === documentKey) {
          pendingExplanationTargets.delete(targetId);
        }
      }

      const symbols =
        (await commands.executeCommand<vscode.DocumentSymbol[]>(
          "vscode.executeDocumentSymbolProvider",
          document.uri,
        )) ?? [];
      if (document.version !== documentVersion) {
        return;
      }

      const symbolSnapshots = createSymbolSnapshots(document, symbols);
      const getHoverRange = createSymbolHoverRangeResolver(document);
      const previousSnapshots = savedSymbolSnapshots.get(documentKey);
      savedSymbolSnapshots.set(
        documentKey,
        new Map(symbolSnapshots.map((snapshot) => [snapshot.symbolKey, snapshot.ownText])),
      );
      if (!previousSnapshots) {
        return;
      }
      const changedSnapshots = symbolSnapshots.filter(
        (snapshot) => previousSnapshots.get(snapshot.symbolKey) !== snapshot.ownText,
      );
      const currentSymbols = new Map(
        symbolSnapshots.map((snapshot) => [snapshot.symbolKey, snapshot.symbol]),
      );
      const changedSymbolKeys = new Set(changedSnapshots.map((snapshot) => snapshot.symbolKey));
      findings.set(
        documentKey,
        (findings.get(documentKey) ?? []).flatMap((finding) => {
          const currentSymbol = currentSymbols.get(finding.symbolKey);
          if (!currentSymbol || changedSymbolKeys.has(finding.symbolKey)) {
            return [];
          }
          return [
            {
              ...finding,
              analysisRange: currentSymbol.range,
              hoverRange: getHoverRange(currentSymbol),
            },
          ];
        }),
      );
      updateDiagnostics(documentKey);
      explanations.set(
        documentKey,
        (explanations.get(documentKey) ?? []).flatMap((explanation) => {
          const currentSymbol = currentSymbols.get(explanation.symbolKey);
          if (!currentSymbol || changedSymbolKeys.has(explanation.symbolKey)) {
            return [];
          }
          return [
            {
              ...explanation,
              analysisRange: currentSymbol.range,
              hoverRange: getHoverRange(currentSymbol),
            },
          ];
        }),
      );

      const analysisTargets = changedSnapshots.map(({ symbolKey, symbol }) => {
        const targetId = `${++targetSequence}:${documentKey}`;
        const target = {
          symbolKey,
          analysisRange: symbol.range,
          hoverRange: getHoverRange(symbol),
        };
        pendingTargets.set(targetId, {
          documentUri: document.uri,
          documentVersion,
          ...target,
        });
        return { targetId, ...target };
      });

      if (analysisTargets.length === 0) {
        return;
      }

      const targetDescriptions = analysisTargets.map(({ targetId, hoverRange }) => ({
        targetId,
        startLine: hoverRange.start.line + 1,
        startColumn: hoverRange.start.character + 1,
      }));
      void commands.executeCommand("workbench.action.chat.open", {
        mode: "agent",
        query: `/breaking-change-detect Read-only analysis: never edit, undo, revert, or format files. Analyze each attached target independently from this saved snapshot. The target IDs and symbol locations are ${JSON.stringify(targetDescriptions)}. Call #recordBreakingChange exactly once for every target, using its matching targetId and a messages array containing all confirmed breaking changes, or an empty array when none are found.`,
        attachFiles: analysisTargets.map((target) => ({
          uri: document.uri,
          range: {
            startLineNumber: target.analysisRange.start.line + 1,
            startColumn: target.analysisRange.start.character + 1,
            endLineNumber: target.analysisRange.end.line + 1,
            endColumn: target.analysisRange.end.character + 1,
          },
        })),
      });
    }),
  );

  return async () => {
    await Promise.all(vscode.workspace.textDocuments.map(captureSymbolSnapshot));
  };
}
