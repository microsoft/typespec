import { ResolveModuleHost } from "@typespec/compiler/module-resolver";
import { readFile, realpath, stat } from "fs/promises";
import { dirname, isAbsolute, join, resolve } from "path";
import vscode, { ExtensionContext, commands, workspace } from "vscode";
import {
  Executable,
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node.js";
import logger from "./extension-logger.js";
import { TypeSpecLogOutputChannel } from "./typespec-log-output-channel.js";
import { normalizeSlash, useShellInExec } from "./utils.js";

let client: LanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.outputChannel = outputChannel;

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

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => launchLanguageClient(context),
  );
}

function createTaskProvider() {
  return vscode.tasks.registerTaskProvider("typespec", {
    provideTasks: async () => {
      logger.info("Providing tsp tasks");
      const targetPathes = await vscode.workspace
        .findFiles("**/main.tsp", "**/node_modules/**")
        .then((uris) =>
          uris
            .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
            .map((uri) => normalizeSlash(uri.fsPath)),
        );
      logger.info(`Found ${targetPathes.length} main.tsp files`);
      const tasks: vscode.Task[] = [];
      for (const targetPath of targetPathes) {
        tasks.push(...(await createBuiltInTasks(targetPath)));
      }
      logger.info(`Provided ${tasks.length} tsp tasks`);
      return tasks;
    },
    resolveTask: async (task: vscode.Task): Promise<vscode.Task | undefined> => {
      if (task.definition.type === "typespec" && task.name && task.definition.path) {
        const t = await createTask(task.name, task.definition.path, task.definition.args);
        if (t) {
          // returned task's definition must be the same object as the given task's definition
          // otherwise vscode would report error that the task is not resolved
          t.definition = task.definition;
          return t;
        } else {
          return undefined;
        }
      }
      return undefined;
    },
  });
}

function getTaskPath(targetPath: string): { absoluteTargetPath: string; workspaceFolder: string } {
  let workspaceFolder = workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath;
  if (!workspaceFolder) {
    workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    logger.warning(
      `Can't resolve workspace folder from given file ${targetPath}. Try to use the first workspace folder ${workspaceFolder}.`,
    );
  }
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  targetPath = variableResolver.resolve(targetPath);
  targetPath = resolve(workspaceFolder, targetPath);
  targetPath = normalizeSlash(variableResolver.resolve(targetPath));
  return { absoluteTargetPath: targetPath, workspaceFolder };
}

function createTaskInternal(
  name: string,
  absoluteTargetPath: string,
  args: string,
  cli: Executable,
  workspaceFolder: string,
) {
  let cmd = `${cli.command} ${cli.args?.join(" ") ?? ""} compile "${absoluteTargetPath}" ${args}`;
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  cmd = variableResolver.resolve(cmd);
  logger.debug(
    `Command of tsp compile task "${name}" is resolved to: ${cmd} with cwd "${workspaceFolder}"`,
  );
  return new vscode.Task(
    {
      type: "typespec",
      path: absoluteTargetPath,
      args: args,
    },
    vscode.TaskScope.Workspace,
    name,
    "tsp",
    workspaceFolder
      ? new vscode.ShellExecution(cmd, { cwd: workspaceFolder })
      : new vscode.ShellExecution(cmd),
  );
}

async function createTask(name: string, targetPath: string, args?: string) {
  const { absoluteTargetPath, workspaceFolder } = getTaskPath(targetPath);
  const cli = await resolveTypeSpecCli(absoluteTargetPath);
  if (!cli) {
    return undefined;
  }
  return await createTaskInternal(name, absoluteTargetPath, args ?? "", cli, workspaceFolder);
}

async function createBuiltInTasks(targetPath: string): Promise<vscode.Task[]> {
  const { absoluteTargetPath, workspaceFolder } = getTaskPath(targetPath);
  const cli = await resolveTypeSpecCli(absoluteTargetPath);
  if (!cli) {
    return [];
  }
  return [
    { name: `compile - ${targetPath}`, args: "" },
    { name: `watch - ${targetPath}`, args: "--watch" },
  ].map(({ name, args }) => {
    return createTaskInternal(name, absoluteTargetPath, args, cli, workspaceFolder);
  });
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
        { showOutput: false, showPopup: true },
      );
      logger.error("Error detail", [e]);
      throw `TypeSpec server executable was not found: '${exe.command}' is not found.`;
    } else {
      throw e;
    }
  }
}

