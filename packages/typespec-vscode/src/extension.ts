import { ResolveModuleHost } from "@typespec/compiler/module-resolver";
import { readFile, realpath, stat } from "fs/promises";
import { join } from "path";
import vscode, { ExtensionContext, commands, workspace } from "vscode";
import {
  Executable,
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node.js";
import logger from "./extension-logger.js";
import { TypeSpecLogOutputChannel } from "./typespec-log-output-channel.js";
import { normalizeSlash } from "./utils.js";

let client: LanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.outputChannel = outputChannel;

export async function activate(context: ExtensionContext) {
  const cli: Executable = await resolveTypeSpecCli(context);
  context.subscriptions.push(createTaskProvider(context, cli));

  context.subscriptions.push(
    commands.registerCommand("typespec.showOutputChannel", () => {
      outputChannel.show(true /*preserveFocus*/);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("typespec.restartServer", restartTypeSpecServer)
  );

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => launchLanguageClient(context)
  );
}

export function createTaskProvider(context: ExtensionContext, cli: Executable) {
  return vscode.tasks.registerTaskProvider("typespec", {
    provideTasks: async () => {
      const targetPathes = await vscode.workspace
        .findFiles("**/main.tsp")
        .then((uris) =>
          uris
            .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
            .map((uri) => normalizeSlash(uri.fsPath))
        );
      const tasks: vscode.Task[] = [];
      for (const targetPath of targetPathes) {
        const cTask = createTask(cli, `compile - ${targetPath}`, targetPath);
        if (cTask) tasks.push(cTask);
        const wTask = createTask(cli, `watch - ${targetPath}`, targetPath, "--watch");
        if (wTask) tasks.push(wTask);
      }
      return tasks;
    },
    resolveTask: async (task: vscode.Task): Promise<vscode.Task | undefined> => {
      if (task.definition.type === "typespec" && task.name && task.definition.path) {
        const t = createTask(cli, task.name, task.definition.path, task.definition.args);
        // returned task's definition must be the same object as the given task's definition
        // otherwise vscode woould report error that the task is not resolved
        t.definition = task.definition;
        return t;
      }
      return undefined;
    },
  });
}

export function createTask(cli: Executable, name: string, targetPath: string, args?: string) {
  logger.debug(`Creating tsp task with path as '${targetPath}'`);
  let workspaceFolder = workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath;
  if (!workspaceFolder) {
    workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    logger.warning(
      `Can't resolve workspace folder from given file ${targetPath}. Try to use the first workspace folder ${workspaceFolder}.`
    );
  }
  targetPath = normalizeSlash(targetPath);

  let cmd = `${cli.command} ${cli.args?.join(" ") ?? ""} compile "${targetPath}" ${args === undefined ? "" : args}`;
  logger.debug(`tsp compile task created '${targetPath}' with command: '${cmd}'`);
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  cmd = variableResolver.resolve(cmd);
  logger.debug(`tsp compile task command resolved to: ${cmd} with cwd "${workspaceFolder}"`);
  return new vscode.Task(
    {
      type: "typespec",
      path: targetPath,
      args: args,
    },
    vscode.TaskScope.Workspace,
    name,
    "tsp",
    workspaceFolder
      ? new vscode.ShellExecution(cmd, { cwd: workspaceFolder })
      : new vscode.ShellExecution(cmd)
  );
}

async function restartTypeSpecServer(): Promise<void> {
  if (client) {
    await client.stop();
    await client.start();
    logger.debug("TypeSpec server restarted");
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
        { showOutput: false, showPopup: true }
      );
      logger.error("Error detail", [e]);
      throw `TypeSpec server executable was not found: '${exe.command}' is not found.`;
    } else {
      throw e;
    }
  }
}

