import type { ExtensionContext } from "vscode";
import vscode, { commands } from "vscode";
import logger from "./log/logger.js";
import { findInnermostSymbolAtOffset, findTypeSpecEntityAtOffset } from "./symbol-range.js";
import { createSymbolHoverRangeResolver, createSymbolSnapshots } from "./symbol-snapshot.js";
import { CommandName } from "./types.js";

const RECORD_TYPESPEC_EXPLANATION_TOOL = "typespec_recordExplanation";

interface TypeSpecExplanationTarget {
  documentUri: vscode.Uri;
  documentVersion: number;
  symbolKey: string;
  symbolName: string;
  ownText: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
}

interface RecordTypeSpecExplanationInput {
  targetId: string;
  explanation: string;
}

interface TypeSpecExplanation {
  symbolKey: string;
  ownText: string;
  analysisRange: vscode.Range;
  hoverRange: vscode.Range;
  markdown: string;
}

export function registerTypeSpecAiExplanationHover(context: ExtensionContext) {
  let targetSequence = 0;
  const pendingTargets = new Map<string, TypeSpecExplanationTarget>();
  const explanations = new Map<string, TypeSpecExplanation[]>();

  const resolveTarget = async (
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
        ownText: document.getText(
          new vscode.Range(
            document.positionAt(entity.range.pos),
            document.positionAt(entity.range.end),
          ),
        ),
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
      ownText: snapshot.ownText,
      analysisRange: symbol.range,
      hoverRange: createSymbolHoverRangeResolver(document)(symbol),
    };
  };

  const requestExplanation = (target: TypeSpecExplanationTarget) => {
    const documentKey = target.documentUri.toString();
    const existingTarget = [...pendingTargets.values()].find(
      (candidate) =>
        candidate.documentUri.toString() === documentKey &&
        candidate.symbolKey === target.symbolKey,
    );
    if (existingTarget) {
      return;
    }

    const targetId = `explanation:${++targetSequence}:${documentKey}`;
    pendingTargets.set(targetId, target);
    logger.debug(`Requesting an AI explanation for TypeSpec symbol '${target.symbolName}'.`);
    setTimeout(() => {
      void commands
        .executeCommand("workbench.action.chat.open", {
          mode: "agent",
          query: `Explain the attached TypeSpec entity in at most two short Markdown paragraphs. Describe the API specification the entity represents. For operation, give out the route url explicitly. This is read-only analysis: do not edit, undo, revert, format, or save files. Call #recordTypeSpecExplanation exactly once with targetId ${JSON.stringify(targetId)} and the complete explanation. Do not call any other tool.`,
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
          pendingTargets.delete(targetId);
          logger.error("Failed to start the TypeSpec AI explanation request.", [error]);
        });
    }, 0);
  };

  context.subscriptions.push(
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

        const target = await resolveTarget(document, position);
        if (!target || !target.hoverRange.contains(position)) {
          return undefined;
        }

        requestExplanation(target);
        return new vscode.Hover(
          new vscode.MarkdownString(
            `$(loading~spin) Explaining **${target.symbolName}** with AI...`,
          ),
          target.hoverRange,
        );
      },
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

        const target = await resolveTarget(document, targetPosition);
        if (!target) {
          void vscode.window.showInformationMessage(
            "No TypeSpec entity was found at the current cursor position.",
          );
          return;
        }

        requestExplanation(target);
      },
    ),
    vscode.lm.registerTool<RecordTypeSpecExplanationInput>(RECORD_TYPESPEC_EXPLANATION_TOOL, {
      async invoke(options) {
        const target = pendingTargets.get(options.input.targetId);
        if (!target) {
          throw new Error("The TypeSpec explanation target is no longer available.");
        }

        const document = vscode.workspace.textDocuments.find(
          (candidate) => candidate.uri.toString() === target.documentUri.toString(),
        );
        if (!document || document.version !== target.documentVersion) {
          pendingTargets.delete(options.input.targetId);
          throw new Error("The TypeSpec target changed before its explanation could be recorded.");
        }

        const markdown = options.input.explanation.trim();
        if (markdown.length === 0) {
          pendingTargets.delete(options.input.targetId);
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
            ownText: target.ownText,
            analysisRange: target.analysisRange,
            hoverRange: target.hoverRange,
            markdown,
          },
        ]);
        pendingTargets.delete(options.input.targetId);
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
      for (const [targetId, target] of pendingTargets) {
        if (target.documentUri.toString() === documentKey) {
          pendingTargets.delete(targetId);
        }
      }

      const documentVersion = document.version;
      const symbols =
        (await commands.executeCommand<vscode.DocumentSymbol[]>(
          "vscode.executeDocumentSymbolProvider",
          document.uri,
        )) ?? [];
      if (document.version !== documentVersion) {
        return;
      }

      const symbolSnapshots = createSymbolSnapshots(document, symbols);
      const currentSnapshots = new Map(
        symbolSnapshots.map((snapshot) => [snapshot.symbolKey, snapshot]),
      );
      const getHoverRange = createSymbolHoverRangeResolver(document);
      explanations.set(
        documentKey,
        (explanations.get(documentKey) ?? []).flatMap((explanation) => {
          const currentSnapshot = currentSnapshots.get(explanation.symbolKey);
          if (!currentSnapshot || currentSnapshot.ownText !== explanation.ownText) {
            return [];
          }
          return [
            {
              ...explanation,
              analysisRange: currentSnapshot.symbol.range,
              hoverRange: getHoverRange(currentSnapshot.symbol),
            },
          ];
        }),
      );
    }),
  );
}
