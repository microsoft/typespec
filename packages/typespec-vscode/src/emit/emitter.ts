import vscode from "vscode";
import { EmitterSettingName } from "../const.js";

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

function getEmitter(kind: EmitterKind, emitter: Emitter): Emitter {
  const packageFullName: string = emitter.package ?? "";
  const index = packageFullName.lastIndexOf("@");
  let version = undefined;
  let packageName = packageFullName;
  if (index !== -1 && index !== 0) {
    version = packageFullName.substring(index + 1);
    packageName = packageFullName.substring(0, index);
  }

  return {
    language: emitter.language,
    package: packageName,
    version: version,
    kind: kind,
  };
}

export function getRegisterEmitters(kind: EmitterKind): ReadonlyArray<Emitter> {
  const emitters: ReadonlyArray<Emitter> =
    extensionConfig.get(EmitterSettingName[kind] ?? "") ?? [];

  return emitters.map((emitter) => getEmitter(kind, emitter));
}
