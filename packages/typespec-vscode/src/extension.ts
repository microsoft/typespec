import vscode, { commands, ExtensionContext } from "vscode";
import { SettingName } from "./const.js";
import { doEmit } from "./emit/emit.js";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { createTaskProvider } from "./task-provider.js";
import { TspLanguageClient } from "./tsp-language-client.js";

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

  /* code generation command. */
  context.subscriptions.push(
    commands.registerCommand("typespec.GenerateSDK", async (uri: vscode.Uri) => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "TypeSpec: Gerating Client SDK...",
          cancellable: false,
        },
        async (progress) => await doEmit(context, uri, progress),
      );
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

  const taskDisposal = vscode.tasks.registerTaskProvider("typespec", {
    provideTasks: () => {
      return generatSdkTask();
    },
    resolveTask(_task: vscode.Task): vscode.Task | undefined {
      return undefined;
    },
  });
  context.subscriptions.push(taskDisposal);

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
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

function generatSdkTask(): vscode.Task[] {
  const task = new vscode.Task(
    {
      label: "Task: Generate SDK",
      type: "typespec",
    },
    vscode.TaskScope.Workspace,
    "Generate Sdk Task",
    "tsp",
    new vscode.ShellExecution("code --command 'typespec.GenerateSDK'"),
    // new vscode.ShellExecution("code --command 'typespec.GenerateSDK'"),
  );
  return [task];
}
