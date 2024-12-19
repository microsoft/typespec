import vscode from "vscode";
import { EmitterKind } from "./emitter.js";

export interface EmitQuickPickItem extends vscode.QuickPickItem {
  language: string;
  package: string;
  version?: string;
  fromConfig: boolean;
  outputDir?: string;
  emitterKind: EmitterKind;
}

export interface TypeSpecProjectPickItem extends vscode.QuickPickItem {
  path: string;
}
