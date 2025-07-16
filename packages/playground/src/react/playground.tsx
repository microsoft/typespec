import type { CompilerOptions, Diagnostic } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import "@typespec/react-components/style.css";
import debounce from "debounce";
import { KeyCode, KeyMod, MarkerSeverity, Uri, editor } from "monaco-editor";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { CompletionItemTag } from "vscode-languageserver";
import { resolveVirtualPath } from "../browser-host.js";
import { EditorCommandBar } from "../editor-command-bar/editor-command-bar.js";
import { getMonacoRange } from "../services.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";
import { PlaygroundContextProvider } from "./context/playground-context.js";
import { DefaultFooter } from "./default-footer.js";
import { useMonacoModel, type OnMountData } from "./editor.js";
import { OutputView } from "./output-view/output-view.js";
import style from "./playground.module.css";
import { ProblemPane } from "./problem-pane/index.js";
import type { CompilationState, FileOutputViewer, ProgramViewer } from "./types.js";
import { TypeSpecEditor } from "./typespec-editor.js";
import { usePlaygroundState, type PlaygroundState } from "./use-playground-state.js";

// Re-export the PlaygroundState type for convenience
export type { PlaygroundState };

export interface PlaygroundProps {
  host: BrowserHost;

  /** Default content if leaving this unmanaged. */
  defaultContent?: string;

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

  onFileBug?: () => void;

  /** Additional buttons to show up in the command bar */
  commandBarButtons?: ReactNode;

  /** Playground links */
  links?: PlaygroundLinks;

  /** Custom viewers to view the typespec program */
  viewers?: ProgramViewer[];

  /** Custom file viewers that enabled for certain emitters. Key of the map is emitter name */
  emitterViewers?: Record<string, FileOutputViewer[]>;

  onSave?: (value: PlaygroundSaveData) => void;

  editorOptions?: PlaygroundEditorsOptions;

  /**
   * Change the footer of the playground.
   */
  footer?: ReactNode;
}

export interface PlaygroundEditorsOptions {
  theme?: string;
}

export interface PlaygroundSaveData extends PlaygroundState {
  /** Current content of the playground.   */
  content: string;

  /** Emitter name. */
  emitter: string;
}

