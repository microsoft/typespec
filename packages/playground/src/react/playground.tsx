import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import debounce from "debounce";
import { KeyCode, KeyMod, MarkerSeverity, Uri, editor } from "monaco-editor";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { RecoilRoot } from "recoil";
import "swagger-ui/dist/swagger-ui.css";
import { CompletionItemTag } from "vscode-languageserver";
import { BrowserHost } from "../browser-host.js";
import { importTypeSpecCompiler } from "../core.js";
import { PlaygroundManifest } from "../manifest.js";
import { getMarkerLocation } from "../services.js";
import { CompilationState, EmitterOptions } from "../state.js";
import { EditorCommandBar } from "./editor-command-bar.js";
import { useMonacoModel } from "./editor.js";
import { Footer } from "./footer.js";
import { useControllableValue } from "./hooks.js";
import { OutputView } from "./output-view.js";
import { TypeSpecEditor } from "./typespec-editor.js";

export type PlaygroundDefaultState = {
  content?: string;
};

export interface PlaygroundProps {
  host: BrowserHost;

  /** Emitter to use */
  emitter?: string;
  /** Default emitter if leaving this unmanaged. */
  defaultEmitter?: string;
  /** Callback when emitter change */
  onEmitterChange?: (emitter: string) => void;

  /** Emitter options */
  emitterOptions?: EmitterOptions;
  /** Default emitter options if leaving this unmanaged. */
  defaultEmitterOptions?: EmitterOptions;
  /** Callback when emitter options change */
  onEmitterOptionsChange?: (emitter: EmitterOptions) => void;

  /** Sample to use */
  sampleName?: string;
  /** Default sample if leaving this unmanaged. */
  defaultSampleName?: string;
  /** Callback when sample change */
  onSampleNameChange?: (sampleName: string) => void;

  defaultState?: PlaygroundDefaultState;
  onSave?: (value: string) => void;
}

export const StyledPlayground: FunctionComponent<PlaygroundProps> = (props) => (
  <FluentProvider theme={webLightTheme}>
    <Playground {...props} />
  </FluentProvider>
);

export const Playground: FunctionComponent<PlaygroundProps> = (props) => (
  <RecoilRoot>
    <PlaygroundInternal {...props} />
  </RecoilRoot>
);

const PlaygroundInternal: FunctionComponent<PlaygroundProps> = (props) => {
  const { host, defaultState, onSave } = props;
  const [selectedEmitter, onSelectedEmitterChange] = useControllableValue(
    props.emitter,
    props.defaultEmitter,
    props.onEmitterChange
  );
  const [emitterOptions, onEmitterOptionsChange] = useControllableValue(
    props.emitterOptions,
    props.defaultEmitterOptions ?? {},
    props.onEmitterOptionsChange
  );
  const [selectedSampleName, onSelectedSampleNameChange] = useControllableValue(
    props.sampleName,
    props.defaultSampleName,
    props.onSampleNameChange
  );
  const typespecModel = useMonacoModel("inmemory://test/main.tsp", "typespec");
  const [compilationState, setCompilationState] = useState<CompilationState | undefined>(undefined);

  const doCompile = useCallback(async () => {
    const content = typespecModel.getValue();
    const typespecCompiler = await importTypeSpecCompiler();

    const state = await compile(host, content, selectedEmitter, emitterOptions);
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
  }, [host, selectedEmitter, emitterOptions, typespecModel]);

  const updateTypeSpec = useCallback(
    (value: string) => {
      typespecModel.setValue(value);
    },
    [typespecModel]
  );
  useEffect(() => {
    if (selectedSampleName) {
      const config = PlaygroundManifest.samples[selectedSampleName];
      if (config.content) {
        updateTypeSpec(config.content);
        if (config.preferredEmitter) {
          onSelectedEmitterChange(config.preferredEmitter);
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

  const saveCode = useCallback(async () => {
    if (onSave) {
      onSave(typespecModel.getValue());
    }
  }, [typespecModel, onSave]);

  const newIssue = useCallback(async () => {
    await saveCode();
    const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
    const url = `${PlaygroundManifest.links.newIssue}?body=${bodyPayload}`;
    window.open(url, "_blank");
  }, [saveCode, typespecModel]);

  const typespecEditorCommands = useMemo(
    () => [
      // ctrl/cmd+S => save
      { binding: KeyMod.CtrlCmd | KeyCode.KeyS, handle: saveCode },
    ],
    [saveCode]
  );

  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: "1fr auto",
        gridTemplateAreas: '"typespeceditor output"\n    "footer footer"',
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
      }}
    >
      <div css={{ gridArea: "typespeceditor", width: "100%", height: "100%", overflow: "hidden" }}>
        <EditorCommandBar
          onSelectedEmitterChange={onSelectedEmitterChange}
          selectedEmitter={selectedEmitter}
          emitterOptions={emitterOptions}
          onEmitterOptionsChange={onEmitterOptionsChange}
          selectedSampleName={selectedSampleName}
          onSelectedSampleNameChange={onSelectedSampleNameChange}
          saveCode={saveCode}
          newIssue={newIssue}
          documentationUrl={PlaygroundManifest.links.documentation}
        />
        <TypeSpecEditor model={typespecModel} commands={typespecEditorCommands} />
      </div>
      <div
        css={{
          gridArea: "output",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #c5c5c5",
        }}
      >
        <OutputView compilationState={compilationState} />
      </div>
      <Footer />
    </div>
  );
};

const outputDir = "./tsp-output";

async function compile(
  host: BrowserHost,
  content: string,
  selectedEmitter: string,
  emittersOptions: Record<string, Record<string, unknown>>
): Promise<CompilationState> {
  await host.writeFile("main.tsp", content);
  await emptyOutputDir(host);
  try {
    const typespecCompiler = await importTypeSpecCompiler();
    const program = await typespecCompiler.compile(host, "main.tsp", {
      outputDir: "tsp-output",
      emit: [selectedEmitter],
      options: {
        ...emittersOptions,
        [selectedEmitter]: {
          ...emittersOptions[selectedEmitter],
          "emitter-output-dir": "tsp-output",
        },
      },
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
