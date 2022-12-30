import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { FunctionComponent } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";
import { createBrowserHost } from "./browser-host.js";
import { Playground } from "./components/playground.js";
import { attachServices } from "./services.js";

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
  return (
    <RecoilRoot>
      <Playground host={host} />
    </RecoilRoot>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
