export const enum SettingName {
  TspServerPath = "typespec.tsp-server.path",
  NetEmitter = "typespec.emitter.net",
  JavaEmitter = "typespec.emitter.java",
  PythonEmitter = "typespec.emitter.python",
  JsEmitter = "typespec.emitter.javascript",
  ClientEmitter = "typespec.client.emitter",
  ServerEmitter = "typespec.server.emitter",
  SchemaEmitter = "typespec.schema.emitter",
}

export const languageEmitterSettingNames: Record<string, string> = {
  DotNet: SettingName.NetEmitter,
  Java: SettingName.JavaEmitter,
  Python: SettingName.PythonEmitter,
  JavaScript: SettingName.JsEmitter,
};

export const EmitterSettingName: Record<string, string> = {
  client: SettingName.ClientEmitter,
  server: SettingName.ServerEmitter,
  schema: SettingName.SchemaEmitter,
};

export const StartFileName = "main.tsp";
