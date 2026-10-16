/**
 * Install Monaco's global worker factory using Vite's `?worker` imports.
 * JSON models use the JSON worker; other labels use the base editor worker.
 * Call before Monaco requests workers. Replaces any existing `MonacoEnvironment`.
 */
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
