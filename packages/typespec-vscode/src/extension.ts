import { cwd } from "process";
import vscode, { commands, ExtensionContext, QuickPickItem } from "vscode";
import { State } from "vscode-languageclient";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { createTaskProvider } from "./task-provider.js";
import { createTypeSpecProject } from "./tsp-create-project.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { CommandName, InstallGlobalCliCommandArgs, SettingName } from "./types.js";
import { createPromiseWithCancelAndTimeout, spawnExecutionAndLogToOutput } from "./utils.js";

let client: TspLanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension-log", new ExtensionLogListener(outputChannel));

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(createTaskProvider());

  context.subscriptions.push(
    commands.registerCommand(CommandName.ShowOutputChannel, () => {
      outputChannel.show(true /*preserveFocus*/);
    }),
  );

  context.subscriptions.push(
    commands.registerCommand(CommandName.RestartServer, async () => {
      if (client) {
        await client.restart();
      }
    }),
  );

  context.subscriptions.push(
    commands.registerCommand(
      CommandName.InstallGlobalCompilerCli,
      async (args: InstallGlobalCliCommandArgs | undefined) => {
        if (args?.confirm !== false) {
          const yes: QuickPickItem = {
            label: "Install TypeSpec Compiler/CLI globally",
            detail: "Minimum Requirements: 'Node.js 20 LTS' && 'npm avaliable in command prompt'",
            description: " by 'npm install -g @typespec/compiler'",
          };
          const no: QuickPickItem = { label: "Cancel" };
          const title = args?.confirmTitle ?? "Please check the requirements and confirm...";
          const confirm = await vscode.window.showQuickPick<QuickPickItem>([yes, no], {
            title,
            placeHolder: args?.confirmPlaceholder ?? title,
          });
          if (confirm !== yes) {
            logger.info("User cancelled the installation of TypeSpec Compiler/CLI");
            return undefined;
          } else {
            logger.info("User confirmed the installation of TypeSpec Compiler/CLI");
          }
        } else {
          logger.info("Installing TypeSpec Compiler/CLI with confirmation disabled explicitly...");
        }
        return await vscode.window.withProgress<TspLanguageClient | undefined>(
          {
            title: "Installing TypeSpec Compiler/CLI...",
            location: vscode.ProgressLocation.Notification,
            cancellable: true,
          },
          async (_progress, token) => {
            const TIMEOUT = 300000; // set timeout to 5 minutes which should be enough for installing compiler
            try {
              const output = await createPromiseWithCancelAndTimeout(
                spawnExecutionAndLogToOutput("npm", ["install", "-g", "@typespec/compiler"], cwd()),
                token,
                TIMEOUT,
              );
              if (output.exitCode !== 0) {
                logger.error(
                  "Failed to install TypeSpec CLI. Please check the previous log for details",
                  [output],
                  { showOutput: true, showPopup: true },
                );
                return undefined;
              } else {
                logger.info("TypeSpec CLI installed successfully");
                if (args?.forceRecreateLsp || !client || client.state !== State.Running) {
                  await recreateLSPClient(context, args?.popupRecreateLspError);
                }
                return client;
              }
            } catch (e) {
              if (e === "cancelled") {
                logger.info("Installation of TypeSpec Compiler/CLI is cancelled by user");
                return undefined;
              } else if (e === "timeout") {
                logger.error(`Installation of TypeSpec Compiler/CLI is timeout after ${TIMEOUT}ms`);
                return undefined;
              } else {
                logger.error("Unexpected error when installing TypeSpec Compiler/CLI", [e]);
                return undefined;
              }
            }
          },
        );
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
