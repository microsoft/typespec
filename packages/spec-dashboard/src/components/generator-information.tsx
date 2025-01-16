import { ResolvedCoverageReport } from "@typespec/spec-coverage-sdk";
import { FunctionComponent } from "react";
import { InfoEntry, InfoReport } from "./info-table.js";
import { ScenarioGroupRatioStatusBox } from "./scenario-group-status.js";

export type GeneratorInformationProps = {
  status: number;
  report: ResolvedCoverageReport;
};

export const GeneratorInformation: FunctionComponent<GeneratorInformationProps> = ({
  status,
  report,
}) => {
  return (
    <InfoReport>
      <InfoEntry
        label="Reported date"
        caption="Date this report was created"
        value={new Date(report.createdAt).toDateString()}
        valueTitle={report.createdAt}
      />
      <InfoEntry
        label="Spec version"
        caption="This is the version of the spec package used to create this report"
        value={report.scenariosMetadata.version}
      />
      <InfoEntry
        label="Generator version"
        caption="This is the version of the generator used to create this report."
        value={report.generatorMetadata.version}
      />
      <InfoEntry
        label="Generator commit"
        caption="Git Sha of the generator used to create this report."
        value={report.generatorMetadata.commit?.slice(0, 8) ?? "?"}
        valueTitle={report.generatorMetadata.commit}
      />

      <InfoEntry
        label="Status at time of report"
        caption="Coverage when the report was completed"
        value={<ScenarioGroupRatioStatusBox ratio={getCompletedRatioAtTimeOfReport(report)} />}
      />

      <InfoEntry
        label="Current status"
        caption="Coverage of the current scenarios"
        value={<ScenarioGroupRatioStatusBox ratio={status} />}
      />
    </InfoReport>
  );
};

function getCompletedRatioAtTimeOfReport(report: ResolvedCoverageReport) {
  let coveredCount = 0;
  const statues = Object.values(report.results);
  for (const status of statues) {
    if (status === "pass" || status === "not-applicable" || status === "not-supported") {
      coveredCount++;
    }
  }

  return coveredCount / statues.length;
}
