import { AzureCliCredential } from "@azure/identity";
import { SpecCoverageClient } from "@typespec/spec-coverage-sdk";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import pc from "picocolors";
import { computeScenarioManifest } from "../coverage/scenario-manifest.js";
import { logger } from "../logger.js";

export interface UploadScenarioManifestConfig {
  scenariosPaths: string[];
  storageAccountName: string;
  setNames: string[];
  containerName: string;
}

export async function uploadScenarioManifest({
  scenariosPaths,
  storageAccountName,
  setNames,
  containerName,
}: UploadScenarioManifestConfig) {
  const manifests = [];
  for (let idx = 0; idx < scenariosPaths.length; idx++) {
    const path = resolve(process.cwd(), scenariosPaths[idx]);
    logger.info(`Computing scenario manifest for ${path}`);
    const [manifest, diagnostics] = await computeScenarioManifest(path, setNames[idx]);
    if (manifest === undefined || diagnostics.length > 0) {
      process.exit(-1);
    }
    manifests.push(manifest);
  }
  await writeFile("manifest.json", JSON.stringify(manifests, null, 2));
  const client = new SpecCoverageClient(storageAccountName, {
    credential: new AzureCliCredential(),
    containerName,
  });
  await client.createIfNotExists();
  await client.manifest.upload(manifests);

  logger.info(
    `${pc.green("✓")} Scenario manifest uploaded to ${storageAccountName} storage account.`,
  );
}
