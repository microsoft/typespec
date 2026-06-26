import { Card, CardHeader, Text } from "@fluentui/react-components";
import { FunctionComponent, useState } from "react";
import { CoverageSummary } from "../apis.js";
import { useTierFiltering } from "../hooks/use-tier-filtering.js";
import { TierConfig } from "../utils/tier-filtering-utils.js";
import { CoverageOverview } from "./coverage-overview.js";
import { DashboardTable } from "./dashboard-table.js";
import style from "./dashboard.module.css";
import { InfoEntry, InfoReport } from "./info-table.js";
import { TierFilterTabs } from "./tier-filter.js";

export interface DashboardProps {
  coverageSummaries: CoverageSummary[];
  scenarioTierConfig?: TierConfig;
  /** Show coverage overview cards at the top of the dashboard */
  showOverview?: boolean;
  /** Optional friendly display names for emitters. Key is the emitter package name. */
  emitterDisplayNames?: Record<string, string>;
}

export const Dashboard: FunctionComponent<DashboardProps> = ({
  coverageSummaries,
  scenarioTierConfig,
  showOverview,
  emitterDisplayNames,
}) => {
  const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);

  const { filteredSummaries, allTiers } = useTierFiltering(
    coverageSummaries,
    scenarioTierConfig,
    selectedTier,
  );

  const summaryTables = filteredSummaries
    .filter((s) => !selectedTier || s.manifest.scenarios.length > 0)
    .map((coverageSummary, i) => (
      <div key={i} className={style["summary-table"]}>
        <DashboardTable
          coverageSummary={coverageSummary}
          emitterDisplayNames={emitterDisplayNames}
        />
      </div>
    ));

  const specsCardTable = coverageSummaries.map((coverageSummary, i) => (
    <div key={i} className={style["specs-card"]}>
      <CadlRanchSpecsCard coverageSummary={coverageSummary} />
    </div>
  ));

  return (
    <div>
      <TierFilterTabs
        allTiers={allTiers}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
      />
      {showOverview && (
        <CoverageOverview
          coverageSummaries={filteredSummaries}
          emitterDisplayNames={emitterDisplayNames}
        />
      )}
      <div className={style["specs-row"]}>{specsCardTable}</div>
      <div className={style["spacer"]}></div>
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
    <Card className={style["card"]}>
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
