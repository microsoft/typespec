import { writeFile } from "fs/promises";
import pc from "picocolors";
import {
  computeSurfaceChecksManifest,
  createSurfaceChecksSummary,
} from "../coverage/surface-checks-manifest.js";
import { logger } from "../logger.js";

export interface GenerateSurfaceChecksConfig {
  scenariosPath: string;
  outputFile: string;
}

export async function generateSurfaceChecks({
  scenariosPath,
  outputFile,
}: GenerateSurfaceChecksConfig) {
  logger.info(`Computing surface checks manifest for ${scenariosPath}`);
  const [manifest, diagnostics] = await computeSurfaceChecksManifest(scenariosPath);
  if (manifest === undefined || diagnostics.length > 0) {
    process.exit(-1);
  }

  const summary = await createSurfaceChecksSummary(manifest);
  await writeFile(outputFile, summary);
  logger.info(
    `${pc.green("✓")} Surface checks doc generated at ${outputFile} (${manifest.items.length} checks).`,
  );
}
