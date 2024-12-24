import vscode from "vscode";
import logger from "../../log/logger.js";
import { SettingName } from "../../types.js";

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

export const PreDefinedEmitterPickItems: Record<string, vscode.QuickPickItem> = {
  schema: {
    label: "OpenAPI/protoBuf",
    detail: "Generating OpenAPI from TypeSpec",
  },
  client: {
    label: "Client Code",
    detail: "Generating Client Code from TypeSpec.",
  },
  server: {
    label: "<PREVIEW> Server Stub",
    detail: "Generating Server Stub from TypeSpec",
  },
};

function getEmitter(kind: EmitterKind, emitter: Emitter): Emitter | undefined {
  let packageFullName: string = emitter.package;
  if (!packageFullName) {
    logger.error("Emitter package name is required.");
    return undefined;
  }
  packageFullName = packageFullName.trim();
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
  const extensionConfig = vscode.workspace.getConfiguration();
  const emitters: ReadonlyArray<Emitter> =
    extensionConfig.get(SettingName.GenerateCodeEmitters) ?? [];
  return emitters
    .filter((emitter) => emitter.kind === kind)
    .map((emitter) => getEmitter(kind, emitter))
    .filter((emitter) => emitter !== undefined) as Emitter[];
}

export function getRegisterEmitterTypes(): ReadonlyArray<EmitterKind> {
  const extensionConfig = vscode.workspace.getConfiguration();
  const emitters: ReadonlyArray<Emitter> =
    extensionConfig.get(SettingName.GenerateCodeEmitters) ?? [];
  return Array.from(new Set(emitters.map((emitter) => emitter.kind)));
}
