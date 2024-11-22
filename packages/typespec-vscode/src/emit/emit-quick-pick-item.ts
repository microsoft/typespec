import vscode from "vscode";

export interface EmitQuickPickItem extends vscode.QuickPickItem {
  language: string;
  package: string;
  version?: string;
  fromConfig: boolean;
  outputDir?: string;
}
