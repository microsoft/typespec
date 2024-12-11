import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FunctionComponent, useState } from "react";
import { CoverageSummary, getCoverageSummaries } from "./apis.js";
import { Dashboard } from "./components/dashboard.js";
import { useEffectAsync } from "./utils.js";

export const App: FunctionComponent = () => {
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
    <FluentProvider theme={webLightTheme}>
      <div>
        {coverageSummaries ? (
          <Dashboard coverageSummaries={coverageSummaries}></Dashboard>
        ) : (
          "Loading"
        )}
      </div>
    </FluentProvider>
  );
};
