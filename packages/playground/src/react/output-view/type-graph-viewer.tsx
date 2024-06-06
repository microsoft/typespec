import { tokens } from "@fluentui/react-components";
import { DataLineRegular } from "@fluentui/react-icons";
import {
  ColorProvider,
  TypeSpecProgramViewer,
  type ColorPalette,
} from "@typespec/html-program-viewer";
import type { OutputViewerProps, ProgramViewer } from "../types.js";
import style from "./output-view.module.css";

const TypeGraphViewerComponent = ({ program }: OutputViewerProps) => {
  return (
    <div className={style["type-graph-viewer"]}>
      <ColorProvider colors={TypeGraphColors}>
        <TypeSpecProgramViewer program={program} />
      </ColorProvider>
    </div>
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

export const TypeGraphViewer: ProgramViewer = {
  key: "type-graph",
  label: "Type graph",
  icon: <DataLineRegular />,
  render: TypeGraphViewerComponent,
};
