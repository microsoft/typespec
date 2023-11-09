import { css } from "@emotion/react";
import { tokens } from "@fluentui/react-components";
import { Diagnostic, Program } from "@typespec/compiler";
import { ColorPalette, ColorProvider, TypeSpecProgramViewer } from "@typespec/html-program-viewer";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { ErrorTab, InternalCompilerError } from "./error-tab.js";
import { FileOutput } from "./file-output.js";
import { OutputTabs, Tab } from "./output-tabs.js";
import { PlaygroundEditorsOptions } from "./playground.js";
import { CompilationState, CompileResult, FileOutputViewer, ViewerProps } from "./types.js";
import { OutputEditor } from "./typespec-editor.js";

export interface OutputViewProps {
  compilationState: CompilationState | undefined;
  editorOptions?: PlaygroundEditorsOptions;
  viewers?: FileOutputViewer[];
}

export const OutputView: FunctionComponent<OutputViewProps> = ({
  compilationState,
  viewers,
  editorOptions,
}) => {
  if (compilationState === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in compilationState) {
    return <InternalCompilerError error={compilationState.internalCompilerError} />;
  }
  return (
    <OutputViewInternal
      compilationResult={compilationState}
      viewers={viewers}
      editorOptions={editorOptions}
    />
  );
};

const OutputViewInternal: FunctionComponent<{
  compilationResult: CompileResult;
  editorOptions?: PlaygroundEditorsOptions;
  viewers?: FileOutputViewer[];
}> = ({ compilationResult, viewers, editorOptions }) => {
  const { program, outputFiles } = compilationResult;

  const [viewSelection, setViewSelection] = useState<ViewSelection>({
    type: "file",
    filename: "",
    content: "",
  });

  useEffect(() => {
    if (viewSelection.type === "file") {
      if (outputFiles.length > 0) {
        const fileStillThere = outputFiles.find((x) => x === viewSelection.filename);
        void loadOutputFile(fileStillThere ?? outputFiles[0]);
      } else {
        setViewSelection({ type: "file", filename: viewSelection.filename, content: "" });
      }
    }
  }, [program, outputFiles]);

  async function loadOutputFile(path: string) {
    const contents = await program.host.readFile("./tsp-output/" + path);
    setViewSelection({ type: "file", filename: path, content: contents.text });
  }

  const diagnostics = program.diagnostics;
  const tabs: Tab[] = useMemo(() => {
    return [
      ...outputFiles.map(
        (x): Tab => ({
          align: "left",
          name: x,
          id: x,
        })
      ),
      { id: "type-graph", name: "Type Graph", align: "right" },
      {
        id: "errors",
        name: <ErrorTabLabel diagnostics={diagnostics} />,
        align: "right",
      },
    ];
  }, [outputFiles, diagnostics]);
  const handleTabSelection = useCallback((tabId: string) => {
    if (tabId === "type-graph") {
      setViewSelection({ type: "type-graph" });
    } else if (tabId === "errors") {
      setViewSelection({ type: "errors" });
    } else {
      void loadOutputFile(tabId);
    }
  }, []);

  return (
    <>
      <OutputTabs
        tabs={tabs}
        selected={viewSelection.type === "file" ? viewSelection.filename : viewSelection.type}
        onSelect={handleTabSelection}
      />
      <div className="output-content" css={{ width: "100%", height: "100%", overflow: "hidden" }}>
        <OutputContent
          viewSelection={viewSelection}
          editorOptions={editorOptions}
          program={program}
          viewers={viewers}
        />
      </div>
    </>
  );
};

function getRawFileViewer(editorOptions?: PlaygroundEditorsOptions) {
  return {
    key: "raw",
    label: "File",
    render: ({ filename, content }: ViewerProps) => (
      <OutputEditor editorOptions={editorOptions} filename={filename} value={content} />
    ),
  };
}

interface OutputContentProps {
  viewSelection: ViewSelection;
  program: Program | undefined;
  internalCompilerError?: any;
  editorOptions?: PlaygroundEditorsOptions;
  viewers?: FileOutputViewer[];
}

const OutputContent: FunctionComponent<OutputContentProps> = ({
  viewSelection,
  program,
  viewers,
  editorOptions,
}) => {
  const resolvedViewers = useMemo(
    () => [getRawFileViewer(editorOptions), ...(viewers ?? [])],
    [viewers]
  );
  switch (viewSelection.type) {
    case "file":
      return (
        <FileOutput
          filename={viewSelection.filename}
          content={viewSelection.content}
          viewers={resolvedViewers}
        />
      );
    case "errors":
      return <ErrorTab diagnostics={program?.diagnostics} />;
    default:
      return (
        <div
          css={{
            height: "100%",
            overflow: "scroll",
          }}
        >
          {program && <TypeGraphViewer program={program} />}
        </div>
      );
  }
};

type ViewSelection =
  | { type: "file"; filename: string; content: string }
  | { type: "type-graph" }
  | { type: "errors" };

const ErrorTabLabel: FunctionComponent<{
  diagnostics?: readonly Diagnostic[];
}> = ({ diagnostics }) => {
  const errorCount = diagnostics ? diagnostics.length : 0;
  return (
    <div>Errors {errorCount > 0 ? <span css={ErrorTabCountStyles}>{errorCount}</span> : ""}</div>
  );
};

const ErrorTabCountStyles = css({
  backgroundColor: tokens.colorStatusDangerBackground3,
  color: tokens.colorNeutralForegroundOnBrand,
  padding: "0 5px",
  borderRadius: "20px",
});

interface TypeGraphViewerProps {
  program: Program;
}
const TypeGraphViewer = ({ program }: TypeGraphViewerProps) => {
  return (
    <ColorProvider colors={TypeGraphColors}>
      <TypeSpecProgramViewer program={program} />
    </ColorProvider>
  );
};

const TypeGraphColors: ColorPalette = {
  background: tokens.colorNeutralBackground1,
  typeKind: tokens.colorPaletteBerryForeground2,
  typeName: tokens.colorNeutralForeground2,
  dataKey: tokens.colorNeutralForeground2,
  ref: tokens.colorBrandForeground1,
  literal: tokens.colorPaletteLightGreenForeground2,
  indentationGuide: tokens.colorNeutralForeground4,
  property: tokens.colorPaletteMarigoldForeground2,
};
