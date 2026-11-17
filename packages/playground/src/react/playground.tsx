import type { Diagnostic, DiagnosticTarget } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
// Keep runtime styles out of the emitted declarations.
import {} from "@typespec/react-components/style.css";
import { editor } from "monaco-editor";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { EditorCommandBar } from "../editor-command-bar/editor-command-bar.js";
import { getMonacoRange } from "../services.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";
import { PlaygroundContextProvider } from "./context/playground-context.js";
import { debugGlobals, printDebugInfo } from "./debug.js";
import { DefaultFooter } from "./default-footer.js";
import { EditorPanel } from "./editor-panel/editor-panel.js";
import { useMonacoModel, type OnMountData } from "./editor.js";
import {
  useCompilation,
  useDebouncedCompile,
  useEditorActions,
  useMonacoSync,
  type PlaygroundSaveData,
} from "./hooks/index.js";
import { OutputView } from "./output-view/output-view.js";
import style from "./playground.module.css";
import { ProblemPane } from "./problem-pane/index.js";
import type { CommandBarItem } from "./responsive-command-bar/index.js";
import type { FileOutputViewer, ProgramViewer } from "./types.js";
import { useIsMobile } from "./use-mobile.js";
import { usePlaygroundState, type PlaygroundState } from "./use-playground-state.js";
import { ViewToggle, type ViewMode } from "./view-toggle.js";

// Re-export the PlaygroundState type for convenience
export type { PlaygroundState };

/** Playground UI behavior overrides for one emitter, separate from its compiler options. */
export interface PlaygroundEmitterOptions {
  /** Compile debounce delay in milliseconds. Default is 200. */
  debounce?: number;
}

/** Host, state ownership, and extension points for an embedded TypeSpec playground. */
export interface PlaygroundProps {
  /** Initialized browser host; register Monaco language services before mounting the playground. */
  host: BrowserHost;

  /** Default content if leaving this unmanaged. */
  defaultContent?: string;

  /** List of available libraries */
  readonly libraries: readonly string[];

  /** Samples available */
  samples?: Record<string, PlaygroundSample>;

  /** Controlled snapshot; keep this mode for the component's lifetime and apply requested updates. */
  playgroundState?: PlaygroundState;
  /** Initial snapshot when uncontrolled; later changes do not reset existing state. */
  defaultPlaygroundState?: PlaygroundState;
  /** Full next snapshot, emitted for both controlled and uncontrolled changes. */
  onPlaygroundStateChange?: (state: PlaygroundState) => void;

  /**
   * Default emitter to use if not provided in defaultPlaygroundState.
   * @deprecated Use defaultPlaygroundState.emitter instead
   */
  defaultEmitter?: string;

  /** Enable the file-bug command; invoked after requesting a save through `onSave`, if supplied. */
  onFileBug?: () => void;

  /** Additional items to show in the command bar. */
  commandBarItems?: CommandBarItem[];

  /** Program-level output tabs; matching keys replace built-in or earlier custom viewers. */
  viewers?: ProgramViewer[];

  /** Additional file renderers keyed by emitter package name, offered alongside the raw-text view. */
  emitterViewers?: Record<string, FileOutputViewer[]>;

  /**
   * Per-emitter playground options. Key is the emitter name.
   */
  emitterOptions?: Record<string, PlaygroundEmitterOptions>;

  /** Receives a snapshot on Save or the save keyboard shortcut; absent handlers make Save a no-op. */
  onSave?: (value: PlaygroundSaveData) => void;

  /** Editor presentation settings; omitted settings use playground defaults. */
  editorOptions?: PlaygroundEditorsOptions;

  /**
   * Replace the default footer. Null or undefined keeps the default; use an empty fragment to hide it.
   */
  footer?: ReactNode;
}

/** Presentation settings shared by playground editor panels. */
export interface PlaygroundEditorsOptions {
  /** Monaco theme name, applied globally; defaults to `"typespec"`. */
  theme?: string;
}

// Re-export PlaygroundSaveData from hooks for backward compatibility
export type { PlaygroundSaveData };

