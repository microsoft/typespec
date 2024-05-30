import { Tab, TabList, type SelectTabEventHandler } from "@fluentui/react-components";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import type { PlaygroundEditorsOptions } from "../playground.js";
import type { CompilationState, CompileResult, FileOutputViewer, ProgramViewer } from "../types.js";
import { FileViewer } from "./file-viewer.js";
import { TypeGraphViewer } from "./type-graph-viewer.js";

import style from "./output-view.module.css";

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
    programViewers: {
      [FileViewer.key]: FileViewer,
      [TypeGraphViewer.key]: TypeGraphViewer,
    },
  };

  for (const item of viewers ?? []) {
    output.programViewers[item.key] = item;
  }
  for (const item of fileViewers ?? []) {
    output.fileViewers[item.key] = item;
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
  const viewerList = Object.values(viewers.programViewers);
  const [selected, setSelected] = useState(viewerList[0].key);

  const onTabSelect = useCallback<SelectTabEventHandler>(
    (_, data) => setSelected(data.value as any),
    [setSelected]
  );

  const viewer = useMemo(() => {
    return viewers.programViewers[selected];
  }, [viewers.programViewers, selected]);
  return (
    <div className={style["output-view"]}>
      <div className={style["output-content"]}>
        <viewer.render
          program={compilationResult.program}
          outputFiles={compilationResult.outputFiles}
        />
      </div>
      <div className={style["viewer-tabs-container"]}>
        <TabList
          vertical
          size="large"
          selectedValue={selected}
          onTabSelect={onTabSelect}
          className={style["viewer-tabs"]}
        >
          {viewerList.map((viewer) => {
            return (
              <Tab key={viewer.key} value={viewer.key} className={style["viewer-tab"]}>
                <span title={viewer.label}>{viewer.icon}</span>
              </Tab>
            );
          })}
        </TabList>
      </div>
    </div>
  );
};
