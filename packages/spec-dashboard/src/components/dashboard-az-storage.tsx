import { useState } from "react";
import { CoverageFromAzureStorageOptions, CoverageSummary, getCoverageSummaries } from "../apis.js";
import { useEffectAsync } from "../utils.js";
import { Dashboard } from "./dashboard.js";

export interface DashboardFromAzureStorageProps {
  options: CoverageFromAzureStorageOptions;
}

export const DashboardFromAzureStorage = (props: DashboardFromAzureStorageProps) => {
  const [coverageSummaries, setCoverageSummaries] = useState<CoverageSummary[] | undefined>(
    undefined,
  );

  useEffectAsync(async () => {
    const coverageSummaries = await getCoverageSummaries(props.options);

    if (coverageSummaries) {
      setCoverageSummaries(() => coverageSummaries);
    }
  }, []);
  return (
    <div>
      {coverageSummaries ? (
        <Dashboard coverageSummaries={coverageSummaries}></Dashboard>
      ) : (
        "Loading"
      )}
    </div>
  );
};
