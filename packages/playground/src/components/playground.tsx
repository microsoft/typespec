import type { DiagnosticTarget, NoTarget, Program } from "@cadl-lang/compiler";
import debounce from "debounce";
import lzutf8 from "lzutf8";
import { editor, KeyCode, KeyMod, MarkerSeverity, Uri } from "monaco-editor";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import "swagger-ui/dist/swagger-ui.css";
import { CompletionItemTag } from "vscode-languageserver";
import { BrowserHost } from "../browser-host.js";
import { importCadlCompiler } from "../core.js";
import { PlaygroundManifest } from "../manifest.js";
import { CadlEditor } from "./cadl-editor.js";
import { EditorCommandBar } from "./editor-command-bar.js";
import { useMonacoModel } from "./editor.jsx";
import { Footer } from "./footer.js";
import { OutputView } from "./output-view.js";

export interface PlaygroundProps {
  host: BrowserHost;
}

export const Playground: FunctionComponent<PlaygroundProps> = ({ host }) => {
  const cadlModel = useMonacoModel("inmemory://test/main.cadl", "cadl");
  const [outputFiles, setOutputFiles] = useState<string[]>([]);
  const [program, setProgram] = useState<Program>();
  const [internalCompilerError, setInternalCompilerError] = useState<any>();

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
    const url = `${PlaygroundManifest.links.newIssue}?body=${bodyPayload}`;
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
    const cadlCompiler = await importCadlCompiler();
    try {
      const program = await cadlCompiler.compile(host, "main.cadl", {
        outputDir: "cadl-output",
        emit: [PlaygroundManifest.defaultEmitter],
        options: {
          [PlaygroundManifest.defaultEmitter]: {
            "emitter-output-dir": "cadl-output",
          },
        },
      });
      setInternalCompilerError(undefined);
      setProgram(program);
      const markers: editor.IMarkerData[] = program.diagnostics.map((diag) => ({
        ...getMarkerLocation(cadlCompiler, diag.target),
        message: diag.message,
        severity: diag.severity === "error" ? MarkerSeverity.Error : MarkerSeverity.Warning,
        tags: diag.code === "deprecated" ? [CompletionItemTag.Deprecated] : undefined,
      }));

      editor.setModelMarkers(cadlModel, "owner", markers ?? []);

      const outputFiles = await findOutputFiles();

      setOutputFiles(outputFiles);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Internal compiler error", error);
      editor.setModelMarkers(cadlModel, "owner", []);
      setProgram(undefined);
      setInternalCompilerError(error);
    }
  }

  async function findOutputFiles(): Promise<string[]> {
    const files: string[] = [];

    async function addFiles(dir: string) {
      const items = await host.readDir("./cadl-output" + dir);
      for (const item of items) {
        const itemPath = `${dir}/${item}`;
        if ((await host.stat("./cadl-output" + itemPath)).isDirectory()) {
          await addFiles(itemPath);
        } else {
          files.push(dir === "" ? item : `${dir}/${item}`);
        }
      }
    }
    await addFiles("");
    return files;
  }

  function getMarkerLocation(
    cadlCompiler: typeof import("@cadl-lang/compiler"),
    target: DiagnosticTarget | typeof NoTarget
  ): Pick<editor.IMarkerData, "startLineNumber" | "startColumn" | "endLineNumber" | "endColumn"> {
    const loc = cadlCompiler.getSourceLocation(target);
    if (loc === undefined || loc.file.path !== "/test/main.cadl") {
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
        <EditorCommandBar
          saveCode={saveCode}
          newIssue={newIssue}
          updateCadl={updateCadl}
          documentationUrl={PlaygroundManifest.links.documentation}
        />
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
        <OutputView
          host={host}
          program={program}
          outputFiles={outputFiles}
          internalCompilerError={internalCompilerError}
        />
      </div>
      <Footer />
    </div>
  );
};
