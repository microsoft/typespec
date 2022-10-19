import { Diagnostic, Program } from "@cadl-lang/compiler";
import { CadlProgramViewer } from "@cadl-lang/html-program-viewer";
import { css } from "@emotion/react";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import "swagger-ui/dist/swagger-ui.css";
import { BrowserHost } from "../browser-host";
import { ErrorTab } from "./error-tab";
import { OpenAPIOutput } from "./openapi-output";
import { OutputTabs, Tab } from "./output-tabs";

export interface OutputViewProps {
  host: BrowserHost;
  outputFiles: string[];
  internalCompilerError?: any;
  program: Program | undefined;
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
    const contents = await props.host.readFile("./cadl-output/" + path);
    setViewSelection({ type: "file", filename: path, content: contents.text });
  }

  const diagnostics = props.program?.diagnostics;
  const tabs: Tab[] = useMemo(() => {
    return [
      ...props.outputFiles.map(
        (x): Tab => ({
          align: "left",
          name: x,
          id: x,
        })
      ),
      { id: "type-graph", name: "Type Graph", align: "right" },
      {
        id: "errors",
        name: (
          <ErrorTabLabel
            internalCompilerError={props.internalCompilerError}
            diagnostics={diagnostics}
          />
        ),
        align: "right",
      },
    ];
  }, [props.outputFiles, diagnostics, props.internalCompilerError]);
  const handleTabSelection = useCallback((tabId: string) => {
    if (tabId === "type-graph") {
      setViewSelection({ type: "type-graph" });
    } else if (tabId === "errors") {
      setViewSelection({ type: "errors" });
    } else {
      void loadOutputFile(tabId);
    }
  }, []);
  const content =
    viewSelection.type === "file" ? (
      <OpenAPIOutput content={viewSelection.content} />
    ) : viewSelection.type === "errors" ? (
      <ErrorTab internalCompilerError={props.internalCompilerError} diagnostics={diagnostics} />
    ) : (
      <div
        css={{
          height: "100%",
          overflow: "scroll",
        }}
      >
        {props.program && <CadlProgramViewer program={props.program} />}
      </div>
    );
  return (
    <>
      <OutputTabs
        tabs={tabs}
        selected={viewSelection.type === "file" ? viewSelection.filename : viewSelection.type}
        onSelect={handleTabSelection}
      />
      <div className="output-content" css={{ width: "100%", height: "100%", overflow: "hidden" }}>
        {content}
      </div>
    </>
  );
};

type ViewSelection =
  | { type: "file"; filename: string; content: string }
  | { type: "type-graph" }
  | { type: "errors" };

const ErrorTabLabel: FunctionComponent<{
  internalCompilerError?: any;
  diagnostics?: readonly Diagnostic[];
}> = ({ internalCompilerError, diagnostics }) => {
  const errorCount = (internalCompilerError ? 1 : 0) + (diagnostics ? diagnostics.length : 0);
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
