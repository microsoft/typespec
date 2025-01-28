import { DataLineRegular } from "@fluentui/react-icons";
import { TypeGraph } from "@typespec/html-program-viewer/react";
import "@typespec/html-program-viewer/style.css";
import type { OutputViewerProps, ProgramViewer } from "../types.js";
import style from "./output-view.module.css";

const TypeGraphViewerComponent = ({ program }: OutputViewerProps) => {
  return (
    <div className={style["type-graph-viewer"]}>
      <TypeGraph program={program} />
    </div>
  );
};

export const TypeGraphViewer: ProgramViewer = {
  key: "type-graph",
  label: "Type graph",
  icon: <DataLineRegular />,
  render: TypeGraphViewerComponent,
};
