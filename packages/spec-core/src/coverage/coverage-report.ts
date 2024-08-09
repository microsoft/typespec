import { CoverageReport, ScenarioStatus } from "@typespec/spec-coverage-sdk";
import { getScenarioMetadata } from "./common.js";

export async function createCoverageReport(
  scenariosPath: string,
  results: Record<string, ScenarioStatus>,
): Promise<CoverageReport> {
  return {
    scenariosMetadata: await getScenarioMetadata(scenariosPath),
    results,
    createdAt: new Date().toISOString(),
  };
}
