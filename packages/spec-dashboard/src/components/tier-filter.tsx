import { Tab, TabList } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import style from "./dashboard.module.css";
export interface TierFilterProps {
  allTiers?: string[];
  selectedTier?: string;
  setSelectedTier: (tier: string | undefined) => void;
}

/**
 * Tabs to filter scenarios by their tier.
 */
export const TierFilterTabs: FunctionComponent<TierFilterProps> = ({
  allTiers,
  selectedTier,
  setSelectedTier,
}) => {
  if (!allTiers?.length) {
    return null;
  }

  return (
    <div className={style["tier-filter"]}>
      <TabList
        selectedValue={selectedTier ?? "all"}
        onTabSelect={(_, data) => {
          setSelectedTier(data.value === "all" ? undefined : (data.value as string));
        }}
      >
        <Tab value="all">All tiers</Tab>
        {allTiers.map((tier) => (
          <Tab key={tier} value={tier}>
            {tier}
          </Tab>
        ))}
      </TabList>
    </div>
  );
};
