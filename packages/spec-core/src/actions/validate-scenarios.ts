import pc from "picocolors";
import { logger } from "../logger.js";
import { loadScenarios } from "../scenarios-resolver.js";

export interface ValidateScenarioConfig {
  scenariosPath: string;
}

export async function validateScenarios({ scenariosPath }: ValidateScenarioConfig) {
  const [_, diagnostics] = await loadScenarios(scenariosPath);

  if (diagnostics.length > 0) {
    process.exit(-1);
  } else {
    logger.info(`${pc.green("✓")} All scenarios are valid.`);
  }
}
