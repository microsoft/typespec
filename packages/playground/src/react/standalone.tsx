import {
  FluentProvider,
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
  webLightTheme,
} from "@fluentui/react-components";
import { FunctionComponent, useId, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "../browser-host.js";
import { LibraryImportOptions } from "../core.js";
import { registerMonacoDefaultWorkers } from "../monaco-worker.js";
import { registerMonacoLanguage } from "../services.js";
import { StateStorage, createUrlStateStorage } from "../state-storage.js";
import { Playground, PlaygroundProps, PlaygroundSaveData } from "./playground.js";

export interface ReactPlaygroundConfig extends Partial<PlaygroundProps> {
  libraries: string[];
  importConfig?: LibraryImportOptions;
}

export async function createReactPlayground(config: ReactPlaygroundConfig) {
  const host = await createBrowserHost(config.libraries, config.importConfig);
  await registerMonacoLanguage(host);
  registerMonacoDefaultWorkers();

  const stateStorage = createStandalonePlaygroundStateStorage();
  const initialState = stateStorage.load();

  const App: FunctionComponent = () => {
    const toasterId = useId();
    const { dispatchToast } = useToastController(toasterId);

    const options: PlaygroundProps = useMemo(
      () => ({
        ...config,
        host,
        libraries: config.libraries,
        defaultContent: initialState.content,
        defaultEmitter: initialState.emitter ?? config.defaultEmitter,
        defaultCompilerOptions: initialState.options,
        defaultSampleName: initialState.sampleName,
        onSave: (value) => {
          stateStorage.save(value);
          void navigator.clipboard.writeText(window.location.toString());
          dispatchToast(
            <Toast>
              <ToastTitle>Saved!</ToastTitle>
              <ToastBody>Playground link has been copied to the clipboard.</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        },
      }),
      [dispatchToast]
    );

    return (
      <>
        <Toaster toasterId={toasterId} />
        <Playground {...options} />
      </>
    );
  };

  return <App />;
}

export async function renderReactPlayground(config: ReactPlaygroundConfig) {
  const app = await createReactPlayground(config);

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <FluentProvider theme={webLightTheme} style={{ height: "100vh" }}>
      {app}
    </FluentProvider>
  );
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
