import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { createRoot } from "react-dom/client";
import { FunctionComponent } from "react";
import { createBrowserHost } from "./browser-host";
import { Playground } from "./components/cadl-playground";
import { attachServices } from "./services";

import "./style.css";

(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};


const host = await createBrowserHost();
await attachServices(host);

 const App: FunctionComponent = () => {
  return <Playground host={host} />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
