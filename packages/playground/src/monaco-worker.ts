// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

export function registerMonacoDefaultWorkers() {
  self.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (label === "json") {
        return new jsonWorker();
      }
      return new editorWorker();
    },
  };
}
