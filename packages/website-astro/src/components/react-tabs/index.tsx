import { Tab, TabList, type SelectTabData, type SelectTabEvent } from "@fluentui/react-components";
import { useCallback, useState, type ReactNode } from "react";

export interface TabsProps {
  children: (typeof TabItem)[];
}

export const Tabs = ({ children }) => {
  const [selected, setSelected] = useState();

  const handleTabSelection = useCallback(
    (event: SelectTabEvent, data: SelectTabData) => {
      setSelected(data.value as any);
    },
    [setSelected],
  );

  const tabs = children;
  const content = tabs.find((tab) => tab.value === selected)?.content;

  return (
    <div>
      <TabList selectedValue={selected} onTabSelect={handleTabSelection}>
        {tabs.map((tab) => {
          return (
            <Tab key={tab.value} value={tab.value}>
              {tab.value}
            </Tab>
          );
        })}
      </TabList>
      <div>{content}</div>
    </div>
  );
};

export interface TabItemProps {
  value: unknown;
  children: ReactNode;
}

export const TabItem = ({ value, children }) => {
  return children;
};
