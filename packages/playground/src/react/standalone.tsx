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
import {
  Playground,
  type PlaygroundProps,
  type PlaygroundSaveData,
  type PlaygroundState,
} from "./playground.js";

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

  // Keep track of the last saved data to preserve content
  const [lastSavedData, setLastSavedData] = useState<PlaygroundSaveData | null>(null);

  const saveToStorage = useCallback(
    (value: PlaygroundSaveData) => {
      if (!context) {
        return;
      }
      context.stateStorage.save(value);
      setLastSavedData(value);
    },
    [context],
  );

  const onSave = useCallback(
    (value: PlaygroundSaveData) => {
      saveToStorage(value);
      void navigator.clipboard.writeText(window.location.toString());
      dispatchToast(
        <Toast>
          <ToastTitle>Saved!</ToastTitle>
          <ToastBody>Playground link has been copied to the clipboard.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    },
    [dispatchToast, saveToStorage],
  );

  const onPlaygroundStateChange = useCallback(
    (newState: PlaygroundState) => {
      // Auto-save state changes to storage without showing toast.
      // Preserve the last known content or use empty string if none.
      // `emitter`/`compilerOptions` are intentionally omitted — `tspconfig` is the
      // source of truth and the only config persisted on save.
      const saveData: PlaygroundSaveData = {
        content: lastSavedData?.content || "",
        emitter: "",
        tspconfig: newState.tspconfig,
        sampleName: newState.sampleName,
        selectedViewer: newState.selectedViewer,
        viewerState: newState.viewerState,
      };
      saveToStorage(saveData);
    },
    [lastSavedData?.content, saveToStorage],
  );

  const fixedOptions: PlaygroundProps | undefined = useMemo(
    () =>
      context && {
        host: context.host,
        libraries: config.libraries,
        defaultContent: context.initialState.content,
        defaultPlaygroundState: {
          emitter: context.initialState.emitter ?? config.defaultPlaygroundState?.emitter,
          compilerOptions:
            context.initialState.compilerOptions ?? config.defaultPlaygroundState?.compilerOptions,
          tspconfig: context.initialState.tspconfig ?? config.defaultPlaygroundState?.tspconfig,
          sampleName: context.initialState.sampleName ?? config.defaultPlaygroundState?.sampleName,
          selectedViewer:
            context.initialState.selectedViewer ?? config.defaultPlaygroundState?.selectedViewer,
          viewerState:
            context.initialState.viewerState ?? config.defaultPlaygroundState?.viewerState,
        },
      },
    [config.defaultPlaygroundState, config.libraries, context],
  );
  if (context === undefined || fixedOptions === undefined) {
    return config.fallback;
  }

  const options: PlaygroundProps = {
    ...config,
    ...fixedOptions,
    onSave,
    onPlaygroundStateChange,
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      <Playground {...options} />
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
    // `emitter` and `compilerOptions` are only read for backwards compatibility with
    // links shared before tspconfig became the source of truth. They are no longer
    // written on save (see the `save` wrapper below) — `tspconfig` is persisted instead.
    emitter: {
      queryParam: "e",
    },
    compilerOptions: {
      type: "object",
      queryParam: "options",
    },
    tspconfig: {
      queryParam: "tspconfig",
      compress: "lz-base64",
    },
    sampleName: {
      queryParam: "sample",
    },
    selectedViewer: {
      queryParam: "v",
    },
    viewerState: {
      type: "object",
      queryParam: "vs",
    },
  });

  return {
    load: stateStorage.load,
    resolveSearchParams: stateStorage.resolveSearchParams,
    save(data: PlaygroundSaveData) {
      // Drop the legacy structured config so only `tspconfig` is written (this also
      // clears any stale `e`/`options` params carried over from an old link).
      const cleaned: PlaygroundSaveData = {
        ...data,
        emitter: undefined as any,
        compilerOptions: undefined,
      };
      stateStorage.save(
        cleaned.sampleName
          ? { ...cleaned, content: undefined, sampleName: cleaned.sampleName }
          : cleaned,
      );
    },
  };
}