export interface PlaygroundLinks {
  /** Link to documentation */
  documentationUrl?: string;
}

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

  const typespecModel = useMonacoModel("inmemory://test/main.tsp", "typespec");
  const [compilationState, setCompilationState] = useState<CompilationState | undefined>(undefined);

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

  // Extract values from the state hook
  const {
    selectedEmitter,
    compilerOptions,
    selectedSampleName,
    selectedViewer,
    viewerState,
    content,
    onSelectedEmitterChange,
    onCompilerOptionsChange,
    onSelectedSampleNameChange,
    onSelectedViewerChange,
    onViewerStateChange,
    onContentChange,
  } = state;

  // Sync Monaco model with state content
  useEffect(() => {
    if (typespecModel.getValue() !== (content ?? "")) {
      typespecModel.setValue(content ?? "");
    }
  }, [content, typespecModel]);

  // Update state when Monaco model changes
  useEffect(() => {
    const disposable = typespecModel.onDidChangeContent(() => {
      const newContent = typespecModel.getValue();
      if (newContent !== content) {
        onContentChange(newContent);
      }
    });
    return () => disposable.dispose();
  }, [typespecModel, content, onContentChange]);

  const isSampleUntouched = useMemo(() => {
    return Boolean(selectedSampleName && content === props.samples?.[selectedSampleName]?.content);
  }, [content, selectedSampleName, props.samples]);

  const doCompile = useCallback(async () => {
    const currentContent = typespecModel.getValue();
    const typespecCompiler = host.compiler;

    const state = await compile(host, currentContent, selectedEmitter, compilerOptions);
    setCompilationState(state);
    if ("program" in state) {
      const markers: editor.IMarkerData[] = state.program.diagnostics.map((diag) => ({
        ...getMonacoRange(typespecCompiler, diag.target),
        message: diag.message,
        severity: diag.severity === "error" ? MarkerSeverity.Error : MarkerSeverity.Warning,
        tags: diag.code === "deprecated" ? [CompletionItemTag.Deprecated] : undefined,
      }));

      editor.setModelMarkers(typespecModel, "owner", markers ?? []);
    } else {
      editor.setModelMarkers(typespecModel, "owner", []);
    }
  }, [host, selectedEmitter, compilerOptions, typespecModel]);

  useEffect(() => {
    const debouncer = debounce(() => doCompile(), 200);
    const disposable = typespecModel.onDidChangeContent(debouncer);
    return () => {
      debouncer.clear();
      disposable.dispose();
    };
  }, [typespecModel, doCompile]);

  useEffect(() => {
    void doCompile();
  }, [doCompile]);

  const saveCode = useCallback(() => {
    if (onSave) {
      onSave({
        content: content ?? "",
        emitter: selectedEmitter,
        compilerOptions,
        sampleName: isSampleUntouched ? selectedSampleName : undefined,
        selectedViewer,
        viewerState,
      });
    }
  }, [
    content,
    onSave,
    selectedEmitter,
    compilerOptions,
    selectedSampleName,
    isSampleUntouched,
    selectedViewer,
    viewerState,
  ]);

  const formatCode = useCallback(() => {
    void editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, []);

  const fileBug = useCallback(async () => {
    if (props.onFileBug) {
      saveCode();
      props.onFileBug();
    }
  }, [props, saveCode]);

  const typespecEditorActions = useMemo(
    (): editor.IActionDescriptor[] => [
      // ctrl/cmd+S => save
      { id: "save", label: "Save", keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS], run: saveCode },
    ],
    [saveCode],
  );

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

  const playgroundContext = useMemo(() => {
    return {
      host,
      setContent: (val: string) => {
        typespecModel.setValue(val);
        onContentChange(val);
      },
    };
  }, [host, typespecModel, onContentChange]);

  return (
    <PlaygroundContextProvider value={playgroundContext}>
      <div className={style["layout"]}>
        <SplitPane sizes={verticalPaneSizes} onChange={onVerticalPaneSizeChange} split="horizontal">
          <Pane>
            <SplitPane initialSizes={["50%", "50%"]}>
              <Pane className={style["edit-pane"]}>
                <EditorCommandBar
                  host={host}
                  selectedEmitter={selectedEmitter}
                  onSelectedEmitterChange={onSelectedEmitterChange}
                  compilerOptions={compilerOptions}
                  onCompilerOptionsChange={onCompilerOptionsChange}
                  samples={props.samples}
                  selectedSampleName={selectedSampleName}
                  onSelectedSampleNameChange={onSelectedSampleNameChange}
                  saveCode={saveCode}
                  formatCode={formatCode}
                  fileBug={props.onFileBug ? fileBug : undefined}
                  commandBarButtons={props.commandBarButtons}
                  documentationUrl={props.links?.documentationUrl}
                />
                <TypeSpecEditor
                  model={typespecModel}
                  actions={typespecEditorActions}
                  options={props.editorOptions}
                  onMount={onTypeSpecEditorMount}
                />
              </Pane>
              <Pane>
                <OutputView
                  compilationState={compilationState}
                  editorOptions={props.editorOptions}
                  viewers={props.viewers}
                  fileViewers={
                    selectedEmitter ? props.emitterViewers?.[selectedEmitter] : undefined
                  }
                  selectedViewer={selectedViewer}
                  onViewerChange={onSelectedViewerChange}
                  viewerState={viewerState}
                  onViewerStateChange={onViewerStateChange}
                />
              </Pane>
            </SplitPane>
          </Pane>
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
const outputDir = resolveVirtualPath("tsp-output");

async function compile(
  host: BrowserHost,
  content: string,
  selectedEmitter: string,
  options: CompilerOptions,
): Promise<CompilationState> {
  await host.writeFile("main.tsp", content);
  await emptyOutputDir(host);
  try {
    const typespecCompiler = host.compiler;
    const program = await typespecCompiler.compile(host, resolveVirtualPath("main.tsp"), {
      ...options,
      options: {
        ...options.options,
        [selectedEmitter]: {
          ...options.options?.[selectedEmitter],
          "emitter-output-dir": outputDir,
        },
      },
      outputDir,
      emit: selectedEmitter ? [selectedEmitter] : [],
    });
    const outputFiles = await findOutputFiles(host);
    return { program, outputFiles };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Internal compiler error", error);
    return { internalCompilerError: error };
  }
}
async function findOutputFiles(host: BrowserHost): Promise<string[]> {
  const files: string[] = [];

  async function addFiles(dir: string) {
    const items = await host.readDir(outputDir + dir);
    for (const item of items) {
      const itemPath = `${dir}/${item}`;
      if ((await host.stat(outputDir + itemPath)).isDirectory()) {
        await addFiles(itemPath);
      } else {
        files.push(dir === "" ? item : `${dir}/${item}`);
      }
    }
  }
  await addFiles("");
  return files;
}

async function emptyOutputDir(host: BrowserHost) {
  // empty output directory
  const dirs = await host.readDir("./tsp-output");
  for (const file of dirs) {
    const path = "./tsp-output/" + file;
    const uri = Uri.parse(host.pathToFileURL(path));
    const model = editor.getModel(uri);
    if (model) {
      model.dispose();
    }
    await host.rm(path, { recursive: true });
  }
}
