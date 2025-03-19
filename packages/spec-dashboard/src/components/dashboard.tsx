import { Card, CardHeader, Text, tokens } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { CoverageSummary } from "../apis.js";
import { DashboardTable } from "./dashboard-table.js";
import { InfoEntry, InfoReport } from "./info-table.js";

export interface DashboardProps {
  coverageSummaries: CoverageSummary[];
}

export const Dashboard: FunctionComponent<DashboardProps> = ({ coverageSummaries }) => {
  const summaryTables = coverageSummaries.map((coverageSummary, i) => (
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
      <div
        css={{
          display: "flex",
          gap: 50,
          backgroundColor: tokens.colorBrandBackground,
          color: tokens.colorNeutralForegroundInverted,
        }}
      >
        <h1 style={{ fontSize: 20, padding: "0 5px" }}>Spector Coverage Dashboard</h1>
      </div>
      <div css={{ display: "flex" }}>{specsCardTable}</div>
      <div css={{ height: 30 }}></div>
      {summaryTables}
    </div>
  );
};

const CadlRanchSpecsCard: FunctionComponent<{ coverageSummary: CoverageSummary }> = ({
  coverageSummary,
}) => {
  let commitLink = "",
    heading = "",
    packageName = "";
  if (coverageSummary.manifest.setName === "@azure-tools/azure-http-specs") {
    commitLink = `https://github.com/Azure/typespec-azure/commit/${coverageSummary.manifest.commit}`;
    heading = `Azure Specs Manifest`;
    packageName = "azure-http-specs";
  } else {
    commitLink = `https://github.com/microsoft/typespec/commit/${coverageSummary.manifest.commit}`;
    heading = `Typespec Specs Manifest`;
    packageName = "http-specs";
  }

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
