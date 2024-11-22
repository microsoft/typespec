export const enum SettingName {
  TspServerPath = "typespec.tsp-server.path",
  NetEmitter = "typespec.emitter.net",
  JavaEmitter = "typespec.emitter.java",
  PythonEmitter = "typespec.emitter.python",
  JsEmitter = "typespec.emitter.javascript",
}

export const languageEmitterSettingNames: Record<string, string> = {
  net: SettingName.NetEmitter,
  jave: SettingName.JavaEmitter,
  python: SettingName.PythonEmitter,
  js: SettingName.JsEmitter,
};
