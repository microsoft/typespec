import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";

export function registerMonacoDefaultWorkersForVite() {
  (self as any).MonacoEnvironment = {
    getWorker: async function (workerId: string, label: string) {
      switch (label) {
        case "json": {
          return new JsonWorker();
        }
        default: {
          return new EditorWorker();
        }
      }
    },
  };
}
