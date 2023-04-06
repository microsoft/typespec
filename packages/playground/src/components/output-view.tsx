import { css } from "@emotion/react";
import { Settings16Filled } from "@fluentui/react-icons";
import { Diagnostic, Program } from "@typespec/compiler";
import { TypeSpecProgramViewer } from "@typespec/html-program-viewer";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import "swagger-ui/dist/swagger-ui.css";
import { compilationState, CompileResult } from "../state.js";
import { ErrorTab, InternalCompilerError } from "./error-tab.js";
import { OpenAPIOutput } from "./openapi-output.js";
import { OutputSettings } from "./output-settings.js";
import { OutputTabs, Tab } from "./output-tabs.js";

export interface OutputViewProps {}

export const OutputView: FunctionComponent<OutputViewProps> = () => {
  const data = useRecoilValue(compilationState);
  if (data === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in data) {
    return <InternalCompilerError error={data.internalCompilerError} />;
  }
  return <OutputViewInternal compilationResult={data} />;
};

const OutputViewInternal: FunctionComponent<{ compilationResult: CompileResult }> = ({
  compilationResult,
}) => {
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
      {
        id: "settings",
        name: (
          <div
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Settings16Filled />
          </div>
        ),
        align: "right",
      },
    ];
  }, [outputFiles, diagnostics]);
  const handleTabSelection = useCallback((tabId: string) => {
    if (tabId === "type-graph") {
      setViewSelection({ type: "type-graph" });
    } else if (tabId === "errors") {
      setViewSelection({ type: "errors" });
    } else if (tabId === "settings") {
      setViewSelection({ type: "settings" });
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
        <OutputContent viewSelection={viewSelection} program={program} />
      </div>
    </>
  );
};

interface OutputContentProps {
  viewSelection: ViewSelection;
  program: Program | undefined;
  internalCompilerError?: any;
}
const OutputContent: FunctionComponent<OutputContentProps> = ({ viewSelection, program }) => {
  switch (viewSelection.type) {
    case "file":
      return <OpenAPIOutput filename={viewSelection.filename} content={viewSelection.content} />;
    case "errors":
      return <ErrorTab diagnostics={program?.diagnostics} />;
    case "settings":
      return <OutputSettings />;
    default:
      return (
        <div
          css={{
            height: "100%",
            overflow: "scroll",
          }}
        >
          {program && <TypeSpecProgramViewer program={program} />}
        </div>
      );
  }
};

type ViewSelection =
  | { type: "file"; filename: string; content: string }
  | { type: "type-graph" }
  | { type: "errors" }
  | { type: "settings" };

const ErrorTabLabel: FunctionComponent<{
  diagnostics?: readonly Diagnostic[];
}> = ({ diagnostics }) => {
  const errorCount = diagnostics ? diagnostics.length : 0;
  return (
    <div>Errors {errorCount > 0 ? <span css={ErrorTabCountStyles}>{errorCount}</span> : ""}</div>
  );
};

const ErrorTabCountStyles = css({
  backgroundColor: "#cc2222",
  color: "#f5f5f5",
  padding: "0 5px",
  borderRadius: "20px",
});
