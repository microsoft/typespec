// import "./pre-extension-activate" first for the code that needs to run before others
// sort-imports-ignore
import "./pre-extension-activate.js";

import type { ExtensionContext } from "vscode";
import vscode, { commands, TabInputText } from "vscode";
import { State } from "vscode-languageclient";
import { createCodeActionProvider } from "./code-action-provider.js";
import { setTspLanguageClient, tspLanguageClient } from "./extension-context.js";
import { ExtensionStateManager } from "./extension-state-manager.js";
import { ExtensionLogListener, getPopupAction } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { getDirectoryPath, normalizePath } from "./path-utils.js";
import { createTypeSpecSymbolNameRangeResolver } from "./symbol-range.js";
import { createTaskProvider } from "./task-provider.js";
import telemetryClient from "./telemetry/telemetry-client.js";
import type { OperationTelemetryEvent } from "./telemetry/telemetry-event.js";
import { TelemetryEventName } from "./telemetry/telemetry-event.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import type {
  InstallGlobalCliCommandArgs,
  RestartServerCommandArgs,
  RestartServerCommandResult,
  Result,
  TypeSpecExtensionApi,
} from "./types.js";
import {
  BREAKING_CHANGE_DIAGNOSTIC_CODE_PREFIX,
  BREAKING_CHANGE_DIAGNOSTIC_SOURCE,
  CodeActionCommand,
  CommandName,
  ResultCode,
  SettingName,
} from "./types.js";
import { installCompilerWithUi } from "./typespec-utils.js";
import { isWhitespaceStringOrUndefined, spawnExecutionAndLogToOutput } from "./utils.js";
import type { InitTemplatesUrlSetting } from "./vscode-cmd/create-tsp-project.js";
import {
  createTypeSpecProject,
  registerInitTemplateUrls as registerInitTemplateUrlsInternal,
} from "./vscode-cmd/create-tsp-project.js";
import { emitCode } from "./vscode-cmd/emit-code/emit-code.js";
import { importFromOpenApi3 } from "./vscode-cmd/import-from-openapi3.js";
import { installCompilerGlobally } from "./vscode-cmd/install-tsp-compiler.js";
import { clearOpenApi3PreviewTempFolders, showOpenApi3 } from "./vscode-cmd/openapi3-preview.js";

/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension-log", new ExtensionLogListener(outputChannel));

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

