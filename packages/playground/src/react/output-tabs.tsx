import { tokens } from "@fluentui/react-components";
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
  return (
    <div css={{ display: "flex", borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }}>
      {leftTabs.map((tab) => {
        return (
          <OutputTab key={tab.id} tab={tab} selected={selected === tab.id} onSelect={onSelect} />
        );
      })}
      <span css={{ flex: 1, borderRight: `1px solid ${tokens.colorNeutralStroke1}` }}></span>
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
    <div
      tabIndex={0}
      css={[
        {
          height: "26px",
          padding: "0 5px",
          borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
          borderTop: "none",
          borderBottom: "none",
          textDecoration: "none",
          cursor: "pointer",
        },
        selected ? { fontWeight: "bold", backgroundColor: tokens.colorNeutralBackground5 } : {},
      ]}
      onClick={() => onSelect(tab.id)}
    >
      {tab.name}
    </div>
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
