import { CompilerOptions } from "@typespec/compiler";
import debounce from "debounce";
import { KeyCode, KeyMod, MarkerSeverity, Uri, editor } from "monaco-editor";
import {
  FunctionComponent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CompletionItemTag } from "vscode-languageserver";
import { getMarkerLocation } from "../services.js";
import { BrowserHost, PlaygroundSample } from "../types.js";
import { EditorCommandBar } from "./editor-command-bar.js";
import { OnMountData, useMonacoModel } from "./editor.js";
import { DefaultFooter } from "./footer.js";
import { useControllableValue } from "./hooks.js";
import { OutputView } from "./output-view.js";
import Pane from "./split-pane/pane.js";
import { SplitPane } from "./split-pane/split-pane.js";
import { CompilationState, FileOutputViewer } from "./types.js";
import { TypeSpecEditor } from "./typespec-editor.js";

export interface PlaygroundProps {
  host: BrowserHost;

  /** Default emitter if leaving this unmanaged. */
  defaultContent?: string;

  /** List of available libraries */
  libraries: string[];

  /** Emitter to use */
  emitter?: string;
  /** Default emitter if leaving this unmanaged. */
  defaultEmitter?: string;
  /** Callback when emitter change */
  onEmitterChange?: (emitter: string) => void;

  /** Emitter options */
  compilerOptions?: CompilerOptions;
  /** Default emitter options if leaving this unmanaged. */
  defaultCompilerOptions?: CompilerOptions;
  /** Callback when emitter options change */
  onCompilerOptionsChange?: (emitter: CompilerOptions) => void;

  /** Samples available */
  samples?: Record<string, PlaygroundSample>;

  /** Sample to use */
  sampleName?: string;
  /** Default sample if leaving this unmanaged. */
  defaultSampleName?: string;
  /** Callback when sample change */
  onSampleNameChange?: (sampleName: string) => void;

  /** Playground links */
  links?: PlaygroundLinks;

  /** Custom viewers that enabled for certain emitters. Key of the map is emitter name */
  emitterViewers?: Record<string, FileOutputViewer[]>;

  onSave?: (value: PlaygroundSaveData) => void;

  editorOptions?: PlaygroundEditorsOptions;

  /**
   * Change the footer of the playground.
   */
  footer?: (data: { host: BrowserHost }) => ReactNode;
}

export interface PlaygroundEditorsOptions {
  theme?: string;
}

export interface PlaygroundSaveData {
  /** Current content of the playground.   */
  content: string;

  /** Emitter name. */
  emitter: string;

  /** Emitter options. */
  options?: CompilerOptions;

  /** If a sample is selected and the content hasn't changed since. */
  sampleName?: string;
}

export interface PlaygroundLinks {
  /** Link to documentation */
  documentationUrl?: string;
  /** Issue to github issue to open a new issue. */
  githubIssueUrl?: string;
}

