import {
  createBrowserHost,
  filterEmitters,
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

const host = await createBrowserHost(PlaygroundManifest.libraries);
const emitters = await filterEmitters(PlaygroundManifest.libraries)
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
      emitters={emitters}
      defaultContent={initialState.content}
      defaultSampleName={initialState.sampleName}
      onSave={save}
      defaultEmitter={PlaygroundManifest.defaultEmitter}
    />
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
