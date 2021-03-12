import vscode from "vscode";
import { LanguageClient, LanguageClientOptions, Executable } from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {
  const module = context.asAbsolutePath("node_modules/@azure-tools/adl/dist/server/server.js");
  const debugArgs = process.env.DEBUG_ADL_LANGUAGE_SERVER?.split(" ") ?? [];

  const run: Executable = {
    command: "node",
    args: [...debugArgs, module, "--stdio"],
  };

  const options: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: "file",
        language: "adl",
      },
    ],
  };

  client = new LanguageClient(
    "adlLanguageServer",
    "ADL Language Server",
    { run, debug: run },
    options
  );

  client.start();
}

export async function deactivate() {
  await client?.stop();
}
