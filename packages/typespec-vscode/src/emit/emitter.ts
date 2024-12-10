import vscode from "vscode";
import { languageEmitterSettingNames } from "../const.js";

export enum EmitterKind {
  Schema = "schema",
  Client = "client",
  Server = "server",
}

export interface Emitter {
  language: string;
  package: string;
  version?: string;
  kind: EmitterKind;
}

const extensionConfig = vscode.workspace.getConfiguration();

function getEmitter(language: string): Emitter {
  const packageFullName: string =
    extensionConfig.get(languageEmitterSettingNames[language] ?? "") ?? "";
  const index = packageFullName.lastIndexOf("@");
  let version = undefined;
  let packageName = packageFullName;
  if (index !== -1 && index !== 0) {
    version = packageFullName.substring(index + 1);
    packageName = packageFullName.substring(0, index);
  }

  return {
    language: language,
    package: packageName,
    version: version,
    kind: EmitterKind.Client,
  };
}

export const clientEmitters: ReadonlyArray<Emitter> = Object.keys(languageEmitterSettingNames).map(
  (lang) => getEmitter(lang),
);
