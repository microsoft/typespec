import { ExtensionContext, workspace } from "vscode";
import {
  Executable,
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
} from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  const exe = resolveADLServer(context);
  const options: LanguageClientOptions = {
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.adl"),
        workspace.createFileSystemWatcher("**/package.json"),
      ],
    },
    documentSelector: [
      { scheme: "file", language: "adl" },
      { scheme: "untitled", language: "adl" },
    ],
  };

  const name = "ADL";
  const id = "adlLanguageServer";
  client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
  client.start();
}

function resolveADLServer(context: ExtensionContext): Executable {
  const nodeOptions = process.env.ADL_SERVER_NODE_OPTIONS;
  const args = ["--stdio"];

  // In development mode (F5 launch from source), resolve to locally built server.js.
  if (process.env.ADL_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath("../adl/dist/server/server.js");
    // we use CLI instead of NODE_OPTIONS environment variable in this case
    // because --nolazy is not supported by NODE_OPTIONS.
    const options = nodeOptions?.split(" ") ?? [];
    return { command: "node", args: [...options, script, ...args] };
  }

  // In production, first try VS Code configuration, which allows a global machine
  // location that is not on PATH, or a workspace-specific installation.
  let command = workspace.getConfiguration().get("adl.adl-server.path") as string;
  if (command && typeof command !== "string") {
    throw new Error("VS Code configuration option 'adl.adl-server.path' must be a string");
  }

  if (command?.includes("${workspaceRoot}")) {
    const workspaceRoot = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";
    command = command.replace("${workspaceRoot}", workspaceRoot);
  }

  // Default to adl-server on PATH, which would come from `npm install -g
  // @azure-tools/adl` in a vanilla setup.
  if (!command) {
    command = "adl-server";
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
