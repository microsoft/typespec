import { FunctionComponent, ReactElement } from "react";

export interface Tab {
  id: string;
  name: string | ReactElement<any, any>;
  align: "left" | "right";
}
export interface OutputTabsProps {
  tabs: Tab[];
  selected: string;
  onSelect: (file: string) => void;
}

export const OutputTabs: FunctionComponent<OutputTabsProps> = ({ tabs, selected, onSelect }) => {
  const [leftTabs, rightTabs] = chunk(tabs, (x) => x.align === "left");
  console.log("Selected", selected);
  return (
    <div className="output-tabs">
      {leftTabs.map((tab) => {
        return (
          <OutputTab key={tab.id} tab={tab} selected={selected === tab.id} onSelect={onSelect} />
        );
      })}
      <span className="middle-spacer"></span>
      {rightTabs.map((tab) => {
        return (
          <OutputTab key={tab.id} tab={tab} selected={selected === tab.id} onSelect={onSelect} />
        );
      })}
    </div>
  );
};
export interface OutputTabProps {
  tab: Tab;
  selected: boolean;
  onSelect: (id: string) => void;
}
export const OutputTab: FunctionComponent<OutputTabProps> = ({ tab, selected, onSelect }) => {
  return (
    <a className={selected ? "active" : ""} onClick={() => onSelect(tab.id)}>
      {tab.name}
    </a>
  );
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
