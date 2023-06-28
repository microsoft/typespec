import { FunctionComponent } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "../browser-host.js";
import { registerMonacoDefaultWorkers } from "../monaco-worker.js";
import { registerMonacoLanguage } from "../services.js";
import { StateStorage, createUrlStateStorage } from "../state-storage.js";
import { filterEmitters } from "../utils.js";
import { PlaygroundProps, PlaygroundSaveData, StyledPlayground } from "./playground.js";

export interface ReactPlaygroundConfig extends Partial<PlaygroundProps> {
  libraries: string[];
}

export async function createReactPlayground(config: ReactPlaygroundConfig) {
  const host = await createBrowserHost(config.libraries);
  const emitters = await filterEmitters(config.libraries);
  await registerMonacoLanguage(host);
  registerMonacoDefaultWorkers();

  const stateStorage = createStandalonePlaygroundStateStorage();
  const initialState = stateStorage.load();
  const options: PlaygroundProps = {
    ...config,
    host,
    emitters,
    defaultContent: initialState.content,
    defaultEmitter: initialState.emitter ?? config.defaultEmitter,
    defaultEmitterOptions: initialState.options,
    defaultSampleName: initialState.sampleName,
    onSave: (value) => {
      stateStorage.save(value);
      void navigator.clipboard.writeText(window.location.toString());
    },
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

export function createStandalonePlaygroundStateStorage(): StateStorage<PlaygroundSaveData> {
  const stateStorage = createUrlStateStorage<PlaygroundSaveData>({
    content: {
      queryParam: "c",
      compress: "lz-base64",
    },
    emitter: {
      queryParam: "e",
    },
    options: {
      type: "object",
      queryParam: "options",
    },
    sampleName: {
      queryParam: "sample",
    },
  });

  return {
    load: stateStorage.load,
    save(data: PlaygroundSaveData) {
      stateStorage.save(
        data.sampleName ? { sampleName: data.sampleName, options: data.options } : data
      );
    },
  };
}
