import { useMemo } from "react";
import { CoverageSummary } from "../apis.js";
import { classifyScenario, compileTierConfig, TierConfig } from "../utils/tier-filtering-utils.js";

/**
 * Hook to filter coverage summaries by scenario tiers.
 */
export function useTierFiltering(
  coverageSummaries: CoverageSummary[],
  scenarioTierConfig?: TierConfig,
  selectedTier?: string,
) {
  // Compile config once
  const compiledTiers = useMemo(
    () => (scenarioTierConfig ? compileTierConfig(scenarioTierConfig) : null),
    [scenarioTierConfig],
  );

  // Get all tier names from the config
  const allTiers = useMemo(
    () => (scenarioTierConfig?.tiers ? Object.keys(scenarioTierConfig.tiers) : []),
    [scenarioTierConfig],
  );

  // Build a map name -> tier once
  const tierByScenarioName = useMemo(() => {
    const map = new Map<string, string>();

    if (!compiledTiers) {
      return map;
    }

    for (const summary of coverageSummaries) {
      for (const scenario of summary.manifest.scenarios) {
        if (!map.has(scenario.name)) {
          map.set(scenario.name, classifyScenario(scenario.name, compiledTiers));
        }
      }
    }

    return map;
  }, [coverageSummaries, compiledTiers]);

  // Apply filter per summary
  const filteredSummaries = useMemo(() => {
    if (!selectedTier || !compiledTiers) {
      return coverageSummaries;
    }

    return coverageSummaries.map((summary) => ({
      ...summary,
      manifest: {
        ...summary.manifest,
        scenarios: summary.manifest.scenarios.filter(
          (s) => tierByScenarioName.get(s.name) === selectedTier,
        ),
      },
    }));
  }, [selectedTier, coverageSummaries, compiledTiers, tierByScenarioName]);

  return {
    allTiers,
    compiledTiers,
    tierByScenarioName,
    filteredSummaries,
  };
}
