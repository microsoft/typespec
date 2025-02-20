import vscode, { commands, ExtensionContext, TabInputText } from "vscode";
import { State } from "vscode-languageclient";
import { createCodeActionProvider } from "./code-action-provider.js";
import { ExtensionStateManager } from "./extension-state-manager.js";
import { ExtensionLogListener, getPopupAction } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { createTaskProvider } from "./task-provider.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import {
  CommandName,
  InstallGlobalCliCommandArgs,
  RestartServerCommandArgs,
  SettingName,
} from "./types.js";
import { isWhitespaceStringOrUndefined } from "./utils.js";
import { createTypeSpecProject } from "./vscode-cmd/create-tsp-project.js";
import { emitCode } from "./vscode-cmd/emit-code/emit-code.js";
import { importFromOpenApi3 } from "./vscode-cmd/import-from-openapi3.js";
import { installCompilerGlobally } from "./vscode-cmd/install-tsp-compiler.js";

let client: TspLanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension-log", new ExtensionLogListener(outputChannel));

export async function activate(context: ExtensionContext) {
  const stateManager = new ExtensionStateManager(context);

  context.subscriptions.push(createTaskProvider());

  context.subscriptions.push(createCodeActionProvider());

  context.subscriptions.push(
    commands.registerCommand(CommandName.ShowOutputChannel, () => {
      outputChannel.show(true /*preserveFocus*/);
    }),
  );

  context.subscriptions.push(
    commands.registerCommand(CommandName.OpenUrl, (url: string) => {
      try {
        vscode.env.openExternal(vscode.Uri.parse(url));
      } catch (error) {
        logger.error(`Failed to open URL: ${url}`, [error as any]);
      }
    }),
  );

  /* emit command. */
  context.subscriptions.push(
    commands.registerCommand(CommandName.GenerateCode, async (uri: vscode.Uri) => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Generate from TypeSpec...",
          cancellable: false,
        },
        async () => await emitCode(context, uri),
      );
    }),
  );

  context.subscriptions.push(
    commands.registerCommand(
      CommandName.RestartServer,
      async (args: RestartServerCommandArgs | undefined): Promise<TspLanguageClient> => {
        return vscode.window.withProgress(
          {
            title: args?.notificationMessage ?? "Restarting TypeSpec language service...",
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            if (args?.forceRecreate === true) {
              logger.info("Forcing to recreate TypeSpec LSP server...");
              return await recreateLSPClient(context);
            }
            if (client && client.state === State.Running) {
              await client.restart();
              return client;
            } else {
              logger.info(
                "TypeSpec LSP server is not running which is not expected, try to recreate and start...",
              );
              return recreateLSPClient(context);
            }
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
      await createTypeSpecProject(client, stateManager);
    }),
  );

  context.subscriptions.push(
    commands.registerCommand(CommandName.ImportFromOpenApi3, async (uri: vscode.Uri) => {
      await importFromOpenApi3(uri);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(SettingName.TspServerPath)) {
        logger.info("TypeSpec server path changed, restarting server...");
        await recreateLSPClient(context);
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
    await vscode.window.withProgress(
      {
        title: "Launching TypeSpec language service...",
        location: vscode.ProgressLocation.Notification,
      },
      async () => {
        await recreateLSPClient(context);
      },
    );
  } else {
    logger.info("No workspace opened, Skip starting TypeSpec language service.");
  }
  showStartUpMessages(stateManager);
}

export async function deactivate() {
  await client?.stop();
}

async function recreateLSPClient(context: ExtensionContext) {
  logger.info("Recreating TypeSpec LSP server...");
  const oldClient = client;
  client = await TspLanguageClient.create(context, outputChannel);
  await oldClient?.stop();
  await client.start();
  return client;
}

function showStartUpMessages(stateManager: ExtensionStateManager) {
  vscode.workspace.workspaceFolders?.forEach((workspaceFolder) => {
    const msg = stateManager.loadStartUpMessage(workspaceFolder.uri.fsPath);
    if (msg) {
      logger.log("debug", "Start up message found for folder: " + workspaceFolder.uri.fsPath);
      if (isWhitespaceStringOrUndefined(msg.detail)) {
        logger.log(msg.level, msg.popupMessage, [], {
          showPopup: true,
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
