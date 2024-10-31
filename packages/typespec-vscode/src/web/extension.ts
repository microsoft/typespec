import type { ExtensionContext } from "vscode";
import { ExtensionLogListener } from "../log/extension-log-listener.js";
import logger from "../log/logger.js";
import { TypeSpecLogOutputChannel } from "../log/typespec-log-output-channel.js";

/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension log", new ExtensionLogListener(outputChannel));

export async function activate(context: ExtensionContext) {
  logger.info("Activated TypeSpec Web Extension.");
}

export async function deactivate(): Promise<void> {}
