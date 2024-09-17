import {
  FluentProvider,
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
  webLightTheme,
} from "@fluentui/react-components";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { createBrowserHost } from "../browser-host.js";
import type { LibraryImportOptions } from "../core.js";
import { registerMonacoLanguage } from "../services.js";
import {
  createUrlStateStorage,
  type StateStorage,
  type UrlStateStorage,
} from "../state-storage.js";
import type { BrowserHost } from "../types.js";
import { Playground, type PlaygroundProps, type PlaygroundSaveData } from "./playground.js";

export interface ReactPlaygroundConfig extends Partial<PlaygroundProps> {
  readonly libraries: readonly string[];
  readonly importConfig?: LibraryImportOptions;
  /** Content to show while the playground data is loading(Libraries) */
  readonly fallback?: ReactNode;
}

interface StandalonePlaygroundContext {
  host: BrowserHost;
  initialState: Partial<PlaygroundSaveData>;
  stateStorage: StateStorage<PlaygroundSaveData>;
}
function useStandalonePlaygroundContext(
  config: ReactPlaygroundConfig,
): StandalonePlaygroundContext | undefined {
  const [context, setContext] = useState<StandalonePlaygroundContext | undefined>();
  useEffect(() => {
    const load = async () => {
      const host = await createBrowserHost(config.libraries, config.importConfig);
      await registerMonacoLanguage(host);

      const stateStorage = createStandalonePlaygroundStateStorage();
      const initialState = stateStorage.load();
      setContext({ host, initialState, stateStorage });
    };
    void load();
  }, [config.importConfig, config.libraries]);
  return context;
}

export const StandalonePlayground: FunctionComponent<ReactPlaygroundConfig> = (config) => {
  const context = useStandalonePlaygroundContext(config);
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const onSave = useCallback(
    (value: PlaygroundSaveData) => {
      if (!context) {
        return;
      }
      context.stateStorage.save(value);
      void navigator.clipboard.writeText(window.location.toString());
      dispatchToast(
        <Toast>
          <ToastTitle>Saved!</ToastTitle>
          <ToastBody>Playground link has been copied to the clipboard.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    },
    [dispatchToast, context],
  );

  const fixedOptions: PlaygroundProps | undefined = useMemo(
    () =>
      context && {
        host: context.host,
        libraries: config.libraries,
        defaultContent: context.initialState.content,
        defaultEmitter: context.initialState.emitter ?? config.defaultEmitter,
        defaultCompilerOptions: context.initialState.options,
        defaultSampleName: context.initialState.sampleName,
      },
    [config.defaultEmitter, config.libraries, context],
  );
  if (context === undefined || fixedOptions === undefined) {
    return config.fallback;
  }

  const options: PlaygroundProps = {
    ...config,
    ...fixedOptions,
    onSave,
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {options && <Playground {...options} />}
    </>
  );
};

export async function createReactPlayground(config: ReactPlaygroundConfig) {
  return <StandalonePlayground {...config} />;
}

export async function renderReactPlayground(config: ReactPlaygroundConfig) {
  const app = await createReactPlayground(config);

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <FluentProvider theme={webLightTheme} style={{ height: "100vh" }}>
      {app}
    </FluentProvider>,
  );
}

export function createStandalonePlaygroundStateStorage(): UrlStateStorage<PlaygroundSaveData> {
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
    resolveSearchParams: stateStorage.resolveSearchParams,
    save(data: PlaygroundSaveData) {
      stateStorage.save(
        data.sampleName ? { sampleName: data.sampleName, options: data.options } : data,
      );
    },
  };
}
