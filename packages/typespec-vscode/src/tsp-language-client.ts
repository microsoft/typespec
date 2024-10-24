import { ExtensionContext, LogOutputChannel, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";
import { resolveTypeSpecServer } from "./tsp-executable-resolver.js";

export class TspLanguageClient {
  private client: LanguageClient | undefined;

  constructor(){}
  
  async restart(): Promise<void> {
    if (!this.client) {
      logger.error("Unexpected Error: LSP client is undefined for TypeSpec server.");
      return;
    }
    if (this.client.needsStop()) {
      await this.client.restart();
      logger.debug("TypeSpec server restarted");
    } else if (this.client.needsStart()) {
      await this.client.start();
      logger.debug("TypeSpec server started");
    } else {
      logger.warning(
        "Both needsStop() and needsStart() return false when restarting TypeSpec server. Please try to restart again later.",
      );
    }
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.stop();
      logger.debug("TypeSpec server stopped");
    }
  }

  async start(context: ExtensionContext, outputChannel: LogOutputChannel): Promise<void> {
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
        { scheme: "file", language: "yaml", pattern: "**/tspconfig.yaml" },
        { scheme: "untitled", language: "yaml", pattern: "**/tspconfig.yaml" },
      ],
      outputChannel,
    };

    const name = "TypeSpec";
    const id = "typespec";
    try {
      this.client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
      await this.client.start();
      logger.debug("TypeSpec server started");
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
}
