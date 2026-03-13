import { Tab, TabList, type SelectTabEventHandler } from "@fluentui/react-components";
import { useCallback, type FunctionComponent } from "react";
import style from "./view-toggle.module.css";

export type ViewMode = "editor" | "output" | "both";

export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle: FunctionComponent<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  const onTabSelect = useCallback<SelectTabEventHandler>(
    (_, data) => {
      onViewModeChange(data.value as ViewMode);
    },
    [onViewModeChange],
  );

  return (
    <div className={style["view-toggle-bar"]}>
      <TabList
        size="small"
        selectedValue={viewMode}
        onTabSelect={onTabSelect}
        className={style["view-toggle-tabs"]}
      >
        <Tab value="editor" className={style["view-toggle-tab"]}>
          Editor
        </Tab>
        <Tab value="both" className={style["view-toggle-tab"]}>
          Both
        </Tab>
        <Tab value="output" className={style["view-toggle-tab"]}>
          Output
        </Tab>
      </TabList>
    </div>
  );
};
