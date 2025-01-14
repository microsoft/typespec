import pc from "picocolors";
import { logger } from "../logger.js";
import { loadScenarios } from "../scenarios-resolver.js";

export interface ValidateScenarioConfig {
  scenariosPath: string;
  exitDueToPreviousError?: boolean;
  hasMoreScenarios?: boolean;
}

export async function validateScenarios({
  scenariosPath,
  exitDueToPreviousError,
  hasMoreScenarios,
}: ValidateScenarioConfig) {
  const [_, diagnostics] = await loadScenarios(scenariosPath);

  if (diagnostics.length === 0) {
    logger.info(`${pc.green("✓")} All scenarios are valid.`);
    if (exitDueToPreviousError && !hasMoreScenarios) {
      process.exit(-1);
    }
    if (exitDueToPreviousError) return exitDueToPreviousError;
    else return false;
  } else {
    if (hasMoreScenarios) {
      return true;
    } else {
      process.exit(-1);
    }
  }
}
