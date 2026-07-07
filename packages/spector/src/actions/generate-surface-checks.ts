import { writeFile } from "fs/promises";
import pc from "picocolors";
import { computeSurfaceChecksManifest } from "../coverage/surface-checks-manifest.js";
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

  await writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);
  logger.info(
    `${pc.green("✓")} Surface checks manifest generated at ${outputFile} (${manifest.items.length} checks).`,
  );
}
