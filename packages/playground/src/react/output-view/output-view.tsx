import { Button, Tab, TabList, type SelectTabEventHandler } from "@fluentui/react-components";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { PlaygroundEditorsOptions } from "../playground.js";
import type { CompilationState, CompileResult, FileOutputViewer, ProgramViewer } from "../types.js";
import { createFileViewer } from "./file-viewer.js";
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
  /**
   * The currently selected viewer key.
   */
  selectedViewer?: string;
  /**
   * Callback when the selected viewer changes.
   */
  onViewerChange?: (viewerKey: string) => void;
  /**
   * Current viewer state for viewers that have internal state.
   */
  viewerState?: Record<string, any>;
  /**
   * Callback when viewer state changes.
   */
  onViewerStateChange?: (state: Record<string, any>) => void;
}

export const OutputView: FunctionComponent<OutputViewProps> = ({
  compilationState,
  viewers,
  fileViewers,
  selectedViewer,
  onViewerChange,
  viewerState,
  onViewerStateChange,
}) => {
  const resolvedViewers = useMemo(
    () => resolveViewers(viewers, fileViewers),
    [fileViewers, viewers],
  );

  if (compilationState === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in compilationState) {
    return <></>;
  }
  return (
    <OutputViewInternal
      compilationResult={compilationState}
      viewers={resolvedViewers}
      selectedViewer={selectedViewer}
      onViewerChange={onViewerChange}
      viewerState={viewerState}
      onViewerStateChange={onViewerStateChange}
    />
  );
};

function resolveViewers(
  viewers: ProgramViewer[] | undefined,
  fileViewers: FileOutputViewer[] | undefined,
): ResolvedViewers {
  const fileViewer = createFileViewer(fileViewers ?? []);
  const output: ResolvedViewers = {
    programViewers: {
      [fileViewer.key]: fileViewer,
      [TypeGraphViewer.key]: TypeGraphViewer,
    },
  };

  for (const item of viewers ?? []) {
    output.programViewers[item.key] = item;
  }

  return output;
}

interface ResolvedViewers {
  programViewers: Record<string, ProgramViewer>;
}

const OutputViewInternal: FunctionComponent<{
  compilationResult: CompileResult;
  viewers: ResolvedViewers;
  selectedViewer?: string;
  onViewerChange?: (viewerKey: string) => void;
  viewerState?: Record<string, any>;
  onViewerStateChange?: (state: Record<string, any>) => void;
}> = ({
  compilationResult,
  viewers,
  selectedViewer,
  onViewerChange,
  viewerState,
  onViewerStateChange,
}) => {
  const viewerList = Object.values(viewers.programViewers);
  const [internalSelected, setInternalSelected] = useState(viewerList[0].key);

  // Use controlled or uncontrolled selection
  const selected = selectedViewer ?? internalSelected;

  const onTabSelect = useCallback<SelectTabEventHandler>(
    (_, data) => {
      const newSelection = data.value as string;
      setInternalSelected(newSelection);
      onViewerChange?.(newSelection);
    },
    [onViewerChange],
  );

  const viewer = useMemo(() => {
    return viewers.programViewers[selected];
  }, [viewers.programViewers, selected]);
  return (
    <div className={style["output-view"]}>
      <div className={style["output-content"]}>
        <ErrorBoundary fallbackRender={fallbackRender}>
          <viewer.render
            program={compilationResult.program}
            outputFiles={compilationResult.outputFiles}
            viewerState={viewerState}
            onViewerStateChange={onViewerStateChange}
          />
        </ErrorBoundary>
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

function fallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className={style["viewer-error"]}>
      <h2>Something went wrong:</h2>
      <div style={{ color: "red" }}>{error.toString()}</div>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}
