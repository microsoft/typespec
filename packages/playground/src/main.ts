import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { createBrowserHost } from "./browserHost";
import { attachServices } from "./services";
import "./style.css";
import { createUI } from "./ui";

(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

const host = await createBrowserHost();
attachServices(host);
await createUI(host);
