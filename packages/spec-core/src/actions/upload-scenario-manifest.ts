import { AzureCliCredential } from "@azure/identity";
import { SpecCoverageClient } from "@typespec/spec-coverage-sdk";
import { writeFile } from "fs/promises";
import pc from "picocolors";
import { computeScenarioManifest } from "../coverage/scenario-manifest.js";
import { logger } from "../logger.js";

export interface UploadScenarioManifestConfig {
  scenariosPath: string;
  storageAccountName: string;
}

export async function uploadScenarioManifest({
  scenariosPath,
  storageAccountName,
}: UploadScenarioManifestConfig) {
  const [manifest, diagnostics] = await computeScenarioManifest(scenariosPath);
  if (manifest === undefined || diagnostics.length > 0) {
    process.exit(-1);
  }

  await writeFile("manifest.json", JSON.stringify(manifest, null, 2));
  const client = new SpecCoverageClient(storageAccountName, new AzureCliCredential());
  await client.createIfNotExists();
  await client.manifest.upload(manifest);

  logger.info(
    `${pc.green("✓")} Scenario manifest uploaded to ${storageAccountName} storage account.`,
  );
}
