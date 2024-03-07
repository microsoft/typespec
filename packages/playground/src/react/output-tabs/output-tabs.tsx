import {
  SelectTabData,
  SelectTabEvent,
  SelectTabEventHandler,
  Tab,
  TabList,
  TabProps,
  mergeClasses,
} from "@fluentui/react-components";
import { FunctionComponent, ReactElement, useCallback } from "react";
import style from "./output-tabs.module.css";

export interface OutputTab {
  id: string;
  name: string | ReactElement<any, any>;
  align: "left" | "right";
}
export interface OutputTabsProps {
  tabs: OutputTab[];
  selected: string;
  onSelect: (file: string) => void;
}

export const OutputTabs: FunctionComponent<OutputTabsProps> = ({ tabs, selected, onSelect }) => {
  const [leftTabs, rightTabs] = chunk(tabs, (x) => x.align === "left");

  const onTabSelect: SelectTabEventHandler = useCallback(
    (event: SelectTabEvent, data: SelectTabData) => {
      onSelect(data.value as any);
    },
    [onSelect]
  );

  return (
    <TabList selectedValue={selected} onTabSelect={onTabSelect} className={style["tabs"]}>
      {leftTabs.map((tab) => {
        return (
          <OutputTabEl
            key={tab.id}
            value={tab.id}
            className={tab.id === selected && style["tab--selected"]}
          >
            {tab.name}
          </OutputTabEl>
        );
      })}
      <div className={style["tab-divider"]}></div>
      {rightTabs.map((tab) => {
        return (
          <OutputTabEl
            key={tab.id}
            value={tab.id}
            className={tab.id === selected && style["tab--selected"]}
          >
            {tab.name}
          </OutputTabEl>
        );
      })}
    </TabList>
  );
};

const OutputTabEl = (props: TabProps) => {
  return <Tab {...props} className={mergeClasses(style["tab"], props.className)} />;
};

function chunk<T>(items: T[], condition: (item: T) => boolean) {
  const match = [];
  const unMatch = [];
  for (const item of items) {
    if (condition(item)) {
      match.push(item);
    } else {
      unMatch.push(item);
    }
  }
  return [match, unMatch];
}
