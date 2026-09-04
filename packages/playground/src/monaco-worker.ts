export function registerMonacoDefaultWorkersForVite() {
  (self as any).MonacoEnvironment = {
    getWorker: async function (workerId: string, label: string) {
      switch (label) {
        case "json": {
          const { default: JsonWorker } =
            await import("monaco-editor/language/json/json.worker.js?worker");
          return new JsonWorker();
        }
        default: {
          const { default: EditorWorker } =
            await import("monaco-editor/editor/editor.worker.js?worker");
          return new EditorWorker();
        }
      }
    },
  };
}
