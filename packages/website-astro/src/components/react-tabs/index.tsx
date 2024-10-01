import { Tab, TabList, type SelectTabData, type SelectTabEvent } from "@fluentui/react-components";
import { useCallback, useState, type ReactNode } from "react";

export interface TabsProps {
  children: (typeof TabItem)[];
}

export const Tabs = ({ children }) => {
  const tabs = children;

  const [selected, setSelected] = useState(tabs[0].props.value);

  const handleTabSelection = useCallback(
    (event: SelectTabEvent, data: SelectTabData) => {
      setSelected(data.value as any);
    },
    [setSelected],
  );

  const content = tabs.find((tab) => tab.props.value === selected)?.props.children;
  console.log(
    "Tabs",
    tabs.find((tab) => tab.props.value === selected),
  );

  return (
    <div>
      <TabList selectedValue={selected} onTabSelect={handleTabSelection}>
        {tabs.map((tab) => {
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

export const TabItem = ({ value, children }) => {
  return children;
};
