import vscode, { commands, ExtensionContext } from "vscode";
import { State } from "vscode-languageclient";
import { createCodeActionProvider } from "./code-action-provider.js";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
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
import { createTypeSpecProject } from "./vscode-cmd/create-tsp-project.js";
import { installCompilerGlobally } from "./vscode-cmd/install-tsp-compiler.js";

let client: TspLanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension-log", new ExtensionLogListener(outputChannel));

export async function activate(context: ExtensionContext) {
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

  context.subscriptions.push(
    commands.registerCommand(
      CommandName.RestartServer,
      async (args: RestartServerCommandArgs | undefined): Promise<TspLanguageClient> => {
        return vscode.window.withProgress(
          {
            title: "Restarting TypeSpec language service...",
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            if (args?.forceRecreate === true) {
              logger.info("Forcing to recreate TypeSpec LSP server...");
              return await recreateLSPClient(context, args?.popupRecreateLspError);
            }
            if (client && client.state === State.Running) {
              await client.restart();
              return client;
            } else {
              logger.info(
                "TypeSpec LSP server is not running which is not expected, try to recreate and start...",
              );
              return recreateLSPClient(context, args?.popupRecreateLspError);
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
      await createTypeSpecProject(client);
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

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => {
      await recreateLSPClient(context);
    },
  );
}

export async function deactivate() {
  await client?.stop();
}

async function recreateLSPClient(context: ExtensionContext, showPopupWhenError?: boolean) {
  logger.info("Recreating TypeSpec LSP server...");
  const oldClient = client;
  client = await TspLanguageClient.create(context, outputChannel);
  await oldClient?.stop();
  await client.start(showPopupWhenError ?? (vscode.workspace.workspaceFolders?.length ?? 0) > 0);
  return client;
}
