import { MessageBar } from "@fluentui/react-components";
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
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<string | null>(null);

  const loadData = async (debugManifestUrl?: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const options = debugManifestUrl ? { ...props.options, debugManifestUrl } : props.options;

      const coverageSummaries = await getCoverageSummaries(options);

      if (coverageSummaries) {
        setCoverageSummaries(() => coverageSummaries);
        setError(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setCoverageSummaries(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffectAsync(async () => {
    // Check for debug manifest URL parameter on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const debugManifestUrl = urlParams.get("debugManifest");

    if (debugManifestUrl) {
      setDebugMode(debugManifestUrl);
    }

    await loadData(debugManifestUrl || undefined);
  }, []);

  if (error) {
    return (
      <div>
        <MessageBar intent="error" style={{ marginBottom: "20px" }}>
          <strong>Error Loading Dashboard:</strong> {error}
        </MessageBar>
        {debugMode && (
          <MessageBar intent="info" style={{ marginBottom: "20px" }}>
            <strong>Debug Mode:</strong> Using custom manifest from: {debugMode}
          </MessageBar>
        )}
      </div>
    );
  }

  return (
    <div>
      {debugMode && (
        <MessageBar intent="info" style={{ marginBottom: "20px" }}>
          <strong>Debug Mode:</strong> Using custom manifest from: {debugMode}
        </MessageBar>
      )}
      
      {isLoading ? (
        <div>Loading...</div>
      ) : coverageSummaries ? (
        <Dashboard coverageSummaries={coverageSummaries}></Dashboard>
      ) : (
        <div>No data available</div>
      )}
    </div>
  );
};
