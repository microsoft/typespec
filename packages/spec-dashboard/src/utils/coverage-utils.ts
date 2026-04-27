import { ScenarioData } from "@typespec/spec-coverage-sdk";
import { GeneratorCoverageSuiteReport } from "../apis.js";

/**
 * Calculates the ratio of completed (pass, not-applicable, not-supported) scenarios.
 * @param scenarios - All scenarios to consider
 * @param report - The generator coverage report
 * @param scope - Optional prefix to filter scenarios by
 * @returns A ratio between 0 and 1
 */
export function getCompletedRatio(
  scenarios: ScenarioData[],
  report: GeneratorCoverageSuiteReport,
  scope: string = "",
): number {
  const filtered = scenarios.filter((x) => x.name.startsWith(scope));
  let coveredCount = 0;
  for (const scenario of filtered) {
    const status = report.results[scenario.name];
    if (status === "pass" || status === "not-applicable" || status === "not-supported") {
      coveredCount++;
    }
  }

  return filtered.length > 0 ? coveredCount / filtered.length : 0;
}
