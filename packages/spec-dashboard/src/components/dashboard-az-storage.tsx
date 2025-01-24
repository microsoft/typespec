import { useState } from "react";
import { CoverageSummary, getCoverageSummaries } from "../apis.js";
import { useEffectAsync } from "../utils.js";
import { Dashboard } from "./dashboard.js";

export const DashboardFromAzureStorage = () => {
  const [coverageSummaries, setCoverageSummaries] = useState<CoverageSummary[] | undefined>(
    undefined,
  );

  useEffectAsync(async () => {
    const coverageSummaries = await getCoverageSummaries();

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
