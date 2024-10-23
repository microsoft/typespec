import {
  Tab,
  TabList,
  mergeClasses,
  type SelectTabData,
  type SelectTabEvent,
  type SelectTabEventHandler,
} from "@fluentui/react-components";
import { useCallback, type FunctionComponent } from "react";
import style from "./output-tabs.module.css";

export interface OutputTabsProps {
  filenames: string[];
  selected: string;
  onSelect: (file: string) => void;
}

export const OutputTabs: FunctionComponent<OutputTabsProps> = ({
  filenames,
  selected,
  onSelect,
}) => {
  const onTabSelect: SelectTabEventHandler = useCallback(
    (event: SelectTabEvent, data: SelectTabData) => {
      onSelect(data.value as any);
    },
    [onSelect],
  );

  return (
    <TabList selectedValue={selected} onTabSelect={onTabSelect} className={style["tabs"]}>
      {filenames.map((filename) => {
        return (
          <Tab
            key={filename}
            value={filename}
            className={mergeClasses(style["tab"], filename === selected && style["tab--selected"])}
          >
            {filename}
          </Tab>
        );
      })}
    </TabList>
  );
};
