import { stat } from "fs/promises";
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
      client?.error(
        [
          `Cadl server exectuable was not found: '${exe.command}' is not found. Make sure either:`,
          " - cadl is installed globally with `npm install -g @cadl-lang/compiler'.",
          " - cadl server path is configured with https://github.com/microsoft/cadl#installing-vs-code-extension.",
        ].join("\n"),
        undefined,
        false
      );
      throw `Cadl server exectuable was not found: '${exe.command}' is not found.`;
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
    const options = nodeOptions?.split(" ") ?? [];
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
  let serverPath = workspace.getConfiguration().get("cadl.cadl-server.path") as string;
  if (serverPath && typeof serverPath !== "string") {
    throw new Error("VS Code configuration option 'cadl.cadl-server.path' must be a string");
  }

  // Default to cadl-server on PATH, which would come from `npm install -g
  // @cadl-lang/compiler` in a vanilla setup.
  if (!serverPath) {
    const executable = process.platform === "win32" ? "cadl-server.cmd" : "cadl-server";
    return { command: executable, args, options };
  }

  if (serverPath.includes("${workspaceRoot}")) {
    const workspaceRoot = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";
    serverPath = serverPath.replace("${workspaceRoot}", workspaceRoot);
  }

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