function registerTypeSpecAuthoringSkillTrigger(context: ExtensionContext) {
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
      const resolveSymbolNameRange = createTypeSpecSymbolNameRangeResolver(document.getText());
      const getHoverRange = (symbol: vscode.DocumentSymbol): vscode.Range => {
        const nameRange = resolveSymbolNameRange(
          document.offsetAt(symbol.range.start),
          document.offsetAt(symbol.range.end),
        );
        return nameRange
          ? new vscode.Range(document.positionAt(nameRange.pos), document.positionAt(nameRange.end))
          : symbol.selectionRange;
      };
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

export async function activate(context: ExtensionContext) {
  await telemetryClient.doOperationWithTelemetry(
    TelemetryEventName.StartExtension,
    async (tel: OperationTelemetryEvent): Promise<ResultCode> => {
      const stateManager = new ExtensionStateManager(context);
      telemetryClient.Initialize(stateManager);
      /**
       * workaround: vscode output cannot display ANSI color.
       * Set the NO_COLOR environment variable to suppress the addition of ANSI color escape codes.
       */
      process.env["NO_COLOR"] = "true";
      context.subscriptions.push(telemetryClient);

      context.subscriptions.push(createTaskProvider());

      context.subscriptions.push(createCodeActionProvider());

      const initializeTypeSpecAuthoringSkillTrigger =
        registerTypeSpecAuthoringSkillTrigger(context);

      context.subscriptions.push(
        commands.registerCommand(CommandName.ShowOutputChannel, () => {
          outputChannel.show(true /*preserveFocus*/);
        }),
      );

      context.subscriptions.push(
        commands.registerCommand(
          CodeActionCommand.NpmInstallPackage,
          async (projectFolder: string | undefined, pkgName: string, pkgNameInPkgFile: boolean) => {
            try {
              if (projectFolder) {
                await spawnExecutionAndLogToOutput(
                  "npm",
                  pkgNameInPkgFile ? ["install"] : ["install", pkgName],
                  projectFolder,
                );
              } else {
                logger.error(
                  "No package.json file was found, and the dependency package could not be installed",
                  [],
                  {
                    showPopup: true,
                  },
                );
              }
            } catch (error) {
              logger.error(
                "Failed to execute npm install, please check the output for details",
                [error],
                {
                  showPopup: true,
                },
              );
            }
          },
        ),
      );

      context.subscriptions.push(
        commands.registerCommand(CodeActionCommand.OpenUrl, (url: string) => {
          try {
            vscode.env.openExternal(vscode.Uri.parse(url));
          } catch (error) {
            logger.error(`Failed to open URL: ${url}`, [error as any]);
          }
        }),
      );

      /* emit command. */
      context.subscriptions.push(
        commands.registerCommand(CommandName.EmitCode, async (uri: vscode.Uri) => {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Window,
              title: "Emit from TypeSpec...",
              cancellable: false,
            },
            async () => {
              await telemetryClient.doOperationWithTelemetry<ResultCode>(
                TelemetryEventName.EmitCode,
                async (tel): Promise<ResultCode> => {
                  return await emitCode(context, uri, tel);
                },
                undefined,
                (e) => {
                  logger.error("Unexpected error when emitting code from TypeSpec.", [e], {
                    showPopup: true,
                  });
                  return ResultCode.Fail;
                },
              );
            },
          );
        }),
      );

      context.subscriptions.push(
        commands.registerCommand(
          CommandName.RestartServer,
          async (
            args: RestartServerCommandArgs | undefined,
          ): Promise<RestartServerCommandResult> => {
            return vscode.window.withProgress(
              {
                title: args?.notificationMessage ?? "Restarting TypeSpec language service...",
                location: vscode.ProgressLocation.Notification,
              },
              async () => {
                return await telemetryClient.doOperationWithTelemetry(
                  TelemetryEventName.RestartServer,
                  async (tel) => {
                    if (args?.forceRecreate === true) {
                      logger.info("Forcing to recreate TypeSpec LSP server...");
                      tel.lastStep = "Recreate LSP client in force";
                      return await recreateLSPClient(context, tel.activityId);
                    }
                    if (tspLanguageClient && tspLanguageClient.state === State.Running) {
                      tel.lastStep = "Restart LSP client";
                      await tspLanguageClient.restart();
                      return { code: ResultCode.Success, value: tspLanguageClient };
                    } else {
                      logger.info(
                        "TypeSpec LSP server is not running which is not expected, try to recreate and start...",
                      );
                      tel.lastStep = "Recreate LSP client";
                      return await recreateLSPClient(context, tel.activityId);
                    }
                  },
                  args?.activityId,
                  (e) => {
                    logger.error(
                      "Unexpected error when restarting TypeSpec language server.",
                      [e],
                      { showPopup: true },
                    );
                    return { code: ResultCode.Fail };
                  },
                );
              },
            );
          },
        ),
      );

      context.subscriptions.push(
        commands.registerCommand(
          CommandName.InstallGlobalCompilerCli,
          async (args: InstallGlobalCliCommandArgs | undefined) => {
            return await installCompilerGlobally(args);
          },
        ),
      );

      context.subscriptions.push(
        commands.registerCommand(CommandName.CreateProject, async () => {
          await createTypeSpecProject(context, stateManager);
        }),
      );

      context.subscriptions.push(
        commands.registerCommand(CommandName.ImportFromOpenApi3, async (uri: vscode.Uri) => {
          await importFromOpenApi3(uri);
        }),
      );

      context.subscriptions.push(
        commands.registerCommand(CommandName.ShowOpenApi3, async (uri: vscode.Uri) => {
          await telemetryClient.doOperationWithTelemetry(
            TelemetryEventName.PreviewOpenApi3,
            async (tel): Promise<ResultCode> => {
              if (!tspLanguageClient || tspLanguageClient.state !== State.Running) {
                logger.error(
                  "TypeSpec language server is not running. Please restart the server.",
                  [],
                  { showPopup: true },
                );
                telemetryClient.logOperationDetailTelemetry(tel.activityId, {
                  error: "LSP client is not running",
                });
                tel.lastStep = "Check LSP client";
                return ResultCode.Fail;
              }
              return await showOpenApi3(uri, context, tspLanguageClient, tel);
            },
            undefined,
            (e) => {
              logger.error("Unexpected error when previewing OpenAPI3.", [e], {
                showPopup: true,
              });
              return ResultCode.Fail;
            },
          );
        }),
      );

      context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
          if (e.affectsConfiguration(SettingName.TspServerPath)) {
            logger.info("TypeSpec server path changed, restarting server...");
            await telemetryClient.doOperationWithTelemetry(
              TelemetryEventName.ServerPathSettingChanged,
              async (tel) => {
                tel.lastStep = "Recreate LSP client for path change";
                return await recreateLSPClient(context, tel.activityId);
              },
              undefined,
              (e) => {
                logger.error("Unexpected error when restarting server after path change.", [e], {
                  showPopup: true,
                });
                return { code: ResultCode.Fail };
              },
            );
          }
        }),
      );

      // Only try to start language server when some workspace has been opened
      // because the LanguageClient class will popup error notification in vscode directly if failing to start
      // which will be confusing to user if no workspace is opened (i.e. in Create TypeSpec project scenario)
      if (
        (vscode.workspace.workspaceFolders?.length ?? 0) > 0 ||
        // still need to check opened files when there is no workspace opened
        vscode.window.tabGroups.all
          .flatMap((tg) => tg.tabs)
          .findIndex((t) => {
            if (!t.input || !(t.input instanceof TabInputText) || !t.input.uri) {
              return false;
            }
            // When an untitled file being renamed to .tsp file, our extension will be activated
            // before the file info being refreshed properly, so need to check the untitled file too here.
            // untitled file has the scheme "untitled"
            if (t.input.uri.scheme === "untitled") {
              return true;
            }
            // only handle .tsp file, not tspconfig.yaml file because
            // vscode won't activate our extension if tspconfig.yaml is opened without workspace because we are using "workspaceContains:..." activation event now.
            // In order to cover "tspconfig.yaml" file, we would need to hook on "onStartupFinish" or "*" activation event
            // and check whether we should do real job in onDidOpenTextDocument event ourselves.
            // Considering
            //   - it's not a good idea to start our extension whenever vscode is started
            //   - the increasement of complaxity to handle activation ourselves
            //   - purely open a tspconfig.yaml file without other .tsp file as well as without workspace is a related corner case
            //   - user can easily workaround this by calling "Restart TypeSpec Server" command
            // We won't handle this case for now and may revisit this if we get more feedbacks from users.
            return t.input.uri.fsPath.endsWith(".tsp");
          }) >= 0
      ) {
        await telemetryClient.doOperationWithTelemetry<ResultCode>(
          TelemetryEventName.StartServer,
          async (ssTel: OperationTelemetryEvent): Promise<ResultCode> => {
            const startLspWithProgress = async () => {
              return await vscode.window.withProgress(
                {
                  title: "Launching TypeSpec language service...",
                  location: vscode.ProgressLocation.Window,
                },
                async () => {
                  return await recreateLSPClient(context, ssTel.activityId);
                },
              );
            };
            const tspClientStateToResultCode = () => {
              return tspLanguageClient && tspLanguageClient.state === State.Running
                ? ResultCode.Success
                : ResultCode.Fail;
            };
            await startLspWithProgress();
            if (tspLanguageClient) {
              ssTel.lastStep = "LSP client created (first try)";
              return tspClientStateToResultCode();
            }
            // client will be undefined only when we can't find compiler locally or globally
            // otherwise, the client should always be created though the start command may fail which is a different case
            ssTel.lastStep = "Compiler not found (prompting to install)";
            const choice: "Yes" | "Ignore" | undefined = await vscode.window.showWarningMessage(
              "No TypeSpec compiler found which is required to start TypeSpec language server. Do you want to install TypeSpec compiler?",
              "Yes",
              "Ignore",
            );
            if (choice === undefined || choice === "Ignore") {
              logger.info("User cancelled the prompt to install TypeSpec compiler.");
              ssTel.lastStep = "Prompt to install TypeSpec compiler (cancelled).";
              return ResultCode.Cancelled;
            }

            const foldersWithPackageJson = (
              await vscode.workspace.findFiles("**/package.json", "**/node_modules/**")
            ).map((uri) => normalizePath(getDirectoryPath(uri.fsPath)));
            const workspaceFolders =
              vscode.workspace.workspaceFolders?.map((f) => normalizePath(f.uri.fsPath)) ?? [];
            const pathChoices = [
              ...new Set<string>([...workspaceFolders, ...foldersWithPackageJson]),
            ].sort();
            pathChoices.push("global");

            const installResult = await installCompilerWithUi({ confirmNeeded: true }, pathChoices);
            if (installResult.code === ResultCode.Success) {
              logger.info(
                "TypeSpec compiler installed successfully. Try to start LSP server again.",
              );
              await startLspWithProgress();
              ssTel.lastStep = "LSP client created (after install)";
              return tspClientStateToResultCode();
            } else if (
              installResult.code === ResultCode.Fail ||
              installResult.code === ResultCode.Timeout
            ) {
              logger.error(
                "Failed to install TypeSpec compiler. Please check previous logs for details.",
                [],
                { showPopup: true },
              );
              ssTel.lastStep = "Failed to install TypeSpec compiler.";
            } else {
              ssTel.lastStep = "Install TypeSpec compiler cancelled.";
            }
            return installResult.code;
          },
          tel.activityId,
          (e) => {
            logger.error("Unexpected error when starting TypeSpec language server.", [e], {
              showPopup: true,
            });
            return ResultCode.Fail;
          },
        );
      } else {
        logger.info("No workspace opened, Skip starting TypeSpec language service.");
        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          compilerLocation: "skipped-no-workspace-or-tsp-file",
        });
      }
      await initializeTypeSpecAuthoringSkillTrigger();
      showStartUpMessages(stateManager);
      telemetryClient.sendDelayedTelemetryEvents();
      return ResultCode.Success;
    },
    undefined,
    (e) => {
      logger.error("Unexpected error when starting TypeSpec extension.", [e], {
        showPopup: true,
      });
      return ResultCode.Fail;
    },
  );

  // Expose API for other extensions to consume
  const api: TypeSpecExtensionApi = {
    /** Register more InitTemplateUrls which will be included in the Create TypeSpec Project scenario */
    registerInitTemplateUrls(items: InitTemplatesUrlSetting[]) {
      registerInitTemplateUrlsInternal(items);
    },
  };
  return api;
}

