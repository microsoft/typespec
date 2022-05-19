import {
  compile,
  DiagnosticTarget,
  getSourceLocation,
  NoTarget,
  Program,
} from "@cadl-lang/compiler";
import { CadlProgramViewer } from "@cadl-lang/html-program-viewer";
import debounce from "debounce";
import lzutf8 from "lzutf8";
import { editor, KeyCode, KeyMod, MarkerSeverity, Uri } from "monaco-editor";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserHost } from "./browserHost";
import { CadlEditor, OutputEditor } from "./components/cadl-editor";
import { useMonacoModel } from "./components/editor";
import { Footer } from "./components/footer";
import { OutputTabs, Tab } from "./components/output-tabs";
import { SamplesDropdown } from "./components/samples-dropdown";
import { PlaygroundManifest } from "./manifest";
import { attachServices } from "./services";
const host = await createBrowserHost();
attachServices(host);

export const App: FunctionComponent = () => {
  const cadlModel = useMonacoModel("inmemory://test/main.cadl", "cadl");
  const [outputFiles, setOutputFiles] = useState<string[]>([]);
  const [program, setProgram] = useState<Program>();

  useEffect(() => {
    if (window.location.search.length > 0) {
      const parsed = new URLSearchParams(window.location.search);
      const compressed = parsed.get("c");
      if (compressed) {
        const content = lzutf8.decompress(compressed, { inputEncoding: "Base64" });
        cadlModel.setValue(content);
        void doCompile(content);
      }
    }
  }, []);

  useEffect(() => {
    cadlModel.onDidChangeContent(debounce(() => doCompile(cadlModel.getValue()), 200));
  }, [cadlModel]);

  const updateCadl = useCallback(
    (value: string) => {
      cadlModel.setValue(value);
      return doCompile(value);
    },
    [cadlModel]
  );

  const saveCode = useCallback(async () => {
    const compressed = lzutf8.compress(cadlModel.getValue(), { outputEncoding: "Base64" });
    history.pushState(null, "", window.location.pathname + "?c=" + encodeURIComponent(compressed));
    await navigator.clipboard.writeText(window.location.toString());
  }, [cadlModel]);

  const newIssue = useCallback(async () => {
    await saveCode();
    const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
    const url = `https://github.com/microsoft/cadl/issues/new?body=${bodyPayload}`;
    window.open(url, "_blank");
  }, [saveCode, cadlModel]);

  async function emptyOutputDir() {
    // empty output directory
    const dirs = await host.readDir("./cadl-output");
    for (const file of dirs) {
      const path = "./cadl-output/" + file;
      const uri = Uri.parse(host.pathToFileURL(path));
      const model = editor.getModel(uri);
      if (model) {
        model.dispose();
      }
      await host.unlink(path);
    }
  }

  async function doCompile(content: string) {
    await host.writeFile("main.cadl", content);
    await emptyOutputDir();
    const program = await compile("main.cadl", host, {
      outputPath: "cadl-output",
      swaggerOutputFile: "cadl-output/openapi.json",
      emitters: [PlaygroundManifest.defaultEmitter],
    });
    setProgram(program);
    const markers: editor.IMarkerData[] = program.diagnostics.map((diag) => ({
      ...getMarkerLocation(diag.target),
      message: diag.message,
      severity: MarkerSeverity.Error,
    }));

    editor.setModelMarkers(cadlModel, "owner", markers ?? []);

    const outputFiles = await host.readDir("./cadl-output");
    setOutputFiles(outputFiles);
  }

  function getMarkerLocation(
    target: DiagnosticTarget | typeof NoTarget
  ): Pick<editor.IMarkerData, "startLineNumber" | "startColumn" | "endLineNumber" | "endColumn"> {
    const loc = getSourceLocation(target);
    if (loc === undefined || loc.file.path != "/test/main.cadl") {
      return {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      };
    }
    const start = loc.file.getLineAndCharacterOfPosition(loc.pos);
    const end = loc.file.getLineAndCharacterOfPosition(loc.end);
    return {
      startLineNumber: start.line + 1,
      startColumn: start.character + 1,
      endLineNumber: end.line + 1,
      endColumn: end.character + 1,
    };
  }

  const cadlEditorCommands = useMemo(
    () => [
      // ctrl/cmd+S => save
      { binding: KeyMod.CtrlCmd | KeyCode.KeyS, handle: saveCode },
    ],
    [saveCode]
  );

  return (
    <div id="grid">
      <div id="editorContainer">
        <div id="commandBar">
          <label>
            <button onClick={saveCode as any}>Share</button>
          </label>
          <label>
            {"Load a sample: "}
            <SamplesDropdown onSelectSample={updateCadl as any} />
          </label>
          <label>
            <button onClick={newIssue as any}>Open Issue</button>
          </label>
        </div>
        <div id="editor">
          <CadlEditor model={cadlModel} commands={cadlEditorCommands} />
        </div>
      </div>
      <div id="outputContainer">
        {program && <OutputView program={program} outputFiles={outputFiles} />}
      </div>
      <Footer />
    </div>
  );
};

export interface OutputViewProps {
  outputFiles: string[];
  program: Program;
}

export const OutputView: FunctionComponent<OutputViewProps> = (props) => {
  const [viewSelection, setViewSelection] = useState<ViewSelection>({
    type: "file",
    filename: "",
    content: "",
  });

  useEffect(() => {
    if (viewSelection.type === "file") {
      if (props.outputFiles.length > 0) {
        void loadOutputFile(props.outputFiles[0]);
      } else {
        setViewSelection({ type: "file", filename: "", content: "" });
      }
    }
  }, [props.program, props.outputFiles]);

  async function loadOutputFile(path: string) {
    const contents = await host.readFile("./cadl-output/" + path);
    setViewSelection({ type: "file", filename: path, content: contents.text });
  }

  const tabs: Tab[] = useMemo(() => {
    return [
      ...props.outputFiles.map(
        (x): Tab => ({
          align: "left",
          name: x,
          id: x,
        })
      ),
      { id: "program-viewer", name: "Program", align: "right" },
    ];
  }, [props.outputFiles]);
  const handleTabSelection = useCallback((tabId: string) => {
    if (tabId === "program-viewer") {
      setViewSelection({ type: "program-viewer" });
    } else {
      void loadOutputFile(tabId);
    }
  }, []);
  const content =
    viewSelection.type === "file" ? (
      <OutputEditor value={viewSelection.content} />
    ) : (
      <CadlProgramViewer program={props.program} />
    );
  return (
    <>
      <OutputTabs
        tabs={tabs}
        selected={viewSelection.type === "file" ? viewSelection.filename : "program-viewer"}
        onSelect={handleTabSelection}
      />
      <div id="output">{content}</div>
    </>
  );
};

type ViewSelection =
  | { type: "file"; filename: string; content: string }
  | { type: "program-viewer" };
