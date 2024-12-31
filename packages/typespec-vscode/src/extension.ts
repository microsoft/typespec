import vscode, { commands, ExtensionContext } from "vscode";
import { createCodeActionProvider } from "./code-action-provider.js";
import { SettingName } from "./const.js";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { createTaskProvider } from "./task-provider.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { createCommandOpenUrl } from "./vscode-command.js";

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
  context.subscriptions.push(createCommandOpenUrl());

  context.subscriptions.push(
    commands.registerCommand("typespec.showOutputChannel", () => {
      outputChannel.show(true /*preserveFocus*/);
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("typespec.restartServer", async () => {
      if (client) {
        await client.restart();
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(SettingName.TspServerPath)) {
        logger.info("TypeSpec server path changed, restarting server...");
        const oldClient = client;
        client = await TspLanguageClient.create(context, outputChannel);
        await oldClient?.stop();
        await client.start();
      }
    }),
  );

  const tipToolTitle = vscode.l10n.t("Launching TypeSpec language service...");
  return await vscode.window.withProgress(
    {
      title: tipToolTitle,
      location: vscode.ProgressLocation.Notification,
    },
    async () => {
      client = await TspLanguageClient.create(context, outputChannel);
      await client.start();
    },
  );
}

export async function deactivate() {
  await client?.stop();
}