/**
 *
 * @param absoluteTargetPath the path is expected to be absolute path and no further expanding or resolving needed.
 * @returns
 */
async function resolveTypeSpecCli(absoluteTargetPath: string): Promise<Executable | undefined> {
  if (!isAbsolute(absoluteTargetPath)) {
    logger.error(`Expect absolute path for resolving cli, but got ${absoluteTargetPath}`);
    return undefined;
  }

  const options: ExecutableOptions = {
    env: { ...process.env },
  };

  const baseDir = (await isFile(absoluteTargetPath))
    ? dirname(absoluteTargetPath)
    : absoluteTargetPath;

  const compilerPath = await resolveLocalCompiler(baseDir);
  if (!compilerPath || compilerPath.length === 0) {
    const executable = process.platform === "win32" ? `tsp.cmd` : "tsp";
    logger.debug(
      `Can't resolve compiler path for tsp task, try to use default value ${executable}.`,
    );
    return useShellInExec({ command: executable, args: [], options });
  } else {
    logger.debug(`Compiler path resolved as: ${compilerPath}`);
    const jsPath = join(compilerPath, "cmd/tsp.js");
    options.env["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
    return { command: "node", args: [jsPath], options };
  }
}

async function resolveTypeSpecServer(context: ExtensionContext): Promise<Executable> {
  const nodeOptions = process.env.TYPESPEC_SERVER_NODE_OPTIONS;
  const args = ["--stdio"];

  // In development mode (F5 launch from source), resolve to locally built server.js.
  if (process.env.TYPESPEC_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath("../compiler/entrypoints/server.js");
    // we use CLI instead of NODE_OPTIONS environment variable in this case
    // because --nolazy is not supported by NODE_OPTIONS.
    const options = nodeOptions?.split(" ").filter((o) => o) ?? [];
    logger.debug("TypeSpec server resolved in development mode");
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
  let serverPath: string | undefined = workspace.getConfiguration().get("typespec.tsp-server.path");
  if (serverPath && typeof serverPath !== "string") {
    throw new Error("VS Code configuration option 'typespec.tsp-server.path' must be a string");
  }
  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

  // Default to tsp-server on PATH, which would come from `npm install -g
  // @typespec/compiler` in a vanilla setup.
  if (serverPath) {
    logger.debug(`Server path loaded from VS Code configuration: ${serverPath}`);
  } else {
    serverPath = await resolveLocalCompiler(workspaceFolder);
  }
  if (!serverPath) {
    const executable = process.platform === "win32" ? "tsp-server.cmd" : "tsp-server";
    logger.debug(`Can't resolve server path, try to use default value ${executable}.`);
    return useShellInExec({ command: executable, args, options });
  }
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });

  serverPath = variableResolver.resolve(serverPath);
  logger.debug(`Server path expanded to: ${serverPath}`);

  if (!serverPath.endsWith(".js")) {
    // Allow path to tsp-server.cmd to be passed.
    if (await isFile(serverPath)) {
      const command =
        process.platform === "win32" && !serverPath.endsWith(".cmd")
          ? `${serverPath}.cmd`
          : serverPath;

      return useShellInExec({ command, args, options });
    } else {
      serverPath = join(serverPath, "cmd/tsp-server.js");
    }
  }

  options.env["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
  return { command: "node", args: [serverPath, ...args], options };
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
        `Failed to resolve compiler from local. Unexpected executable type: ${executable.type}`,
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
  static readonly VARIABLE_REGEXP = /\$\{([^{}]+?)\}/g;

  public constructor(private variables: Record<string, string>) {}

  public resolve(value: string): string {
    const replaced = value.replace(
      VSCodeVariableResolver.VARIABLE_REGEXP,
      (match: string, variable: string) => {
        return this.variables[variable] ?? match;
      },
    );

    return replaced;
  }
}
