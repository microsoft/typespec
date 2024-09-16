import { SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components";
import { ReactNode, useCallback, useState } from "react";
import style from "./hero-tabs.module.css";

export interface HeroProps {
  tabs: HeroTab[];
}

interface HeroTab {
  value: string;
  content: ReactNode;
}
export const HeroTabs = ({ tabs }: HeroProps) => {
  const [selected, setSelected] = useState<string>(tabs[0].value);
  const handleTabSelection = useCallback(
    (event: SelectTabEvent, data: SelectTabData) => {
      setSelected(data.value as any);
    },
    [setSelected],
  );
  const content = tabs.find((tab) => tab.value === selected)?.content;
  return (
    <>
      <div className={style["illustration-card"]}>{content}</div>
      <TabList selectedValue={selected} onTabSelect={handleTabSelection}>
        {tabs.map((tab) => {
          return (
            <Tab key={tab.value} value={tab.value}>
              {tab.value}
            </Tab>
          );
        })}
      </TabList>
    </>
  );
};
