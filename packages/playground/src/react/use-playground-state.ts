import type { CompilerOptions } from "@typespec/compiler";
import { useControllableValue } from "@typespec/react-components";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PlaygroundSample } from "../types.js";
import {
  compilerOptionsToTspConfig,
  parseTspConfigYaml,
  updateTspConfigYaml,
} from "./editor-panel/tspconfig-utils.js";

export interface PlaygroundState {
  /** Emitter to use */
  emitter?: string;
  /** Emitter options */
  compilerOptions?: CompilerOptions;
  /** Raw tspconfig.yaml content. Source of truth for the compiler configuration. */
  tspconfig?: string;
  /** Sample to use */
  sampleName?: string;
  /** Selected viewer */
  selectedViewer?: string;
  /** Internal state of viewers */
  viewerState?: Record<string, any>;
  /** TypeSpec content */
  content?: string;
}

export interface UsePlaygroundStateProps {
  /** List of available libraries */
  readonly libraries: readonly string[];

  /** Samples available */
  samples?: Record<string, PlaygroundSample>;

  /** Playground state (controlled) */
  playgroundState?: PlaygroundState;
  /** Default playground state if leaving this unmanaged */
  defaultPlaygroundState?: PlaygroundState;
  /** Callback when playground state changes */
  onPlaygroundStateChange?: (state: PlaygroundState) => void;

  /**
   * Default emitter to use if not provided in defaultPlaygroundState.
   * @deprecated Use defaultPlaygroundState.emitter instead
   */
  defaultEmitter?: string;

  /** Default content if not provided in defaultPlaygroundState */
  defaultContent?: string;
}

export interface PlaygroundStateResult {
  // State values
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  /** Raw tspconfig.yaml content (source of truth for the configuration). */
  tspconfig: string;
  selectedSampleName: string;
  selectedViewer?: string;
  viewerState: Record<string, any>;
  content: string;

  // State setters
  onSelectedEmitterChange: (emitter: string) => void;
  onCompilerOptionsChange: (compilerOptions: CompilerOptions) => void;
  onTspconfigChange: (tspconfig: string) => void;
  onSelectedSampleNameChange: (sampleName: string) => void;
  onSelectedViewerChange: (selectedViewer: string) => void;
  onViewerStateChange: (viewerState: Record<string, any>) => void;
  onContentChange: (content: string) => void;

  // Full state management
  playgroundState: PlaygroundState;
  setPlaygroundState: (state: PlaygroundState) => void;
}

export function usePlaygroundState({
  libraries,
  samples,
  playgroundState: controlledPlaygroundState,
  defaultPlaygroundState,
  onPlaygroundStateChange,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  defaultEmitter,
  defaultContent,
}: UsePlaygroundStateProps): PlaygroundStateResult {
  // Create the effective default state with proper fallback logic
  const effectiveDefaultState = useMemo((): PlaygroundState => {
    const baseDefault = defaultPlaygroundState ?? {};

    // If no emitter is provided in defaultPlaygroundState, use fallback logic
    if (!baseDefault.emitter) {
      // First try the deprecated defaultEmitter prop
      if (defaultEmitter) {
        return { ...baseDefault, emitter: defaultEmitter, content: defaultContent };
      }
    }

    return { ...baseDefault, content: baseDefault.content ?? defaultContent };
  }, [defaultPlaygroundState, defaultEmitter, libraries, defaultContent]);

  // Use a single controllable value for the entire playground state
  const [playgroundState, setPlaygroundState] = useControllableValue(
    controlledPlaygroundState,
    effectiveDefaultState,
    onPlaygroundStateChange,
  );

  // Extract individual values from the consolidated state with proper defaults.
  // The raw tspconfig.yaml is the source of truth for the compiler configuration.
  // For backwards compatibility (older shared links / samples that only provide the
  // structured `emitter` + `compilerOptions`), synthesize the YAML when none is stored.
  const tspconfig = useMemo(
    () =>
      playgroundState.tspconfig ??
      compilerOptionsToTspConfig(
        playgroundState.emitter ?? "",
        playgroundState.compilerOptions ?? {},
      ),
    [playgroundState.tspconfig, playgroundState.emitter, playgroundState.compilerOptions],
  );

  const parsedConfig = useMemo(
    () => parseTspConfigYaml(tspconfig) ?? { compilerOptions: {} },
    [tspconfig],
  );

  const selectedEmitter = (parsedConfig.selectedEmitter ?? "") as any;
  const compilerOptions = parsedConfig.compilerOptions;
  const selectedSampleName = playgroundState.sampleName ?? "";
  const selectedViewer = playgroundState.selectedViewer;
  const content = playgroundState.content ?? "";

  // Create a generic state updater that can handle any field
  const updateState = useCallback(
    (updates: Partial<PlaygroundState>) => {
      setPlaygroundState({ ...playgroundState, ...updates });
    },
    [playgroundState, setPlaygroundState],
  );

  // Raw YAML edits are persisted directly — this is the source of truth.
  const onTspconfigChange = useCallback(
    (tspconfig: string) => updateState({ tspconfig }),
    [updateState],
  );

  // Visual form changes are written back into the YAML, preserving comments and any
  // fields the form doesn't manage.
  const onSelectedEmitterChange = useCallback(
    (emitter: string) =>
      updateState({ tspconfig: updateTspConfigYaml(tspconfig, emitter, compilerOptions) }),
    [updateState, tspconfig, compilerOptions],
  );
  const onCompilerOptionsChange = useCallback(
    (newOptions: CompilerOptions) =>
      updateState({ tspconfig: updateTspConfigYaml(tspconfig, selectedEmitter, newOptions) }),
    [updateState, tspconfig, selectedEmitter],
  );
  const onSelectedSampleNameChange = useCallback(
    (sampleName: string) => updateState({ sampleName }),
    [updateState],
  );
  const onSelectedViewerChange = useCallback(
    (selectedViewer: string) => updateState({ selectedViewer }),
    [updateState],
  );
  const onViewerStateChange = useCallback(
    (viewerState: Record<string, any>) => updateState({ viewerState }),
    [updateState],
  );
  const onContentChange = useCallback((content: string) => updateState({ content }), [updateState]);

  // Track last processed sample to avoid re-processing
  const lastProcessedSample = useRef<string>("");

  // Handle sample changes
  useEffect(() => {
    if (selectedSampleName && samples && selectedSampleName !== lastProcessedSample.current) {
      const config = samples[selectedSampleName];
      if (config?.content) {
        lastProcessedSample.current = selectedSampleName;
        const updates: Partial<PlaygroundState> = { content: config.content };
        // Samples are authored with structured emitter/options — convert them into the
        // raw tspconfig.yaml which is the playground's source of truth.
        if (config.preferredEmitter || config.compilerOptions) {
          updates.tspconfig = compilerOptionsToTspConfig(
            config.preferredEmitter ?? "",
            config.compilerOptions ?? {},
          );
        }
        updateState(updates);
      }
    }
  }, [selectedSampleName, samples, updateState]);

  return {
    // State values
    selectedEmitter,
    compilerOptions,
    tspconfig,
    selectedSampleName,
    selectedViewer,
    viewerState: playgroundState.viewerState ?? {},
    content,

    // State setters
    onSelectedEmitterChange,
    onCompilerOptionsChange,
    onTspconfigChange,
    onSelectedSampleNameChange,
    onSelectedViewerChange,
    onViewerStateChange,
    onContentChange,

    // Full state management
    playgroundState,
    setPlaygroundState,
  };
}
