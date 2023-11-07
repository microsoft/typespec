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
  StateStorage,
  createBrowserHost,
  createUrlStateStorage,
  registerMonacoDefaultWorkers,
  registerMonacoLanguage,
} from "@typespec/playground";
import { Playground, PlaygroundProps, PlaygroundSaveData } from "@typespec/playground/react";
import { FunctionComponent, useId, useMemo } from "react";

import "@typespec/playground/style.css";

async function createPlaygroundComponent() {
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
  const host = await createBrowserHost(libraries, {
    useShim: true,
  });
  await registerMonacoLanguage(host);
  registerMonacoDefaultWorkers();

  const stateStorage = createStandalonePlaygroundStateStorage();
  const initialState = stateStorage.load();

  const App: FunctionComponent = () => {
    const toasterId = useId();
    const { dispatchToast } = useToastController(toasterId);

    const options: PlaygroundProps = useMemo(
      () => ({
        host,
        libraries: libraries,
        defaultContent: initialState.content,
        defaultEmitter: initialState.emitter ?? defaultEmitter,
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
      <FluentProvider theme={webLightTheme} style={{ height: "100%", width: "100%" }}>
        <Toaster toasterId={toasterId} />
        <div style={{ height: "calc(100vh - var(--ifm-navbar-height))", width: "100%" }}>
          <Playground {...options} />
        </div>
      </FluentProvider>
    );
  };

  return <App />;
}

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

const comp = await createPlaygroundComponent();
export default function PlaygroundPage() {
  return <Layout>{comp}</Layout>;
}
