import { Tab, TabList, type SelectTabData, type SelectTabEvent } from "@fluentui/react-components";
import { useCallback, useState, type ReactNode } from "react";

export interface TabsProps {
  children: (typeof TabItem)[];
}

export const Tabs = ({ children }) => {
  const tabs = children;

  const [selected, setSelected] = useState(tabs[0].props.value);

  const handleTabSelection = useCallback(
    (_: SelectTabEvent, data: SelectTabData) => {
      setSelected(data.value as any);
    },
    [setSelected],
  );

  const content = tabs.find((tab: any) => tab.props.value === selected)?.props.children;

  return (
    <div>
      <TabList selectedValue={selected} onTabSelect={handleTabSelection}>
        {tabs.map((tab: any) => {
          return (
            <Tab key={tab.props.value} value={tab.props.value}>
              {tab.props.value}
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

export const TabItem = ({ children }: { value: any; children: any }) => {
  return children;
};
