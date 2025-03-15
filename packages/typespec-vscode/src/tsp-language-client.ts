import type {
  CustomRequestName,
  InitProjectConfig,
  InitProjectContext,
  InitProjectTemplate,
  ServerInitializeResult,
} from "@typespec/compiler";
import { inspect } from "util";
import { ExtensionContext, LogOutputChannel, RelativePattern, workspace } from "vscode";
import { Executable, LanguageClient, LanguageClientOptions } from "vscode-languageclient/node.js";
import { TspConfigFileName } from "./const.js";
import logger from "./log/logger.js";
import telemetryClient from "./telemetry/telemetry-client.js";
import { resolveTypeSpecServer } from "./tsp-executable-resolver.js";
import {
  ExecOutput,
  isWhitespaceStringOrUndefined,
  listParentFolder,
  spawnExecutionAndLogToOutput,
} from "./utils.js";

export class TspLanguageClient {
  constructor(
    private client: LanguageClient,
    private exe: Executable,
  ) {}

  private initProjectContext?: InitProjectContext;

  get state() {
    return this.client.state;
  }

  get initializeResult(): ServerInitializeResult | undefined {
    return this.client.initializeResult as ServerInitializeResult;
  }

  async getInitProjectContext(): Promise<InitProjectContext | undefined> {
    if (this.initProjectContext) {
      return this.initProjectContext;
    }

    if (this.initializeResult?.customCapacities?.getInitProjectContext !== true) {
      logger.warning(
        "Get init project context is not supported by the current TypeSpec Compiler's LSP.",
      );
      return undefined;
    }
    const getInitProjectContextRequestName: CustomRequestName = "typespec/getInitProjectContext";
    try {
      this.initProjectContext = await this.client.sendRequest(getInitProjectContextRequestName);
      return this.initProjectContext;
    } catch (e) {
      logger.error("Unexpected error when getting init project context", [e]);
      return undefined;
    }
  }

  async validateInitProjectTemplate(template: InitProjectTemplate): Promise<boolean> {
    if (this.initializeResult?.customCapacities?.validateInitProjectTemplate !== true) {
      logger.warning(
        "Validate init project template is not supported by the current TypeSpec Compiler's LSP.",
      );
      return false;
    }
    const validateInitProjectTemplateRequestName: CustomRequestName =
      "typespec/validateInitProjectTemplate";
    try {
      return await this.client.sendRequest(validateInitProjectTemplateRequestName, { template });
    } catch (e) {
      logger.error("Unexpected error when validating init project template", [e]);
      return false;
    }
  }

  async initProject(config: InitProjectConfig): Promise<boolean> {
    if (this.initializeResult?.customCapacities?.initProject !== true) {
      logger.warning("Init project is not supported by the current TypeSpec Compiler's LSP.");
      return false;
    }
    const initProjectRequestName: CustomRequestName = "typespec/initProject";
    try {
      const result = await this.client.sendRequest(initProjectRequestName, { config });
      return result === true;
    } catch (e) {
      logger.error("Unexpected error when initializing project", [e]);
      return false;
    }
  }

  async runCliCommand(args: string[], cwd: string): Promise<ExecOutput | undefined> {
    if (isWhitespaceStringOrUndefined(this.initializeResult?.compilerCliJsPath)) {
      logger.warning(
        `Failed to run cli command with args [${args.join(", ")}] because no compilerCliJsPath is provided by the server. Please consider upgrade TypeSpec Compiler.`,
      );
      return undefined;
    }
    try {
      const result = await spawnExecutionAndLogToOutput(
        "node",
        [this.initializeResult!.compilerCliJsPath!, ...args],
        cwd,
      );
      if (result.exitCode !== 0) {
        logger.error(
          `Cli command with args [${args.join(", ")}] finishes with non-zero exit code ${result.exitCode}. Please check previous log for details`,
          result.error ? [result.error] : [],
        );
      }
      return result;
    } catch (e) {
      logger.error(`Unexpected error when running Cli command with args [${args.join(", ")}]`, [e]);
      return undefined;
    }
  }

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

  async start(activityId: string): Promise<void> {
    try {
      if (this.client.needsStart()) {
        // please be aware that this method would popup error notification in vscode directly
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
            " - TypeSpec server path is configured with https://typespec.io/docs/introduction/editor/vscode/#configure.",
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
      telemetryClient.logOperationDetailTelemetry(activityId, {
        error: `Error when starting TypeSpec server: ${inspect(e)}`,
      });
    }
  }

  async dispose(): Promise<void> {
    if (this.client) {
      await this.client.dispose();
    }
  }

  static async create(
    activityId: string,
    context: ExtensionContext,
    outputChannel: LogOutputChannel,
  ): Promise<TspLanguageClient> {
    const exe = await resolveTypeSpecServer(activityId, context);
    logger.debug("TypeSpec server resolved as ", [exe]);
    const watchers = [
      workspace.createFileSystemWatcher("**/*.tsp"),
      workspace.createFileSystemWatcher(`**/${TspConfigFileName}`),
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
        { scheme: "file", language: "yaml", pattern: `**/${TspConfigFileName}` },
      ],
      outputChannel,
    };

    const name = "TypeSpec";
    const id = "typespec";
    const lc = new LanguageClient(id, name, { run: exe, debug: exe }, options);
    return new TspLanguageClient(lc, exe);
  }

  async compileOpenApi3(
    mainTspFile: string,
    srcFolder: string,
    outputFolder: string,
  ): Promise<ExecOutput | undefined> {
    const result = await this.runCliCommand(
      [
        "compile",
        mainTspFile,
        "--emit=@typespec/openapi3",
        "--option",
        "@typespec/openapi3.file-type=json",
        "--option",
        `@typespec/openapi3.emitter-output-dir=${outputFolder}`,
      ],
      srcFolder,
    );
    return result;
  }
}
