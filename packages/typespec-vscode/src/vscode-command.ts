import vscode from "vscode";
import logger from "./log/logger.js";

export const OPEN_URL_COMMAND = "typespec.openUrl";

export function createCommandOpenUrl() {
  return vscode.commands.registerCommand(OPEN_URL_COMMAND, (url: string) => {
    // Although vscode has already dealt with the problem of wrong URL, try catch is still added here.
    try {
      vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
      logger.error(`Failed to open URL: ${url}`, [error as any]);
    }
  });
}
