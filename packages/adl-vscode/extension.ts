import { ExtensionContext } from "vscode";
import { LanguageClient, LanguageClientOptions, Executable } from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  const id = "adlLanguageServer";
  const name = "ADL Language Server";
  const exe = resolveADLServer(context);

  const options: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "adl" }],
  };

  client = new LanguageClient(id, name, { run: exe, debug: exe }, options);
  client.start();
}

/**
 * In development, resolve to the locally built server.js, and when installed
 * from VSIX, resolve to the globally installed `@azure-tools/adl` package using
 * adl-server on PATH.
 *
 * Eventually, we'll want to prefer a local install of the adl package to the
 * user's project location, but that isn't implemented yet.
 */
function resolveADLServer(context: ExtensionContext): Executable {
  const nodeOptions = process.env.ADL_SERVER_NODE_OPTIONS;
  const args = ["--stdio"];

  if (process.env.ADL_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath("../adl/cmd/adl-server.js");
    const options = nodeOptions?.split(" ") ?? [];
    return { command: "node", args: [...options, script, ...args] };
  }

  const command = process.platform === "win32" ? "adl-server.cmd" : "adl-server";
  return { command, args, options: { env: { NODE_OPTIONS: nodeOptions } } };
}

export async function deactivate() {
  await client?.stop();
}
