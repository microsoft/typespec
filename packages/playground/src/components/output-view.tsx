import { Diagnostic, Program } from "@cadl-lang/compiler";
import { CadlProgramViewer } from "@cadl-lang/html-program-viewer";
import { css } from "@emotion/react";
import { Settings16Filled } from "@fluentui/react-icons";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import "swagger-ui/dist/swagger-ui.css";
import { BrowserHost } from "../browser-host.js";
import { ErrorTab } from "./error-tab.js";
import { OpenAPIOutput } from "./openapi-output.js";
import { OutputSettings } from "./output-settings.js";
import { OutputTabs, Tab } from "./output-tabs.js";

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
  }, [props.outputFiles, diagnostics, props.internalCompilerError]);
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
        <OutputContent
          viewSelection={viewSelection}
          program={props.program}
          internalCompilerError={props.internalCompilerError}
        />
      </div>
    </>
  );
};

interface OutputContentProps {
  viewSelection: ViewSelection;
  program: Program | undefined;
  internalCompilerError?: any;
}
const OutputContent: FunctionComponent<OutputContentProps> = ({
  viewSelection,
  internalCompilerError,
  program,
}) => {
  switch (viewSelection.type) {
    case "file":
      return <OpenAPIOutput filename={viewSelection.filename} content={viewSelection.content} />;
    case "errors":
      return (
        <ErrorTab
          internalCompilerError={internalCompilerError}
          diagnostics={program?.diagnostics}
        />
      );
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
          {program && <CadlProgramViewer program={program} />}
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
