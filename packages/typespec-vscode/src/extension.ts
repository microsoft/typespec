import vscode, { commands, ExtensionContext, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions } from "vscode-languageclient/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import npmPackageProvider from "./npm-package-provider.js";
import { resolveTypeSpecServer } from "./typespec/compiler.js";
import schemaProvider from "./typespec/schema-provider.js";
import { provideTspconfigCompletionItems } from "./vscode/completion-item-provider.js";
import { createTaskProvider } from "./vscode/task-provider.js";
import { TypeSpecLogOutputChannel } from "./vscode/typespec-log-output-channel.js";

let client: LanguageClient | undefined;
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
    commands.registerCommand("typespec.restartServer", restartTypeSpecServer),
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "yaml", scheme: "file", pattern: "**/tspconfig.yaml" },
      {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
          const doc: TextDocument = TextDocument.create(
            document.uri.toString(),
            document.languageId,
            document.version,
            document.getText(),
          );
          const items = await provideTspconfigCompletionItems(doc, position);
          return items.map((item) => {
            const r = new vscode.CompletionItem(item.label);
            switch (item.kind) {
              case "field":
                r.kind = vscode.CompletionItemKind.Field;
                break;
              case "value":
                r.kind = vscode.CompletionItemKind.Value;
                break;
              default:
                logger.debug(`Unknown kind of completion item: ${item.kind}`);
                r.kind = vscode.CompletionItemKind.Text;
            }
            // TODO: double check how to determine the documentation is markdown or not
            r.documentation = item.documentation?.includes("```")
              ? new vscode.MarkdownString(item.documentation)
              : item.documentation;
            r.insertText = item.insertText;
            return r;
          });
        },
      },
    ),
  );

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => launchLanguageClient(context),
  );
}

async function restartTypeSpecServer(): Promise<void> {
  if (!client) {
    logger.error("Unexpected Error: LSP client is undefined for TypeSpec server.");
    return;
  }
  if (client.needsStop()) {
    await client.restart();
    logger.debug("TypeSpec server restarted");
  } else if (client.needsStart()) {
    await client.start();
    logger.debug("TypeSpec server started");
  } else {
    logger.warning(
      "Both needsStop() and needsStart() return false when restarting TypeSpec server. Please try to restart again later.",
    );
  }
}

async function launchLanguageClient(context: ExtensionContext) {
  const exe = await resolveTypeSpecServer(context);
  logger.debug("TypeSpec server resolved as ", [exe]);
  const options: LanguageClientOptions = {
    synchronize: {
      // Synchronize the setting section 'typespec' to the server
      configurationSection: "typespec",
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.cadl"),
        workspace.createFileSystemWatcher("**/cadl-project.yaml"),
        workspace.createFileSystemWatcher("**/*.tsp"),
        workspace.createFileSystemWatcher("**/tspconfig.yaml"),
        workspace.createFileSystemWatcher("**/package.json"),
      ],
    },
    documentSelector: [
      { scheme: "file", language: "typespec" },
      { scheme: "untitled", language: "typespec" },
    ],
    outputChannel,
  };

  const name = "TypeSpec";
  const id = "typespec";
  try {
    client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
    await client.start();
    logger.debug("TypeSpec server started");
    schemaProvider.init(client);
  } catch (e) {
    if (typeof e === "string" && e.startsWith("Launching server using command")) {
      const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

      logger.error(
        [
          `TypeSpec server executable was not found: '${exe.command}' is not found. Make sure either:`,
          ` - TypeSpec is installed locally at the root of this workspace ("${workspaceFolder}") or in a parent directory.`,
          " - TypeSpec is installed globally with `npm install -g @typespec/compiler'.",
          " - TypeSpec server path is configured with https://github.com/microsoft/typespec#installing-vs-code-extension.",
        ].join("\n"),
        [],
        { showOutput: false, showPopup: true },
      );
      logger.error("Error detail", [e]);
      throw `TypeSpec server executable was not found: '${exe.command}' is not found.`;
    } else {
      throw e;
    }
  }
}

export async function deactivate() {
  npmPackageProvider.reset();
  await client?.stop();
}
