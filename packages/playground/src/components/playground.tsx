import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import debounce from "debounce";
import { editor, KeyCode, KeyMod, MarkerSeverity, Uri } from "monaco-editor";
import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import { RecoilRoot, useRecoilValue, useSetRecoilState } from "recoil";
import "swagger-ui/dist/swagger-ui.css";
import { CompletionItemTag } from "vscode-languageserver";
import { BrowserHost } from "../browser-host.js";
import { importCadlCompiler } from "../core.js";
import { getMarkerLocation } from "../services.js";
import {
  CompilationState,
  compilationState,
  emittersOptionsState,
  selectedEmitterState,
} from "../state.js";
import { CadlEditor } from "./cadl-editor.js";
import { EditorCommandBar } from "./editor-command-bar.js";
import { useMonacoModel } from "./editor.jsx";
import { Footer } from "./footer.js";
import { OutputView } from "./output-view.js";

export interface PlaygroundProps {
  host: BrowserHost;
  cadlContent?: string;
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

const PlaygroundInternal: FunctionComponent<PlaygroundProps> = ({ host, cadlContent, onSave }) => {
  const cadlModel = useMonacoModel("inmemory://test/main.cadl", "cadl");
  const setCompilationStatus = useSetRecoilState(compilationState);
  const emittersOptions = useRecoilValue(emittersOptionsState);
  const selectedEmitter = useRecoilValue(selectedEmitterState);

  useEffect(() => {
    const newContent = cadlContent ?? "";
    cadlModel.setValue(newContent);
    void doCompile(newContent);
  }, [cadlContent]);

  useEffect(() => {
    cadlModel.onDidChangeContent(debounce(() => doCompile(cadlModel.getValue()), 200));
  }, [cadlModel]);

  useEffect(() => {
    void doCompile(cadlModel.getValue());
  }, [selectedEmitter, emittersOptions]);

  const updateCadl = useCallback(
    (value: string) => {
      cadlModel.setValue(value);
      return doCompile(value);
    },
    [cadlModel]
  );

  const saveCode = useCallback(async () => {
    if (onSave) {
      onSave(cadlModel.getValue());
    }
  }, [cadlModel, onSave]);

  const newIssue = useCallback(async () => {
    await saveCode();
    const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
    const url = `https://github.com/microsoft/cadl/issues/new?body=${bodyPayload}`;
    window.open(url, "_blank");
  }, [saveCode, cadlModel]);

  async function doCompile(content: string) {
    const cadlCompiler = await importCadlCompiler();

    const state = await compile(host, content, selectedEmitter, emittersOptions);
    setCompilationStatus(state);
    if ("program" in state) {
      const markers: editor.IMarkerData[] = state.program.diagnostics.map((diag) => ({
        ...getMarkerLocation(cadlCompiler, diag.target),
        message: diag.message,
        severity: diag.severity === "error" ? MarkerSeverity.Error : MarkerSeverity.Warning,
        tags: diag.code === "deprecated" ? [CompletionItemTag.Deprecated] : undefined,
      }));

      editor.setModelMarkers(cadlModel, "owner", markers ?? []);
    } else {
      editor.setModelMarkers(cadlModel, "owner", []);
    }
  }

  const cadlEditorCommands = useMemo(
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
        gridTemplateAreas: '"cadleditor output"\n    "footer footer"',
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
      }}
    >
      <div css={{ gridArea: "cadleditor", width: "100%", height: "100%", overflow: "hidden" }}>
        <EditorCommandBar saveCode={saveCode} newIssue={newIssue} updateCadl={updateCadl} />
        <CadlEditor model={cadlModel} commands={cadlEditorCommands} />
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
        <OutputView />
      </div>
      <Footer />
    </div>
  );
};

const outputDir = "./cadl-output";

async function compile(
  host: BrowserHost,
  content: string,
  selectedEmitter: string,
  emittersOptions: Record<string, Record<string, unknown>>
): Promise<CompilationState> {
  await host.writeFile("main.cadl", content);
  await emptyOutputDir(host);
  try {
    const cadlCompiler = await importCadlCompiler();
    const program = await cadlCompiler.compile(host, "main.cadl", {
      outputDir: "cadl-output",
      emit: [selectedEmitter],
      options: {
        ...emittersOptions,
        [selectedEmitter]: {
          ...emittersOptions[selectedEmitter],
          "emitter-output-dir": "cadl-output",
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
  const dirs = await host.readDir("./cadl-output");
  for (const file of dirs) {
    const path = "./cadl-output/" + file;
    const uri = Uri.parse(host.pathToFileURL(path));
    const model = editor.getModel(uri);
    if (model) {
      model.dispose();
    }
    await host.rm(path, { recursive: true });
  }
}
