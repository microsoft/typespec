import { ExtensionContext, workspace } from "vscode";
import {
  Executable,
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  const exe = resolveCadlServer(context);
  const options: LanguageClientOptions = {
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.cadl"),
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
  client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
  client.start();
}

function resolveCadlServer(context: ExtensionContext): Executable {
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

  // In production, first try VS Code configuration, which allows a global machine
  // location that is not on PATH, or a workspace-specific installation.
  let command = workspace.getConfiguration().get("cadl.cadl-server.path") as string;
  if (command && typeof command !== "string") {
    throw new Error("VS Code configuration option 'cadl.cadl-server.path' must be a string");
  }

  if (command?.includes("${workspaceRoot}")) {
    const workspaceRoot = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";
    command = command.replace("${workspaceRoot}", workspaceRoot);
  }

  // Default to cadl-server on PATH, which would come from `npm install -g
  // @cadl-lang/compiler` in a vanilla setup.
  if (!command) {
    command = "cadl-server";
  }

  if (process.platform === "win32" && !command.endsWith(".cmd")) {
    command += ".cmd";
  }

  let options: ExecutableOptions | undefined;
  if (nodeOptions) {
    options = {
      env: { ...process.env, NODE_OPTIONS: nodeOptions },
    };
  }

  return { command, args, options };
}

export async function deactivate() {
  await client?.stop();
}