export async function deactivate() {
  try {
    await tspLanguageClient?.stop();
    await clearOpenApi3PreviewTempFolders();
  } catch (e) {
    logger.error("Error during extension deactivation", [e]);
  }
}

async function recreateLSPClient(
  context: ExtensionContext,
  activityId: string,
): Promise<Result<TspLanguageClient>> {
  try {
    logger.info("Recreating TypeSpec LSP server...");
    const oldClient = tspLanguageClient;
    setTspLanguageClient(await TspLanguageClient.create(activityId, context, outputChannel));
    await oldClient?.stop();
    if (!tspLanguageClient) {
      telemetryClient.logOperationDetailTelemetry(activityId, {
        error: "Failed to create TspLanguageClient. Compiler could not be resolved.",
      });
      return { code: ResultCode.Fail, details: "Failed to create TspLanguageClient." };
    } else {
      await tspLanguageClient.start(activityId);
      if (tspLanguageClient.state === State.Running) {
        telemetryClient.logOperationDetailTelemetry(activityId, {
          compilerVersion: tspLanguageClient.initializeResult?.serverInfo?.version ?? "< 0.64.0",
        });
        return { code: ResultCode.Success, value: tspLanguageClient };
      } else {
        telemetryClient.logOperationDetailTelemetry(activityId, {
          error: `Failed to start TspLanguageClient. State: ${tspLanguageClient.state}`,
        });
        return { code: ResultCode.Fail, details: "TspLanguageClient is not running." };
      }
    }
  } catch (e) {
    logger.error(
      "TypeSpec language server is unavailable due to an unexpected error. Please restart the server.",
      [e],
      { showPopup: true },
    );
    telemetryClient.logOperationDetailTelemetry(activityId, {
      error: `Unexpected error in recreateLSPClient: ${e}`,
    });
    return { code: ResultCode.Fail, details: `Unexpected error: ${e}` };
  }
}

