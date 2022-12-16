import { ResolveModuleHost } from "@cadl-lang/compiler/module-resolver";
import { readFile, realpath, stat } from "fs/promises";
import { join } from "path";
import vscode, { commands, ExtensionContext, workspace } from "vscode";
import {
  Executable,
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand("cadl.restartServer", restartCadlServer));

  return await vscode.window.withProgress(
    {
      title: "Launching Cadl language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => launchLanguageClient(context)
  );
}

async function restartCadlServer(): Promise<void> {
  if (client) {
    await client.stop();
    await client.start();
  }
}

async function launchLanguageClient(context: ExtensionContext) {
  const exe = await resolveCadlServer(context);
  const options: LanguageClientOptions = {
    synchronize: {
      // Synchronize the setting section 'cadl' to the server
      configurationSection: "cadl",
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.cadl"),
        workspace.createFileSystemWatcher("**/cadl-project.yaml"),
        workspace.createFileSystemWatcher("**/package.json"),
      ],
    },
    documentSelector: [
      { scheme: "file", language: "cadl" },
      { scheme: "untitled", language: "cadl" },
    ],
  };

  const name = "Cadl";
  const id = "cadlLanguageServer";
  try {
    client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
    await client.start();
  } catch (e) {
    if (typeof e === "string" && e.startsWith("Launching server using command")) {
      const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

      client?.error(
        [
          `Cadl server executable was not found: '${exe.command}' is not found. Make sure either:`,
          ` - cadl is installed locally at the root of this workspace ("${workspaceFolder}") or in a parent directory.`,
          " - cadl is installed globally with `npm install -g @cadl-lang/compiler'.",
          " - cadl server path is configured with https://github.com/microsoft/cadl#installing-vs-code-extension.",
        ].join("\n"),
        undefined,
        false
      );
      throw `Cadl server executable was not found: '${exe.command}' is not found.`;
    } else {
      throw e;
    }
  }
}

async function resolveCadlServer(context: ExtensionContext): Promise<Executable> {
  const nodeOptions = process.env.CADL_SERVER_NODE_OPTIONS;
  const args = ["--stdio"];

  // In development mode (F5 launch from source), resolve to locally built server.js.
  if (process.env.CADL_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath("../compiler/dist/server/server.js");
    // we use CLI instead of NODE_OPTIONS environment variable in this case
    // because --nolazy is not supported by NODE_OPTIONS.
    const options = nodeOptions?.split(" ").filter((o) => o) ?? [];
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
  let serverPath: string | undefined = workspace.getConfiguration().get("cadl.cadl-server.path");
  if (serverPath && typeof serverPath !== "string") {
    throw new Error("VS Code configuration option 'cadl.cadl-server.path' must be a string");
  }
  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

  // Default to cadl-server on PATH, which would come from `npm install -g
  // @cadl-lang/compiler` in a vanilla setup.
  if (!serverPath) {
    serverPath = await resolveLocalCompiler(workspaceFolder);
  }
  if (!serverPath) {
    const executable = process.platform === "win32" ? "cadl-server.cmd" : "cadl-server";
    return { command: executable, args, options };
  }
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });

  serverPath = variableResolver.resolve(serverPath);

  if (!serverPath.endsWith(".js")) {
    // Allow path to cadl-server.cmd to be passed.
    if (await isFile(serverPath)) {
      const command =
        process.platform === "win32" && !serverPath.endsWith(".cmd")
          ? `${serverPath}.cmd`
          : "cadl-server";

      return { command, args, options };
    } else {
      serverPath = join(serverPath, "cmd/cadl-server.js");
    }
  }

  options.env["CADL_SKIP_COMPILER_RESOLVE"] = "1";
  return { command: "node", args: [serverPath, ...args], options };
}

async function resolveLocalCompiler(baseDir: string): Promise<string | undefined> {
  // dynamic import required when unbundled as this module is CommonJS for
  // VS Code and the module-resolver is an ES module.
  const { resolveModule } = await import("@cadl-lang/compiler/module-resolver");

  const host: ResolveModuleHost = {
    realpath,
    readFile: (path: string) => readFile(path, "utf-8"),
    stat,
  };
  try {
    const executable = await resolveModule(host, "@cadl-lang/compiler", {
      baseDir,
    });
    if (executable.type === "module") {
      return executable.path;
    }
  } catch (e) {
    // Couldn't find the module
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
