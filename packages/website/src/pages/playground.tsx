import {
  FluentProvider,
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
  webLightTheme,
} from "@fluentui/react-components";
import Layout from "@theme/Layout";
import {
  BrowserHost,
  StateStorage,
  createBrowserHost,
  createUrlStateStorage,
  registerMonacoDefaultWorkers,
  registerMonacoLanguage,
} from "@typespec/playground";
import { Playground, PlaygroundProps, PlaygroundSaveData } from "@typespec/playground/react";
import { FunctionComponent, useEffect, useId, useMemo, useState } from "react";

import "@typespec/playground/style.css";

const libraries = [
  "@typespec/compiler",
  "@typespec/http",
  "@typespec/rest",
  "@typespec/openapi",
  "@typespec/versioning",
  "@typespec/openapi3",
  "@typespec/json-schema",
  "@typespec/protobuf",
];
const defaultEmitter = "@typespec/openapi3";

interface PlaygroundContext {
  host: BrowserHost;
  initialState: Partial<PlaygroundSaveData>;
  stateStorage: StateStorage<PlaygroundSaveData>;
}

function usePlaygroundContext(): PlaygroundContext | undefined {
  const [context, setContext] = useState<PlaygroundContext | undefined>(undefined);
  useEffect(async () => {
    const host = await createBrowserHost(libraries, {
      useShim: true,
    });
    await registerMonacoLanguage(host);
    registerMonacoDefaultWorkers();

    const stateStorage = createStandalonePlaygroundStateStorage();
    const initialState = stateStorage.load();

    setContext({
      host,
      initialState,
    });
  }, []);
  return context;
}

const App: FunctionComponent = () => {
  const context = usePlaygroundContext();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const options: PlaygroundProps = useMemo(
    () =>
      context && {
        host: context.host,
        libraries: libraries,
        defaultContent: context.initialState.content,
        defaultEmitter: context.initialState.emitter ?? defaultEmitter,
        defaultCompilerOptions: context.initialState.options,
        defaultSampleName: context.initialState.sampleName,
        onSave: (value) => {
          context.stateStorage.save(value);
          void navigator.clipboard.writeText(window.location.toString());
          dispatchToast(
            <Toast>
              <ToastTitle>Saved!</ToastTitle>
              <ToastBody>Playground link has been copied to the clipboard.</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        },
      },
    [dispatchToast, context]
  );

  return context ? (
    <FluentProvider theme={webLightTheme} style={{ height: "100%", width: "100%" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ height: "calc(100vh - var(--ifm-navbar-height))", width: "100%" }}>
        <Playground {...options} />
      </div>
    </FluentProvider>
  ) : null;
};

function createStandalonePlaygroundStateStorage(): StateStorage<PlaygroundSaveData> {
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

export default function PlaygroundPage() {
  return (
    <Layout>
      <App />
    </Layout>
  );
}
