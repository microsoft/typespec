import { Dropdown, Option, Text } from "@fluentui/react-components";
import { FunctionComponent } from "react";
export interface TierFilterProps {
  allTiers?: string[];
  selectedTier?: string;
  setSelectedTier: (tier: string | undefined) => void;
}

/**
 * A dropdown to filter scenarios by their tier.
 */
export const TierFilterDropdown: FunctionComponent<TierFilterProps> = ({
  allTiers,
  selectedTier,
  setSelectedTier,
}) => {
  if (!allTiers?.length) {
    return null;
  }

  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        marginBottom: 20,
        padding: "10px 15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "6px",
        gap: 10,
      }}
    >
      <Text weight="semibold">Filter by Tier:</Text>
      <Dropdown
        placeholder="All tiers"
        value={selectedTier ? `${selectedTier}` : ""}
        selectedOptions={selectedTier ? [selectedTier] : []}
        onOptionSelect={(_, data) => {
          setSelectedTier(data.optionValue === "all" ? undefined : data.optionValue);
        }}
        css={{ minWidth: 150 }}
      >
        <Option value="all">All tiers</Option>
        {allTiers.map((tier) => (
          <Option key={tier} value={tier}>
            {tier}
          </Option>
        ))}
      </Dropdown>
      {selectedTier && (
        <Text size={200} style={{ color: "#666", marginLeft: 10 }}>
          Showing {selectedTier} tier scenarios only
        </Text>
      )}
    </div>
  );
};
