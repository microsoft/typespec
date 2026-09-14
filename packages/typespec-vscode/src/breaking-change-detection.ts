import type { ExtensionContext } from "vscode";
import vscode, { commands } from "vscode";
import { createSymbolHoverRangeResolver, createSymbolSnapshots } from "./symbol-snapshot.js";
import {
  BREAKING_CHANGE_DIAGNOSTIC_CODE_PREFIX,
  BREAKING_CHANGE_DIAGNOSTIC_SOURCE,
  CommandName,
} from "./types.js";

const RECORD_BREAKING_CHANGE_TOOL = "typespec_recordBreakingChange";

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

interface BreakingChangeFinding {
  id: string;
  symbolKey: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
  message: string;
}

export function registerTypeSpecAuthoringSkillTrigger(context: ExtensionContext) {
  let targetSequence = 0;
  let findingSequence = 0;
  const pendingTargets = new Map<string, BreakingChangeTarget>();
  const findings = new Map<string, BreakingChangeFinding[]>();
  const savedSymbolSnapshots = new Map<string, Map<string, string>>();
  const diagnostics = vscode.languages.createDiagnosticCollection("typespec-breaking-changes");

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
    vscode.workspace.onDidOpenTextDocument((document) => {
      void captureSymbolSnapshot(document);
    }),
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