function showStartUpMessages(stateManager: ExtensionStateManager) {
  vscode.workspace.workspaceFolders?.forEach((workspaceFolder) => {
    const msg = stateManager.loadStartUpMessage(workspaceFolder.uri.fsPath);
    if (msg) {
      logger.log("debug", "Start up message found for folder: " + workspaceFolder.uri.fsPath);
      if (isWhitespaceStringOrUndefined(msg.detail)) {
        logger.log(msg.level, msg.popupMessage, [], {
          showPopup: true,
          popupButtonText: "",
        });
      } else {
        const SHOW_DETAIL = "View Details in Output";
        const popupAction = getPopupAction(msg.level);
        if (popupAction) {
          popupAction(msg.popupMessage, SHOW_DETAIL).then((action) => {
            if (action === SHOW_DETAIL) {
              outputChannel.show(true);
            }
            // log the start up message to Output no matter user clicked the button or not
            // and there are many logs coming when starting the extension, so
            // log the message when the popup is clicked (or disappearing) to make sure these logs are shown at the end of the Output window to catch
            // user's attention.
            logger.log(msg.level, msg.popupMessage + "\n", [msg.detail]);
          });
        }
      }
    } else {
      logger.log("debug", "No start up message found for folder: " + workspaceFolder.uri.fsPath);
    }
    stateManager.cleanUpStartUpMessage(workspaceFolder.uri.fsPath);
  });
}
