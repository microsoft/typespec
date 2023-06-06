import { FunctionComponent } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "../browser-host.js";
import { registerMonacoDefaultWorkers } from "../monaco-worker.js";
import { registerMonacoLanguage } from "../services.js";
import { getStateFromUrl, saveTypeSpecContentInQueryParameter } from "../state-storage.js";
import { filterEmitters } from "../utils.js";
import { PlaygroundProps, StyledPlayground } from "./playground.js";

export interface ReactPlaygroundConfig extends Partial<PlaygroundProps> {
  libraries: string[];
}

export async function createReactPlayground(config: ReactPlaygroundConfig) {
  const host = await createBrowserHost(config.libraries);
  const emitters = await filterEmitters(config.libraries);
  await registerMonacoLanguage(host);
  registerMonacoDefaultWorkers();

  const initialState = getStateFromUrl();
  const options: PlaygroundProps = {
    ...config,
    host,
    emitters,
    defaultContent: initialState.content,
    defaultSampleName: initialState.sampleName,
    onSave: saveTypeSpecContentInQueryParameter as any,
  };
  const App: FunctionComponent = () => {
    return <StyledPlayground {...options} />;
  };

  return <App />;
}

export async function renderReactPlayground(config: ReactPlaygroundConfig) {
  const app = await createReactPlayground(config);

  const root = createRoot(document.getElementById("root")!);
  root.render(app);
}
