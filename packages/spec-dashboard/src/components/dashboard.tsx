import { Card, CardHeader, Dropdown, Option, Text } from "@fluentui/react-components";
import { FunctionComponent, useState } from "react";
import { CoverageSummary } from "../apis.js";
import { DashboardTable } from "./dashboard-table.js";
import { InfoEntry, InfoReport } from "./info-table.js";

export interface DashboardProps {
  coverageSummaries: CoverageSummary[];
}

export const Dashboard: FunctionComponent<DashboardProps> = ({ coverageSummaries }) => {
  const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);

  // Filter scenarios by tier if a tier is selected
  const filteredCoverageSummaries = selectedTier
    ? coverageSummaries.map((summary) => ({
        ...summary,
        manifest: {
          ...summary.manifest,
          scenarios: summary.manifest.scenarios.filter(
            (scenario) => scenario.tier === selectedTier,
          ),
        },
      }))
    : coverageSummaries;

  const summaryTables = filteredCoverageSummaries.map((coverageSummary, i) => (
    <div key={i} css={{ margin: 5 }}>
      <DashboardTable coverageSummary={coverageSummary} />
    </div>
  ));

  const specsCardTable = filteredCoverageSummaries.map((coverageSummary, i) => (
    <div key={i} css={{ margin: 5, flex: 0 }}>
      <CadlRanchSpecsCard coverageSummary={coverageSummary} />
    </div>
  ));

  // Get unique tiers from all scenarios across all coverage summaries
  const allTiers = Array.from(
    new Set(
      coverageSummaries
        .flatMap((summary) => summary.manifest.scenarios)
        .map((scenario) => scenario.tier),
    ),
  ).sort();

  return (
    <div>
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
      <div css={{ display: "flex" }}>{specsCardTable}</div>
      <div css={{ height: 30 }}></div>
      {summaryTables}
    </div>
  );
};

const CadlRanchSpecsCard: FunctionComponent<{
  coverageSummary: CoverageSummary;
}> = ({ coverageSummary }) => {
  const commitLink = `${coverageSummary.manifest.repo}/commit/${coverageSummary.manifest.commit}`;
  const heading = coverageSummary.manifest.displayName;
  const packageName = coverageSummary.manifest.packageName;

  return (
    <Card css={{ width: 500 }}>
      <CardHeader header={<Text weight="bold">{heading}</Text>} />
      <InfoReport>
        <InfoEntry
          label="Commit"
          caption="Git Sha of the manifest used to create this report."
          value={<a href={commitLink}>{coverageSummary.manifest.commit.slice(0, 6)}</a>}
        />
        <InfoEntry
          label="Version"
          caption={`Version of the ${packageName} package used to create this report.`}
          value={coverageSummary.manifest.version}
        />
        <InfoEntry
          label="Scenario count"
          caption="Number of scenarios at this time"
          value={coverageSummary.manifest.scenarios.length}
        />
      </InfoReport>
    </Card>
  );
};