async function resolveTypeSpecExecutable(
  context: ExtensionContext,
  mode: "cli" | "server"
): Promise<Executable> {
  const devModeScriptName = mode === "cli" ? "cli" : "server";
  const cmdName = mode === "cli" ? "tsp" : "tsp-server";
  const nodeOptions =
    mode === "cli"
      ? process.env.TYPESPEC_CLI_NODE_OPTIONS
      : process.env.TYPESPEC_SERVER_MODE_OPTIONS;
  const args: string[] = mode === "cli" ? [] : ["--stdio"];

  // In development mode (F5 launch from source), resolve to locally built cli.js or server.js.
  if (process.env.TYPESPEC_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath(`../compiler/entrypoints/${devModeScriptName}.js`);
    // we use CLI instead of NODE_OPTIONS environment variable in this case
    // because --nolazy is not supported by NODE_OPTIONS.
    const options = nodeOptions?.split(" ").filter((o) => o) ?? [];
    logger.debug(`TypeSpec command ${mode} resolved in development mode`);
    return { command: "node", args: [...options, script, ...args] };
  }

  const options: ExecutableOptions = {
    env: { ...process.env },
  };
  if (nodeOptions) {
    options.env.NODE_OPTIONS = nodeOptions;
  }

  // In production, first try VS Code configuration, which allows a global machine
  // location that is not on PATH, or a workspace-specific installation.
  let targetPath: string | undefined = workspace.getConfiguration().get(`typespec.${cmdName}.path`);
  if (targetPath && typeof targetPath !== "string") {
    throw new Error(`VS Code configuration option 'typespec.${cmdName}.path' must be a string`);
  }
  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

  // Default to tsp/tsp-server on PATH, which would come from `npm install -g
  // @typespec/compiler` in a vanilla setup.
  if (targetPath) {
    logger.debug(`Server path loaded from VS Code configuration: ${targetPath}`);
  } else {
    targetPath = await resolveLocalCompiler(workspaceFolder);
  }
  if (!targetPath) {
    const executable = process.platform === "win32" ? `${cmdName}.cmd` : cmdName;
    logger.debug(`Can't resolve ${cmdName}} path, try to use default value ${executable}.`);
    return { command: executable, args, options };
  }
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });

  targetPath = variableResolver.resolve(targetPath);
  logger.debug(`Server path expanded to: ${targetPath}`);

  if (!targetPath.endsWith(".js")) {
    // Allow path to tsp.cmd or tsp-server.cmd to be passed.
    if (await isFile(targetPath)) {
      const command =
        process.platform === "win32" && !targetPath.endsWith(".cmd")
          ? `${targetPath}.cmd`
          : cmdName;

      return { command, args, options };
    } else {
      targetPath = join(targetPath, `cmd/${cmdName}.js`);
    }
  }

  options.env["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
  return { command: "node", args: [targetPath, ...args], options };
}

async function resolveTypeSpecCli(context: ExtensionContext): Promise<Executable> {
  return resolveTypeSpecExecutable(context, "cli");
}
async function resolveTypeSpecServer(context: ExtensionContext): Promise<Executable> {
  return resolveTypeSpecExecutable(context, "server");
}

async function resolveLocalCompiler(baseDir: string): Promise<string | undefined> {
  // dynamic import required when unbundled as this module is CommonJS for
  // VS Code and the module-resolver is an ES module.
  const { resolveModule } = await import("@typespec/compiler/module-resolver");

  const host: ResolveModuleHost = {
    realpath,
    readFile: (path: string) => readFile(path, "utf-8"),
    stat,
  };
  try {
    logger.debug(`Try to resolve compiler from local, baseDir: ${baseDir}`);
    const executable = await resolveModule(host, "@typespec/compiler", {
      baseDir,
    });
    if (executable.type === "module") {
      logger.debug(`Resolved compiler from local: ${executable.path}`);
      return executable.path;
    } else {
      logger.debug(
        `Failed to resolve compiler from local. Unexpected executable type: ${executable.type}`
      );
    }
  } catch (e) {
    // Couldn't find the module
    logger.debug("Exception when resolving compiler from local", [e]);
    return undefined;
  }
  return undefined;
}

async function isFile(path: string) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function deactivate() {
  await client?.stop();
}

/**
 * Resolve some of the VSCode variables.
 * Simpler aLternative until https://github.com/microsoft/vscode/issues/46471 is supported.
 */
class VSCodeVariableResolver {
  static readonly VARIABLE_REGEXP = /\$\{(.*?)\}/g;

  public constructor(private variables: Record<string, string>) {}

  public resolve(value: string): string {
    const replaced = value.replace(
      VSCodeVariableResolver.VARIABLE_REGEXP,
      (match: string, variable: string) => {
        return this.variables[variable] ?? match;
      }
    );

    return replaced;
  }
}
