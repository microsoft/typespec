import { ExtensionContext, LogOutputChannel, RelativePattern, workspace } from "vscode";
import { Executable, LanguageClient, LanguageClientOptions } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";
import { resolveTypeSpecServer } from "./tsp-executable-resolver.js";
import { listParentFolder } from "./utils.js";

export class TspLanguageClient {
  constructor(
    private client: LanguageClient,
    private exe: Executable,
  ) {}

  async restart(): Promise<void> {
    try {
      if (this.client.needsStop()) {
        await this.client.restart();
        logger.info("TypeSpec server restarted");
      } else if (this.client.needsStart()) {
        await this.client.start();
        logger.info("TypeSpec server started");
      } else {
        logger.error(
          `Unexpected state when restarting TypeSpec server. state = ${this.client.state}.`,
        );
      }
    } catch (e) {
      logger.error("Error restarting TypeSpec server", [e]);
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.client.needsStop()) {
        await this.client.stop();
        logger.info("TypeSpec server stopped");
      } else {
        logger.warning("TypeSpec server is already stopped");
      }
    } catch (e) {
      logger.error("Error stopping TypeSpec server", [e]);
    }
  }

  async start(): Promise<void> {
    try {
      if (this.client.needsStart()) {
        await this.client.start();
        logger.info("TypeSpec server started");
      } else {
        logger.warning("TypeSpec server is already started");
      }
    } catch (e) {
      if (typeof e === "string" && e.startsWith("Launching server using command")) {
        const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

        logger.error(
          [
            `TypeSpec server executable was not found: '${this.exe.command}' is not found. Make sure either:`,
            ` - TypeSpec is installed locally at the root of this workspace ("${workspaceFolder}") or in a parent directory.`,
            " - TypeSpec is installed globally with `npm install -g @typespec/compiler'.",
            " - TypeSpec server path is configured with https://github.com/microsoft/typespec#installing-vs-code-extension.",
          ].join("\n"),
          [],
          { showOutput: false, showPopup: true },
        );
        logger.error("Error detail", [e]);
      } else {
        logger.error("Unexpected error when starting TypeSpec server", [e], {
          showOutput: false,
          showPopup: true,
        });
      }
    }
  }

  async dispose(): Promise<void> {
    if (this.client) {
      await this.client.dispose();
    }
  }

  static async create(
    context: ExtensionContext,
    outputChannel: LogOutputChannel,
  ): Promise<TspLanguageClient> {
    const exe = await resolveTypeSpecServer(context);
    logger.debug("TypeSpec server resolved as ", [exe]);
    const watchers = [
      workspace.createFileSystemWatcher("**/*.cadl"),
      workspace.createFileSystemWatcher("**/cadl-project.yaml"),
      workspace.createFileSystemWatcher("**/*.tsp"),
      workspace.createFileSystemWatcher("**/tspconfig.yaml"),
      // please be aware that the vscode watch with '**' will honer the files.watcherExclude settings
      // so we won't get notification for those package.json under node_modules
      // if our customers exclude the node_modules folder in files.watcherExclude settings.
      workspace.createFileSystemWatcher("**/package.json"),
    ];
    for (const folder of workspace.workspaceFolders ?? []) {
      for (const p of listParentFolder(folder.uri.fsPath, false /*includeSelf*/)) {
        watchers.push(workspace.createFileSystemWatcher(new RelativePattern(p, "package.json")));
      }
    }
    watchers.forEach((w) => context.subscriptions.push(w));

    const options: LanguageClientOptions = {
      synchronize: {
        // Synchronize the setting section 'typespec' to the server
        configurationSection: "typespec",
        fileEvents: watchers,
      },
      documentSelector: [
        { scheme: "file", language: "typespec" },
        { scheme: "untitled", language: "typespec" },
        { scheme: "file", language: "yaml", pattern: "**/tspconfig.yaml" },
      ],
      outputChannel,
    };

    const name = "TypeSpec";
    const id = "typespec";
    const lc = new LanguageClient(id, name, { run: exe, debug: exe }, options);
    return new TspLanguageClient(lc, exe);
  }
}
