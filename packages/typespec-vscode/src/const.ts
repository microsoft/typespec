export const enum SettingName {
  TspServerPath = "typespec.tsp-server.path",
  NetEmitter = "typespec.emitter.net",
  JavaEmitter = "typespec.emitter.java",
  PythonEmitter = "typespec.emitter.python",
  JsEmitter = "typespec.emitter.javascript",
}

export const languageEmitterSettingNames: Record<string, string> = {
  DotNet: SettingName.NetEmitter,
  Java: SettingName.JavaEmitter,
  Python: SettingName.PythonEmitter,
  JavaScript: SettingName.JsEmitter,
};

export const StartFileName = "main.tsp";
