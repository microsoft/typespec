import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { FunctionComponent, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "./browser-host.js";
import { StyledPlayground } from "./components/playground.js";
import { attachServices } from "./services.js";
import { getCadlContentFromQueryParam, saveCadlContentInQueryParameter } from "./state-storage.js";

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

const initialContent = getCadlContentFromQueryParam("c");
const App: FunctionComponent = () => {
  const save = useCallback((content: string) => {
    void saveCadlContentInQueryParameter("c", content);
  }, []);
  return <StyledPlayground host={host} cadlContent={initialContent} onSave={save} />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
