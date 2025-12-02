import { Card, CardHeader, Text } from "@fluentui/react-components";
import { FunctionComponent, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { CoverageSummary } from "../apis.js";
import { useTierFiltering } from "../hooks/use-tier-filtering.js";
import { TierConfig } from "../utils/tier-filtering-utils.js";
import { DashboardTable } from "./dashboard-table.js";
import { EmitterDetail } from "./emitter-detail.js";
import { EmitterOverview } from "./emitter-overview.js";
import { InfoEntry, InfoReport } from "./info-table.js";
import { TierFilterDropdown } from "./tier-filter.js";

export interface DashboardProps {
  coverageSummaries: CoverageSummary[];
  scenarioTierConfig?: TierConfig;
  /** If true, uses the new overview/detail view with routing. Default: false for backward compatibility */
  useOverviewMode?: boolean;
}

export const Dashboard: FunctionComponent<DashboardProps> = ({
  coverageSummaries,
  scenarioTierConfig,
  useOverviewMode = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<string | undefined>("core");

  const { filteredSummaries, allTiers } = useTierFiltering(
    coverageSummaries,
    scenarioTierConfig,
    selectedTier,
  );

  // New overview mode with routing
  if (useOverviewMode) {
    return (
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <EmitterOverview
                coverageSummaries={coverageSummaries}
                scenarioTierConfig={scenarioTierConfig}
              />
            }
          />
          <Route
            path="/emitter/:emitterName"
            element={
              <EmitterDetail
                coverageSummaries={coverageSummaries}
                scenarioTierConfig={scenarioTierConfig}
              />
            }
          />
        </Routes>
      </HashRouter>
    );
  }

  // Legacy mode - show all tables
  const summaryTables = filteredSummaries.map((coverageSummary, i) => (
    <div key={i} css={{ margin: 5 }}>
      <DashboardTable coverageSummary={coverageSummary} />
    </div>
  ));

  const specsCardTable = coverageSummaries.map((coverageSummary, i) => (
    <div key={i} css={{ margin: 5, flex: 0 }}>
      <CadlRanchSpecsCard coverageSummary={coverageSummary} />
    </div>
  ));

  return (
    <div>
      <TierFilterDropdown
        allTiers={allTiers}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
      />
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
  const heading = coverageSummary.tableName || coverageSummary.manifest.displayName;
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
