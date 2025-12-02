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

  // Build a map (scenarioName, emitterName) -> tier
  const tierByScenarioAndEmitter = useMemo(() => {
    const map = new Map<string, string>();

    if (!compiledTiers) {
      return map;
    }

    for (const summary of coverageSummaries) {
      for (const emitterName of Object.keys(summary.generatorReports)) {
        for (const scenario of summary.manifest.scenarios) {
          const key = `${scenario.name}::${emitterName}`;
          if (!map.has(key)) {
            map.set(key, classifyScenario(scenario.name, compiledTiers, emitterName));
          }
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

    return coverageSummaries.map((summary) => {
      // Filter generator reports and their results per emitter
      const filteredGeneratorReports: typeof summary.generatorReports = {};

      for (const [emitterName, report] of Object.entries(summary.generatorReports)) {
        if (!report) continue;

        // Filter results to only include scenarios matching the tier for this specific emitter
        const filteredResults: Record<string, any> = {};
        let hasMatchingScenarios = false;

        for (const scenario of summary.manifest.scenarios) {
          const key = `${scenario.name}::${emitterName}`;
          if (tierByScenarioAndEmitter.get(key) === selectedTier) {
            hasMatchingScenarios = true;
            if (scenario.name in report.results) {
              filteredResults[scenario.name] = report.results[scenario.name];
            }
          }
        }

        if (hasMatchingScenarios) {
          filteredGeneratorReports[emitterName] = {
            ...report,
            results: filteredResults,
          };
        }
      }

      // Only include scenarios that exist in at least one emitter's filtered results
      const scenariosWithResults = new Set<string>();
      for (const report of Object.values(filteredGeneratorReports)) {
        if (report) {
          for (const scenarioName of Object.keys(report.results)) {
            scenariosWithResults.add(scenarioName);
          }
        }
      }

      const commonScenarios = summary.manifest.scenarios.filter((scenario) =>
        scenariosWithResults.has(scenario.name),
      );

      return {
        ...summary,
        manifest: {
          ...summary.manifest,
          scenarios: commonScenarios,
        },
        generatorReports: filteredGeneratorReports,
      };
    });
  }, [selectedTier, coverageSummaries, compiledTiers, tierByScenarioAndEmitter]);

  return {
    allTiers,
    compiledTiers,
    tierByScenarioAndEmitter,
    filteredSummaries,
  };
}
