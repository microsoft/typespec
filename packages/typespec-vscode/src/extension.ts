// import "./pre-extension-activate" first for the code that needs to run before others
// sort-imports-ignore
import "./pre-extension-activate.js";

import vscode, { commands, ExtensionContext, TabInputText } from "vscode";
import { State } from "vscode-languageclient";
import { createCodeActionProvider } from "./code-action-provider.js";
import { setTspLanguageClient, tspLanguageClient } from "./extension-context.js";
import { ExtensionStateManager } from "./extension-state-manager.js";
import { ExtensionLogListener, getPopupAction } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { getDirectoryPath, normalizePath } from "./path-utils.js";
import { createTaskProvider } from "./task-provider.js";
import telemetryClient from "./telemetry/telemetry-client.js";
import { OperationTelemetryEvent, TelemetryEventName } from "./telemetry/telemetry-event.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import {
  CodeActionCommand,
  CommandName,
  InstallGlobalCliCommandArgs,
  RestartServerCommandArgs,
  RestartServerCommandResult,
  Result,
  ResultCode,
  SettingName,
  TypeSpecExtensionApi,
} from "./types.js";
import { installCompilerWithUi } from "./typespec-utils.js";
import { isWhitespaceStringOrUndefined, spawnExecutionAndLogToOutput } from "./utils.js";
import {
  createTypeSpecProject,
  InitTemplatesUrlSetting,
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

export async function activate(context: ExtensionContext) {
  await telemetryClient.doOperationWithTelemetry(
    TelemetryEventName.StartExtension,
    async (tel: OperationTelemetryEvent) => {
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
              return await showOpenApi3(uri, context, tspLanguageClient!, tel);
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
                return await recreateLSPClient(context, tel.activityId);
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
                  location: vscode.ProgressLocation.Notification,
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
            }
            return installResult.code;
          },
          tel.activityId,
        );
      } else {
        logger.info("No workspace opened, Skip starting TypeSpec language service.");
      }
      showStartUpMessages(stateManager);
      telemetryClient.sendDelayedTelemetryEvents();
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
  await tspLanguageClient?.stop();
  await clearOpenApi3PreviewTempFolders();
}

async function recreateLSPClient(
  context: ExtensionContext,
  activityId: string,
): Promise<Result<TspLanguageClient>> {
  logger.info("Recreating TypeSpec LSP server...");
  const oldClient = tspLanguageClient;
  setTspLanguageClient(await TspLanguageClient.create(activityId, context, outputChannel));
  await oldClient?.stop();
  if (!tspLanguageClient) {
    telemetryClient.logOperationDetailTelemetry(activityId, {
      error: "Failed to create TspLanguageClient",
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
        error: `Failed to start TspLanguageClient.`,
      });
      return { code: ResultCode.Fail, details: "TspLanguageClient is not running." };
    }
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
