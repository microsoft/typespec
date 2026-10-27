import type { CompilerOptions } from "@typespec/compiler";
import { useControllableValue } from "@typespec/react-components";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PlaygroundSample } from "../types.js";
import {
  compilerOptionsToTspConfig,
  parseTspConfigYaml,
  updateTspConfigYaml,
} from "./editor-panel/tspconfig-utils.js";

/**
 * Serializable playground state for controlled usage, initial defaults, and persistence.
 * Raw `tspconfig` takes precedence over the legacy structured emitter and compiler options.
 */
export interface PlaygroundState {
  /** Legacy emitter selection used to synthesize configuration when `tspconfig` is absent. */
  emitter?: string;
  /** Legacy structured options used to synthesize configuration when `tspconfig` is absent. */
  compilerOptions?: CompilerOptions;
  /** Raw tspconfig.yaml content. Source of truth for the compiler configuration. */
  tspconfig?: string;
  /** Sample key to load; loading a new nonempty sample replaces content and any supplied settings. */
  sampleName?: string;
  /** Key of a program viewer; omit to let the output view manage its own selection. */
  selectedViewer?: string;
  /** State passed through to custom program viewers; updates replace the entire record. */
  viewerState?: Record<string, any>;
  /** TypeSpec content */
  content?: string;
}

/** Inputs for controlled or internally managed playground state. Choose a mode on the first render. */
export interface UsePlaygroundStateProps {
  /** List of available libraries */
  readonly libraries: readonly string[];

  /** Samples available */
  samples?: Record<string, PlaygroundSample>;

  /** Controlled state snapshot; the caller must apply changes received through the callback. */
  playgroundState?: PlaygroundState;
  /** Initial state for uncontrolled usage; later changes do not reset the state. */
  defaultPlaygroundState?: PlaygroundState;
  /** Receives the full next snapshot for both controlled and uncontrolled updates. */
  onPlaygroundStateChange?: (state: PlaygroundState) => void;

  /**
   * Default emitter to use if not provided in defaultPlaygroundState.
   * @deprecated Use defaultPlaygroundState.emitter instead
   */
  defaultEmitter?: string;

  /** Default content if not provided in defaultPlaygroundState */
  defaultContent?: string;
}

/** Effective editor/configuration values and callbacks that update their underlying state snapshot. */
export interface PlaygroundStateResult {
  // State values
  /** First emitter parsed from `tspconfig`, or an empty string if none is selected. */
  selectedEmitter: string;
  /** Structured options derived from `tspconfig`, or an empty object if parsing fails. */
  compilerOptions: CompilerOptions;
  /** Raw tspconfig.yaml content (source of truth for the configuration). */
  tspconfig: string;
  /** Selected sample key, defaulting to an empty string. */
  selectedSampleName: string;
  /** Program-viewer key from the state, undefined when selection is internally managed. */
  selectedViewer?: string;
  /** Viewer state from the snapshot, defaulting to an empty object. */
  viewerState: Record<string, any>;
  /** Editor source from the snapshot, defaulting to an empty string. */
  content: string;

  // State setters
  /**
   * Rewrite the emitter selection, preserving comments and unrelated settings only for valid mapping YAML.
   * Empty, invalid, or non-mapping YAML is rebuilt from the requested emitter and current supported
   * compiler options, discarding comments and unrelated settings.
   */
  onSelectedEmitterChange: (emitter: string) => void;
  /**
   * Rewrite supported options, preserving comments and unrelated settings only for valid mapping YAML.
   * Empty, invalid, or non-mapping YAML is rebuilt from the selected emitter and requested supported
   * compiler options, discarding comments and unrelated settings.
   */
  onCompilerOptionsChange: (compilerOptions: CompilerOptions) => void;
  /** Store raw YAML unchanged, including incomplete or invalid edits. */
  onTspconfigChange: (tspconfig: string) => void;
  /** Select a sample key; the sample-loading effect then applies its content and settings. */
  onSelectedSampleNameChange: (sampleName: string) => void;
  /** Store the selected program-viewer key. */
  onSelectedViewerChange: (selectedViewer: string) => void;
  /** Replace the viewer-state record without merging its entries. */
  onViewerStateChange: (viewerState: Record<string, any>) => void;
  /** Replace source content while preserving other state fields. */
  onContentChange: (content: string) => void;

  // Full state management
  /** Underlying snapshot before derived defaults and YAML parsing are applied. */
  playgroundState: PlaygroundState;
  /** Replace the complete snapshot; in controlled mode, only requests an update from its owner. */
  setPlaygroundState: (state: PlaygroundState) => void;
}

/**
 * Manage a single playground state snapshot and derive editor values from it.
 * Omit `playgroundState` for internal state, or supply it with a change callback for controlled
 * usage; do not switch modes after mounting. Individual callbacks preserve other snapshot fields.
 * When raw YAML is absent, configuration is synthesized from the legacy structured fields.
 */
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

  // Visual form changes preserve comments and unmanaged fields in valid mapping YAML;
  // otherwise updateTspConfigYaml rebuilds the configuration from structured settings.
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
