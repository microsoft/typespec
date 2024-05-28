import type { Program } from "@typespec/compiler";
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from "react";
import { FileOutput } from "../file-output/file-output.js";
import { OutputTabs, type OutputTab } from "../output-tabs/output-tabs.js";
import type { PlaygroundEditorsOptions } from "../playground.js";
import type { CompilationState, CompileResult, FileOutputViewer, ProgramViewer } from "../types.js";
import style from "./output-view.module.css";
import { TypeGraphViewer } from "./type-graph-viewer.js";

export interface OutputViewProps {
  compilationState: CompilationState | undefined;
  editorOptions?: PlaygroundEditorsOptions;
  /**
   * List of custom viewers to display the output. It can be file viewers or program viewers.
   */
  viewers?: ProgramViewer[];
  fileViewers?: FileOutputViewer[];
}

export const OutputView: FunctionComponent<OutputViewProps> = ({
  compilationState,
  viewers,
  fileViewers,
  editorOptions,
}) => {
  if (compilationState === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in compilationState) {
    return <></>;
  }
  const resolvedViewers = useMemo(() => resolveViewers(viewers, fileViewers), [viewers]);
  return (
    <OutputViewInternal
      compilationResult={compilationState}
      viewers={resolvedViewers}
      editorOptions={editorOptions}
    />
  );
};

function resolveViewers(
  viewers: ProgramViewer[] | undefined,
  fileViewers: FileOutputViewer[] | undefined
): ResolvedViewers {
  const output: ResolvedViewers = {
    fileViewers: {},
    programViewers: {},
  };

  for (const item of viewers ?? []) {
    output.programViewers[item.key] = item;
  }
  for (const item of fileViewers ?? []) {
    output.fileViewers[item.key] = item;
  }

  if (viewers === undefined || viewers?.length === 0) {
    output.programViewers[TypeGraphViewer.key] = TypeGraphViewer;
  }
  return output;
}

interface ResolvedViewers {
  fileViewers: Record<string, FileOutputViewer>;
  programViewers: Record<string, ProgramViewer>;
}

const OutputViewInternal: FunctionComponent<{
  compilationResult: CompileResult;
  editorOptions?: PlaygroundEditorsOptions;
  viewers: ResolvedViewers;
}> = ({ compilationResult, viewers, editorOptions }) => {
  const { program, outputFiles } = compilationResult;

  const [viewSelection, setViewSelection] = useState<ViewSelection>({
    type: "file",
    id: `file:`,
    filename: "",
    content: "",
  });

  useEffect(() => {
    if (viewSelection.type === "file") {
      if (outputFiles.length > 0) {
        const fileStillThere = outputFiles.find((x) => x === viewSelection.filename);
        void loadOutputFile(fileStillThere ?? outputFiles[0]);
      } else {
        setViewSelection({
          type: "file",
          id: viewSelection.id,
          filename: viewSelection.filename,
          content: "",
        });
      }
    }
  }, [program, outputFiles]);

  async function loadOutputFile(path: string) {
    const contents = await program.host.readFile("./tsp-output/" + path);
    setViewSelection({
      type: "file",
      id: `file:${path}`,
      filename: path,
      content: contents.text,
    });
  }

  const diagnostics = program.diagnostics;
  const tabs: OutputTab[] = useMemo(() => {
    return [
      ...outputFiles.map(
        (x): OutputTab => ({
          align: "left",
          name: x,
          id: `file:${x}`,
        })
      ),
      ...(Object.values(viewers.programViewers).map(
        (x) => ({ id: `viewer:${x.key}`, name: x.label, align: "right" }) as const
      ) ?? []),
    ];
  }, [outputFiles, diagnostics]);
  const handleTabSelection = useCallback((tabId: string) => {
    const [type, key] = tabId.split(":", 2);
    if (type === "viewer") {
      setViewSelection({ id: tabId, type: "viewer", key });
    } else {
      void loadOutputFile(key);
    }
  }, []);

  return (
    <div className={style["output-view"]}>
      <OutputTabs tabs={tabs} selected={viewSelection.id} onSelect={handleTabSelection} />
      <div className={style["output-content"]}>
        <OutputContent viewSelection={viewSelection} program={program} viewers={viewers} />
      </div>
    </div>
  );
};

interface OutputContentProps {
  viewSelection: ViewSelection;
  program: Program | undefined;
  internalCompilerError?: any;
  viewers: ResolvedViewers;
}

const OutputContent: FunctionComponent<OutputContentProps> = ({
  viewSelection,
  program,
  viewers,
}) => {
  switch (viewSelection.type) {
    case "file":
      return (
        <FileOutput
          filename={viewSelection.filename}
          content={viewSelection.content}
          viewers={viewers.fileViewers}
        />
      );
    default:
      const viewer = viewers.programViewers[viewSelection.key];
      if (viewer && program) {
        return <viewer.render program={program} />;
      }
      return null;
  }
};

type ViewSelection =
  | { type: "file"; id: string; filename: string; content: string }
  | { type: "viewer"; id: string; key: string };