/**
 * Playground component for TypeSpec with consolidated state management.
 *
 * @example
 * ```tsx
 * const [playgroundState, setPlaygroundState] = useState<PlaygroundState>({
 *   emitter: 'openapi3',
 *   compilerOptions: {},
 *   sampleName: 'basic',
 *   selectedViewer: 'openapi',
 *   viewerState: {}
 * });
 *
 * <Playground
 *   host={host}
 *   playgroundState={playgroundState}
 *   onPlaygroundStateChange={setPlaygroundState}
 *   samples={samples}
 *   viewers={viewers}
 * />
 * ```
 *
 * For uncontrolled usage, use defaultPlaygroundState:
 * ```tsx
 * <Playground
 *   host={host}
 *   defaultPlaygroundState={{
 *     emitter: 'openapi3',
 *     compilerOptions: {},
 *   }}
 *   samples={samples}
 *   viewers={viewers}
 * />
 * ```
 *
 * For backward compatibility, you can also use the deprecated defaultEmitter prop:
 * ```tsx
 * <Playground
 *   host={host}
 *   defaultEmitter="openapi3"
 *   samples={samples}
 *   viewers={viewers}
 * />
 * ```
 */
export const Playground: FunctionComponent<PlaygroundProps> = (props) => {
  const { host, onSave } = props;
  const editorRef = useRef<editor.IStandaloneCodeEditor | undefined>(undefined);

  useEffect(() => {
    editor.setTheme(props.editorOptions?.theme ?? "typespec");
  }, [props.editorOptions?.theme]);

  useEffect(() => {
    printDebugInfo();
    debugGlobals().host = host;
  }, [host]);

  const typespecModel = useMonacoModel("inmemory://test/main.tsp", "typespec");

  // Use the playground state hook
  const state = usePlaygroundState({
    libraries: props.libraries,
    samples: props.samples,
    playgroundState: props.playgroundState,
    defaultPlaygroundState: props.defaultPlaygroundState,
    onPlaygroundStateChange: props.onPlaygroundStateChange,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    defaultEmitter: props.defaultEmitter,
    defaultContent: props.defaultContent,
  });

  const {
    selectedEmitter,
    compilerOptions,
    tspconfig,
    selectedSampleName,
    selectedViewer,
    viewerState,
    content,
    onSelectedEmitterChange,
    onCompilerOptionsChange,
    onTspconfigChange,
    onSelectedSampleNameChange,
    onSelectedViewerChange,
    onViewerStateChange,
    onContentChange,
  } = state;

  // Bidirectional Monaco ↔ state sync
  useMonacoSync({ typespecModel, content, onContentChange });

  // Compilation
  const { compilationState, isCompiling, isOutputStale, doCompile } = useCompilation({
    host,
    selectedEmitter,
    tspconfig,
    typespecModel,
  });

  // Debounced recompile on content changes
  const currentEmitterOptions = selectedEmitter
    ? props.emitterOptions?.[selectedEmitter]
    : undefined;
  useDebouncedCompile({
    typespecModel,
    doCompile,
    debounceDelay: currentEmitterOptions?.debounce,
  });

  // Editor actions (save, format, file-bug, keybindings)
  const isSampleUntouched = useMemo(() => {
    return Boolean(selectedSampleName && content === props.samples?.[selectedSampleName]?.content);
  }, [content, selectedSampleName, props.samples]);

  const { saveCode, formatCode, fileBug, editorActions } = useEditorActions({
    typespecModel,
    editorRef,
    selectedEmitter,
    compilerOptions,
    tspconfig,
    selectedSampleName,
    isSampleUntouched,
    selectedViewer,
    viewerState,
    onSave,
    onFileBug: props.onFileBug,
  });

  const onTypeSpecEditorMount = useCallback(({ editor }: OnMountData) => {
    editorRef.current = editor;
  }, []);

  const [verticalPaneSizes, setVerticalPaneSizes] = useState<(string | number | undefined)[]>(
    verticalPaneSizesConst.collapsed,
  );
  const toggleProblemPane = useCallback(() => {
    setVerticalPaneSizes((value) => {
      return value === verticalPaneSizesConst.collapsed
        ? verticalPaneSizesConst.expanded
        : verticalPaneSizesConst.collapsed;
    });
  }, [setVerticalPaneSizes]);

  const onVerticalPaneSizeChange = useCallback(
    (sizes: number[]) => {
      setVerticalPaneSizes(sizes);
    },
    [setVerticalPaneSizes],
  );
  const handleDiagnosticSelected = useCallback(
    (diagnostic: Diagnostic) => {
      editorRef.current?.setSelection(getMonacoRange(host.compiler, diagnostic.target));
    },
    [host.compiler],
  );

  const handleRevealSource = useCallback(
    (target: DiagnosticTarget) => {
      const range = getMonacoRange(host.compiler, target);
      editorRef.current?.setSelection(range);
      editorRef.current?.revealRangeInCenterIfOutsideViewport(range);
      editorRef.current?.focus();
    },
    [host.compiler],
  );

  const playgroundContext = useMemo(() => {
    return {
      host,
      setContent: (val: string) => {
        typespecModel.setValue(val);
        onContentChange(val);
      },
    };
  }, [host, typespecModel, onContentChange]);

  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>("editor");

  // Reset to "editor" when entering mobile, force "both" on desktop
  useEffect(() => {
    if (!isMobile) {
      setViewMode("both");
    } else {
      setViewMode("editor");
    }
  }, [isMobile]);

  const commandBar = (
    <EditorCommandBar
      host={host}
      selectedEmitter={selectedEmitter}
      onSelectedEmitterChange={onSelectedEmitterChange}
      samples={props.samples}
      selectedSampleName={selectedSampleName}
      onSelectedSampleNameChange={onSelectedSampleNameChange}
      saveCode={saveCode}
      formatCode={formatCode}
      fileBug={props.onFileBug ? fileBug : undefined}
      commandBarItems={props.commandBarItems}
    />
  );

  const editorPanel = (
    <EditorPanel
      host={host}
      model={typespecModel}
      actions={editorActions}
      editorOptions={props.editorOptions}
      onMount={onTypeSpecEditorMount}
      selectedEmitter={selectedEmitter}
      compilerOptions={compilerOptions}
      tspconfig={tspconfig}
      onCompilerOptionsChange={onCompilerOptionsChange}
      onSelectedEmitterChange={onSelectedEmitterChange}
      onTspconfigChange={onTspconfigChange}
      commandBar={isMobile ? undefined : commandBar}
    />
  );

  const outputPanel = (
    <OutputView
      compilationState={compilationState}
      isCompiling={isCompiling}
      isOutputStale={isOutputStale}
      onRevealSource={handleRevealSource}
      editorOptions={props.editorOptions}
      viewers={props.viewers}
      fileViewers={selectedEmitter ? props.emitterViewers?.[selectedEmitter] : undefined}
      selectedViewer={selectedViewer}
      onViewerChange={onSelectedViewerChange}
      viewerState={viewerState}
      onViewerStateChange={onViewerStateChange}
    />
  );

  const mainContent =
    viewMode === "both" ? (
      <SplitPane initialSizes={["50%", "50%"]}>
        <Pane className={style["edit-pane"]}>{editorPanel}</Pane>
        <Pane>{outputPanel}</Pane>
      </SplitPane>
    ) : viewMode === "editor" ? (
      <div className={style["single-pane"]}>{editorPanel}</div>
    ) : (
      <div className={style["single-pane"]}>{outputPanel}</div>
    );

  return (
    <PlaygroundContextProvider value={playgroundContext}>
      <div className={style["layout"]}>
        {isMobile && (
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} actions={commandBar} />
        )}
        <SplitPane sizes={verticalPaneSizes} onChange={onVerticalPaneSizeChange} split="horizontal">
          <Pane>{mainContent}</Pane>
          <Pane minSize={30}>
            <ProblemPane
              collapsed={verticalPaneSizes[1] === verticalPaneSizesConst.collapsed[1]}
              compilationState={compilationState}
              onHeaderClick={toggleProblemPane}
              onDiagnosticSelected={handleDiagnosticSelected}
            />
          </Pane>
        </SplitPane>
        {props.footer ?? <DefaultFooter />}
      </div>
    </PlaygroundContextProvider>
  );
};

const verticalPaneSizesConst = {
  collapsed: [undefined, 30],
  expanded: [undefined, 200],
};
