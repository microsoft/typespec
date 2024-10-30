import { AzureCliCredential } from "@azure/identity";
import { SpecCoverageClient } from "@typespec/spec-coverage-sdk";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import pc from "picocolors";
import { computeScenarioManifest } from "../coverage/scenario-manifest.js";
import { logger } from "../logger.js";

export interface ScenarioManifest {
  scenarioPath: string;
  mode: string;
}

export interface UploadScenarioManifestConfig {
  scenarioManifests: ScenarioManifest[];
  storageAccountName: string;
}

export async function uploadScenarioManifest({
  scenarioManifests,
  storageAccountName,
}: UploadScenarioManifestConfig) {
  for (const scenarioManifest of scenarioManifests) {
    scenarioManifest.scenarioPath = resolve(process.cwd(), scenarioManifest.scenarioPath);
  }

  const manifests = [];
  for (const scenarioManifest of scenarioManifests) {
    const path = resolve(process.cwd(), scenarioManifest.scenarioPath);
    logger.info(`Computing scenario manifest for ${path}`);
    const [manifest, diagnostics] = await computeScenarioManifest(path, scenarioManifest.mode);
    if (manifest === undefined || diagnostics.length > 0) {
      process.exit(-1);
    }
    manifests.push(manifest);
  }

  await writeFile("manifest.json", JSON.stringify(manifests, null, 2));
  const client = new SpecCoverageClient(storageAccountName, new AzureCliCredential());
  await client.createIfNotExists();
  await client.manifest.upload(manifests);

  logger.info(
    `${pc.green("✓")} Scenario manifest uploaded to ${storageAccountName} storage account.`,
  );
}
