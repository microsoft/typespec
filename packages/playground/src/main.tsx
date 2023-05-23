import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { FunctionComponent, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "./browser-host.js";
import { StyledPlayground } from "./components/playground.js";
import { attachServices } from "./services.js";
import { getStateFromUrl, saveTypeSpecContentInQueryParameter } from "./state-storage.js";

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

const initialState = getStateFromUrl();
const App: FunctionComponent = () => {
  const save = useCallback((content: string) => {
    void saveTypeSpecContentInQueryParameter(content);
  }, []);
  return <StyledPlayground host={host} defaultState={initialState} onSave={save} />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
