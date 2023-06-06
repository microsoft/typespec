import {
  createBrowserHost,
  getStateFromUrl,
  registerMonacoDefaultWorkers,
  registerMonacoLanguage,
  saveTypeSpecContentInQueryParameter,
} from "@typespec/playground";
import { StyledPlayground } from "@typespec/playground/react";
import { FunctionComponent, useCallback } from "react";
import { createRoot } from "react-dom/client";

import { PlaygroundManifest } from "@typespec/playground/manifest";
import "./style.css";

const host = await createBrowserHost();
await registerMonacoLanguage(host);
registerMonacoDefaultWorkers();

const initialState = getStateFromUrl();
const App: FunctionComponent = () => {
  const save = useCallback((content: string) => {
    void saveTypeSpecContentInQueryParameter(content);
  }, []);
  return (
    <StyledPlayground
      host={host}
      defaultContent={initialState.content}
      defaultSampleName={initialState.sampleName}
      onSave={save}
      defaultEmitter={PlaygroundManifest.defaultEmitter}
    />
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
