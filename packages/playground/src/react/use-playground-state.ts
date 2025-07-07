import type { CompilerOptions } from "@typespec/compiler";
import { useControllableValue } from "@typespec/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaygroundSample } from "../types.js";

export interface PlaygroundState {
  /** Emitter to use */
  emitter?: string;
  /** Emitter options */
  compilerOptions?: CompilerOptions;
  /** Sample to use */
  sampleName?: string;
  /** Selected viewer */
  selectedViewer?: string;
  /** Internal state of viewers */
  viewerState?: Record<string, any>;
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

  /** Function to update TypeSpec content */
  updateTypeSpec?: (content: string) => void;
}

export interface PlaygroundStateResult {
  // State values
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  selectedSampleName: string;
  selectedViewer?: string;
  viewerState: Record<string, any>;

  // State setters
  onSelectedEmitterChange: (emitter: string) => void;
  onCompilerOptionsChange: (compilerOptions: CompilerOptions) => void;
  onSelectedSampleNameChange: (sampleName: string) => void;
  onSelectedViewerChange: (selectedViewer: string) => void;
  onViewerStateChange: (viewerState: Record<string, any>) => void;

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
  updateTypeSpec,
}: UsePlaygroundStateProps): PlaygroundStateResult {
  // Create the effective default state with proper fallback logic
  const effectiveDefaultState = useMemo((): PlaygroundState => {
    const baseDefault = defaultPlaygroundState ?? {};

    // If no emitter is provided in defaultPlaygroundState, use fallback logic
    if (!baseDefault.emitter) {
      // First try the deprecated defaultEmitter prop
      if (defaultEmitter) {
        return { ...baseDefault, emitter: defaultEmitter };
      }
    }

    return baseDefault;
  }, [defaultPlaygroundState, defaultEmitter, libraries]);

  // Use a single controllable value for the entire playground state
  const [playgroundState, setPlaygroundState] = useControllableValue(
    controlledPlaygroundState,
    effectiveDefaultState,
    onPlaygroundStateChange,
  );

  // Extract individual values from the consolidated state with proper defaults
  const selectedEmitter = playgroundState.emitter as any;
  const compilerOptions = useMemo(
    () => playgroundState.compilerOptions ?? {},
    [playgroundState.compilerOptions],
  );
  const selectedSampleName = playgroundState.sampleName ?? "";
  const selectedViewer = playgroundState.selectedViewer;

  // Individual change handlers that update the consolidated state
  const onSelectedEmitterChange = useCallback(
    (emitter: string) => {
      setPlaygroundState({ ...playgroundState, emitter });
    },
    [playgroundState, setPlaygroundState],
  );

  const onCompilerOptionsChange = useCallback(
    (compilerOptions: CompilerOptions) => {
      setPlaygroundState({ ...playgroundState, compilerOptions });
    },
    [playgroundState, setPlaygroundState],
  );

  const onSelectedSampleNameChange = useCallback(
    (sampleName: string) => {
      setPlaygroundState({ ...playgroundState, sampleName });
    },
    [playgroundState, setPlaygroundState],
  );

  const onSelectedViewerChange = useCallback(
    (selectedViewer: string) => {
      setPlaygroundState({ ...playgroundState, selectedViewer });
    },
    [playgroundState, setPlaygroundState],
  );

  const [viewerState, setViewerState] = useState<Record<string, any>>(
    playgroundState.viewerState ?? {},
  );

  // Update viewerState when playgroundState.viewerState changes
  useEffect(() => {
    if (playgroundState.viewerState) {
      setViewerState(playgroundState.viewerState);
    }
  }, [playgroundState.viewerState]);

  const onViewerStateChange = useCallback(
    (newViewerState: Record<string, any>) => {
      setViewerState(newViewerState);
      setPlaygroundState({ ...playgroundState, viewerState: newViewerState });
    },
    [playgroundState, setPlaygroundState],
  );

  // Store refs to latest callback functions to avoid dependency issues
  const onSelectedEmitterChangeRef = useRef(onSelectedEmitterChange);
  const onCompilerOptionsChangeRef = useRef(onCompilerOptionsChange);

  // Update refs when callbacks change
  useEffect(() => {
    onSelectedEmitterChangeRef.current = onSelectedEmitterChange;
    onCompilerOptionsChangeRef.current = onCompilerOptionsChange;
  });

  // Handle sample changes
  useEffect(() => {
    if (selectedSampleName && samples && updateTypeSpec) {
      const config = samples[selectedSampleName];
      if (config.content) {
        updateTypeSpec(config.content);
        if (config.preferredEmitter) {
          onSelectedEmitterChangeRef.current(config.preferredEmitter);
        }
        if (config.compilerOptions) {
          onCompilerOptionsChangeRef.current(config.compilerOptions);
        }
      }
    }
  }, [selectedSampleName, samples, updateTypeSpec]);

  return {
    // State values
    selectedEmitter,
    compilerOptions,
    selectedSampleName,
    selectedViewer,
    viewerState,

    // State setters
    onSelectedEmitterChange,
    onCompilerOptionsChange,
    onSelectedSampleNameChange,
    onSelectedViewerChange,
    onViewerStateChange,

    // Full state management
    playgroundState,
    setPlaygroundState,
  };
}