export const Playground: FunctionComponent<PlaygroundProps> = (props) => {
  const { host, onSave } = props;
  const editorRef = useRef<editor.IStandaloneCodeEditor | undefined>(undefined);

  const [selectedEmitter, onSelectedEmitterChange] = useControllableValue(
    props.emitter,
    props.defaultEmitter,
    props.onEmitterChange
  );
  const [compilerOptions, onCompilerOptionsChange] = useControllableValue(
    props.compilerOptions,
    props.defaultCompilerOptions ?? {},
    props.onCompilerOptionsChange
  );
  const [selectedSampleName, onSelectedSampleNameChange] = useControllableValue(
    props.sampleName,
    props.defaultSampleName,
    props.onSampleNameChange
  );
  const [content, setContent] = useState(props.defaultContent);
  const isSampleUntouched = useMemo(() => {
    return Boolean(selectedSampleName && content === props.samples?.[selectedSampleName]?.content);
  }, [content, selectedSampleName, props.samples]);
  const typespecModel = useMonacoModel("inmemory://test/main.tsp", "typespec");
  const [compilationState, setCompilationState] = useState<CompilationState | undefined>(undefined);

  const doCompile = useCallback(async () => {
    const content = typespecModel.getValue();
    setContent(content);
    const typespecCompiler = host.compiler;

    const state = await compile(host, content, selectedEmitter, compilerOptions);
    setCompilationState(state);
    if ("program" in state) {
      const markers: editor.IMarkerData[] = state.program.diagnostics.map((diag) => ({
        ...getMarkerLocation(typespecCompiler, diag.target),
        message: diag.message,
        severity: diag.severity === "error" ? MarkerSeverity.Error : MarkerSeverity.Warning,
        tags: diag.code === "deprecated" ? [CompletionItemTag.Deprecated] : undefined,
      }));

      editor.setModelMarkers(typespecModel, "owner", markers ?? []);
    } else {
      editor.setModelMarkers(typespecModel, "owner", []);
    }
  }, [host, selectedEmitter, compilerOptions, typespecModel, setContent]);

  const updateTypeSpec = useCallback(
    (value: string) => {
      if (typespecModel.getValue() !== value) {
        typespecModel.setValue(value);
      }
    },
    [typespecModel]
  );
  useEffect(() => {
    updateTypeSpec(props.defaultContent ?? "");
  }, []);

  useEffect(() => {
    if (selectedSampleName && props.samples) {
      const config = props.samples[selectedSampleName];
      if (config.content) {
        updateTypeSpec(config.content);
        if (config.preferredEmitter) {
          onSelectedEmitterChange(config.preferredEmitter);
        }
        if (config.compilerOptions) {
          onCompilerOptionsChange(config.compilerOptions);
        }
      }
    }
  }, [updateTypeSpec, selectedSampleName]);

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
        content: typespecModel.getValue(),
        emitter: selectedEmitter,
        options: compilerOptions,
        sampleName: isSampleUntouched ? selectedSampleName : undefined,
      });
    }
  }, [
    typespecModel,
    onSave,
    selectedEmitter,
    compilerOptions,
    selectedSampleName,
    isSampleUntouched,
  ]);

  const formatCode = useCallback(() => {
    void editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, [typespecModel]);

  const newIssue = useCallback(async () => {
    saveCode();
    const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
    const url = `${props?.links?.githubIssueUrl}?body=${bodyPayload}`;
    window.open(url, "_blank");
  }, [saveCode, typespecModel]);

  const typespecEditorActions = useMemo(
    (): editor.IActionDescriptor[] => [
      // ctrl/cmd+S => save
      { id: "save", label: "Save", keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS], run: saveCode },
    ],
    [saveCode]
  );

  const onTypeSpecEditorMount = useCallback(({ editor }: OnMountData) => {
    editorRef.current = editor;
  }, []);

  const footer = useMemo(() => {
    return props.footer ? props.footer({ host }) : <DefaultFooter host={host} />;
  }, [host]);
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        fontFamily: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
      }}
    >
      <SplitPane
        initialSizes={["50%", "50%"]}
        css={{ gridArea: "typespeceditor", width: "100%", height: "100%", overflow: "hidden" }}
      >
        <Pane>
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
            newIssue={props?.links?.githubIssueUrl ? newIssue : undefined}
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
            viewers={props.emitterViewers?.[selectedEmitter]}
          />
        </Pane>
      </SplitPane>
      {footer}
    </div>
  );
};

const outputDir = "./tsp-output";

async function compile(
  host: BrowserHost,
  content: string,
  selectedEmitter: string,
  options: CompilerOptions
): Promise<CompilationState> {
  await host.writeFile("main.tsp", content);
  await emptyOutputDir(host);
  try {
    const typespecCompiler = host.compiler;
    const program = await typespecCompiler.compile(host, "main.tsp", {
      ...options,
      options: {
        ...options.options,
        [selectedEmitter]: {
          ...options.options?.[selectedEmitter],
          "emitter-output-dir": "tsp-output",
        },
      },
      outputDir: "tsp-output",
      emit: [selectedEmitter],
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
