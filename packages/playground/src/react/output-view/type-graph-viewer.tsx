import { DataLineRegular } from "@fluentui/react-icons";
import { TypeGraph } from "@typespec/html-program-viewer/react";
import "@typespec/html-program-viewer/style.css";
import { useCallback } from "react";
import type { OutputViewerProps, ProgramViewer } from "../types.js";
import style from "./output-view.module.css";

const TypeGraphViewerComponent = ({
  program,
  viewerState,
  onViewerStateChange,
}: OutputViewerProps) => {
  const currentPath = viewerState?.["type-graph:path"] || "";

  // Update viewer state when path changes
  const handleNavigationChange = useCallback(
    (path: string) => {
      onViewerStateChange?.({
        ...viewerState,
        "type-graph:path": path,
      });
    },
    [viewerState, onViewerStateChange],
  );

  return (
    <div className={style["type-graph-viewer"]}>
      <TypeGraph
        program={program}
        currentPath={currentPath}
        onNavigationChange={handleNavigationChange}
      />
    </div>
  );
};

export const TypeGraphViewer: ProgramViewer = {
  key: "type-graph",
  label: "Type graph",
  icon: <DataLineRegular />,
  render: TypeGraphViewerComponent,
};
