import vscode from "vscode";
import { EmitterKind } from "./emitter.js";

export interface EmitQuickPickItem extends vscode.QuickPickItem {
  language: string;
  package: string;
  version?: string;
  sourceRepo?: string;
  requisites?: string[];
  fromConfig: boolean;
  outputDir?: string;
  emitterKind: EmitterKind;
}
