import vscode from "vscode";
import { OPEN_URL_COMMAND } from "./const.js";

export function createCommandOpenUrl() {
  return vscode.commands.registerCommand(OPEN_URL_COMMAND, (url: string) =>
    vscode.env.openExternal(vscode.Uri.parse(url)),
  );
}
